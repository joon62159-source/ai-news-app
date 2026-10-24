import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const feeds = pgTable(
  "feeds",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    url: text("url").notNull(),
    enabled: boolean("enabled").notNull().default(true),
  },
  (t) => [uniqueIndex("feeds_user_url_idx").on(t.userId, t.url)],
);

export const categories = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    color: text("color").notNull().default("#6b7280"),
  },
  (t) => [uniqueIndex("categories_user_name_idx").on(t.userId, t.name)],
);

export const articles = pgTable(
  "articles",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    feedId: integer("feed_id").references(() => feeds.id, {
      onDelete: "set null",
    }),
    // null = 미분류 (카테고리 삭제 시 미분류로 이동)
    categoryId: integer("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    url: text("url").notNull(),
    titleOrig: text("title_orig").notNull(),
    titleKo: text("title_ko").notNull(),
    summaryKo: text("summary_ko").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    fetchedAt: timestamp("fetched_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    notionPageId: text("notion_page_id"),
  },
  (t) => [
    uniqueIndex("articles_user_url_idx").on(t.userId, t.url),
    index("articles_user_category_idx").on(t.userId, t.categoryId),
  ],
);
