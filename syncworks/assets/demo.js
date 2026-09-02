/* 데모 연출 모음 — ① 알림 토스트(N 키 순환, 세션당 1회 자동) ② 단축키 시트(? 키)
   ③ 다크 관제 테마 토글(D 키, 모니터링 계열만) ④ 필터 드롭다운 → 차트 리드로우.
   전부 정적 연출. 실서비스에서는 ①이 웹소켓 알림, ④가 재조회 API로 바뀔 뿐 UI는 동일. */
(function () {
  var PAGE = (location.pathname.split('/').pop() || 'index.html');
  if (PAGE === 'login.html' || PAGE === 'index.html' || PAGE === '_cap.html') return;
  var REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;

  var css = ''
    /* 토스트 */
    + '.swdm-toast{position:fixed;top:68px;right:20px;z-index:985;width:330px;background:var(--surface);border:1px solid var(--g02);'
    + 'border-radius:12px;padding:13px 15px;display:flex;gap:11px;box-shadow:0 12px 32px rgba(0,0,0,.18);cursor:pointer;'
    + 'transform:translateX(120%);transition:transform .45s cubic-bezier(.22,.61,.36,1)}'
    + '.swdm-toast.on{transform:none}'
    + '.swdm-toast .ic{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex:none}'
    + '.swdm-toast .ic svg{width:16px;height:16px}'
    + '.swdm-toast h6{font-size:12.5px;font-weight:600;color:var(--ink);margin:0 0 3px}'
    + '.swdm-toast p{font-size:11.5px;line-height:1.55;color:var(--g08);margin:0}'
    + '.swdm-toast time{font-size:10px;color:var(--g05);margin-left:auto;flex:none}'
    + '.swdm-toast .x{position:absolute;top:8px;right:10px;border:0;background:none;color:var(--g05);cursor:pointer;font-size:12px;display:none}'
    + '.swdm-toast:hover .x{display:block}'
    /* 단축키 시트 */
    + '.swdm-hlp{position:fixed;inset:0;z-index:988;background:rgba(15,23,42,.38);display:flex;align-items:center;justify-content:center}'
    + '.swdm-hlp .bx{width:min(420px,92vw);background:var(--surface);border-radius:14px;padding:22px 24px;box-shadow:0 24px 64px rgba(0,0,0,.3)}'
    + '.swdm-hlp h4{font-size:15px;font-weight:700;color:var(--ink);margin:0 0 14px}'
    + '.swdm-hlp .rw{display:flex;align-items:center;gap:10px;padding:7px 0;font-size:12.5px;color:var(--g08)}'
    + '.swdm-hlp kbd{min-width:26px;text-align:center;font:600 11px Pretendard,sans-serif;color:var(--ink);background:var(--g01);'
    + 'border:1px solid var(--g03);border-bottom-width:2px;border-radius:6px;padding:3px 7px}'
    + '.swdm-hlp .nt{font-size:10.5px;color:var(--g05);margin-top:12px}'
    /* 필터 드롭다운 */
    + '.swdm-menu{position:absolute;z-index:975;min-width:150px;background:var(--surface);border:1px solid var(--g02);border-radius:10px;'
    + 'padding:5px;box-shadow:0 10px 28px rgba(0,0,0,.16)}'
    + '.swdm-menu div{padding:8px 12px;border-radius:7px;font-size:12px;color:var(--ink);cursor:pointer;white-space:nowrap}'
    + '.swdm-menu div:hover{background:var(--g01)}'
    + '.swdm-menu div.cur{color:var(--brand);font-weight:600}';
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  /* ── ① 알림 토스트 ── */
  var TOASTS = [
    { tone: 'orange', title: '온도 상한 근접', body: '냉장센터 B 4.8°C — 이대로면 21:30 상한 도달 예상', href: 'temperature.html' },
    { tone: 'red', title: '소비기한 D-3', body: '두부 300g (L-0811) — 우선 출고 지정됨, 제1공장 창고', href: 'expiry.html' },
    { tone: 'blue', title: '결재 대기 알림', body: '발주 승인 1건이 2일째 대기 중입니다 — 확인이 필요해요', href: 'bpm.html' }
  ];
  var TONE = {
    orange: ['var(--tint-orange)', 'var(--orange)'],
    red: ['var(--tint-red)', 'var(--neg)'],
    blue: ['var(--tint-blue)', 'var(--brand)']
  };
  var ICON_BELL = '<svg viewBox="0 0 16 16" fill="none"><path d="M8 2a4 4 0 0 0-4 4v2.5L2.8 11h10.4L12 8.5V6a4 4 0 0 0-4-4Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M6.5 13.2a1.6 1.6 0 0 0 3 0" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>';
  var tIdx = 0, toastEl = null;

  function showToast(i) {
    if (toastEl) toastEl.remove();
    var t = TOASTS[i % TOASTS.length];
    var el = document.createElement('div');
    el.className = 'swdm-toast';
    el.innerHTML = '<span class="ic" style="background:' + TONE[t.tone][0] + ';color:' + TONE[t.tone][1] + '">' + ICON_BELL + '</span>'
      + '<span style="min-width:0"><h6>' + t.title + '</h6><p>' + t.body + '</p></span>'
      + '<time>방금</time><button class="x" type="button">✕</button>';
    document.body.appendChild(el);
    toastEl = el;
    void el.getBoundingClientRect();
    el.classList.add('on');
    el.addEventListener('click', function (e) {
      if (e.target.closest('.x')) { hide(); return; }
      location.href = t.href;
    });
    var tm = setTimeout(hide, 9000);
    function hide() {
      clearTimeout(tm);
      el.classList.remove('on');
      setTimeout(function () { el.remove(); if (toastEl === el) toastEl = null; }, 450);
    }
  }
  /* 세션당 1회, 진입 7초 뒤 자동 연출 */
  try {
    if (!sessionStorage.getItem('swdm_toast')) {
      sessionStorage.setItem('swdm_toast', '1');
      setTimeout(function () { showToast(0); tIdx = 1; }, 7000);
    }
  } catch (e) {}

  /* ── ② 단축키 시트 ── */
  var hlp = null;
  var KEYS = [
    ['⌘K', '화면 검색 · AI에게 질문'],
    ['A', 'AI 어시스턴트 — 시나리오 자동 재생'],
    ['R', '진입 모션 다시 재생'],
    ['T', '안내 비컨 표시/숨김'],
    ['N', '알림 도착 연출 (누를 때마다 다른 알림)'],
    ['D', '다크 관제 테마 (모니터링 화면)'],
    ['Esc', '열린 창 닫기']
  ];
  function toggleHelp() {
    if (hlp) { hlp.remove(); hlp = null; return; }
    hlp = document.createElement('div');
    hlp.className = 'swdm-hlp';
    hlp.innerHTML = '<div class="bx"><h4>단축키</h4>'
      + KEYS.map(function (k) { return '<div class="rw"><kbd>' + k[0] + '</kbd>' + k[1] + '</div>'; }).join('')
      + '<p class="nt">데모 연출용 단축키입니다 — ? 키로 언제든 다시 볼 수 있어요.</p></div>';
    document.body.appendChild(hlp);
    hlp.addEventListener('mousedown', function (e) { if (e.target === hlp) toggleHelp(); });
  }

  /* ── ③ 다크 관제 테마 (모니터링 계열만) ── */
  var OPS = ['monitoring.html', 'monitoring_live.html', 'monitoring_analytics.html',
    'temperature.html', 'alarms.html', 'finished_defects.html', 'shipping_mon.html', 'stock_mon.html'];
  var isOps = OPS.indexOf(PAGE) > -1;
  function applyDark(onoff) {
    document.documentElement.setAttribute('data-theme', onoff ? 'darkops' : (localStorage.getItem('sw_theme') || ''));
    try { sessionStorage.setItem('swdm_dark', onoff ? '1' : ''); } catch (e) {}
  }
  try {
    if (isOps && sessionStorage.getItem('swdm_dark') === '1') applyDark(true);
  } catch (e) {}

  /* ── ④ 필터 드롭다운 → 차트 리드로우 ── */
  var OPTS = [
    [/법인/, ['전체 법인', '법인A', '법인B', '법인C']],
    [/\d{4}년/, ['2026년', '2025년', '2024년']],
    [/주|개월|월$|기간|12/, ['최근 12주', '최근 6개월', '올해']],
    [/창고/, ['전체 창고', '중앙물류센터', '냉장센터', '제1공장 창고']],
    [/라인/, ['전체 라인', '1호 라인', '2호 라인', '5호 라인']],
    [/제품|품목/, ['전체 제품', '두부류', '콩물·음료', '나물·반찬']]
  ];
  var menu = null, seed = 1;
  function closeMenu() { if (menu) { menu.remove(); menu = null; } }
  function rand() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }

  function perturb() {
    /* 막대·게이지 값을 ±14% 흔들고 모션 재생 → "재조회" 연출 */
    document.querySelectorAll('.combo .bars > i, .bars .grpx i, .hbar i, .stack .bar i').forEach(function (el) {
      var prop = el.closest('.hbar') || el.closest('.bar') ? 'width' : 'height';
      var v = parseFloat(el.style[prop]);
      if (isNaN(v)) return;
      el.style[prop] = Math.max(6, Math.min(100, v * (0.86 + rand() * 0.28))) + '%';
    });
    /* KPI 숫자는 유지 — AI 답변·화면 문구와 정합성 (카운트업만 재생됨) */
    if (window.swmotion) window.swmotion.replay();
  }

  /* ui.js가 만든 select 기반 드롭다운 — 값이 바뀌면 리드로우 */
  document.addEventListener('change', function (e) {
    if (e.target.matches && e.target.matches('select.sel, select.ctl') && !REDUCE) perturb();
  });

  /* select 없이 라벨만 있는 정적 필터 버튼 — 간이 메뉴 제공 */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('button.dd-btn:not(.dd .dd-btn), button.sel:not(.dd .sel)');
    if (!btn) { closeMenu(); return; }
    e.preventDefault();
    if (menu && menu._for === btn) { closeMenu(); return; }
    closeMenu();
    var label = btn.textContent.trim();
    var opts = null;
    for (var i = 0; i < OPTS.length; i++) if (OPTS[i][0].test(label)) { opts = OPTS[i][1].slice(); break; }
    if (!opts) opts = ['전체 보기', '최근 3개월', '최근 12개월'];
    if (opts.indexOf(label) === -1) opts.unshift(label);
    menu = document.createElement('div');
    menu.className = 'swdm-menu';
    menu._for = btn;
    menu.innerHTML = opts.map(function (o) {
      return '<div class="' + (o === label ? 'cur' : '') + '">' + o + '</div>';
    }).join('');
    document.body.appendChild(menu);
    var r = btn.getBoundingClientRect();
    menu.style.left = Math.min(r.left + scrollX, scrollX + innerWidth - menu.offsetWidth - 12) + 'px';
    menu.style.top = (r.bottom + scrollY + 6) + 'px';
    menu.addEventListener('click', function (ev) {
      var it = ev.target.closest('div');
      if (!it || it === menu) return;
      var v = it.textContent;
      closeMenu();
      if (v === label) return;
      btn.textContent = v;
      if (!REDUCE) perturb();
    });
  });

  /* ── 키 바인딩 ── */
  document.addEventListener('keydown', function (e) {
    if (/input|textarea|select/i.test(e.target.tagName)) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'n' || e.key === 'N') showToast(tIdx++);
    else if (e.key === '?' || e.key === '/') toggleHelp();
    else if ((e.key === 'd' || e.key === 'D') && isOps) {
      applyDark(document.documentElement.getAttribute('data-theme') !== 'darkops');
    }
    else if (e.key === 'Escape') { closeMenu(); if (hlp) toggleHelp(); }
  });
})();
