# PRD: AI News Collector

## 1. 개요
해외 AI 뉴스를 RSS로 수집하고, Claude API가 한국어로 번역·요약·카테고리 분류하여 카드 형태로 보여주는 웹 앱. 마음에 드는 뉴스는 카드의 'Notion 저장' 버튼으로 Notion에 보관한다.

### 목표
- 영어 AI 뉴스를 한국어 요약 카드로 빠르게 훑어본다.
- 뉴스가 자동으로 카테고리별로 분류되어 원하는 주제만 골라 볼 수 있다.
- 필요한 뉴스는 한 번의 클릭으로 Notion에 저장한다.

### 비목표 (현재 범위 밖)
- 자동 주기 수집(스케줄러). 수집은 사용자가 버튼을 눌렀을 때만 실행한다.
- 모바일 네이티브 앱, 다국어 번역(한국어만 지원).

## 2. 기술 스택
| 영역 | 선택 |
|---|---|
| 프레임워크 | Next.js (App Router, TypeScript) |
| 로그인 | Clerk |
| 데이터베이스 | Neon (Postgres) + Drizzle ORM |
| 번역/요약/분류 | Claude API (`@anthropic-ai/sdk`) |
| Notion 저장 | Notion MCP 서버 |
| RSS 파싱 | `rss-parser` |

## 3. 기본 뉴스 소스
- TechCrunch AI: https://techcrunch.com/category/artificial-intelligence/ (RSS: `.../feed/`)
- The Verge AI: https://www.theverge.com/ai-artificial-intelligence (RSS: `https://www.theverge.com/rss/ai-artificial-intelligence/index.xml`)

구현 시 실제 RSS URL의 동작 여부를 먼저 확인한다. 사용자는 피드를 추가·삭제·활성화/비활성화할 수 있다.

## 4. 기능 요구사항
### 4.1 로그인
- 앱 실행 시 Clerk 로그인이 필수다. 미로그인 상태에서는 모든 페이지·API가 로그인 화면으로 보호된다.
- 모든 데이터는 Clerk `userId`로 구분하며, 쿼리는 항상 userId로 스코프한다.

### 4.2 뉴스 가져오기
- "뉴스 가져오기" 버튼 클릭 시 서버가 활성 피드를 fetch한다.
- 기사 URL 기준으로 이미 저장된 기사는 제외하고 새 기사만 처리한다.
- 새 기사는 Claude API에 배치로 전달하여 아래를 JSON으로 받는다.
  - 한국어 제목
  - 한국어 요약(2~3문장)
  - 카테고리 1개 (사용자 카테고리 목록 중에서 선택, 해당 없으면 "미분류")
- 1회 처리 기사 수에 상한을 두고, 진행 중 로딩 상태를 표시한다.

### 4.3 뉴스 카드
- 표시 항목: 한국어 제목, 한국어 요약, 카테고리 뱃지, 출처, 발행일, 원문 링크, **Notion 저장 버튼**.
- 이미 Notion에 저장된 카드는 "저장됨"으로 표시하고 중복 저장을 막는다.

### 4.4 카테고리
- 기본 카테고리 목록 제공(예: LLM/모델, 이미지·영상, 로보틱스, 정책·규제, 비즈니스·투자, 기타).
- 사용자가 카테고리를 추가·수정·삭제할 수 있다.
- 카테고리 칩 클릭 시 해당 카테고리 뉴스만 필터링한다.
- 카테고리 삭제 시 소속 기사는 "미분류"로 이동한다.
- (선택) 카테고리 변경 후 기존 기사 재분류 기능.

### 4.5 RSS 피드 관리
- 기본 피드 2개를 내장한다.
- 사용자가 피드를 추가·삭제·활성화 토글할 수 있다.

### 4.6 Notion 저장
- 카드의 'Notion 저장' 버튼 클릭 시 Notion MCP 서버를 통해 Notion에 페이지를 생성한다.
- 저장 내용: 한국어 제목, 요약, 카테고리, 원문 링크, 출처, 발행일.
- 저장 성공 시 `notionPageId`를 기록하고, 실패 시 오류 메시지를 보여준다.

## 5. 사용자 흐름
1. 접속 → Clerk 로그인 → 메인 화면
2. "뉴스 가져오기" 클릭 → 새 기사 수집·번역·요약·분류 → 카드 목록 표시
3. 카테고리 칩으로 필터링하여 원하는 뉴스 열람
4. 마음에 드는 카드의 'Notion 저장' 클릭 → Notion에 저장, 카드에 "저장됨" 표시
5. 설정 화면에서 카테고리·피드를 추가/수정/삭제

## 6. 데이터 모델 (Drizzle, 초안)
- `feeds`(id, userId, name, url, enabled)
- `categories`(id, userId, name, color)
- `articles`(id, userId, feedId, categoryId, url, titleOrig, titleKo, summaryKo, publishedAt, fetchedAt, notionPageId nullable) — `(userId, url)` unique

## 7. 미결 사항: Notion MCP 연동
- 웹 서버에서 MCP를 쓰는 방식 결정 필요: (a) Claude API의 MCP connector로 Claude가 Notion 도구를 호출, (b) 서버에서 MCP 클라이언트로 직접 호출.
- Notion 인증 방식(내부 통합 토큰 vs OAuth)과 저장 대상 페이지/DB 지정 방식을 구현 초기에 확정한다.

## 8. 비기능 요구사항
- 환경변수(`.env.local`, 커밋 금지): Clerk 키, `DATABASE_URL`(Neon), `ANTHROPIC_API_KEY`, Notion 관련 키.
- Claude 호출은 서버에서만 수행하여 API 키를 노출하지 않는다.
- 비용 제어를 위해 저렴·빠른 모델을 기본으로 하고 기사를 배치 처리한다.

## 9. 구현 단계
1. Next.js 스캐폴딩 + Clerk 로그인/보호 라우트
2. Neon + Drizzle 스키마/마이그레이션, 기본 카테고리·피드 시드
3. 뉴스 가져오기 API (RSS → Claude → 저장) + 버튼
4. 카드 목록 + 카테고리 필터
5. 카테고리/피드 관리 화면
6. Notion MCP 저장 버튼

## 10. 검증 기준
- 비로그인 접근 시 로그인 화면으로 이동한다.
- 가져오기 후 한국어 제목/요약/카테고리가 있는 카드가 표시되고, 재클릭해도 중복 기사가 생기지 않는다.
- 카테고리 필터와 카테고리·피드의 추가/수정/삭제가 동작한다.
- Notion 저장 클릭 시 Notion에 페이지가 생성되고 카드에 "저장됨"이 표시된다.
