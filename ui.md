# UI 가이드: AI뉴스수집기

메인 화면(대시보드)을 기준으로 한 UI 스타일 가이드. 스타일링은 Tailwind CSS(v4)로 하고, 요구사항은 `PRD.md`를 따른다.

## 1. 디자인 원칙
- **읽기 우선**: 한국어 본문이 주인공이다. 장식은 최소화하고 여백과 글자 위계로 구분한다.
- **차분한 톤**: 흰 배경 + 중립 회색 + 단일 강조색(인디고). 카테고리 색은 작은 점·뱃지에만 쓴다.
- **일관성**: 간격은 4의 배수(Tailwind 기본 스케일), 모서리는 `rounded-xl`(카드)·`rounded-full`(칩·뱃지)로 통일한다.
- **라이트/다크 모두 지원**: `dark:` 변형을 쓰고, 색을 하드코딩하지 않고 아래 토큰을 쓴다.

## 2. 디자인 토큰

### 색상
| 용도 | 라이트 | 다크 |
|---|---|---|
| 페이지 배경 | `bg-slate-50` | `dark:bg-slate-950` |
| 카드/표면 | `bg-white` | `dark:bg-slate-900` |
| 테두리 | `border-slate-200` | `dark:border-slate-800` |
| 본문 텍스트 | `text-slate-900` | `dark:text-slate-100` |
| 보조 텍스트 | `text-slate-600` | `dark:text-slate-400` |
| 흐린 텍스트(메타) | `text-slate-500` | `dark:text-slate-500` |
| 강조(Primary) | `bg-indigo-600 hover:bg-indigo-700 text-white` | `dark:bg-indigo-500 dark:hover:bg-indigo-400` |
| 성공(저장됨) | `text-emerald-700 bg-emerald-50` | `dark:text-emerald-300 dark:bg-emerald-950` |
| 오류 | `text-red-700 bg-red-50` | `dark:text-red-300 dark:bg-red-950` |

카테고리 고유 색은 DB의 `categories.color`(hex)를 쓴다. 기본값은 `src/db/defaults.ts` 참고. 인라인 `style`로 점(dot)에만 적용하고, 뱃지 배경은 중립색을 유지한다.

### 타이포그래피
- 폰트: `font-sans`(Geist). 한글은 시스템 폰트로 폴백되므로 `globals.css`의 `body`에서 `font-family: Arial` 고정을 제거하고 `var(--font-sans)`를 쓴다.
- 위계:
  - 앱 이름: `text-lg font-bold tracking-tight`
  - 카드 제목: `text-lg font-semibold leading-snug`
  - 본문(요약): `text-[15px] leading-7 text-slate-600`
  - 메타(출처·날짜): `text-xs text-slate-500`
- 한국어 줄바꿈은 `break-keep`을 제목·요약에 적용한다.

### 간격·모양
- 페이지 컨테이너: `mx-auto w-full max-w-6xl px-4 sm:px-6`
- 섹션 간격: `space-y-6` (헤더 ↔ 카테고리 ↔ 카드 목록)
- 카드: `rounded-xl border p-5 shadow-sm`, hover 시 `hover:shadow-md transition-shadow`
- 포커스 링: 모든 상호작용 요소에 `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500`

## 3. 레이아웃

```
┌──────────────────────────────────────────────────────┐
│ 헤더: AI뉴스수집기            [뉴스 가져오기]  (유저) │
├──────────────────────────────────────────────────────┤
│ 카테고리: (전체) (LLM/모델) (로보틱스) … (+ 카테고리)  │
├──────────────────────────────────────────────────────┤
│ ┌────────┐ ┌────────┐ ┌────────┐                     │
│ │ 뉴스   │ │ 뉴스   │ │ 뉴스   │   ← 반응형 그리드     │
│ │ 카드   │ │ 카드   │ │ 카드   │                     │
│ └────────┘ └────────┘ └────────┘                     │
└──────────────────────────────────────────────────────┘
```

- 반응형 카드 그리드: `grid gap-4 sm:grid-cols-2 lg:grid-cols-3`
- 모바일(<640px)은 1열, 카테고리 바는 가로 스크롤.

## 4. 컴포넌트

### 4.1 헤더
- 상단 고정: `sticky top-0 z-10 border-b bg-white/80 backdrop-blur dark:bg-slate-950/80`
- 좌측: 앱 이름 "AI뉴스수집기" (`text-lg font-bold`), 앞에 작은 인디고 로고 점 또는 아이콘.
- 우측: **뉴스 가져오기** Primary 버튼 + Clerk `UserButton`. 현재 `layout.tsx`의 `UserButton` 전용 헤더를 이 헤더로 대체한다.
- 가져오기 진행 중: 버튼 `disabled`, 스피너 + "가져오는 중…" 표시. 완료 시 토스트/인라인 문구로 "새 기사 N건" 알림.

### 4.2 카테고리 바 (뉴스 카드 목록 바로 위)
- 컨테이너: `flex items-center gap-2 overflow-x-auto pb-1` (줄바꿈 대신 가로 스크롤, 스크롤바는 숨김 처리 가능).
- **칩(Chip)**:
  - 기본: `shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100`
  - 선택됨: `bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900`
  - 각 칩 앞에 카테고리 색 점 `size-2 rounded-full` (`style={{ backgroundColor: color }}`).
  - 첫 칩은 **전체**(점 없음). 마지막 일반 칩 뒤에 "미분류"가 있다.
  - 칩 우측에 기사 수를 `text-xs text-slate-400`로 표시(선택).
- **카테고리 추가 버튼**: 칩 목록의 **맨 끝**에 위치.
  - 모양: 점선 테두리 칩 `shrink-0 rounded-full border border-dashed px-3.5 py-1.5 text-sm text-slate-500 hover:border-indigo-400 hover:text-indigo-600`
  - 내용: `+` 아이콘 + "카테고리 추가". 모바일에서도 라벨을 유지한다.
  - 클릭 시: 칩 자리에서 인라인 입력(이름 입력 + 색 선택 + 확인/취소)으로 전환하거나 작은 팝오버를 연다. Enter로 확정, Esc로 취소.
  - 접근성: `aria-label="카테고리 추가"`.
- 칩 호버 시 우측에 수정·삭제 아이콘을 노출한다(삭제 시 확인 문구: "소속 기사는 미분류로 이동합니다").

### 4.3 뉴스 카드
구성(위→아래):
1. 상단 행: 카테고리 뱃지(좌) · 발행일(우, 상대시간 예: "3시간 전", `title`에 절대 시각)
2. 제목(한국어): `text-lg font-semibold leading-snug break-keep line-clamp-2`
3. 요약(한국어, 2~3문장): `text-[15px] leading-7 text-slate-600 line-clamp-4`
4. 하단 행(`mt-auto pt-4 border-t`): 출처 · 원문 링크(좌) / **Notion 저장** 버튼(우)

세부:
- 카드 컨테이너: `flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900`
- 카테고리 뱃지: `inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300` + 색 점.
- 출처: `text-xs text-slate-500`. 원문 링크: `text-xs text-indigo-600 hover:underline`, "원문 보기 ↗", `target="_blank" rel="noopener noreferrer"`.
- **Notion 저장 버튼** 상태:
  - 기본: 보조(Secondary) 버튼 `rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-slate-50`
  - 저장 중: 스피너 + "저장 중…", `disabled`
  - 저장됨: `bg-emerald-50 text-emerald-700` + 체크 아이콘 + "저장됨", `disabled`(중복 저장 방지)
  - 실패: 버튼 아래 `text-xs text-red-600`로 오류 메시지, 버튼은 다시 활성화.
- 제목은 원문 링크가 아니라 텍스트로만 두고, 이동은 "원문 보기"로 한정해 실수 클릭을 줄인다.

### 4.4 버튼
| 종류 | 클래스 |
|---|---|
| Primary | `inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed` |
| Secondary | `inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800` |
| Ghost(아이콘) | `rounded-md p-1.5 text-slate-500 hover:bg-slate-100` |

터치 영역은 최소 36px 높이를 유지한다.

### 4.5 빈 상태 / 로딩 / 오류
- **빈 상태**(기사 없음): 카드 그리드 자리에 중앙 정렬 안내 — "아직 수집된 뉴스가 없어요" + Primary "뉴스 가져오기" 버튼. 필터 결과가 비었으면 "이 카테고리에는 뉴스가 없어요".
- **로딩**: 카드 모양 스켈레톤(`animate-pulse`, `bg-slate-200` 블록 3줄) 6개.
- **오류**: 목록 상단에 `rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm` 배너 + "다시 시도".

## 5. 인터랙션·접근성
- 카테고리 칩은 `button`이며 선택 상태에 `aria-pressed`를 둔다. 칩 그룹은 `role="group" aria-label="카테고리"`.
- 색만으로 상태를 전달하지 않는다(저장됨은 아이콘+텍스트, 선택 칩은 색+굵기/대비 변화).
- 본문 대비 WCAG AA(4.5:1) 이상 유지 — 흐린 텍스트(`slate-500`)는 메타 정보에만 쓴다.
- 애니메이션은 `transition-colors`/`transition-shadow` 수준으로 짧게(150ms), `motion-reduce:transition-none`을 고려한다.
- 카테고리 필터는 URL 쿼리(`?category=<id>`)로 반영해 새로고침·공유 시 유지한다.

## 6. 구현 메모
- 컴포넌트 위치 제안: `src/components/` — `header.tsx`, `category-bar.tsx`, `news-card.tsx`, `news-grid.tsx`.
- 서버 컴포넌트에서 DB를 읽고(`auth()`로 `userId` 확인), 칩 선택·카테고리 추가·Notion 저장 같은 상호작용 부분만 클라이언트 컴포넌트로 분리한다.
- Next.js 16 `cacheComponents` 때문에 요청 데이터를 읽는 목록·카테고리 영역은 `<Suspense fallback={스켈레톤}>`으로 감싼다(CLAUDE.md 참고).
- `metadata.title`을 앱 이름에 맞춰 "AI뉴스수집기"로 바꾼다(현재 "AI News Collector").
- 아이콘은 별도 의존성 없이 인라인 SVG를 쓰거나, 필요하면 `lucide-react` 도입을 검토한다.
