"use client";

import { useEffect } from "react";
import { useAuth, useClerk } from "@clerk/nextjs";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { loaded, openSignIn } = useClerk();
  const { isSignedIn } = useAuth();

  // 접속 즉시 로그인 모달을 띄운다. 이미 로그인된 상태에서는 열지 않는다.
  // 닫아도 버튼으로 다시 열 수 있다.
  useEffect(() => {
    if (loaded && isSignedIn === false) openSignIn();
  }, [loaded, isSignedIn, openSignIn]);

  // 로그인 여부는 클라이언트 값만 신뢰한다(prerender된 서버 화면과 어긋날 수 있음).
  if (isSignedIn === undefined) return null;
  if (isSignedIn) return <>{children}</>;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">AI News Collector</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        해외 AI 뉴스를 한국어로 번역·요약해 보여줍니다. 로그인 후 이용할 수 있습니다.
      </p>
      <button
        type="button"
        onClick={() => openSignIn()}
        className="h-12 rounded-full bg-foreground px-6 font-medium text-background"
      >
        로그인
      </button>
    </main>
  );
}
