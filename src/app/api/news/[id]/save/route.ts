import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { articles, categories } from "@/db/schema";
import { createNotionPage } from "@/lib/notion";

export async function POST(
  _req: Request,
  ctx: RouteContext<"/api/news/[id]/save">,
) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id)) {
    return Response.json({ error: "잘못된 요청이에요" }, { status: 400 });
  }

  const [row] = await db
    .select({
      titleKo: articles.titleKo,
      summaryKo: articles.summaryKo,
      url: articles.url,
      publishedAt: articles.publishedAt,
      notionPageId: articles.notionPageId,
      categoryName: categories.name,
    })
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .where(and(eq(articles.id, id), eq(articles.userId, userId)));
  if (!row) {
    return Response.json({ error: "기사를 찾을 수 없어요" }, { status: 404 });
  }
  // 중복 저장 방지
  if (row.notionPageId) {
    return Response.json({ notionPageId: row.notionPageId });
  }

  try {
    const notionPageId = await createNotionPage(row);
    await db
      .update(articles)
      .set({ notionPageId })
      .where(and(eq(articles.id, id), eq(articles.userId, userId)));
    return Response.json({ notionPageId });
  } catch (e) {
    console.error("save to notion failed", e);
    return Response.json(
      { error: "Notion에 저장하지 못했어요" },
      { status: 500 },
    );
  }
}
