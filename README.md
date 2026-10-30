# AI News Collector

해외 AI 뉴스를 RSS로 수집하고, Claude API로 한국어 번역·요약·카테고리 분류를 한 뒤 카드로 보여주는 웹 앱입니다. 마음에 드는 뉴스는 카드의 버튼으로 Notion에 저장할 수 있습니다.

## 주요 기능

- **뉴스 가져오기**: "뉴스 가져오기" 버튼을 누르면 활성 RSS 피드에서 지난 24시간 기사를 수집합니다. URL 기준으로 중복 기사는 제외합니다.
- **번역·요약·분류**: 새 기사를 Claude API에 전달해 한국어 제목, 2~3문장 요약, 카테고리를 한 번에 받아옵니다.
- **뉴스 카드**: 제목, 요약, 카테고리 뱃지, 출처, 발행일, 원문 링크를 카드로 표시하고 카테고리 칩으로 필터링합니다.
- **Notion 저장**: 카드에서 한 번 클릭으로 Notion DB에 저장하며, 저장된 카드는 "저장됨"으로 표시됩니다.
- **사용자별 데이터**: Clerk 로그인이 필수이며 모든 데이터는 `userId`로 구분됩니다.

기본 피드는 TechCrunch AI와 The Verge AI이고, 기본 카테고리는 LLM/모델, 이미지·영상, 로보틱스, 정책·규제, 비즈니스·투자, 기타입니다.

## 기술 스택

| 영역 | 선택 |
|---|---|
| 프레임워크 | Next.js 16 (App Router, TypeScript), React 19 |
| 스타일 | Tailwind CSS 4 |
| 로그인 | Clerk |
| 데이터베이스 | Neon (Postgres) + Drizzle ORM |
| 번역/요약/분류 | Claude API (`@anthropic-ai/sdk`) |
| RSS 파싱 | `rss-parser` |
| 저장소 연동 | Notion API |

## 시작하기

### 1. 설치

```bash
npm install
```

### 2. 환경변수

프로젝트 루트에 `.env.local`을 만들고 아래 값을 채웁니다. 이 파일은 커밋하지 않습니다.

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Neon (Postgres)
DATABASE_URL=

# Claude API
ANTHROPIC_API_KEY=

# Notion
NOTION_API_TOKEN=
NOTION_DATABASE_ID=
```

### 3. 데이터베이스 마이그레이션

```bash
npm run db:migrate
```

### 4. 개발 서버 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)에 접속해 로그인하면 됩니다.

## 명령어

| 명령어 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 (localhost:3000) |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 실행 |
| `npm run lint` | ESLint 검사 |
| `npx tsc --noEmit` | 타입 검사 |
| `npm run db:generate` | `schema.ts` 변경분으로 `drizzle/`에 SQL 생성 |
| `npm run db:migrate` | Neon에 마이그레이션 적용 |
| `npm run db:studio` | Drizzle Studio 실행 |

## 프로젝트 구조

```
src/
├── app/
│   ├── api/news/fetch/     # 뉴스 가져오기 API (RSS → Claude → DB)
│   ├── api/news/[id]/save/ # Notion 저장 API
│   ├── dashboard/          # 메인 대시보드
│   ├── sign-in, sign-up/   # Clerk 로그인·회원가입
│   └── layout.tsx
├── components/             # 카테고리 바, 뉴스 카드, 가져오기 버튼 등
├── db/                     # Drizzle 스키마·클라이언트·기본 데이터
├── lib/                    # RSS 수집, Claude 호출, Notion 연동
└── proxy.ts                # 로그인 보호 (Next.js 16 middleware 대체)
drizzle/                    # 마이그레이션 SQL
```

## 문서

- [PRD.md](PRD.md): 요구사항, 데이터 모델, 구현 단계
- [ui.md](ui.md): Tailwind 기반 UI 가이드
- [CLAUDE.md](CLAUDE.md): 개발 시 참고할 아키텍처와 주의사항

## 진행 상황

- [x] Next.js + Clerk 로그인
- [x] Neon + Drizzle 스키마
- [x] 뉴스 가져오기 및 Claude 번역·요약·분류
- [x] 뉴스 카드 목록, 카테고리 필터
- [x] Notion 저장 버튼
- [ ] 카테고리·피드 관리 화면

## 주의사항

Next.js 16은 기존 버전과 다른 breaking change가 있습니다. `middleware`는 `proxy`로 바뀌었고 `cacheComponents`가 켜져 있어, 요청 데이터에 접근하는 부분은 `<Suspense>`로 감싸야 합니다. 자세한 내용은 [CLAUDE.md](CLAUDE.md)를 참고하세요.
