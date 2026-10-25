"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Result = {
  inserted: number;
  duplicates: number;
  errors: { feed: string; message: string }[];
};

export function FetchNewsButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean }>();

  const busy = loading || isPending;

  async function onClick() {
    setLoading(true);
    setMessage(undefined);
    try {
      const res = await fetch("/api/news/fetch", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "요청에 실패했어요");

      const r = data as Result;
      const failed = r.errors.map((e) => e.feed).join(", ");
      setMessage({
        text:
          `새 기사 ${r.inserted}건` +
          (failed ? ` · 실패한 피드: ${failed}` : ""),
        error: r.errors.length > 0,
      });
      startTransition(() => router.refresh());
    } catch (e) {
      setMessage({
        text: e instanceof Error ? e.message : "요청에 실패했어요",
        error: true,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <p
        role="status"
        className={`text-sm ${message?.error ? "text-red-600" : "text-slate-500"}`}
      >
        {message?.text}
      </p>
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy && (
          <span
            aria-hidden
            className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none"
          />
        )}
        {busy ? "가져오는 중…" : "뉴스 가져오기"}
      </button>
    </div>
  );
}
