// Notion "AI 뉴스 북마크" DB의 속성: 제목(title), 요약(text), 출처(url), 카테고리(select), 날짜(date)
const NOTION_VERSION = "2022-06-28";
// rich_text 한 덩어리는 2000자까지만 허용된다.
const RICH_TEXT_LIMIT = 2000;

export type NotionArticle = {
  titleKo: string;
  summaryKo: string;
  url: string;
  categoryName: string | null;
  publishedAt: Date | null;
};

export async function createNotionPage(article: NotionArticle): Promise<string> {
  const token = process.env.NOTION_API_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!token || !databaseId) {
    throw new Error("NOTION_API_TOKEN / NOTION_DATABASE_ID가 설정되지 않았어요");
  }

  const properties: Record<string, unknown> = {
    제목: { title: [{ text: { content: article.titleKo.slice(0, RICH_TEXT_LIMIT) } }] },
    요약: {
      rich_text: [{ text: { content: article.summaryKo.slice(0, RICH_TEXT_LIMIT) } }],
    },
    출처: { url: article.url },
    카테고리: { select: { name: article.categoryName ?? "미분류" } },
  };
  if (article.publishedAt) {
    properties["날짜"] = { date: { start: article.publishedAt.toISOString() } };
  }

  const res = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ parent: { database_id: databaseId }, properties }),
  });
  if (!res.ok) {
    throw new Error(`Notion API ${res.status}: ${await res.text()}`);
  }
  return ((await res.json()) as { id: string }).id;
}
