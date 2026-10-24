import { eq } from "drizzle-orm";
import { db } from ".";
import { categories, feeds } from "./schema";

const DEFAULT_CATEGORIES = [
  { name: "LLM/모델", color: "#6366f1" },
  { name: "이미지·영상", color: "#ec4899" },
  { name: "로보틱스", color: "#f59e0b" },
  { name: "정책·규제", color: "#10b981" },
  { name: "비즈니스·투자", color: "#0ea5e9" },
  { name: "기타", color: "#6b7280" },
];

const DEFAULT_FEEDS = [
  {
    name: "TechCrunch AI",
    url: "https://techcrunch.com/category/artificial-intelligence/feed/",
  },
  {
    name: "The Verge AI",
    url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
  },
];

// 사용자별 기본 카테고리·피드 시드. 이미 데이터가 있으면 건드리지 않는다.
export async function ensureDefaults(userId: string) {
  const [hasCategory] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.userId, userId))
    .limit(1);
  if (!hasCategory) {
    await db
      .insert(categories)
      .values(DEFAULT_CATEGORIES.map((c) => ({ ...c, userId })))
      .onConflictDoNothing();
  }

  const [hasFeed] = await db
    .select({ id: feeds.id })
    .from(feeds)
    .where(eq(feeds.userId, userId))
    .limit(1);
  if (!hasFeed) {
    await db
      .insert(feeds)
      .values(DEFAULT_FEEDS.map((f) => ({ ...f, userId })))
      .onConflictDoNothing();
  }
}
