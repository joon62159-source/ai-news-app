import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { articles, categories, feeds } from "@/db/schema";
import { CategoryBar } from "@/components/category-bar";
import { FetchNewsButton } from "@/components/fetch-news-button";
import { NewsCard } from "@/components/news-card";

export const metadata = { title: "대시보드 · AI뉴스수집기" };

export default function DashboardPage(props: PageProps<"/dashboard">) {
  return (
    <main className="flex-1 bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
            AI뉴스수집기
          </h1>
          <FetchNewsButton />
        </div>
        <Suspense fallback={<Skeleton />}>
          <Feed searchParams={props.searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function Feed({
  searchParams,
}: {
  searchParams: PageProps<"/dashboard">["searchParams"];
}) {
  const { userId } = await auth();
  if (!userId) return null; // proxy.ts가 이미 보호하므로 도달하지 않는다.

  const raw = (await searchParams).category;
  const selected = typeof raw === "string" ? raw : undefined;
  const categoryId = selected && selected !== "none" ? Number(selected) : null;

  const categoryFilter =
    selected === "none"
      ? isNull(articles.categoryId)
      : categoryId !== null && Number.isInteger(categoryId)
        ? eq(articles.categoryId, categoryId)
        : undefined;

  const [categoryList, rows] = await Promise.all([
    db
      .select({ id: categories.id, name: categories.name, color: categories.color })
      .from(categories)
      .where(eq(categories.userId, userId))
      .orderBy(asc(categories.id)),
    db
      .select({
        id: articles.id,
        url: articles.url,
        titleKo: articles.titleKo,
        summaryKo: articles.summaryKo,
        publishedAt: articles.publishedAt,
        fetchedAt: articles.fetchedAt,
        notionPageId: articles.notionPageId,
        categoryName: categories.name,
        categoryColor: categories.color,
        feedName: feeds.name,
      })
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .leftJoin(feeds, eq(articles.feedId, feeds.id))
      .where(and(eq(articles.userId, userId), categoryFilter))
      .orderBy(desc(sql`coalesce(${articles.publishedAt}, ${articles.fetchedAt})`))
      .limit(60),
  ]);

  return (
    <>
      <CategoryBar categories={categoryList} selected={selected} />
      {rows.length === 0 ? (
        <p className="py-20 text-center text-slate-500">
          {selected ? "이 카테고리에는 뉴스가 없어요" : "아직 수집된 뉴스가 없어요"}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((a) => (
            <NewsCard key={a.id} article={a} />
          ))}
        </div>
      )}
    </>
  );
}

function Skeleton() {
  return (
    <div className="grid animate-pulse gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          className="h-52 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
        />
      ))}
    </div>
  );
}
