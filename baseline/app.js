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
  /* 진행 단계 문구 — 실제 화면이 서버 진행 신호(해석 → 조회 → 확인 → 정리 → 작성)에 맞춰 바꾸는 순서를 본뜸.
     [시작 ms, 문구]. query = 데이터를 조회하는 질문, quick = 조회 없이 바로 답하는 질문(되묻기·거부 등) */
  const STAGE_FLOW = {
    query: [[0, "질문을 해석하고 있어요"], [700, "데이터를 조회하고 있어요"], [1700, "조회 결과를 확인하고 있어요"],
            [2400, "답변을 정리하고 있어요"], [3000, "답변을 작성하고 있어요"]],
    quick: [[0, "질문을 해석하고 있어요"], [800, "답변을 작성하고 있어요"]],
  };
  function loadingBubble(label) {
    return el(`
      <div class="bubble bubble--ai"><span class="loading__stage">${esc(label)}</span>
        <div class="loading"><span class="loading__dot"></span><span class="loading__dot"></span><span class="loading__dot"></span><span class="loading__label">0초</span></div>
      </div>`);
  }
  /* 오류 말풍선 + [다시 보내기] — 서버가 처리 중 실패했을 때 실제 화면이 보여주는 모양 */
  function failBubble(question) {
    const b = el(`
      <div class="bubble bubble--ai bubble--warn">
        <p>데이터를 조회하는 중에 서버 오류가 났어요. 아래 버튼으로 같은 질문을 다시 보내주세요.</p>
        <div class="bubble__actions"><button class="btn btn--retry">다시 보내기</button></div>
      </div>`);
    b.querySelector(".btn--retry").addEventListener("click", () => {
      if (generating) return;
      b.querySelector(".bubble__actions").remove();
      sendMessage(question, true);
    });
    return b;
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

  /* ---------- 추천 질문 칩 ---------- */
  const STARTERS = [
    "상암점 내일 발주 짜줘",
    "이번 달 법인별 주문 건수 보여줘",
    "올해 월별 주문 금액 추이 보여줘",
    "두부 로트 추적",
  ];
  const FOLLOWUPS = {
    order: ["유통기한 임박 품목 전체 보여줘", "지난주 발주량과 비교해줘", "발주 이력 보여줘"],
    corp: ["맑은식품 거래처별로 보여줘", "지난달이랑 비교해줘", "주문 많은 품목 순위 보여줘"],
    trend: ["법인별로 나눠서 보여줘", "작년 같은 기간과 비교해줘", "표로 정리해줘"],
    lot: ["같은 제품 최근 생산 로트 알려줘", "이 로트의 출고처 보여줘"],
  };
  function followupRow(list) {
    if (!list || !list.length) return null;
    return el(`<div class="followups">${list
      .map((q) => `<button class="chip chip--q">${esc(q)}</button>`)
      .join("")}</div>`);
  }

  /* ---------- scenarios (mock backend) ---------- */
  function scenarioFor(text) {
    const t = text.replace(/\s/g, "");
    if (/연락처|전화번호|개인정보/.test(t)) return "refuse";
    if (/법인별주문|주문건수/.test(t)) return "corp";
    if (/월별|추이/.test(t)) return "trend";
    if (/^맑은물에매출알려줘$|매출어때/.test(t)) return "clarify";
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
          <p style="font-size:12px;color:var(--g8);margin-top:12px;">두부는 D-1이라 추가 발주 없이 오늘 중 소진을 권장합니다. 폐기 예상 손실은 약 12만원입니다.</p>
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
          <p>지난주 상암점 안전재고은 <strong>4.2%</strong>로 전주 대비 0.8%p 상승했습니다. 주요 원인은 <span class="dl-inline" data-screen="재고정보 관리">두부·콩물</span> 재고 과다입니다.</p>
          <p style="font-size:12px;color:var(--g8);margin-top:8px;">두부·콩물 발주량을 10% 줄이면 다음 주 안전재고을 3%대로 낮출 수 있을 것으로 예상됩니다.</p>
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
    if (kind === "corp") {
      return `
        <div class="bubble bubble--ai">
          <p>이번 달(10월 1일 ~ 10월 23일) 전체 법인 주문 건수 합계는 <strong>3,513건</strong>입니다. 화면 기준(등록 법인 9개)으로는 <strong>3,204건</strong>이에요.</p>
          <div class="answer-table"><table>
            <thead><tr><th>법인</th><th>주문 건수</th><th>비중</th></tr></thead>
            <tbody>
              <tr><td>맑은식품</td><td><strong>1,118건</strong></td><td>31.8%</td></tr>
              <tr><td>꿈꾸는콩</td><td>842건</td><td>24.0%</td></tr>
              <tr><td>맑은동해</td><td>486건</td><td>13.8%</td></tr>
              <tr><td>맑은물에홀딩스</td><td>312건</td><td>8.9%</td></tr>
              <tr><td>참좋은콩</td><td>207건</td><td>5.9%</td></tr>
              <tr><td>외 4개 법인</td><td>239건</td><td>6.8%</td></tr>
              <tr class="row--subtotal"><td>등록 법인 9개 소계</td><td>3,204건</td><td>91.2%</td></tr>
              <tr class="row--subtotal"><td>위탁생산처</td><td>309건</td><td>8.8%</td></tr>
              <tr class="row--total"><td>합계</td><td>3,513건</td><td>100%</td></tr>
            </tbody></table></div>
          <p style="font-size:12px;color:var(--g8);margin-top:10px;">주문 관리 화면은 등록 법인 9개 기준으로 집계되어 소계(3,204건)와 화면 건수가 일치합니다.</p>
          ${evidence(["주문 DB", "법인 DB"], "high")}
          ${deepLinks(["주문정보 관리"])}
        </div>`;
    }
    if (kind === "trend") {
      return `
        <div class="bubble bubble--ai">
          <p>올해 1월~10월 월별 주문 금액 추이입니다. 10월 누적은 <strong>21.4억 원</strong>으로 전월 대비 <strong style="color:var(--pos-2)">+8.2%</strong>예요.</p>
          <div class="mini-chart">
            <svg viewBox="0 0 560 190" xmlns="http://www.w3.org/2000/svg">
              <g stroke="#eaebed"><line x1="40" y1="20" x2="540" y2="20"/><line x1="40" y1="70" x2="540" y2="70"/><line x1="40" y1="120" x2="540" y2="120"/><line x1="40" y1="160" x2="540" y2="160"/></g>
              <text x="34" y="24" font-size="10" fill="#a7a8aa" text-anchor="end">25억</text>
              <text x="34" y="124" font-size="10" fill="#a7a8aa" text-anchor="end">15억</text>
              <polyline fill="none" stroke="#2c7fdf" stroke-width="2.5" points="40,128 95,122 150,131 205,110 260,97 315,104 370,84 425,88 480,64 540,46"/>
              <g fill="#2c7fdf"><circle cx="480" cy="64" r="3.5"/><circle cx="540" cy="46" r="4.5"/></g>
              <text x="540" y="34" font-size="11" font-weight="700" fill="#034bb4" text-anchor="end">21.4억</text>
              <g font-size="10" fill="#a7a8aa" text-anchor="middle"><text x="40" y="180">1월</text><text x="150" y="180">3월</text><text x="260" y="180">5월</text><text x="370" y="180">7월</text><text x="480" y="180">9월</text><text x="540" y="180">10월</text></g>
            </svg>
          </div>
          ${evidence(["주문 DB"], "high")}
          ${deepLinks(["주문정보 관리"])}
        </div>`;
    }
    if (kind === "clarify") {
      return `
        <div class="bubble bubble--ai">
          <p>어떤 매출을 말씀하시는 걸까요? 기준을 골라 주시면 바로 조회할게요.</p>
          <div class="followups" style="margin-top:10px">
            <button class="chip chip--q">맑은물에 법인 최근 1개월 매출 (접수일 기준)</button>
            <button class="chip chip--q">맑은물에 그룹 전체 이번 달 매출</button>
            <button class="chip chip--q">맑은물에홀딩스 올해 누적 매출</button>
          </div>
        </div>`;
    }
    if (kind === "refuse") {
      return `
        <div class="bubble bubble--ai">
          <p>거래처 담당자 연락처는 <strong>개인정보</strong>라 답변해 드릴 수 없어요.</p>
          <p style="font-size:12px;color:var(--g8);margin-top:8px;">연락처는 권한이 있는 계정으로 기초정보 관리 &gt; 거래처 관리 화면에서 확인할 수 있습니다.</p>
          ${deepLinks(["거래처 관리"])}
        </div>`;
    }
    return `
      <div class="bubble bubble--ai">
        <p>질문을 이해했어요. 발주·재고·유통기한·안전재고·로트 추적 등 ERP 데이터를 조회해 답변할 수 있습니다.</p>
        <p style="font-size:12px;color:var(--g8);margin-top:8px;">예: “상암점 내일 발주 짜줘”, “두부 로트 추적”, “창고별 두부 재고”처럼 물어봐 주세요.</p>
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

  /* 오류 화면 시연: 주소에 ?error=1 을 붙이면 첫 질문 한 번만 서버 오류로 끝난다. [다시 보내기]는 정상 답변 */
  let failNext = new URLSearchParams(location.search).get("error") === "1";

  function sendMessage(text, isRetry) {
    if (!text.trim() || generating) return;
    addUserMessage(text.trim());
    input.value = "";
    autoGrow();
    const kind = scenarioFor(text);
    const fail = failNext && !isRetry;
    failNext = false;
    const flow = STAGE_FLOW[/^(refuse|clarify|default)$/.test(kind) ? "quick" : "query"];
    const aiRow = addAiRow();
    const col = aiRow.querySelector(".msg__col");
    const loading = loadingBubble(flow[0][1]);
    const stageEl = loading.querySelector(".loading__stage");
    const secEl = loading.querySelector(".loading__label");
    col.appendChild(loading);
    scrollDown();
    setGenerating(true);
    stopRequested = false;
    const t0 = Date.now();
    const stageTimers = flow.slice(1).map(([ms, label]) => setTimeout(() => { if (!stopRequested) stageEl.textContent = label; }, ms));
    const secTimer = setInterval(() => { secEl.textContent = Math.floor((Date.now() - t0) / 1000) + "초"; }, 250);
    /* 오류 시연은 조회 단계(2번째 문구)까지만 진행하고 끊는다 */
    const endAt = fail ? 2000 : flow[flow.length - 1][0] + 600;
    setTimeout(() => {
      stageTimers.forEach(clearTimeout);
      clearInterval(secTimer);
      if (stopRequested) {
        loading.querySelector(".loading").remove();
        stageEl.textContent = "답변 생성을 멈췄어요.";
        setGenerating(false);
        return;
      }
      loading.remove();
      if (fail) {
        col.appendChild(failBubble(text.trim()));
        col.appendChild(el(`<span class="msg__stamp">${now()}</span>`));
        setGenerating(false);
        scrollDown();
        return;
      }
      col.appendChild(el(answerContent(kind)));
      if (kind !== "clarify") col.appendChild(actionBar());
      const fu = followupRow(FOLLOWUPS[kind]);
      if (fu) col.appendChild(fu);
      col.appendChild(el(`<span class="msg__stamp">${now()}</span>`));
      setGenerating(false);
      scrollDown();
    }, endAt);
  }

  /* ---------- excel download ---------- */
  function runExcel(ctaWrap) {
    const bubble = ctaWrap.closest(".bubble");
    if (bubble.querySelector(".excel-card")) return;
    const card = el(`
      <div class="excel-card">
        <div class="excel-card__file"><div class="excel-card__badge">XLS</div>
          <div class="excel-card__meta"><div class="excel-card__name">상암점_발주초안_20261023.xlsx</div><div class="excel-card__sub">2개 시트 · 내려받는 중…</div></div>
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
    // 추천 질문 칩 → 그대로 질의
    const qChip = e.target.closest(".chip--q");
    if (qChip) { sendMessage(qChip.textContent.replace(/\s*\(.*\)\s*$/, "")); return; }
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
  }

  /* ---------- 대화 이어보기 (localStorage 복원 목업) ---------- */
  function renderRestore() {
    thread.appendChild(el(`
      <div class="restore-banner">
        <div class="restore-banner__txt"><strong>지난 대화를 이어서 보여드려요</strong><span> · 마지막 대화 10월 22일 17:41 · 저장된 메시지 41개</span></div>
        <button class="btn btn--ghost" id="freshBtn">새 대화 시작</button>
      </div>`));
    thread.appendChild(el('<div class="date-divider"><span>10월 22일</span></div>'));
    const u = el(`<div class="msg msg--user"><div class="msg__col"><div class="bubble bubble--user"></div><span class="msg__stamp msg__stamp--past">이전 대화 · 17:41</span></div></div>`);
    u.querySelector(".bubble").textContent = "이번 달 법인별 주문 건수 보여줘";
    thread.appendChild(u);
    const aiRow = addAiRow();
    const col = aiRow.querySelector(".msg__col");
    col.appendChild(el(answerContent("corp")));
    col.appendChild(el('<span class="msg__stamp msg__stamp--past">이전 대화 · 17:41</span>'));
    thread.querySelector("#freshBtn").addEventListener("click", () => { renderInitial(); toast("새 대화를 시작했어요"); });
  }

  function renderInitial() {
    thread.innerHTML = "";
    if (new URLSearchParams(location.search).get("restore") === "1") { renderRestore(); }
    thread.appendChild(el('<div class="date-divider"><span>오늘 · 10월 23일</span></div>'));
    const aiRow = addAiRow();
    const col = aiRow.querySelector(".msg__col");
    col.appendChild(el(`
      <div class="bubble bubble--ai">
        <p>안녕하세요 두람 님. 오늘 아침 기준으로 확인이 필요한 항목 3건을 먼저 알려드릴게요.</p>
        <div class="status-cards">
          <div class="status-card"><div class="status-card__label">유통기한 임박</div><div class="status-card__value" style="color:var(--neg)">7품목</div></div>
          <div class="status-card"><div class="status-card__label">재고 부족</div><div class="status-card__value" style="color:var(--orange-1)">4품목</div></div>
          <div class="status-card"><div class="status-card__label">미검수 입고</div><div class="status-card__value" style="color:var(--pos-2)">2건</div></div>
        </div>
        ${evidence(["재고 DB", "품질 DB"], "high")}
      </div>`));
    col.appendChild(actionBar());
    col.appendChild(followupRow(STARTERS));
    col.appendChild(el(`<span class="msg__stamp">${now()}</span>`));
    scrollDown();
  }
  if (newChatBtn) newChatBtn.addEventListener("click", renderEmptyState); // 새 대화 버튼 제거됨(계정당 대화 1개 정책)

  /* ---------- mobile drawer ---------- */
  function toggleDrawer(open) { lnb.classList.toggle("is-open", open); scrim.classList.toggle("is-open", open); }
  hamburger.addEventListener("click", () => toggleDrawer(true));
  scrim.addEventListener("click", () => toggleDrawer(false));
  lnb.addEventListener("click", (e) => { if (e.target.classList.contains("lnb__item")) toggleDrawer(false); });

  renderInitial();
})();
