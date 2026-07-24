# 맑은물에 ERP — AI 어시스턴트 프로토타입

맑은물에 홀딩스 식품제조 통합 ERP(el-bigs)에 붙는 **AI 어시스턴트**의 동작 프로토타입.
빌드 없음 · 의존성 없음(Pretendard 웹폰트 CDN 하나 제외). 정적 HTML/CSS/JS.

기획: `맑은물에ERP_AzureOpenAI_AI어시스턴트_MVP` · 디자인: 삼성화재 SFUXC 디자인 가이드 기반 리디자인(Figma)

## 버전 비교 구조

개발 1차 범위와 대화 기록 저장 기능을 얹은 차기 후보를 나란히 배포한다.

| 경로 | 버전 | 내용 |
|---|---|---|
| `index.html` | — | **랜딩** — 두 버전 비교·이동 |
| `baseline/` | v1.0 | **기본 버전** — 대화 기록 저장 없음 (1차 개발 범위) |
| `history/` | v1.1 | **대화 기록 버전** — 대화 저장·선택·검색 (차기 후보) |

- 라이브: `https://doolam2.github.io/erp-ai-assistant-mvp/`
- git 태그로 스냅샷 고정: `v1.0-baseline`, `v1.1-history`

## 각 버전 화면

두 버전 모두 아래 2화면을 공유한다.

| 파일 | 내용 |
|---|---|
| `index.html` | ERP 홈 대시보드 + 우측 슬라이드 챗 패널 |
| `chat.html` | AI 어시스턴트 전체화면 챗 |

### 이중 진입 (기획서 UI 원칙)

- **상단 GNB `✨ AI 어시스턴트`** → 우측 430px 챗 패널 슬라이드(딤 없이 대시보드가 밀림). 모바일 폭은 전체화면 전환.
- **좌측 LNB `AI 어시스턴트`** → `chat.html` 전체화면 챗.
- 슬라이드 답변의 `재고현황에서 열기 ↗` → 뒤 ERP가 로트별 재고현황으로 전환 + 로트(`L-2607-18`) 하이라이트.

## 대화 기록 버전 (`history/`)

`baseline/`에 `history.js`를 얹어 대화 기록을 구현한다. 기존 `app.js`·`home.js`는 수정하지 않는다.

- **저장**: 브라우저 `localStorage` (서버 아님). 세션 = `{id, title, preview, updatedAt, html}`.
- **전체화면**: `LNB │ 대화 기록 사이드바 │ 챗` 3단. 세션 선택·검색·새 대화(삭제 없음).
- **슬라이드 패널**: head의 기록 아이콘 → 대화 기록 오버레이.
- **자동 저장**: thread를 `MutationObserver`로 감시해 현재 세션을 저장(전송 로직에 비침투).

## 응답 규격

AI 답변은 기획서에 확정된 JSON 규격을 전제로 만들었다.

```json
{ "query": "이번 달 A라인 불량률은?", "sources": ["production_db", "quality_db"], "answer": "…", "confidence": "high" }
```

`sources`는 근거 칩, `confidence`는 배지로 노출(high 조용 / medium 확인 / low 강조 축소).

## 로컬 실행

```bash
python3 -m http.server 4173
```

`http://localhost:4173` 을 연다.

## 메모

- 외부 의존은 Pretendard 웹폰트 CDN 하나뿐, 나머지는 상대경로.
- 데이터는 전부 목업. 실제 ERP DB·Azure OpenAI에 연결되지 않는다.
