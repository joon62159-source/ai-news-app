import Parser from "rss-parser";

export type FeedItem = {
  url: string;
  title: string;
  summary: string;
  publishedAt: Date;
};

const parser = new Parser({
  timeout: 10_000,
  headers: { "User-Agent": "ainewscollector/1.0" },
});

// Claude가 요약할 재료이므로 카드에 보이는 길이보다 넉넉하게 남긴다.
const SUMMARY_MAX = 1000;

// 추적 파라미터·해시를 제거해 같은 기사가 URL만 달라 중복 저장되는 것을 막는다.
export function normalizeUrl(raw: string): string {
  const u = new URL(raw.trim());
  u.hash = "";
  for (const key of [...u.searchParams.keys()]) {
    if (key.startsWith("utm_") || ["fbclid", "gclid", "ref"].includes(key)) {
      u.searchParams.delete(key);
    }
  }
  return u.toString();
}

function toPlainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

// 피드 하나를 읽어 since 이후에 발행된 기사만 반환한다.
export async function fetchFeedItems(
  feedUrl: string,
  since: Date,
): Promise<FeedItem[]> {
  const feed = await parser.parseURL(feedUrl);
  const items: FeedItem[] = [];

  for (const item of feed.items) {
    if (!item.link || !item.title || !item.isoDate) continue;
    const publishedAt = new Date(item.isoDate);
    if (Number.isNaN(publishedAt.getTime()) || publishedAt < since) continue;

    let url: string;
    try {
      url = normalizeUrl(item.link);
    } catch {
      continue;
    }

    const body = toPlainText(
      item.contentSnippet ?? item.summary ?? item.content ?? "",
    );
    items.push({
      url,
      title: item.title.trim(),
      summary:
        body.length > SUMMARY_MAX ? `${body.slice(0, SUMMARY_MAX)}…` : body,
      publishedAt,
    });
  }

  return items;
}
