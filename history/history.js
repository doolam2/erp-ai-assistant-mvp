/* =========================================================
   대화 유지 (v2) — 계정당 대화 1개
   목록·검색·새 대화 없음. thread 를 MutationObserver 로 감시해
   localStorage 에 계속 저장하고, 다시 열면 이어서 보여준다.
   app.js·home.js 를 수정하지 않는 비침투 레이어.
   실서비스에서는 agent_conversations(계정당 1개) 로 대체된다.
   ========================================================= */
(function () {
  "use strict";
  const LS = "mm_erp_thread_v2";

  const isChat = !!document.getElementById("chatBody"); // chat.html (전체화면)
  const isHome = !!document.getElementById("aiPanel");  // index.html (슬라이드)
  if (!isChat && !isHome) return;

  const threadEl = isChat
    ? document.getElementById("thread")
    : document.getElementById("aiThread");
  if (!threadEl) return;

  /* 저장된 대화가 있으면 초기 데모 대신 이어서 표시 */
  let suppress = false;
  const saved = localStorage.getItem(LS);
  if (saved) {
    suppress = true;
    threadEl.innerHTML = saved;
    requestAnimationFrame(() => { suppress = false; });
    const scroller = isChat ? document.getElementById("chatBody") : threadEl;
    if (scroller) scroller.scrollTop = scroller.scrollHeight;
  }

  /* 대화 변화를 감지해 자동 저장 (디바운스) */
  let t = null;
  new MutationObserver(() => {
    if (suppress) return;
    clearTimeout(t);
    t = setTimeout(() => localStorage.setItem(LS, threadEl.innerHTML), 250);
  }).observe(threadEl, { childList: true, subtree: true, characterData: true });


  /* 슬라이드 패널: home.js 가 첫 열기 때 인트로를 새로 그리므로,
     저장된 대화가 있으면 열기 직후 저장본으로 되돌린다 */
  if (isHome) {
    const launch = document.getElementById("aiLaunch");
    if (launch) launch.addEventListener("click", () => {
      const cur = localStorage.getItem(LS);
      if (!cur) return;
      setTimeout(() => {
        suppress = true;
        threadEl.innerHTML = cur;
        requestAnimationFrame(() => { suppress = false; });
        threadEl.scrollTop = threadEl.scrollHeight;
      }, 0);
    });
  }

  /* 대화가 계정당 1개이므로 '새 대화' 버튼은 숨긴다 */
  const newBtn = document.getElementById("newChatBtn");
  if (newBtn) newBtn.style.display = "none";
})();
