export type NewsCardData = {
  id: number;
  url: string;
  titleKo: string;
  summaryKo: string;
  publishedAt: Date | null;
  fetchedAt: Date;
  notionPageId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  feedName: string | null;
};

const rtf = new Intl.RelativeTimeFormat("ko", { numeric: "auto" });

function relativeTime(date: Date) {
  const diffSec = (date.getTime() - Date.now()) / 1000;
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, sec] of units) {
    if (Math.abs(diffSec) >= sec) return rtf.format(Math.round(diffSec / sec), unit);
  }
  return "방금 전";
}

export function NewsCard({ article }: { article: NewsCardData }) {
  const date = article.publishedAt ?? article.fetchedAt;

  return (
    <article className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md motion-reduce:transition-none dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: article.categoryColor ?? "#9ca3af" }}
          />
          {article.categoryName ?? "미분류"}
        </span>
        <time
          dateTime={date.toISOString()}
          title={date.toLocaleString("ko-KR")}
          className="shrink-0 text-xs text-slate-500"
        >
          {relativeTime(date)}
        </time>
      </div>

      <h2 className="mt-3 line-clamp-2 break-keep text-lg font-semibold leading-snug text-slate-900 dark:text-slate-100">
        {article.titleKo}
      </h2>
      <p className="mt-2 line-clamp-6 break-keep text-[15px] leading-7 text-slate-600 dark:text-slate-400">
        {article.summaryKo}
      </p>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
        <div className="flex min-w-0 items-center gap-2 text-xs">
          {article.feedName && (
            <span className="truncate text-slate-500">{article.feedName}</span>
          )}
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-indigo-600 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:text-indigo-400"
          >
            원문 보기 ↗
          </a>
        </div>
        {article.notionPageId && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            ✓ 저장됨
          </span>
        )}
      </div>
    </article>
  );
}
