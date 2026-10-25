import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { ensureDefaults } from "@/db/defaults";
import { articles, categories, feeds } from "@/db/schema";
import { processArticles } from "@/lib/claude";
import { fetchFeedItems } from "@/lib/rss";

const WINDOW_MS = 24 * 60 * 60 * 1000;

export type FetchNewsResult = {
  inserted: number;
  duplicates: number;
  processed: number;
  errors: { feed: string; message: string }[];
};

// 활성 피드에서 지난 24시간 기사를 수집해 articles에 저장한다.
// 저장 시점에는 titleKo/summaryKo에 원문을 임시로 넣고 processedAt은 null로 둔다.
// 이후 미처리 기사(이번에 새로 저장된 것 + 이전에 실패한 것)를 Claude로 번역·요약·분류한다.
export async function fetchNewsForUser(userId: string): Promise<FetchNewsResult> {
  await ensureDefaults(userId);

  const activeFeeds = await db
    .select({ id: feeds.id, name: feeds.name, url: feeds.url })
    .from(feeds)
    .where(and(eq(feeds.userId, userId), eq(feeds.enabled, true)));

  const since = new Date(Date.now() - WINDOW_MS);
  const settled = await Promise.allSettled(
    activeFeeds.map((f) => fetchFeedItems(f.url, since)),
  );

  const errors: FetchNewsResult["errors"] = [];
  // 피드 간에도 같은 URL이 겹칠 수 있어 URL 기준으로 먼저 하나만 남긴다.
  const byUrl = new Map<string, typeof articles.$inferInsert>();

  settled.forEach((r, i) => {
    const feed = activeFeeds[i];
    if (r.status === "rejected") {
      errors.push({
        feed: feed.name,
        message: r.reason instanceof Error ? r.reason.message : String(r.reason),
      });
      return;
    }
    for (const item of r.value) {
      if (byUrl.has(item.url)) continue;
      byUrl.set(item.url, {
        userId,
        feedId: feed.id,
        url: item.url,
        titleOrig: item.title,
        titleKo: item.title,
        summaryKo: item.summary,
        publishedAt: item.publishedAt,
      });
    }
  });

  const rows = [...byUrl.values()];
  let inserted = 0;
  if (rows.length > 0) {
    // (userId, url) unique 인덱스로 이미 저장된 기사는 건너뛴다.
    const insertedRows = await db
      .insert(articles)
      .values(rows)
      .onConflictDoNothing({ target: [articles.userId, articles.url] })
      .returning({ id: articles.id });
    inserted = insertedRows.length;
  }

  const processed = await processPending(userId, errors);

  return { inserted, duplicates: rows.length - inserted, processed, errors };
}

// processedAt이 null인 기사를 Claude로 처리해 저장한다. 실패한 기사는 그대로 남겨 다음 수집 때 재시도한다.
async function processPending(
  userId: string,
  errors: FetchNewsResult["errors"],
): Promise<number> {
  const pending = await db
    .select({
      id: articles.id,
      title: articles.titleOrig,
      summary: articles.summaryKo,
    })
    .from(articles)
    .where(and(eq(articles.userId, userId), isNull(articles.processedAt)));
  if (pending.length === 0) return 0;

  const cats = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(eq(categories.userId, userId));
  const categoryId = new Map(cats.map((c) => [c.name, c.id]));

  const results = await processArticles(pending, [...categoryId.keys()]);

  let done = 0;
  for (const r of results) {
    if (!r.ok) {
      const title = pending.find((p) => p.id === r.id)?.title ?? `#${r.id}`;
      errors.push({ feed: title, message: r.message });
      continue;
    }
    await db
      .update(articles)
      .set({
        titleKo: r.value.titleKo,
        summaryKo: r.value.summaryKo,
        categoryId: categoryId.get(r.value.category) ?? null,
        processedAt: new Date(),
      })
      .where(and(eq(articles.id, r.id), eq(articles.userId, userId)));
    done++;
  }
  return done;
}
