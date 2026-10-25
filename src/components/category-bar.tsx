import Link from "next/link";

type Category = { id: number; name: string; color: string };

const chipBase =
  "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 motion-reduce:transition-none";
const chipIdle =
  "border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800";
const chipActive =
  "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900";

// selected: undefined=전체, "none"=미분류, 그 외 카테고리 id 문자열
export function CategoryBar({
  categories,
  selected,
}: {
  categories: Category[];
  selected: string | undefined;
}) {
  const chip = (key: string | undefined, label: string, color?: string) => {
    const active = selected === key;
    return (
      <Link
        key={key ?? "all"}
        href={key ? `/dashboard?category=${key}` : "/dashboard"}
        aria-pressed={active}
        className={`${chipBase} ${active ? chipActive : chipIdle}`}
      >
        {color && (
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: color }}
          />
        )}
        {label}
      </Link>
    );
  };

  return (
    <div
      role="group"
      aria-label="카테고리"
      className="flex items-center gap-2 overflow-x-auto pb-1"
    >
      {chip(undefined, "전체")}
      {categories.map((c) => chip(String(c.id), c.name, c.color))}
      {chip("none", "미분류", "#9ca3af")}
    </div>
  );
}
