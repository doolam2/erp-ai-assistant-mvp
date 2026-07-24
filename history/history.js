/* =========================================================
   대화 기록 (History) — localStorage 세션 저장/선택/검색
   기존 app.js·home.js를 수정하지 않고 얹는 레이어.
   - 세션 저장소는 localStorage (서버 아님, 프로토타입)
   - thread를 MutationObserver로 감시해 현재 세션을 자동 저장
   - 삭제 기능 없음 (1차 범위 밖)
   ========================================================= */
(function () {
  "use strict";

  const LS_KEY = "mm_erp_sessions_v1";
  const LS_CUR = "mm_erp_current_v1";

  const isChat = !!document.getElementById("chatBody"); // chat.html (전체화면)
  const isHome = !!document.getElementById("aiPanel"); // index.html (슬라이드)
  if (!isChat && !isHome) return;

  const threadEl = isChat
    ? document.getElementById("thread")
    : document.getElementById("aiThread");
  if (!threadEl) return;

  /* ---------- helpers ---------- */
  const uid = () => "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const nowTime = () =>
    new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  const esc = (s) =>
    String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function evidence(sources, conf) {
    const label = { high: "신뢰도 높음", medium: "신뢰도 보통 · 확인 필요", low: "근거 부족 · 담당자 확인" }[conf];
    return (
      '<div class="evidence"><span class="evidence__label">조회한 데이터</span>' +
      sources.map((s) => `<span class="src-chip">${esc(s)}</span>`).join("") +
      `<span class="evidence__spacer"></span><span class="conf-badge ${conf}">${label}</span></div>`
    );
  }
  function aiRow(inner, stamp) {
    return `<div class="msg msg--ai"><div class="msg__avatar">AI</div><div class="msg__col">${inner}<span class="msg__stamp">${stamp}</span></div></div>`;
  }
  function userRow(text, stamp) {
    return `<div class="msg msg--user"><div class="msg__col"><div class="bubble bubble--user">${esc(text)}</div><span class="msg__stamp">${stamp}</span></div></div>`;
  }
  const divider = (label) => `<div class="date-divider"><span>${label}</span></div>`;

  const EMPTY_HTML =
    '<div class="empty-state"><div class="empty-state__mark">AI</div>' +
    '<div class="empty-state__title">무엇을 도와드릴까요?</div>' +
    '<div class="empty-state__sub">발주 · 재고 · 유통기한 · 로트 추적을 물어보세요</div>' +
    '<div class="suggested">' +
    '<button class="chip chip--suggest">오늘 유통기한 임박 품목</button>' +
    '<button class="chip chip--suggest">상암점 내일 발주 짜줘</button>' +
    '<button class="chip chip--suggest">두부 로트 추적</button>' +
    '<button class="chip chip--suggest">지난주 폐기율 알려줘</button></div></div>';

  /* ---------- seed sessions ---------- */
  function seed() {
    const s1Body =
      '<div class="bubble bubble--ai"><p>안녕하세요 선영님. 오늘 아침 기준으로 확인이 필요한 항목 3건을 먼저 알려드릴게요.</p>' +
      '<div class="status-cards">' +
      '<div class="status-card"><div class="status-card__label">유통기한 임박</div><div class="status-card__value" style="color:var(--neg)">7품목</div></div>' +
      '<div class="status-card"><div class="status-card__label">재고 부족</div><div class="status-card__value" style="color:var(--orange-1)">4품목</div></div>' +
      '<div class="status-card"><div class="status-card__label">미검수 입고</div><div class="status-card__value" style="color:var(--pos-2)">2건</div></div></div>' +
      evidence(["재고 DB", "품질 DB"], "high") +
      "</div>";
    const s1Answer =
      '<div class="bubble bubble--ai"><p>상암점 7월 25일자 발주 초안입니다. 유통기한 임박 품목은 발주를 줄이고 현재고를 먼저 소진하도록 잡았어요.</p>' +
      '<div class="answer-table"><table><thead><tr><th>품목</th><th>현재고</th><th>유통기한</th><th>권장 발주</th></tr></thead><tbody>' +
      '<tr><td>국산 두부 200g</td><td>42박스</td><td style="color:var(--neg)"><strong>D-1</strong></td><td style="color:var(--g5)">0박스</td></tr>' +
      '<tr><td>콩물 150g</td><td>18박스</td><td style="color:var(--neg)"><strong>D-2</strong></td><td><strong>25박스</strong></td></tr>' +
      '<tr><td>비지 500g</td><td style="color:var(--orange-1)"><strong>6박스</strong></td><td>D-5</td><td><strong>40박스</strong></td></tr>' +
      "</tbody></table></div>" +
      evidence(["재고 DB", "생산 DB"], "medium") +
      "</div>";

    const list = [
      {
        id: uid(), title: "상암점 두부 발주", ts: Date.now(), when: "오늘",
        html: divider("오늘 · 7월 24일") + aiRow(s1Body, "오전 9:02") +
          userRow("내일 상암점 발주 넣어야 하는데, 유통기한 임박한 재고부터 소진되게 발주량 잡아줘.", "오전 9:04") +
          aiRow(s1Answer, "오전 9:04"),
      },
      {
        id: uid(), title: "지난주 폐기율", ts: Date.now() - 864e5, when: "어제",
        html: divider("어제 · 7월 23일") + userRow("지난주 폐기율 알려줘", "오후 3:10") +
          aiRow('<div class="bubble bubble--ai"><p>지난주 상암점 폐기율은 <strong>4.2%</strong>로 전주 대비 0.8%p 상승했습니다. 주요 원인은 두부·콩물 재고 과다입니다.</p>' + evidence(["생산 DB", "재고 DB"], "high") + "</div>", "오후 3:10"),
      },
      {
        id: uid(), title: "설비 3호기 로트 추적", ts: Date.now() - 3 * 864e5, when: "7/21",
        html: divider("7월 21일") + userRow("설비 3호기에서 나온 로트 추적해줘", "오전 11:22") +
          aiRow('<div class="bubble bubble--ai"><p>정지 시간대(7/21 02:00~03:10) 생산 로트 3건을 확인했습니다: L-2607-05, L-2607-06, L-2607-07.</p>' + evidence(["생산 DB", "모니터링"], "high") + "</div>", "오전 11:22"),
      },
      {
        id: uid(), title: "이번 달 콩물 생산량", ts: Date.now() - 4 * 864e5, when: "7/20",
        html: divider("7월 20일") + userRow("이번 달 콩물 생산량 얼마야?", "오후 2:05") +
          aiRow('<div class="bubble bubble--ai"><p>이번 달 콩물 라인 누적 생산량은 <strong>12,400박스</strong>입니다. 전월 동기 대비 +5.3%.</p>' + evidence(["생산 DB"], "high") + "</div>", "오후 2:05"),
      },
      {
        id: uid(), title: "낫또 발효 온도 이상", ts: Date.now() - 5 * 864e5, when: "7/19",
        html: divider("7월 19일") + userRow("낫또 발효조 온도 이상 있었어?", "오전 10:40") +
          aiRow('<div class="bubble bubble--ai"><p>3호 발효조에서 설정 대비 <strong>2.4℃ 편차</strong>가 감지됐습니다. 해당 배치 품질검사를 권고드립니다.</p>' + evidence(["모니터링", "품질 DB"], "medium") + "</div>", "오전 10:40"),
      },
      {
        id: uid(), title: "에너지바 원가 조회", ts: Date.now() - 6 * 864e5, when: "7/18",
        html: divider("7월 18일") + userRow("에너지바 원가 조회해줘", "오후 4:18") +
          aiRow('<div class="bubble bubble--ai"><p>7월 원자재 단가 상승분을 반영하면 에너지바 마진은 <strong>11%</strong>로 추정됩니다. 전월 대비 1.6%p 하락.</p>' + evidence(["구매 DB", "생산 DB"], "medium") + "</div>", "오후 4:18"),
      },
    ];
    list.forEach((s) => (s.preview = derivePreview(s.html)));
    return list;
  }

  function derivePreview(html) {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    const ai = tmp.querySelector(".bubble--ai p");
    if (ai) return ai.textContent.trim();
    const u = tmp.querySelector(".bubble--user");
    return u ? u.textContent.trim() : "새 대화를 시작하세요";
  }
  function deriveTitle(html) {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    const u = tmp.querySelector(".bubble--user");
    if (u) { const t = u.textContent.trim(); return t.length > 22 ? t.slice(0, 22) + "…" : t; }
    return "새 대화";
  }
  function relTime(ts) {
    const d0 = new Date(); d0.setHours(0, 0, 0, 0);
    const diff = Math.floor((d0 - new Date(new Date(ts).setHours(0, 0, 0, 0))) / 864e5);
    if (diff <= 0) return "오늘";
    if (diff === 1) return "어제";
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }

  /* ---------- store ---------- */
  function loadAll() { try { return JSON.parse(localStorage.getItem(LS_KEY)) || null; } catch (e) { return null; } }
  function saveAll() { localStorage.setItem(LS_KEY, JSON.stringify(sessions)); }
  let sessions = loadAll();
  if (!sessions || !sessions.length) { sessions = seed(); saveAll(); localStorage.setItem(LS_CUR, sessions[0].id); }
  let currentId = localStorage.getItem(LS_CUR) || sessions[0].id;
  if (!sessions.some((s) => s.id === currentId)) currentId = sessions[0].id;

  let suppress = false; // observer 무시 플래그 (프로그램 로드 중)
  let query = "";

  function currentSession() { return sessions.find((s) => s.id === currentId); }

  function loadSession(id) {
    const s = sessions.find((x) => x.id === id);
    if (!s) return;
    currentId = id;
    localStorage.setItem(LS_CUR, id);
    suppress = true;
    threadEl.innerHTML = s.html;
    requestAnimationFrame(() => { suppress = false; });
    const body = isChat ? document.getElementById("chatBody") : threadEl;
    if (body) body.scrollTop = body.scrollHeight;
    renderList();
  }

  function newSession() {
    const s = { id: uid(), title: "새 대화", preview: "새 대화를 시작하세요", ts: Date.now(), html: EMPTY_HTML };
    sessions.unshift(s);
    saveAll();
    loadSession(s.id);
  }

  // thread 변화 → 현재 세션 저장 (debounce)
  let saveTimer = null;
  function scheduleSave() {
    if (suppress) return;
    // 메시지가 생기면 빈 상태 안내 제거
    const es = threadEl.querySelector(".empty-state");
    if (es && threadEl.querySelector(".msg")) es.remove();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const s = currentSession();
      if (!s) return;
      const html = threadEl.innerHTML;
      if (html.indexOf("empty-state") !== -1 && !threadEl.querySelector(".msg")) {
        s.html = html; s.preview = "새 대화를 시작하세요";
      } else {
        s.html = html;
        s.title = deriveTitle(html);
        s.preview = derivePreview(html);
        s.ts = Date.now();
        // 최신 세션을 맨 위로
        sessions = [s, ...sessions.filter((x) => x.id !== s.id)];
      }
      saveAll();
      renderList();
    }, 450);
  }
  new MutationObserver(scheduleSave).observe(threadEl, { childList: true, subtree: true, characterData: true });

  /* ---------- list rendering ---------- */
  let listEl = null, countEl = null, searchInput = null;

  function matches(s) {
    if (!query) return true;
    const q = query.toLowerCase();
    return (s.title || "").toLowerCase().includes(q) || (s.preview || "").toLowerCase().includes(q);
  }

  function renderList() {
    if (!listEl) return;
    const filtered = sessions.filter(matches);
    if (countEl) {
      if (query) { countEl.textContent = `'${query}' 검색 결과 ${filtered.length}건`; countEl.hidden = false; }
      else countEl.hidden = true;
    }
    if (!filtered.length) {
      listEl.innerHTML = '<div class="hsb-empty">검색 결과가 없습니다</div>';
      return;
    }
    listEl.innerHTML = filtered
      .map((s) => {
        const active = s.id === currentId ? " is-active" : "";
        return (
          `<button class="hsb-item${active}" data-id="${s.id}">` +
          `<div class="hsb-item__top"><span class="hsb-item__title">${esc(s.title)}</span><span class="hsb-item__time">${relTime(s.ts)}</span></div>` +
          `<div class="hsb-item__preview">${esc(s.preview || "")}</div></button>`
        );
      })
      .join("");
  }

  function wireList(root) {
    listEl = root.querySelector(".hsb-list");
    countEl = root.querySelector(".hsb-count");
    searchInput = root.querySelector(".hsb-search input");
    root.querySelector(".hsb-new").addEventListener("click", newSession);
    listEl.addEventListener("click", (e) => {
      const it = e.target.closest(".hsb-item");
      if (it) loadSession(it.dataset.id);
    });
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        query = searchInput.value.trim();
        root.querySelector(".hsb-clear").hidden = !query;
        renderList();
      });
      root.querySelector(".hsb-clear").addEventListener("click", () => {
        searchInput.value = ""; query = ""; root.querySelector(".hsb-clear").hidden = true; renderList(); searchInput.focus();
      });
    }
    renderList();
  }

  const PANEL_HTML =
    '<div class="hsb-head"><span class="hsb-head__title">대화 기록</span>' +
    '<button class="hsb-new">+ 새 대화</button></div>' +
    '<div class="hsb-search"><input type="text" placeholder="대화 검색" />' +
    '<button class="hsb-clear" hidden aria-label="지우기">✕</button></div>' +
    '<div class="hsb-count" hidden></div>' +
    '<div class="hsb-list"></div>';

  /* ---------- chat.html: 3단 사이드바 ---------- */
  function initChat() {
    const app = document.querySelector(".app");
    const lnb = document.getElementById("lnb");
    const sb = document.createElement("aside");
    sb.className = "history-sb";
    sb.innerHTML = PANEL_HTML;
    lnb.insertAdjacentElement("afterend", sb);
    wireList(sb);
    // 상단바 중복 '새 대화' 숨김 (사이드바가 대체)
    const topNew = document.getElementById("newChatBtn");
    if (topNew) topNew.style.display = "none";
    // 현재 세션 로드 (app.js가 렌더한 초기 화면 위에 덮어씀)
    loadSession(currentId);
  }

  /* ---------- index.html: 슬라이드 패널 오버레이 ---------- */
  function initHome() {
    const head = document.querySelector(".ai-panel__head");
    const inner = document.querySelector(".ai-panel__inner");
    if (!head || !inner) return;

    // head에 대화 기록 아이콘 추가 (⤢ 앞)
    const icon = document.createElement("button");
    icon.className = "ico ai-hist-icon";
    icon.title = "대화 기록";
    icon.innerHTML = '<span></span><span></span><span></span>';
    const expand = head.querySelector('a.ico');
    head.insertBefore(icon, expand);

    // 오버레이 (head+scope 아래 ~ input 위 영역을 덮음)
    const ov = document.createElement("div");
    ov.className = "ai-hist-overlay";
    ov.hidden = true;
    ov.innerHTML = PANEL_HTML;
    inner.appendChild(ov);
    const scope = document.querySelector(".ai-panel__scope");
    const inputBar = document.querySelector(".ai-input");
    const placeOverlay = () => {
      ov.style.top = head.offsetHeight + (scope ? scope.offsetHeight : 0) + "px";
      ov.style.bottom = (inputBar ? inputBar.offsetHeight : 103) + "px";
    };
    placeOverlay();
    window.addEventListener("resize", placeOverlay);
    wireList(ov);

    icon.addEventListener("click", () => {
      ov.hidden = !ov.hidden;
      icon.classList.toggle("is-active", !ov.hidden);
    });
    // 세션 선택 시 오버레이 닫기
    ov.querySelector(".hsb-list").addEventListener("click", (e) => {
      if (e.target.closest(".hsb-item")) { ov.hidden = true; icon.classList.remove("is-active"); }
    });

    loadSession(currentId);
  }

  if (isChat) initChat();
  else initHome();
})();
