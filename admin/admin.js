/* ===== 관리자 프로토타입 — 뷰 전환 · 차트 · 로그 상세 (목업, 이모지 없음) ===== */
(function () {
  "use strict";

  const VIEWS = {
    dashboard: ["토큰 사용량 대시보드", "Azure OpenAI · GPT-5 mini · 사내 MVP"],
    logs: ["응답 로그", "sources · confidence 기록 · 낮은 confidence가 보강 대상"],
    qa: ["QA 검증 리스트", "실제 업무 질문으로 응답 정확도를 반복 검증"],
    settings: ["모델 · API 설정", "민감 값은 .env로 일원화 · 환경별 분리"],
    alerts: ["임계치 알림", "사용량 임계치 초과 시 통보 이력"],
    accuracy: ["응답 정확도", "난이도별 정확도 추이"],
    db: ["DB 연결 (MCP)", "실제 dev DB 직접 조회 · 스키마 학습"],
    org: ["조직 · 권한", "조직별 열람 권한 · 배정량"],
  };
  const REAL = new Set(["dashboard", "logs", "qa", "settings"]);

  const pageTitle = document.getElementById("pageTitle");
  const pageSub = document.getElementById("pageSub");
  const contentEl = document.querySelector(".content");

  function showView(v) {
    document.querySelectorAll(".lnb__item").forEach((it) => it.classList.toggle("is-active", it.dataset.view === v));
    document.querySelectorAll(".view").forEach((s) => (s.hidden = true));
    const target = REAL.has(v) ? document.getElementById("view-" + v) : document.getElementById("view-placeholder");
    if (!REAL.has(v)) document.getElementById("phTitle").textContent = VIEWS[v][0];
    if (target) target.hidden = false;
    const [t, s] = VIEWS[v] || VIEWS.dashboard;
    pageTitle.textContent = t;
    pageSub.textContent = s;
    if (contentEl) contentEl.scrollTop = 0;
  }
  document.querySelectorAll(".lnb__item").forEach((it) =>
    it.addEventListener("click", () => showView(it.dataset.view))
  );

  /* ---------- 일별 토큰 사용량 차트 (22일, Input/Output 스택) ---------- */
  const chart = document.getElementById("dailyChart");
  if (chart) {
    const days = [
      [0.42, 0.15], [0.55, 0.2], [0.6, 0.22], [0.5, 0.18], [0.68, 0.25], [0.72, 0.28],
      [0.35, 0.12], [0.4, 0.15], [0.78, 0.3], [0.82, 0.32], [0.7, 0.26], [0.6, 0.22],
      [0.45, 0.16], [0.5, 0.19], [0.88, 0.34], [0.92, 0.36], [0.8, 0.3], [0.74, 0.28],
      [0.5, 0.18], [0.58, 0.21], [0.95, 0.38], [1.0, 0.4],
    ];
    const max = 1.4;
    chart.innerHTML = days
      .map(([i, o], idx) => {
        const inH = (i / max) * 100, outH = (o / max) * 100;
        return `<div class="chart-col"><div class="chart-bar" style="height:${inH + outH}%">
          <div class="seg-in" style="height:${(inH / (inH + outH)) * 100}%"></div>
          <div class="seg-out" style="height:${(outH / (inH + outH)) * 100}%"></div>
        </div><span class="chart-x">${idx + 1}</span></div>`;
      })
      .join("");
  }

  /* ---------- 응답 로그: 행 선택 → 상세 ---------- */
  const LOGS = [
    { meta: "09:14 · 품질관리팀", tags: ['<span class="tag tag--lv">Lv.2 관계 DB</span>', '<span class="tag tag--high">confidence: high</span>'],
      json: `{\n  <span class="k">"query"</span>: <span class="s">"이번 달 A라인 불량률은?"</span>,\n  <span class="k">"sources"</span>: [<span class="s">"production_db"</span>, <span class="s">"quality_db"</span>],\n  <span class="k">"answer"</span>: <span class="s">"이번 달 A라인 불량률은 1.8%입니다."</span>,\n  <span class="k">"confidence"</span>: <span class="s">"high"</span>\n}`, fb: null },
    { meta: "09:08 · 맑은물에", tags: ['<span class="tag tag--high">confidence: high</span>'],
      json: `{\n  <span class="k">"query"</span>: <span class="s">"상암점 이번 주 발주 추이 정리해줘"</span>,\n  <span class="k">"sources"</span>: [<span class="s">"production_db"</span>],\n  <span class="k">"answer"</span>: <span class="s">"이번 주 상암점 발주는 두부 중심으로 12% 증가했습니다."</span>,\n  <span class="k">"confidence"</span>: <span class="s">"high"</span>\n}`, fb: null },
    { meta: "08:52 · 설비보전팀", tags: ['<span class="tag tag--lv">Lv.3 멀티 DB 조합</span>', '<span class="tag tag--medium">confidence: medium</span>', '<span class="tag" style="background:var(--g1);color:var(--g8)">피드백 있음</span>'],
      json: `{\n  <span class="k">"query"</span>: <span class="s">"설비 3호기 정지 이력과\n            그때 생산된 로트 알려줘"</span>,\n  <span class="k">"sources"</span>: [<span class="s">"equipment_db"</span>, <span class="s">"production_db"</span>, <span class="s">"quality_db"</span>],\n  <span class="k">"answer"</span>: <span class="s">"7월 18일 14:20~15:05 정지,\n             해당 시간 로트 3건입니다."</span>,\n  <span class="k">"confidence"</span>: <span class="s">"medium"</span>\n}`,
      fb: "사용자 피드백 · 별로예요<br />“정보가 부정확해요” — 로트 3건 중 1건은 정지 시간 이전에 생산된 건입니다." },
    { meta: "08:41 · 맑은물에", tags: ['<span class="tag tag--high">confidence: high</span>'],
      json: `{\n  <span class="k">"query"</span>: <span class="s">"지난주 폐기율 알려줘"</span>,\n  <span class="k">"sources"</span>: [<span class="s">"production_db"</span>],\n  <span class="k">"answer"</span>: <span class="s">"지난주 상암점 폐기율은 4.2%입니다."</span>,\n  <span class="k">"confidence"</span>: <span class="s">"high"</span>\n}`, fb: null },
    { meta: "08:20 · 생산본부", tags: ['<span class="tag tag--low">confidence: low</span>', '<span class="tag" style="background:var(--tint-red);color:var(--neg)">권한 없음</span>'],
      json: `{\n  <span class="k">"query"</span>: <span class="s">"원가 대비 마진율 상위 품목은?"</span>,\n  <span class="k">"sources"</span>: [],\n  <span class="k">"answer"</span>: <span class="s">"원가 · 마진 정보는 조회 권한이 필요합니다."</span>,\n  <span class="k">"confidence"</span>: <span class="s">"low"</span>\n}`, fb: null },
    { meta: "08:03 · 맑은물에", tags: ['<span class="tag tag--high">confidence: high</span>'],
      json: `{\n  <span class="k">"query"</span>: <span class="s">"국산 두부 최근 4주 판매량"</span>,\n  <span class="k">"sources"</span>: [<span class="s">"production_db"</span>],\n  <span class="k">"answer"</span>: <span class="s">"최근 4주 국산 두부 판매량은 6,420박스입니다."</span>,\n  <span class="k">"confidence"</span>: <span class="s">"high"</span>\n}`, fb: null },
  ];
  const detailCard = document.querySelector("#view-logs .cols > .card:last-child");
  function renderDetail(i) {
    const d = LOGS[i];
    detailCard.innerHTML =
      `<div class="card__head"><div class="card__title">로그 상세</div><div class="card__sub">${d.meta}</div></div>` +
      `<div class="detail__meta">${d.tags.join("")}</div>` +
      `<pre class="code">${d.json}</pre>` +
      (d.fb ? `<div class="detail__feedback">${d.fb}</div>` : "") +
      `<div style="display:flex;gap:8px;margin-top:14px;"><button class="btn btn--primary">QA 리스트에 추가</button><button class="btn btn--outline">프롬프트 보강</button></div>`;
  }
  document.querySelectorAll("#logRows tr").forEach((tr) =>
    tr.addEventListener("click", () => {
      document.querySelectorAll("#logRows tr").forEach((r) => r.classList.remove("is-selected"));
      tr.classList.add("is-selected");
      renderDetail(+tr.dataset.log);
    })
  );

  /* ---------- 시각적 토글: 필터 칩 · 탭 · 모델 라디오 ---------- */
  document.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip-filter");
    if (chip) {
      const row = chip.parentElement;
      if (chip.textContent.trim() === "전체") row.querySelectorAll(".chip-filter").forEach((c) => c.classList.remove("is-active"));
      chip.classList.toggle("is-active");
      const all = row.querySelector(".chip-filter");
      if (chip !== all) all.classList.remove("is-active");
      return;
    }
    const tab = e.target.closest(".tab");
    if (tab) { tab.parentElement.querySelectorAll(".tab").forEach((t) => t.classList.remove("is-active")); tab.classList.add("is-active"); return; }
    const model = e.target.closest(".model-card");
    if (model) {
      model.parentElement.querySelectorAll(".model-card").forEach((m) => m.classList.remove("is-selected"));
      model.classList.add("is-selected");
    }
  });
})();
