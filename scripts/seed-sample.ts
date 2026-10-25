// 예제 기사 5건을 articles에 넣는다. 사용법: node scripts/seed-sample.ts <clerk userId>
// Node의 TS 타입 제거 실행을 쓰므로 상대 import에 .ts 확장자를 붙인다.
import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { articles, categories, feeds } from "../src/db/schema.ts";

process.loadEnvFile(".env.local");

const userId = process.argv[2];
if (!userId) {
  console.error("사용법: node scripts/seed-sample.ts <clerk userId>");
  process.exit(1);
}

const db = drizzle(neon(process.env.DATABASE_URL!));

const CATEGORIES = [
  { name: "LLM/모델", color: "#6366f1" },
  { name: "이미지·영상", color: "#ec4899" },
  { name: "로보틱스", color: "#f59e0b" },
  { name: "정책·규제", color: "#10b981" },
  { name: "비즈니스·투자", color: "#0ea5e9" },
];

const FEEDS = [
  {
    name: "TechCrunch AI",
    url: "https://techcrunch.com/category/artificial-intelligence/feed/",
  },
  {
    name: "The Verge AI",
    url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
  },
];

const SAMPLES = [
  {
    feed: "TechCrunch AI",
    category: "LLM/모델",
    url: "https://example.com/ai-news/1",
    titleOrig: "Lumen Labs unveils Atlas-3, a 2M-token context language model",
    titleKo: "루멘 랩스, 200만 토큰 컨텍스트의 언어 모델 '아틀라스-3' 공개",
    summaryKo:
      "루멘 랩스가 200만 토큰까지 한 번에 처리하는 대규모 언어 모델 아틀라스-3를 공개했다. 긴 문서와 코드베이스 분석에서 이전 세대 대비 정확도가 높아졌다고 회사는 밝혔다. API는 다음 달부터 제공된다.",
    publishedAt: "2026-10-20T13:00:00Z",
  },
  {
    feed: "The Verge AI",
    category: "이미지·영상",
    url: "https://example.com/ai-news/2",
    titleOrig:
      "Prismic's new video generator makes 60-second clips from a single prompt",
    titleKo: "프리즈믹, 프롬프트 하나로 60초 영상을 만드는 생성 모델 출시",
    summaryKo:
      "프리즈믹이 텍스트 한 줄로 최대 60초 길이의 영상을 생성하는 모델을 내놨다. 장면 간 인물·배경 일관성이 개선됐지만, 저작권 논란을 막기 위해 학습 데이터 출처 공개 범위를 두고 비판도 나온다.",
    publishedAt: "2026-10-21T09:30:00Z",
  },
  {
    feed: "TechCrunch AI",
    category: "로보틱스",
    url: "https://example.com/ai-news/3",
    titleOrig:
      "Warehouse startup Kinetiq raises $120M to deploy humanoid pickers",
    titleKo:
      "물류 스타트업 키네틱, 휴머노이드 피킹 로봇 도입 위해 1억 2천만 달러 투자 유치",
    summaryKo:
      "키네틱이 시리즈 B에서 1억 2천만 달러를 조달했다. 이 자금으로 휴머노이드 로봇을 물류센터에 확대 배치할 계획이며, 올해 말까지 세 곳의 대형 고객사와 시범 운영에 들어간다.",
    publishedAt: "2026-10-21T16:45:00Z",
  },
  {
    feed: "The Verge AI",
    category: "정책·규제",
    url: "https://example.com/ai-news/4",
    titleOrig: "EU finalizes guidance for high-risk AI systems under the AI Act",
    titleKo: "EU, AI법 고위험 AI 시스템 가이드라인 최종 확정",
    summaryKo:
      "EU 집행위가 AI법에 따른 고위험 AI 시스템의 적합성 평가 기준을 담은 가이드라인을 확정했다. 채용·의료·금융 분야 기업은 내년부터 문서화와 사람 감독 의무를 이행해야 한다.",
    publishedAt: "2026-10-22T08:10:00Z",
  },
  {
    feed: "TechCrunch AI",
    category: "비즈니스·투자",
    url: "https://example.com/ai-news/5",
    titleOrig: "Enterprise AI spending to top $400B next year, analysts say",
    titleKo: '애널리스트 "내년 기업용 AI 지출 4,000억 달러 넘을 것"',
    summaryKo:
      "시장조사 기관들은 내년 기업의 AI 관련 지출이 4,000억 달러를 넘을 것으로 전망했다. 생성형 AI 도입이 파일럿 단계를 지나 업무 자동화로 확산되면서 인프라와 소프트웨어 투자가 동시에 늘고 있다.",
    publishedAt: "2026-10-23T11:20:00Z",
  },
];

await db
  .insert(categories)
  .values(CATEGORIES.map((c) => ({ ...c, userId })))
  .onConflictDoNothing();
await db
  .insert(feeds)
  .values(FEEDS.map((f) => ({ ...f, userId })))
  .onConflictDoNothing();

const categoryRows = await db
  .select()
  .from(categories)
  .where(eq(categories.userId, userId));
const feedRows = await db.select().from(feeds).where(eq(feeds.userId, userId));
const categoryId = new Map(categoryRows.map((c) => [c.name, c.id]));
const feedId = new Map(feedRows.map((f) => [f.name, f.id]));

const inserted = await db
  .insert(articles)
  .values(
    SAMPLES.map(({ feed, category, publishedAt, ...rest }) => ({
      ...rest,
      userId,
      feedId: feedId.get(feed),
      categoryId: categoryId.get(category),
      publishedAt: new Date(publishedAt),
      processedAt: new Date(),
    })),
  )
  .onConflictDoNothing()
  .returning({ id: articles.id });

console.log(`articles ${inserted.length}건 추가 (중복은 건너뜀)`);
