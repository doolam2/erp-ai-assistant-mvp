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
    + '.swdm-menu div.cur{color:var(--brand);font-weight:600}'
    /* 화면 스캔 */
    + '.swdm-scan{position:fixed;left:0;right:0;height:3px;z-index:965;background:linear-gradient(90deg,transparent,var(--brand),transparent);'
    + 'box-shadow:0 0 18px 4px rgba(44,127,223,.35);pointer-events:none}'
    + '.swdm-mark{position:absolute;z-index:962;pointer-events:none;border:2px solid var(--brand);border-radius:10px;'
    + 'box-shadow:0 0 0 4px rgba(44,127,223,.14);opacity:0;transition:opacity .3s}'
    + '.swdm-mark.on{opacity:1}'
    + '.swdm-mlb{position:absolute;z-index:963;background:#1C2333;color:#fff;font:600 11px Pretendard,sans-serif;'
    + 'padding:6px 10px;border-radius:8px;box-shadow:0 6px 16px rgba(0,0,0,.25);opacity:0;transition:opacity .3s;max-width:260px;line-height:1.5}'
    + '.swdm-mlb.on{opacity:1}'
    /* AI 위젯 카드 */
    + '.swdm-wg{position:relative}'
    + '.swdm-wg .aichip{position:absolute;top:10px;right:10px;font-size:9px;font-weight:700;color:var(--brand);'
    + 'background:var(--tint-blue);padding:2px 7px;border-radius:20px}'
    + '.swdm-wg .wx{position:absolute;top:8px;right:38px;border:0;background:none;color:var(--g05);cursor:pointer;font-size:11px;display:none}'
    + '.swdm-wg:hover .wx{display:block}'
    /* 보고서 초안 */
    + '.swdm-draft{background:var(--surface);border:1px solid var(--brand);border-radius:var(--radius);padding:18px 20px;margin-bottom:20px}'
    + '.swdm-draft h3{font-size:14px;margin:0 0 4px}'
    + '.swdm-draft .tag{font-size:9px;font-weight:700;color:var(--brand);background:var(--tint-blue);padding:2px 7px;border-radius:20px;margin-left:8px}'
    + '.swdm-draft p{font-size:12px;color:var(--g08);line-height:1.7;margin:8px 0 0}'
    /* GNB 알림 벨 */
    + '.swdm-bell{position:relative;display:flex;align-items:center;justify-content:center;width:34px;height:34px;'
    + 'border-radius:9px;color:var(--g08);margin-right:14px;flex:none}'
    + '.swdm-bell:hover{background:var(--g01)}'
    + '.swdm-bell svg{width:17px;height:17px}'
    + '.swdm-bell .bd{position:absolute;top:1px;right:0;min-width:15px;height:15px;border-radius:8px;background:var(--neg);'
    + 'color:#fff;font-size:9px;font-weight:700;display:none;align-items:center;justify-content:center;padding:0 4px;border:2px solid var(--surface)}';
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  /* ── ① 알림 토스트 (알림 센터와 연동 — 세션 인박스 누적 + GNB 벨 뱃지) ── */
  var TOASTS = [
    { tone: 'orange', title: '온도 상한 근접', body: '냉장센터 B 4.8°C — 이대로면 21:30 상한 도달 예상', href: 'temperature.html', scr: '온습도', bdg: '경고' },
    { tone: 'red', title: '소비기한 D-3', body: '두부 300g (L-0811) — 우선 출고 지정됨, 제1공장 창고', href: 'expiry.html', scr: '소비기한 관리', bdg: '긴급' },
    { tone: 'blue', title: '결재 대기 알림', body: '발주 승인 1건이 2일째 대기 중입니다 — 확인이 필요해요', href: 'bpm.html', scr: 'BPM', bdg: '승인' }
  ];
  function inbox() {
    try { return JSON.parse(sessionStorage.getItem('swdm_inbox') || '[]'); } catch (e) { return []; }
  }
  function unseen() {
    var seen = 0;
    try { seen = parseInt(sessionStorage.getItem('swdm_seen') || '0', 10); } catch (e) {}
    return Math.max(0, inbox().length - seen);
  }
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
    /* 인박스 누적(같은 제목은 한 번만) + 벨 뱃지 갱신 */
    try {
      var bx = inbox();
      if (!bx.some(function (n) { return n.t === t.title; })) {
        var now = new Date();
        bx.push({ t: t.title, b: t.body, h: t.href, tone: t.tone, scr: t.scr, bdg: t.bdg,
          tm: ('0' + now.getHours()).slice(-2) + ':' + ('0' + now.getMinutes()).slice(-2) });
        sessionStorage.setItem('swdm_inbox', JSON.stringify(bx));
      }
    } catch (e) {}
    updateBell();
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

  /* ── ①-b GNB 알림 벨 + 미확인 뱃지 ── */
  var bell = null;
  function updateBell() {
    if (!bell) return;
    var n = unseen();
    var bd = bell.querySelector('.bd');
    bd.textContent = n > 9 ? '9+' : n;
    bd.style.display = n > 0 ? 'flex' : 'none';
  }
  function mountBell() {
    var user = document.querySelector('.gnb .user');
    if (!user || bell) return;
    bell = document.createElement('a');
    bell.className = 'swdm-bell';
    bell.href = 'notifications.html';
    bell.title = '알림 센터';
    bell.innerHTML = ICON_BELL + '<span class="bd"></span>';
    user.parentNode.insertBefore(bell, user);
    updateBell();
  }

  /* ── ①-c 알림 센터 — 새 알림을 피드 맨 위에 꽂기 ── */
  function feedInject() {
    if (PAGE !== 'notifications.html') return;
    var bx = inbox();
    if (!bx.length) return;
    var table = document.querySelector('table.grid');
    var head = table && table.querySelector('tr');
    if (!head) return;
    var BG = { orange: 'bg-orange', red: 'bg-red', blue: 'bg-blue' };
    bx.slice().reverse().forEach(function (n) {
      var tr = document.createElement('tr');
      tr.className = 'swdm-new';
      tr.innerHTML = '<td><span class="t-mut">' + n.tm + '</span></td>'
        + '<td><span class="badge ' + (BG[n.tone] || 'bg-blue') + '">' + (n.bdg || '알림') + '</span></td>'
        + '<td><b>' + n.t + '</b> — ' + n.b + '</td>'
        + '<td><span class="t-mut">' + (n.scr || '') + '</span></td>'
        + '<td><span class="badge bg-blue">안읽음</span></td>';
      tr.style.cursor = 'pointer';
      tr.addEventListener('click', function () { location.href = n.h; });
      head.parentNode.insertBefore(tr, head.nextSibling);
    });
    /* 안읽음 KPI 갱신 (기본 7 + 새 알림) */
    var kpi = document.querySelector('.kpi .num');
    if (kpi && kpi.childNodes[0]) kpi.childNodes[0].textContent = String(7 + bx.length);
    /* 확인 처리 → 벨 뱃지 초기화 */
    try { sessionStorage.setItem('swdm_seen', String(bx.length)); } catch (e) {}
    updateBell();
  }
  mountBell();
  feedInject();

  /* ── ①-d AI 위젯 (대시보드 개인화 — 챗 제안 반영 시 추가) ── */
  function renderWidgets() {
    if (PAGE !== 'dashboard.html') return;
    var kpis = document.querySelector('.kpis');
    if (!kpis) return;
    kpis.querySelectorAll('.swdm-wg').forEach(function (w) { w.remove(); });
    var ws = [];
    try { ws = JSON.parse(localStorage.getItem('sw_widgets') || '[]'); } catch (e) {}
    ws.forEach(function (w) {
      var d = document.createElement('div');
      d.className = 'kpi swdm-wg';
      d.innerHTML = '<div class="lb">' + w.lb + '</div><div class="num">' + w.num + '</div>'
        + '<div class="meta">' + (w.meta || '') + '</div>'
        + '<span class="aichip">AI</span><button class="wx" type="button" title="위젯 제거">✕</button>';
      d.querySelector('.wx').addEventListener('click', function () {
        try {
          var arr = JSON.parse(localStorage.getItem('sw_widgets') || '[]').filter(function (x) { return x.lb !== w.lb; });
          localStorage.setItem('sw_widgets', JSON.stringify(arr));
        } catch (e) {}
        d.remove();
      });
      kpis.appendChild(d);
    });
  }
  renderWidgets();
  window.swdemo = { renderWidgets: renderWidgets };

  /* ── ①-e 화면 스캔 (S 키) — AI가 이상 포인트를 훑어 표시 ── */
  var scanEls = [];
  function clearScan() {
    scanEls.forEach(function (e) { e.remove(); });
    scanEls = [];
  }
  function runScan() {
    clearScan();
    var line = document.createElement('div');
    line.className = 'swdm-scan';
    line.style.top = '0px';
    document.body.appendChild(line);
    scanEls.push(line);
    var t0 = Date.now(), DUR = 1100;
    var iv = setInterval(function () {
      var p = Math.min(1, (Date.now() - t0) / DUR);
      line.style.top = (p * innerHeight) + 'px';
      if (p >= 1) { clearInterval(iv); line.remove(); marks(); }
    }, 16);
    function marks() {
      /* 이상 신호: 부정 증감·경고 배지에서 상위 3곳 */
      var cands = [].slice.call(document.querySelectorAll('.kpi .delta.t-neg, .kpi .delta.t-orange, .badge.bg-red, .badge.bg-orange, .t-orange.zt, b.t-orange, b.t-neg'));
      var seen = [], picked = [];
      cands.forEach(function (el) {
        if (picked.length >= 3) return;
        var r = el.getBoundingClientRect();
        if (r.width === 0 || r.top < 60) return;
        var key = Math.round(r.top / 120);
        if (seen.indexOf(key) > -1) return;
        seen.push(key);
        picked.push(el);
      });
      picked.forEach(function (el, i) {
        setTimeout(function () {
          var box = (el.closest('.kpi') || el.closest('.zcard') || el.parentElement);
          var r = box.getBoundingClientRect();
          var mk = document.createElement('div');
          mk.className = 'swdm-mark';
          mk.style.left = (r.left + scrollX - 5) + 'px';
          mk.style.top = (r.top + scrollY - 5) + 'px';
          mk.style.width = (r.width + 10) + 'px';
          mk.style.height = (r.height + 10) + 'px';
          document.body.appendChild(mk);
          var lb = document.createElement('div');
          lb.className = 'swdm-mlb';
          lb.textContent = (i + 1) + ' · ' + el.textContent.trim().slice(0, 40);
          document.body.appendChild(lb);
          lb.style.left = Math.min(r.left + scrollX, scrollX + innerWidth - 280) + 'px';
          lb.style.top = (r.bottom + scrollY + 8) + 'px';
          void mk.getBoundingClientRect();
          mk.classList.add('on'); lb.classList.add('on');
          scanEls.push(mk, lb);
        }, i * 220);
      });
      if (!picked.length) {
        var ok = document.createElement('div');
        ok.className = 'swdm-mlb on';
        ok.style.left = '50%'; ok.style.top = '80px'; ok.style.transform = 'translateX(-50%)'; ok.style.position = 'fixed';
        ok.textContent = '이 화면에서는 이상 신호가 없어요';
        document.body.appendChild(ok);
        scanEls.push(ok);
        setTimeout(clearScan, 2500);
      }
    }
  }

  /* ── ①-f 보고서 초안 (?draft=1 — AI 챗에서 생성) ── */
  if (PAGE === 'report_builder.html' && /[?&]draft=1/.test(location.search)) {
    var main = document.querySelector('.main');
    if (main) {
      var dft = document.createElement('section');
      dft.className = 'swdm-draft';
      dft.innerHTML = '<h3>주간 경영 보고 초안<span class="tag">AI 생성</span></h3>'
        + '<p>8월 4주차 매출 12,232,412천원(전년비 +8.2%), 연간 달성률 95.6%로 4.4%p 미달이나 남은 영업일 추세상 근접 달성 전망. '
        + '특이사항 ① 냉장센터 B 온도 반복 상승 — 입고 시간대 기준 완화 제안 등록 ② 소비기한 D-3 1건 우선 출고 처리 ③ 부자재 장기 체류 16% — 안전재고 기준 재조정 필요.</p>'
        + '<p style="color:var(--g05);font-size:11px">아래 구성에서 섹션을 다듬어 발행하세요 — 초안은 저장 전까지 유지되지 않습니다.</p>';
      var head = main.querySelector('.page-head');
      head.parentNode.insertBefore(dft, head.nextSibling);
    }
  }

  /* ── ② 단축키 시트 ── */
  var hlp = null;
  var KEYS = [
    ['⌘K', '화면 검색 · AI에게 질문'],
    ['A', 'AI 어시스턴트 — 시나리오 자동 재생'],
    ['R', '진입 모션 다시 재생'],
    ['T', '안내 비컨 표시/숨김'],
    ['S', '화면 스캔 — AI가 이상 포인트 표시'],
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
    else if (e.key === 's' || e.key === 'S') runScan();
    else if (e.key === '?' || e.key === '/') toggleHelp();
    else if ((e.key === 'd' || e.key === 'D') && isOps) {
      applyDark(document.documentElement.getAttribute('data-theme') !== 'darkops');
    }
    else if (e.key === 'Escape') { closeMenu(); clearScan(); if (hlp) toggleHelp(); }
  });
})();
