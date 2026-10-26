"use client";

import { useRef, useState } from "react";

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

function CategoryBadge({ article }: { article: NewsCardData }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
      <span
        className="size-2 rounded-full"
        style={{ backgroundColor: article.categoryColor ?? "#9ca3af" }}
      />
      {article.categoryName ?? "미분류"}
    </span>
  );
}

function SaveControl({
  saved,
  saving,
  error,
  onSave,
  className = "",
}: {
  saved: boolean;
  saving: boolean;
  error: boolean;
  onSave: () => void;
  className?: string;
}) {
  if (saved) {
    return (
      <span
        className={`inline-flex shrink-0 items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 ${className}`}
      >
        ✓ 저장됨
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onSave}
      disabled={saving}
      className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-slate-800 ${
        error
          ? "border-red-300 text-red-600 dark:border-red-800 dark:text-red-400"
          : "border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300"
      } ${className}`}
    >
      {saving && (
        <span
          aria-hidden
          className="size-3 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600 motion-reduce:animate-none"
        />
      )}
      {saving ? "저장 중…" : error ? "저장 실패 · 다시 시도" : "뉴스 저장"}
    </button>
  );
}

const linkClass =
  "shrink-0 text-indigo-600 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:text-indigo-400";

export function NewsCard({ article }: { article: NewsCardData }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const date = article.publishedAt ?? article.fetchedAt;
  const [saved, setSaved] = useState(article.notionPageId !== null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  async function save() {
    setSaving(true);
    setError(false);
    try {
      const res = await fetch(`/api/news/${article.id}/save`, { method: "POST" });
      if (!res.ok) throw new Error();
      setSaved(true);
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  const saveControl = (className?: string) => (
    <SaveControl
      saved={saved}
      saving={saving}
      error={error}
      onSave={save}
      className={className}
    />
  );

  return (
    <article className="relative flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md motion-reduce:transition-none dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <CategoryBadge article={article} />
        <time
          dateTime={date.toISOString()}
          title={date.toLocaleString("ko-KR")}
          className="shrink-0 text-xs text-slate-500"
        >
          {relativeTime(date)}
        </time>
      </div>

      <h2 className="mt-3 line-clamp-2 break-keep text-lg font-semibold leading-snug text-slate-900 dark:text-slate-100">
        {/* 제목 버튼이 카드 전체를 덮어(after) 카드 어디를 눌러도 상세가 열린다. */}
        <button
          type="button"
          onClick={() => dialogRef.current?.showModal()}
          className="cursor-pointer text-left after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-indigo-500"
        >
          {article.titleKo}
        </button>
      </h2>
      <p className="mt-2 line-clamp-4 break-keep text-[15px] leading-7 text-slate-600 dark:text-slate-400">
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
            className={`relative z-10 ${linkClass}`}
          >
            원문 보기 ↗
          </a>
        </div>
        {saveControl("relative z-10")}
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby={`news-${article.id}-title`}
        // 배경(::backdrop)을 눌렀을 때만 닫는다. 내용 안 클릭은 target이 dialog가 아니다.
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-2xl rounded-xl border border-slate-200 bg-white p-0 text-slate-900 shadow-xl backdrop:bg-slate-900/50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
      >
        <div className="flex max-h-[85vh] flex-col">
          <div className="flex items-center justify-between gap-3 px-6 pt-6">
            <CategoryBadge article={article} />
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="닫기"
              className="-m-2 inline-flex size-9 cursor-pointer items-center justify-center rounded-lg text-xl leading-none text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:hover:bg-slate-800"
            >
              ×
            </button>
          </div>

          <div className="overflow-y-auto px-6 pb-2">
            <h2
              id={`news-${article.id}-title`}
              className="mt-3 break-keep text-xl font-semibold leading-snug"
            >
              {article.titleKo}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {article.feedName && `${article.feedName} · `}
              <time dateTime={date.toISOString()}>
                {date.toLocaleString("ko-KR")}
              </time>
            </p>
            <p className="mt-4 whitespace-pre-line break-keep text-base leading-8 text-slate-700 dark:text-slate-300">
              {article.summaryKo}
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-6 py-4 text-sm dark:border-slate-800">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              원문 보기 ↗
            </a>
            {saveControl()}
          </div>
        </div>
      </dialog>
    </article>
  );
}
