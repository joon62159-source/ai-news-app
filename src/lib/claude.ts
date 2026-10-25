import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-haiku-5-5";
const CONCURRENCY = 8;

const client = new Anthropic();

export type ArticleInput = {
  id: number;
  title: string;
  summary: string;
};

export type ProcessedArticle = {
  titleKo: string;
  summaryKo: string;
  // 사용자의 카테고리 이름 중 하나
  category: string;
};

const SYSTEM_PROMPT = `당신은 해외 AI 뉴스를 한국어 독자에게 전달하는 편집자입니다.
기사의 영어 제목과 RSS 요약이 주어지면 다음을 수행하세요.
- titleKo: 자연스러운 한국어 제목으로 번역합니다. 고유명사와 제품명은 원문 표기를 유지해도 됩니다.
- summaryKo: 핵심 내용을 3~4문장의 한국어로 요약합니다. 누가 무엇을 했는지, 왜 중요한지를 담고, 입력에 없는 사실은 추가하지 않습니다.
- category: 주어진 카테고리 목록 중 가장 알맞은 것 하나를 고릅니다. 맞는 것이 없으면 "기타"가 있을 때 그것을 고릅니다.`;

async function processOne(
  article: ArticleInput,
  categoryNames: string[],
): Promise<ProcessedArticle> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    output_config: {
      effort: "low",
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            titleKo: { type: "string" },
            summaryKo: { type: "string" },
            category: { type: "string", enum: categoryNames },
          },
          required: ["titleKo", "summaryKo", "category"],
          additionalProperties: false,
        },
      },
    },
    messages: [
      {
        role: "user",
        content: `카테고리 목록: ${categoryNames.join(", ")}\n\n제목: ${article.title}\n\nRSS 요약: ${article.summary || "(없음)"}`,
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("Claude가 이 기사의 처리를 거부했어요");
  }
  if (response.stop_reason === "max_tokens") {
    throw new Error("Claude 응답이 잘렸어요");
  }

  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") throw new Error("Claude 응답이 비어 있어요");
  return JSON.parse(text.text) as ProcessedArticle;
}

export type ProcessResult =
  | { id: number; ok: true; value: ProcessedArticle }
  | { id: number; ok: false; message: string };

// 기사들을 CONCURRENCY건씩 병렬로 처리한다. 한 건이 실패해도 나머지는 계속 진행한다.
export async function processArticles(
  articles: ArticleInput[],
  categoryNames: string[],
): Promise<ProcessResult[]> {
  const results: ProcessResult[] = [];

  for (let i = 0; i < articles.length; i += CONCURRENCY) {
    const chunk = articles.slice(i, i + CONCURRENCY);
    const settled = await Promise.allSettled(
      chunk.map((a) => processOne(a, categoryNames)),
    );
    settled.forEach((r, j) => {
      const id = chunk[j].id;
      results.push(
        r.status === "fulfilled"
          ? { id, ok: true, value: r.value }
          : {
              id,
              ok: false,
              message:
                r.reason instanceof Error ? r.reason.message : String(r.reason),
            },
      );
    });
  }

  return results;
}
