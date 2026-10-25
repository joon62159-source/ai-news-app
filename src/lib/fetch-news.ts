import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureDefaults } from "@/db/defaults";
import { articles, feeds } from "@/db/schema";
import { fetchFeedItems } from "@/lib/rss";

const WINDOW_MS = 24 * 60 * 60 * 1000;

export type FetchNewsResult = {
  inserted: number;
  duplicates: number;
  errors: { feed: string; message: string }[];
};

// 활성 피드에서 지난 24시간 기사를 수집해 articles에 저장한다.
// 번역·요약·분류는 아직 없으므로 titleKo/summaryKo에는 원문을 임시로 넣고 categoryId는 null(미분류)로 둔다.
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
  if (rows.length === 0) return { inserted: 0, duplicates: 0, errors };

  // (userId, url) unique 인덱스로 이미 저장된 기사는 건너뛴다.
  const insertedRows = await db
    .insert(articles)
    .values(rows)
    .onConflictDoNothing({ target: [articles.userId, articles.url] })
    .returning({ id: articles.id });

  return {
    inserted: insertedRows.length,
    duplicates: rows.length - insertedRows.length,
    errors,
  };
}
