ALTER TABLE "articles" ADD COLUMN "processed_at" timestamp with time zone;
--> statement-breakpoint
-- 이미 분류된 기사(예제 시드)는 처리 완료로 간주한다.
UPDATE "articles" SET "processed_at" = now() WHERE "category_id" IS NOT NULL;
