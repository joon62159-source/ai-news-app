import { AuthGate } from "@/components/auth-gate";

export default function Home() {
  return (
    <AuthGate>
      <main className="flex flex-1 items-center justify-center p-6">
        <p className="text-zinc-600 dark:text-zinc-400">
          뉴스 카드가 여기에 표시됩니다.
        </p>
      </main>
    </AuthGate>
  );
}
