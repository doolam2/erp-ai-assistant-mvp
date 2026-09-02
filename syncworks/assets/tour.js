/* 비컨 팝오버 온보딩(TT-03 방식) — 딤 없이 파란 펄스 점을 요소 옆에 두고,
   누르면 그 자리에 작은 팝오버(제목·설명·n/N·다음)가 열림. [다음] = 다음 비컨으로 순회.
   T 키 = 비컨 표시/숨김 토글. 페이지 전용 스텝이 없으면 공통 4스텝.
   콘텐츠 검토 단계 — 표시 조건(첫 방문만 등)은 확정 후 붙임. */
(function () {
  var PAGE = (location.pathname.split('/').pop() || 'index.html');
  if (PAGE === 'login.html' || PAGE === 'index.html' || PAGE === '_cap.html') return;

  /* ── 공통 스텝 (모든 화면) ── */
  var GENERIC = [
    { sel: '.lnb a.on', t: '지금 있는 화면', b: '왼쪽 메뉴에 현재 위치가 표시됩니다. 같은 묶음의 다른 업무로 바로 이동할 수 있어요.' },
    { sel: '.page-head h1', t: '화면 제목과 기준', b: '제목 옆에는 조회 기준(기간·법인·단위)이 함께 표시됩니다. 다른 화면에서도 같은 자리를 보면 됩니다.' },
    { sel: '.main .panel', t: '핵심 데이터', b: '이 화면의 중심 패널입니다. 표의 행이나 그래프의 숫자를 누르면 상세로 이어집니다.' },
    { sel: '.swai-fab', t: 'AI 어시스턴트', b: '찾기 어려운 건 직접 뒤지지 말고 물어보세요. 데이터 근거와 함께 답하고, 해당 화면으로 바로 데려다줍니다.' }
  ];

  /* ── 페이지 전용 스텝 ── */
  var TOURS = {
    'dashboard.html': [
      { sel: '.kpis .kpi', t: '경영 숫자는 여기부터', b: '매출·이익·달성률·미수까지 카드 6장으로 모입니다. 매일 아침 이 줄만 봐도 회사 상태가 잡혀요.' },
      { sel: '.main .panel', t: '월별 실적 vs 목표', b: '막대는 실적, 선은 목표입니다. 목표에 못 미친 달은 옅게 표시돼 한눈에 구분됩니다.' },
      { sel: '.lnb a.on', t: '경영 관리 메뉴', b: '손익계산서·법인별 실적·매출 목표가 같은 묶음에 있습니다. 지금 보는 숫자의 근거는 전부 여기서 열립니다.' },
      { sel: '.swai-fab', t: '숫자가 궁금하면 AI에게', b: '"이번 달 매출 어때?"라고 물으면 근거 표와 함께 답합니다. 화면을 뒤질 필요가 없어요.' }
    ],
    'sales_report.html': [
      { sel: '.kpis .kpi', t: '매출 핵심 지표', b: '당월 매출·이익률·달성률·거래처 집중도입니다. 집중도가 내려가면 매출 구조가 건강해지고 있다는 뜻이에요.' },
      { sel: '.main .panel', t: '거래처 파레토', b: '막대는 거래처별 매출, 선은 누적 비중입니다. 상위 몇 곳이 매출을 얼마나 차지하는지 바로 보입니다.' },
      { sel: '.page-head .actions', t: '기간·범위 바꾸기', b: '조회 기간과 창고·법인 범위를 여기서 바꿉니다. CSV로 내려받아 보고서에 쓸 수도 있어요.' },
      { sel: '.swai-fab', t: '분석은 AI에게', b: '"어느 채널이 크고 있어?"처럼 물어보세요. 화면의 숫자를 근거로 답합니다.' }
    ],
    'temperature.html': [
      { sel: '.zcard.warn', t: '주의 구역은 테두리로', b: '기준 상한에 가까워진 구역은 주황 테두리로 표시됩니다. 지금은 냉장센터 B가 상한에 근접했어요.' },
      { sel: '.main .panel', t: '24시간 추이', b: '연한 띠가 안전 범위입니다. 선이 띠를 벗어나기 전에 도달 예상 시각을 미리 알려드려요.' },
      { sel: '.lnb a.on', t: '모니터링 묶음', b: '설비 관제·알람 이력·완제품 불량이 같은 메뉴에 있습니다. 알람이 울리면 이력 화면으로 이어집니다.' },
      { sel: '.swai-fab', t: '원인이 궁금하면', b: '"냉장센터 B 왜 오르고 있어?"라고 물으면 원인 패턴과 도달 예상 시각까지 답합니다.' }
    ],
    'lots.html': [
      { sel: '.page-head h1', t: '로트 추적', b: '한 로트가 어느 원료로, 언제, 어느 라인에서 만들어져 어디로 갔는지 전 과정을 소급합니다.' },
      { sel: '.main .panel', t: '이력 타임라인', b: '원료 입고부터 출고까지 단계별로 이어집니다. 각 단계를 누르면 해당 전표가 열립니다.' },
      { sel: '.swai-fab', t: '회수 범위도 즉시', b: '"이 로트 문제 생기면 회수 범위는?"이라고 물으면 출고처와 형제 로트까지 계산해 답합니다.' }
    ],
    'orders.html': [
      { sel: '.kpis .kpi', t: '오늘의 주문 현황', b: '신규·미확정·출고 대기가 카드로 요약됩니다. 미확정이 쌓이면 여기서 먼저 티가 나요.' },
      { sel: '.main .panel', t: '주문 목록', b: '행을 누르면 상세로 들어갑니다. 상태 배지 색으로 확정·대기·보류를 구분해요.' },
      { sel: '.page-head .actions', t: '기간 선택', b: '조회 기간을 바꾸거나 프리셋(이번 주·이번 달)을 바로 적용할 수 있습니다.' },
      { sel: '.swai-fab', t: '몰리는 날 미리 알기', b: '"이번 주 주문 몰리는 데 있어?"라고 물으면 요일별 패턴과 대비 방법까지 답합니다.' }
    ]
  };

  var steps = [];

  /* ── 스타일 ── */
  var css = ''
    + '.swtr-bcn{position:absolute;z-index:940;width:14px;height:14px;border-radius:50%;background:var(--brand);'
    + 'border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.25);cursor:pointer;transition:transform .15s}'
    + '.swtr-bcn:hover{transform:scale(1.25)}'
    + '.swtr-bcn::after{content:"";position:absolute;inset:-3px;border-radius:50%;border:2px solid var(--brand);'
    + 'animation:swtrp 1.8s cubic-bezier(.22,.61,.36,1) infinite}'
    + '@keyframes swtrp{0%{transform:scale(.7);opacity:.9}70%{transform:scale(2.1);opacity:0}100%{transform:scale(2.1);opacity:0}}'
    + '@media (prefers-reduced-motion: reduce){.swtr-bcn::after{animation:none;opacity:0}}'
    + '.swtr-pop{position:absolute;z-index:945;width:280px;background:var(--surface);border-radius:12px;padding:16px 18px;'
    + 'box-shadow:0 10px 32px rgba(0,0,0,.2);border:1px solid var(--g02)}'
    + '.swtr-pop .arw{position:absolute;top:-5px;width:10px;height:10px;background:var(--surface);transform:rotate(45deg);'
    + 'border-left:1px solid var(--g02);border-top:1px solid var(--g02)}'
    + '.swtr-pop h5{margin:0 0 6px;font-size:14px;font-weight:600;color:var(--ink)}'
    + '.swtr-pop p{margin:0 0 12px;font-size:12px;line-height:1.65;color:var(--g08)}'
    + '.swtr-pop .ft{display:flex;align-items:center}'
    + '.swtr-pop .n{font-size:11px;font-weight:600;color:var(--g05)}'
    + '.swtr-pop .nx{margin-left:auto;border:0;border-radius:8px;background:var(--brand);color:#fff;'
    + 'font:600 12px Pretendard,sans-serif;padding:7px 16px;cursor:pointer}'
    + '.swtr-pop .x{position:absolute;top:12px;right:12px;border:0;background:none;color:var(--g05);cursor:pointer;font-size:13px;padding:2px 4px}'
    + '.swtr-pop .x:hover{color:var(--g08)}';
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  var beacons = [], pop = null, hidden = false;

  function place() {
    beacons.forEach(function (b, i) {
      var r = steps[i].el.getBoundingClientRect();
      b.style.left = (r.right + scrollX - 18) + 'px';
      b.style.top = (r.top + scrollY + 4) + 'px';
    });
  }

  function closePop() { if (pop) { pop.remove(); pop = null; } }

  function openPop(i) {
    closePop();
    var s = steps[i];
    var r = s.el.getBoundingClientRect();
    pop = document.createElement('div');
    pop.className = 'swtr-pop';
    pop.innerHTML = '<i class="arw"></i><button class="x" type="button" aria-label="닫기">✕</button>'
      + '<h5>' + s.t + '</h5><p>' + s.b + '</p>'
      + '<div class="ft"><span class="n">' + (i + 1) + ' / ' + steps.length + '</span>'
      + '<button class="nx" type="button">' + (i + 1 < steps.length ? '다음' : '완료') + '</button></div>';
    document.body.appendChild(pop);
    var bx = r.right + scrollX - 11;             /* 비컨 중심 x */
    var left = Math.max(12, Math.min(bx - 140, scrollX + innerWidth - 292));
    pop.style.left = left + 'px';
    var ph = pop.getBoundingClientRect().height || 150;
    var below = r.top + 26 + ph <= innerHeight - 12;   /* 아래 공간 없으면 위로 뒤집기 */
    pop.style.top = (below ? r.top + scrollY + 26 : r.top + scrollY - ph - 16) + 'px';
    var arw = pop.querySelector('.arw');
    arw.style.left = (bx - left - 5) + 'px';
    if (!below) { arw.style.top = 'auto'; arw.style.bottom = '-5px'; arw.style.transform = 'rotate(225deg)'; }
    pop.querySelector('.x').addEventListener('click', closePop);
    pop.querySelector('.nx').addEventListener('click', function () {
      if (i + 1 < steps.length) {
        openPop(i + 1);
        steps[i + 1].el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      } else closePop();
    });
  }

  function build() {
    steps = (TOURS[PAGE] || GENERIC)
      .map(function (s) { return { sel: s.sel, t: s.t, b: s.b, el: document.querySelector(s.sel) }; })
      .filter(function (s) { return !!s.el; });
    steps.forEach(function (s, i) {
      var b = document.createElement('button');
      b.className = 'swtr-bcn';
      b.type = 'button';
      b.title = s.t;
      b.addEventListener('click', function () { openPop(i); });
      document.body.appendChild(b);
      beacons.push(b);
    });
    place();
  }

  function onReady(fn) {
    if (document.readyState !== 'loading') setTimeout(fn, 120);
    else document.addEventListener('DOMContentLoaded', function () { setTimeout(fn, 120); });
  }
  onReady(build);
  addEventListener('resize', place);

  /* T 키 = 비컨 토글 */
  document.addEventListener('keydown', function (e) {
    if (/input|textarea|select/i.test(e.target.tagName)) return;
    if (e.key === 't' || e.key === 'T') {
      hidden = !hidden;
      beacons.forEach(function (b) { b.style.display = hidden ? 'none' : ''; });
      if (hidden) closePop();
    }
    if (e.key === 'Escape') closePop();
  });
})();
