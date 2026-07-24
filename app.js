/* =========================================================
   AI 어시스턴트 프로토타입 — 맑은물에 ERP (프론트 전용 · 목업)
   ========================================================= */
(function () {
  "use strict";

  const thread = document.getElementById("thread");
  const chatBody = document.getElementById("chatBody");
  const input = document.getElementById("messageInput");
  const inputField = document.getElementById("inputField");
  const newChatBtn = document.getElementById("newChatBtn");
  const toastEl = document.getElementById("toast");
  const deleteOverlay = document.getElementById("deleteOverlay");
  const hamburger = document.getElementById("hamburger");
  const lnb = document.getElementById("lnb");
  const scrim = document.getElementById("scrim");
  const scopeBar = document.getElementById("scopeBar");

  let generating = false;
  let stopRequested = false;
  let pendingDeleteMsg = null;

  const el = (html) => {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  };
  const now = () =>
    new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  const scrollDown = () => { chatBody.scrollTop = chatBody.scrollHeight; };
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ---------- toast ---------- */
  let toastTimer = null;
  function toast(msg, withCheck = true) {
    toastEl.innerHTML = (withCheck ? '<span class="toast__check">✓</span>' : "") + esc(msg);
    toastEl.hidden = false;
    requestAnimationFrame(() => toastEl.classList.add("is-shown"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove("is-shown");
      setTimeout(() => (toastEl.hidden = true), 220);
    }, 2200);
  }

  /* ---------- message builders ---------- */
  function addUserMessage(text) {
    const row = el(`
      <div class="msg msg--user">
        <div class="msg__col"><div class="bubble bubble--user"></div><span class="msg__stamp">${now()}</span></div>
      </div>`);
    row.querySelector(".bubble").textContent = text;
    thread.appendChild(row);
    scrollDown();
  }
  function addAiRow() {
    const row = el(`<div class="msg msg--ai"><div class="msg__avatar">AI</div><div class="msg__col"></div></div>`);
    thread.appendChild(row);
    scrollDown();
    return row;
  }
  function loadingBubble(label) {
    return el(`
      <div class="bubble bubble--ai"><span>${esc(label)}</span>
        <div class="loading"><span class="loading__dot"></span><span class="loading__dot"></span><span class="loading__dot"></span><span class="loading__label">답변 생성 중…</span></div>
      </div>`);
  }
  function actionBar() {
    return el(`
      <div class="action-bar">
        <button class="action-btn" data-act="copy">복사</button>
        <button class="action-btn" data-act="like">좋아요</button>
        <button class="action-btn" data-act="dislike">별로예요</button>
        <button class="action-btn action-btn--danger" data-act="delete">삭제</button>
      </div>`);
  }

  /* evidence: sources chips + confidence badge */
  function evidence(sources, conf) {
    const label = { high: "신뢰도 높음", medium: "신뢰도 보통 · 확인 필요", low: "근거 부족 · 담당자 확인" }[conf];
    return `
      <div class="evidence">
        <span class="evidence__label">조회한 데이터</span>
        ${sources.map((s) => `<span class="src-chip">${esc(s)}</span>`).join("")}
        <span class="evidence__spacer"></span>
        <span class="conf-badge ${conf}">${label}</span>
      </div>`;
  }
  function deepLinks(items) {
    return `<div class="deep-links">${items
      .map((s) => `<button class="dl-btn" data-screen="${esc(s)}">${esc(s)}에서 열기 ↗</button>`)
      .join("")}</div>`;
  }

  /* ---------- scenarios (mock backend) ---------- */
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
      return `
        <div class="bubble bubble--ai">
          <p><span class="dl-inline" data-screen="발주정보 관리">국산 두부</span>는 D-1 임박이라 추가 발주 없이 현재고 소진을 권장합니다. 콩물 25박스, 비지 40박스 발주가 적정합니다.</p>
          <div class="answer-table"><table>
            <thead><tr><th>품목</th><th>현재고</th><th>유통기한</th><th>권장 발주</th></tr></thead>
            <tbody>
              <tr><td>국산 두부 300g</td><td>42박스</td><td style="color:var(--neg)"><strong>D-1</strong></td><td style="color:var(--g5)">0박스</td></tr>
              <tr><td>콩물 500ml</td><td>18박스</td><td style="color:var(--neg)"><strong>D-2</strong></td><td><strong>25박스</strong></td></tr>
              <tr><td>비지 400g</td><td style="color:var(--orange-1)"><strong>6박스</strong></td><td>D-5</td><td><strong>40박스</strong></td></tr>
              <tr><td>국산 나물 200g</td><td style="color:var(--orange-1)"><strong>0박스</strong></td><td style="color:var(--g5)">—</td><td><strong>30박스</strong></td></tr>
            </tbody></table></div>
          <p style="font-size:12px;color:var(--g8);margin-top:12px;">두부는 D-1이라 추가 발주 없이 오늘 중 소진 권장드립니다. 폐기 예상 손실은 약 12만원입니다.</p>
          ${evidence(["생산 DB", "품질 DB", "재고 DB"], "medium")}
          ${deepLinks(["발주정보 관리", "재고정보 관리 · 로트"])}
          <div class="answer-actions">
            <button class="btn btn--primary" data-cta="order">발주서 생성</button>
            <button class="btn btn--ghost" data-cta="excel">엑셀 다운로드</button>
          </div>
        </div>`;
    }
    if (kind === "waste") {
      return `
        <div class="bubble bubble--ai">
          <p>지난주 상암점 폐기율은 <strong>4.2%</strong>로 전주 대비 0.8%p 상승했습니다. 주요 원인은 <span class="dl-inline" data-screen="재고정보 관리">두부·콩물</span> 재고 과다입니다.</p>
          <p style="font-size:12px;color:var(--g8);margin-top:8px;">두부·콩물 발주량을 10% 줄이면 다음 주 폐기율을 3%대로 낮출 수 있을 것으로 예상됩니다.</p>
          ${evidence(["생산 DB", "재고 DB"], "high")}
        </div>`;
    }
    if (kind === "lot") {
      return `
        <div class="bubble bubble--ai">
          <p><span class="dl-inline" data-screen="재고정보 관리 · 로트">국산 두부 로트 L-2307</span>이 유통기한 D-1입니다. 생산 이력을 확인하세요.</p>
          <p style="font-size:12px;color:var(--g8);margin-top:8px;">입고(7/18) → 생산(7/19) → 품질검사 합격(7/19) → 출고(7/20 상암점).</p>
          ${evidence(["재고 DB", "생산 DB", "품질 DB"], "high")}
          ${deepLinks(["재고정보 관리 · 로트", "품질정보 관리"])}
        </div>`;
    }
    if (kind === "stock") {
      return `
        <div class="bubble bubble--ai">
          <p>오늘 아침 기준 확인이 필요한 항목입니다.</p>
          <div class="status-cards">
            <div class="status-card"><div class="status-card__label">유통기한 임박</div><div class="status-card__value" style="color:var(--neg)">7품목</div></div>
            <div class="status-card"><div class="status-card__label">재고 부족</div><div class="status-card__value" style="color:var(--orange-1)">4품목</div></div>
            <div class="status-card"><div class="status-card__label">미검수 입고</div><div class="status-card__value" style="color:var(--pos-2)">2건</div></div>
          </div>
          ${evidence(["재고 DB", "품질 DB"], "high")}
        </div>`;
    }
    return `
      <div class="bubble bubble--ai">
        <p>질문을 이해했어요. 발주·재고·유통기한·폐기율·로트 추적 등 ERP 데이터를 조회해 답변할 수 있습니다.</p>
        <p style="font-size:12px;color:var(--g8);margin-top:8px;">예: “상암점 내일 발주 짜줘”, “두부 로트 추적”, “지난주 폐기율”처럼 물어봐 주세요.</p>
      </div>`;
  }

  /* ---------- send flow ---------- */
  function setGenerating(on) {
    generating = on;
    input.disabled = on;
    inputField.classList.toggle("is-locked", on);
    if (on) {
      input.placeholder = "답변을 생성하는 동안에는 입력할 수 없어요";
      document.getElementById("sendBtn").outerHTML =
        '<button class="btn--stop" id="sendBtn"><span class="square"></span>멈추기</button>';
    } else {
      input.placeholder = "메시지를 입력하세요";
      document.getElementById("sendBtn").outerHTML =
        '<button class="btn btn--send" id="sendBtn">전송</button>';
    }
    bindSendBtn();
  }

  function sendMessage(text) {
    if (!text.trim() || generating) return;
    addUserMessage(text.trim());
    input.value = "";
    autoGrow();
    const kind = scenarioFor(text);
    const aiRow = addAiRow();
    const col = aiRow.querySelector(".msg__col");
    const loading = loadingBubble("데이터를 조회하고 있어요.");
    col.appendChild(loading);
    scrollDown();
    setGenerating(true);
    stopRequested = false;
    setTimeout(() => {
      if (stopRequested) {
        loading.querySelector(".loading").remove();
        loading.querySelector("span").textContent = "답변 생성을 멈췄어요.";
        setGenerating(false);
        return;
      }
      loading.remove();
      col.appendChild(el(answerContent(kind)));
      col.appendChild(actionBar());
      col.appendChild(el(`<span class="msg__stamp">${now()}</span>`));
      setGenerating(false);
      scrollDown();
    }, 1400);
  }

  /* ---------- excel download ---------- */
  function runExcel(ctaWrap) {
    const bubble = ctaWrap.closest(".bubble");
    if (bubble.querySelector(".excel-card")) return;
    const card = el(`
      <div class="excel-card">
        <div class="excel-card__file"><div class="excel-card__badge">XLS</div>
          <div class="excel-card__meta"><div class="excel-card__name">상암점_발주초안_20260723.xlsx</div><div class="excel-card__sub">2개 시트 · 내려받는 중…</div></div>
        </div>
        <div class="progress"><div class="progress__fill"></div></div>
      </div>`);
    bubble.appendChild(card);
    scrollDown();
    const fill = card.querySelector(".progress__fill");
    requestAnimationFrame(() => (fill.style.width = "62%"));
    setTimeout(() => (fill.style.width = "100%"), 700);
    setTimeout(() => {
      card.querySelector(".excel-card__sub").textContent = "24KB · 2개 시트 · 방금 전";
      card.querySelector(".progress").outerHTML = `
        <div class="answer-actions" style="margin-top:0">
          <button class="btn btn--primary" data-cta="apply">발주 시스템에 반영</button>
          <button class="btn btn--ghost" data-cta="redownload">다시 받기</button>
        </div>`;
      toast("엑셀 파일을 저장했어요");
    }, 1500);
  }

  /* ---------- feedback popover ---------- */
  function openFeedback(bar) {
    if (bar.parentElement.querySelector(".popover")) return;
    const pop = el(`
      <div class="popover">
        <div class="popover__title">어떤 점이 아쉬웠나요?</div>
        <div class="reason-chips">
          <button class="chip">정보가 부정확해요</button>
          <button class="chip">최신 데이터가 아니에요</button>
          <button class="chip">질문과 관련이 없어요</button>
          <button class="chip">답변이 너무 길어요</button>
        </div>
        <div class="popover__actions">
          <button class="btn btn--ghost" data-fb="cancel">취소</button>
          <button class="btn btn--primary" data-fb="send">보내기</button>
        </div>
      </div>`);
    bar.parentElement.appendChild(pop);
    scrollDown();
    pop.querySelectorAll(".reason-chips .chip").forEach((c) =>
      c.addEventListener("click", () => c.classList.toggle("is-selected"))
    );
    pop.addEventListener("click", (e) => {
      const fb = e.target.dataset.fb;
      if (fb === "cancel") pop.remove();
      if (fb === "send") { pop.remove(); toast("피드백을 보냈어요. 개선에 반영할게요"); }
    });
  }

  /* ---------- thread delegation ---------- */
  thread.addEventListener("click", (e) => {
    // deep-link (inline or button)
    const dl = e.target.closest(".dl-inline, .dl-btn");
    if (dl) { toast(`${dl.dataset.screen} 화면으로 이동합니다 (프로토타입)`, false); return; }

    const actBtn = e.target.closest(".action-btn");
    if (actBtn) {
      const act = actBtn.dataset.act;
      const bar = actBtn.closest(".action-bar");
      if (act === "copy") {
        const txt = bar.parentElement.querySelector(".bubble--ai").innerText;
        if (navigator.clipboard) navigator.clipboard.writeText(txt).catch(() => {});
        bar.querySelectorAll(".action-btn").forEach((b) => b.classList.remove("is-active"));
        actBtn.classList.add("is-active"); actBtn.textContent = "복사됨";
        setTimeout(() => (actBtn.textContent = "복사"), 1500);
        toast("답변을 클립보드에 복사했어요");
      } else if (act === "like") { actBtn.classList.toggle("is-active"); toast("피드백 고맙습니다");
      } else if (act === "dislike") {
        bar.querySelectorAll(".action-btn").forEach((b) => b.classList.remove("is-active"));
        actBtn.classList.add("is-active"); openFeedback(bar);
      } else if (act === "delete") { pendingDeleteMsg = actBtn.closest(".msg"); deleteOverlay.hidden = false; }
      return;
    }
    const cta = e.target.dataset.cta;
    if (cta === "excel" || cta === "redownload") runExcel(e.target);
    else if (cta === "order") toast("발주서 초안을 생성했어요");
    else if (cta === "apply") toast("발주 시스템에 반영했어요");
    const chip = e.target.closest(".chip--suggest");
    if (chip) sendMessage(chip.textContent);
  });

  /* ---------- delete dialog ---------- */
  deleteOverlay.addEventListener("click", (e) => {
    const act = e.target.dataset.dialog;
    if (e.target === deleteOverlay || act === "cancel") { deleteOverlay.hidden = true; pendingDeleteMsg = null; }
    else if (act === "confirm") {
      if (pendingDeleteMsg) pendingDeleteMsg.remove();
      deleteOverlay.hidden = true; pendingDeleteMsg = null; toast("답변을 삭제했어요");
    }
  });

  /* ---------- input ---------- */
  function autoGrow() { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 120) + "px"; }
  input.addEventListener("input", autoGrow);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input.value); } });
  function bindSendBtn() {
    document.getElementById("sendBtn").addEventListener("click", () => {
      if (generating) stopRequested = true; else sendMessage(input.value);
    });
  }
  bindSendBtn();

  /* ---------- scope chips (mock) ---------- */
  if (scopeBar) scopeBar.addEventListener("click", (e) => {
    const chip = e.target.closest(".scope-chip");
    if (!chip) return;
    const which = chip.dataset.scope === "corp" ? "법인" : "기간";
    toast(`${which} 선택 (프로토타입) — 선택 기준이 모든 질의에 적용됩니다`, false);
  });

  /* ---------- new chat / empty ---------- */
  function renderEmptyState() {
    thread.innerHTML = "";
    thread.appendChild(el(`
      <div class="empty-state">
        <div class="empty-state__mark">AI</div>
        <div class="empty-state__title">무엇을 도와드릴까요?</div>
        <div class="empty-state__sub">발주 · 재고 · 유통기한 · 로트 추적을 물어보세요</div>
        <div class="suggested">
          <button class="chip chip--suggest">오늘 유통기한 임박 품목</button>
          <button class="chip chip--suggest">상암점 내일 발주 짜줘</button>
          <button class="chip chip--suggest">두부 로트 추적</button>
          <button class="chip chip--suggest">지난주 폐기율 알려줘</button>
        </div>
      </div>`));
  }

  function renderInitial() {
    thread.innerHTML = "";
    thread.appendChild(el('<div class="date-divider"><span>오늘 · 7월 23일</span></div>'));
    const aiRow = addAiRow();
    const col = aiRow.querySelector(".msg__col");
    col.appendChild(el(`
      <div class="bubble bubble--ai">
        <p>안녕하세요 선영님. 오늘 아침 기준으로 확인이 필요한 항목 3건을 먼저 알려드릴게요.</p>
        <div class="status-cards">
          <div class="status-card"><div class="status-card__label">유통기한 임박</div><div class="status-card__value" style="color:var(--neg)">7품목</div></div>
          <div class="status-card"><div class="status-card__label">재고 부족</div><div class="status-card__value" style="color:var(--orange-1)">4품목</div></div>
          <div class="status-card"><div class="status-card__label">미검수 입고</div><div class="status-card__value" style="color:var(--pos-2)">2건</div></div>
        </div>
        ${evidence(["재고 DB", "품질 DB"], "high")}
      </div>`));
    col.appendChild(actionBar());
    col.appendChild(el(`<span class="msg__stamp">${now()}</span>`));
    thread.appendChild(el(`
      <div class="suggested">
        <button class="chip chip--suggest">상암점 내일 발주 짜줘</button>
        <button class="chip chip--suggest">두부 로트 추적</button>
        <button class="chip chip--suggest">지난주 폐기율 알려줘</button>
      </div>`));
    scrollDown();
  }
  newChatBtn.addEventListener("click", renderEmptyState);

  /* ---------- mobile drawer ---------- */
  function toggleDrawer(open) { lnb.classList.toggle("is-open", open); scrim.classList.toggle("is-open", open); }
  hamburger.addEventListener("click", () => toggleDrawer(true));
  scrim.addEventListener("click", () => toggleDrawer(false));
  lnb.addEventListener("click", (e) => { if (e.target.classList.contains("lnb__item")) toggleDrawer(false); });

  renderInitial();
})();
