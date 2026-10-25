# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트

해외 AI 뉴스를 RSS로 수집해 Claude API로 한국어 번역·요약·분류하고, 카드로 보여주며 Notion에 저장하는 웹 앱. 요구사항·데이터 모델·구현 단계는 `PRD.md`가 기준이다(구현 단계 1~2 완료, 3단계 뉴스 가져오기 API부터 남음). UI 작업 시에는 `ui.md`(Tailwind 기반 UI 가이드: 대시보드 레이아웃, 카테고리 바, 뉴스 카드 스타일)를 따른다.

## 명령어

```bash
npm run dev          # 개발 서버 (localhost:3000)
npm run build
npm run lint         # eslint
npx tsc --noEmit     # 타입 검사
npm run db:generate  # schema.ts 변경 → drizzle/ 에 SQL 생성
npm run db:migrate   # Neon에 마이그레이션 적용
npm run db:studio
```

테스트 러너는 아직 없다.

## Next.js 16 주의사항

학습 데이터와 다른 breaking change가 있다(`AGENTS.md` 참고). 코드 작성 전 `node_modules/next/dist/docs/`의 관련 문서를 읽을 것.

- middleware는 `proxy`로 이름이 바뀌었다: `src/proxy.ts`.
- `next.config.ts`에서 `cacheComponents: true`. 요청 데이터(`cookies()`, `headers()`, Clerk 컴포넌트 등)에 접근하는 부분은 `<Suspense>`로 감싸야 하며, 아니면 prerender 오류로 `/`가 404가 된다. `layout.tsx`의 `ClerkProvider`와 로그인·회원가입 페이지가 이 때문에 Suspense로 감싸져 있다.
- Clerk 7(`@clerk/nextjs`): `SignedIn`/`SignedOut`은 제거됐고 `<Show when="signed-in">`을 쓴다.

## 아키텍처

- **인증**: `src/proxy.ts`가 `/sign-in`, `/sign-up`을 제외한 모든 페이지·API를 `auth.protect()`로 보호한다. 모든 DB 쿼리는 Clerk `userId`로 스코프해야 하므로 API 라우트에서도 `auth()`로 `userId`를 직접 확인한다(`createRouteMatcher`는 Clerk가 deprecated 경고를 낸다).
- **DB**: Neon(Postgres) + Drizzle, `@neondatabase/serverless`의 HTTP 드라이버. 스키마는 `src/db/schema.ts`(`feeds`, `categories`, `articles`), 클라이언트는 `src/db/index.ts`. `articles`는 `(userId, url)` unique로 중복 수집을 막고, 카테고리·피드 삭제 시 FK가 `set null`이라 `categoryId`가 null이면 "미분류"로 취급한다.
- **사용자별 기본 데이터**: 전역 시드가 아니라 `src/db/defaults.ts`의 `ensureDefaults(userId)`가 첫 접속 시 기본 카테고리·피드를 넣는다(호출부는 아직 없음).
- **drizzle-kit**은 `.env.local`을 자동으로 읽지 않아 `drizzle.config.ts`에서 `process.loadEnvFile(".env.local")`를 쓴다.
- Claude 호출과 Notion 연동은 서버에서만 수행한다. Notion MCP 연동 방식은 PRD 7장에서 미결이다.

## 환경변수 (`.env.local`)

Clerk 키(`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`), `DATABASE_URL`. 이후 `ANTHROPIC_API_KEY`와 Notion 키가 추가된다.
