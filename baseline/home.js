/* =========================================================
   홈 대시보드 + GNB 슬라이드 AI 어시스턴트 — 맑은물에 ERP (목업)
   ========================================================= */
(function () {
  "use strict";

  const app = document.getElementById("app");
  const aiLaunch = document.getElementById("aiLaunch");
  const aiClose = document.getElementById("aiClose");
  const aiThread = document.getElementById("aiThread");
  const aiInput = document.getElementById("aiInput");
  const aiInputField = document.getElementById("aiInputField");
  const toastEl = document.getElementById("toast");
  const homeView = document.getElementById("homeView");
  const stockView = document.getElementById("stockView");
  const dlBanner = document.getElementById("dlBanner");
  const pageTitle = document.getElementById("pageTitle");
  const pageSub = document.getElementById("pageSub");
  const lnb = document.getElementById("lnb");
  const scrim = document.getElementById("scrim");
  const hamburger = document.getElementById("hamburger");

  let generating = false;
  let panelReady = false;

  const el = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const now = () => new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const scrollDown = () => { aiThread.scrollTop = aiThread.scrollHeight; };
  const isMobile = () => window.matchMedia("(max-width: 767px)").matches;

  /* ---------- toast ---------- */
  let toastTimer = null;
  function toast(msg, withCheck = true) {
    toastEl.innerHTML = (withCheck ? '<span class="toast__check">✓</span>' : "") + esc(msg);
    toastEl.hidden = false;
    requestAnimationFrame(() => toastEl.classList.add("is-shown"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.classList.remove("is-shown"); setTimeout(() => (toastEl.hidden = true), 220); }, 2200);
  }

  /* ---------- answer builders (reused CSS classes) ---------- */
  function evidence(sources, conf) {
    const label = { high: "신뢰도 높음", medium: "신뢰도 보통 · 확인 필요", low: "근거 부족 · 담당자 확인" }[conf];
    return `<div class="evidence"><span class="evidence__label">조회한 데이터</span>${sources.map((s) => `<span class="src-chip">${esc(s)}</span>`).join("")}<span class="evidence__spacer"></span><span class="conf-badge ${conf}">${label}</span></div>`;
  }
  function deepLinks(items) {
    return `<div class="deep-links">${items.map((s) => `<button class="dl-btn" data-screen="${esc(s)}">${esc(s)}에서 열기 ↗</button>`).join("")}</div>`;
  }
  function scenarioFor(text) {
    const t = text.replace(/\s/g, "");
    if (/발주|주문|상암/.test(t)) return "order";
    if (/폐기|손실/.test(t)) return "waste";
    if (/유통기한|임박|재고/.test(t)) return "stock";
    if (/로트|추적|이력/.test(t)) return "lot";
    return "default";
  }
  function answerContent(kind) {
    if (kind === "order") {
      return `<div class="bubble bubble--ai">
        <p><span class="dl-inline" data-screen="발주정보 관리">국산 두부</span>는 D-1 임박이라 추가 발주 없이 현재고 소진을 권장합니다. 콩물 25박스, 비지 40박스 발주가 적정합니다.</p>
        <div class="answer-table"><table>
          <thead><tr><th>품목</th><th>현재고</th><th>유통기한</th><th>권장 발주</th></tr></thead>
          <tbody>
            <tr><td>국산 두부 200g</td><td>42박스</td><td style="color:var(--neg)"><strong>D-1</strong></td><td style="color:var(--g5)">0박스</td></tr>
            <tr><td>콩물 150g</td><td>18박스</td><td style="color:var(--neg)"><strong>D-2</strong></td><td><strong>25박스</strong></td></tr>
            <tr><td>비지 500g</td><td style="color:var(--orange-1)"><strong>6박스</strong></td><td>D-5</td><td><strong>40박스</strong></td></tr>
          </tbody></table></div>
        ${evidence(["생산 DB", "품질 DB", "재고 DB"], "medium")}
        ${deepLinks(["발주정보 관리", "재고정보 관리 · 로트"])}
        <div class="answer-actions">
          <button class="btn btn--primary" data-cta="order">발주서 생성</button>
          <button class="btn btn--ghost" data-cta="excel">엑셀 다운로드</button>
        </div></div>`;
    }
    if (kind === "waste") {
      return `<div class="bubble bubble--ai">
        <p>지난주 상암점 안전재고은 <strong>4.2%</strong>로 전주 대비 0.8%p 상승했습니다. 주요 원인은 <span class="dl-inline" data-screen="재고정보 관리 · 로트">두부·콩물</span> 재고 과다입니다.</p>
        ${evidence(["생산 DB", "재고 DB"], "high")}</div>`;
    }
    if (kind === "lot") {
      return `<div class="bubble bubble--ai">
        <p><span class="dl-inline" data-screen="재고정보 관리 · 로트">국산 두부 로트 L-2607-18</span>이 유통기한 D-1입니다. 입고(7/17) → 생산(7/18) → 품질합격(7/18) → 출고(7/20 상암점).</p>
        ${evidence(["재고 DB", "생산 DB", "품질 DB"], "high")}
        ${deepLinks(["재고정보 관리 · 로트", "품질정보 관리"])}</div>`;
    }
    if (kind === "stock") {
      return `<div class="bubble bubble--ai">
        <p>오늘 아침 기준 확인이 필요한 항목입니다.</p>
        <div class="status-cards">
          <div class="status-card"><div class="status-card__label">유통기한 임박</div><div class="status-card__value" style="color:var(--neg)">7품목</div></div>
          <div class="status-card"><div class="status-card__label">재고 부족</div><div class="status-card__value" style="color:var(--orange-1)">4품목</div></div>
          <div class="status-card"><div class="status-card__label">미검수 입고</div><div class="status-card__value" style="color:var(--pos-2)">2건</div></div>
        </div>
        ${evidence(["재고 DB", "품질 DB"], "high")}
        ${deepLinks(["재고정보 관리 · 로트"])}</div>`;
    }
    return `<div class="bubble bubble--ai">
      <p>질문을 이해했어요. 발주·재고·유통기한·안전재고·로트 추적 등 ERP 데이터를 조회해 답변할 수 있습니다.</p>
      <p style="font-size:12px;color:var(--g8);margin-top:8px;">예: “상암점 내일 발주 짜줘”, “두부 로트 추적”처럼 물어봐 주세요.</p></div>`;
  }

  /* ---------- panel chat flow ---------- */
  function addUser(text) {
    const row = el(`<div class="msg msg--user"><div class="msg__col"><div class="bubble bubble--user"></div><span class="msg__stamp">${now()}</span></div></div>`);
    row.querySelector(".bubble").textContent = text;
    aiThread.appendChild(row); scrollDown();
  }
  function addAiRow() {
    const row = el(`<div class="msg msg--ai"><div class="msg__avatar">AI</div><div class="msg__col"></div></div>`);
    aiThread.appendChild(row); scrollDown(); return row;
  }
  function sendMessage(text) {
    if (!text.trim() || generating) return;
    addUser(text.trim()); aiInput.value = ""; autoGrow();
    const kind = scenarioFor(text);
    const col = addAiRow().querySelector(".msg__col");
    const loading = el(`<div class="bubble bubble--ai"><span>데이터를 조회하고 있어요.</span><div class="loading"><span class="loading__dot"></span><span class="loading__dot"></span><span class="loading__dot"></span><span class="loading__label">답변 생성 중…</span></div></div>`);
    col.appendChild(loading); scrollDown(); generating = true;
    setTimeout(() => {
      loading.remove();
      col.appendChild(el(answerContent(kind)));
      col.appendChild(el(`<span class="msg__stamp">${now()}</span>`));
      generating = false; scrollDown();
    }, 1200);
  }
  function renderPanelInitial() {
    aiThread.innerHTML = "";
    aiThread.appendChild(el(`<div class="date-divider"><span>오늘 · 7월 24일</span></div>`));
    const col = addAiRow().querySelector(".msg__col");
    col.appendChild(el(`<div class="bubble bubble--ai">
      <p>안녕하세요 두람 님. 오늘 아침 기준 확인이 필요한 항목 3건을 먼저 알려드릴게요.</p>
      <div class="status-cards">
        <div class="status-card"><div class="status-card__label">유통기한 임박</div><div class="status-card__value" style="color:var(--neg)">7품목</div></div>
        <div class="status-card"><div class="status-card__label">재고 부족</div><div class="status-card__value" style="color:var(--orange-1)">4품목</div></div>
        <div class="status-card"><div class="status-card__label">미검수</div><div class="status-card__value" style="color:var(--pos-2)">2건</div></div>
      </div>
      ${evidence(["재고 DB", "품질 DB"], "high")}
      ${deepLinks(["재고정보 관리 · 로트"])}</div>`));
    col.appendChild(el(`<span class="msg__stamp">${now()}</span>`));
    scrollDown();
  }

  /* ---------- open / close slide ---------- */
  function openPanel() {
    if (isMobile()) { window.location.href = "chat.html"; return; }
    if (!panelReady) { renderPanelInitial(); panelReady = true; }
    app.classList.add("ai-open");
  }
  function closePanel() { app.classList.remove("ai-open"); }
  aiLaunch.addEventListener("click", () => { app.classList.contains("ai-open") ? closePanel() : openPanel(); });
  aiClose.addEventListener("click", closePanel);

  /* ---------- deep-link → navigate ERP behind ---------- */
  function showStock(fromDeepLink) {
    homeView.hidden = true; stockView.hidden = false;
    dlBanner.hidden = !fromDeepLink;
    pageTitle.textContent = "재고정보 관리";
    pageSub.textContent = "로트별 재고현황 · 맑은물에홀딩스";
    setActiveNav("재고정보 관리");
    const hl = document.getElementById("lotL260718");
    if (fromDeepLink && hl) {
      hl.classList.add("row-hl");
      hl.scrollIntoView({ behavior: "smooth", block: "center" });
    } else if (hl) { hl.classList.remove("row-hl"); }
  }
  function showHome() {
    stockView.hidden = true; homeView.hidden = false; dlBanner.hidden = true;
    pageTitle.textContent = "홈 대시보드";
    pageSub.textContent = "맑은물에 홀딩스 · 2026년 7월 24일";
    setActiveNav(null);
  }
  function setActiveNav(label) {
    lnb.querySelectorAll(".lnb__item").forEach((it) => {
      it.classList.toggle("lnb__item--active", !!label && it.dataset.nav === label);
    });
  }

  /* ---------- panel thread delegation ---------- */
  aiThread.addEventListener("click", (e) => {
    const dl = e.target.closest(".dl-inline, .dl-btn");
    if (dl) {
      const screen = dl.dataset.screen || "";
      if (/재고/.test(screen)) { showStock(true); toast("재고현황으로 이동했어요", true); }
      else { toast(`${screen} 화면으로 이동합니다 (프로토타입)`, false); }
      return;
    }
    const cta = e.target.dataset.cta;
    if (cta === "order") toast("발주서 초안을 생성했어요");
    else if (cta === "excel") toast("엑셀 파일을 저장했어요");
  });

  /* ---------- LNB nav ---------- */
  lnb.addEventListener("click", (e) => {
    const item = e.target.closest(".lnb__item[data-nav]");
    if (!item) return;
    e.preventDefault();
    const nav = item.dataset.nav;
    if (nav === "재고정보 관리") { showStock(false); }
    else { showHome(); setActiveNav(nav); toast(`${nav} (프로토타입) — 준비 중`, false); }
    if (isMobile()) toggleDrawer(false);
  });

  /* breadcrumb back to home */
  stockView.addEventListener("click", (e) => {
    if (e.target.closest("[data-home]")) showHome();
  });

  /* ---------- input ---------- */
  function autoGrow() { aiInput.style.height = "auto"; aiInput.style.height = Math.min(aiInput.scrollHeight, 120) + "px"; }
  aiInput.addEventListener("input", autoGrow);
  aiInput.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(aiInput.value); } });
  document.getElementById("aiSend").addEventListener("click", () => sendMessage(aiInput.value));

  /* ---------- mobile drawer ---------- */
  function toggleDrawer(open) { lnb.classList.toggle("is-open", open); scrim.classList.toggle("is-open", open); }
  hamburger.addEventListener("click", () => toggleDrawer(true));
  scrim.addEventListener("click", () => toggleDrawer(false));
})();
