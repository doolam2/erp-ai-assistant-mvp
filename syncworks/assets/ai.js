/* AI 어시스턴트 슬라이드 챗 — 데모 연출용(정적 시나리오).
   우하단 AI 버튼 → 우측 슬라이드 패널. 추천 질문 칩 클릭 시 타이핑 연출로 답변,
   근거 미니표 + 딥링크(실제 화면 이동). A 키 = 패널 열고 첫 시나리오 자동 재생(촬영용).
   실서비스에서는 답변 생성부만 API로 교체하면 됨. */
(function () {
  var PAGE = (location.pathname.split('/').pop() || 'index.html');
  if (PAGE === 'login.html' || PAGE === 'index.html' || PAGE === '_cap.html') return;
  var REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 페이지별 시나리오 ── */
  var COMMON = [
    { q: '이번 달 실적 요약해줘',
      a: '8월 매출은 12,232,412천원으로 전년 동월 대비 +8.2%입니다. 목표 달성률은 95.6%로 4.4%p 미달이지만, 남은 영업일 추세면 월말 근접 달성이 예상됩니다.',
      rows: [['당월 매출', '12,232,412', '+8.2%'], ['목표 달성률', '95.6%', '-4.4%p'], ['미수 잔액', '842,110', '+2건']],
      link: { href: 'dashboard.html', label: '경영 대시보드에서 보기' } },
    { q: '지금 주의할 게 있어?',
      a: '두 가지가 눈에 띕니다. 냉장센터 B 온도가 4.8°C로 상한(5.0°C)에 근접해 21:30경 도달이 예상되고, 부자재 장기 체류 재고가 16%로 안전재고 기준 재조정이 필요합니다.',
      link: { href: 'temperature.html', label: '온습도 현황 보기' } }
  ];
  var SCEN = {
    'dashboard.html': [
      { q: '이번 달 매출 어때?',
        a: '8월 매출은 12,232,412천원, 전년 동월 대비 +8.2%입니다. 목표 대비 95.6%로 4.4%p 미달인데, 원인은 급식 채널 단가 조정입니다. 카드 숫자를 누르면 근거 화면으로 이동합니다.',
        rows: [['당월 매출', '12,232,412', '+8.2%'], ['매출총이익률', '23.4%', '+0.8%p'], ['목표 달성률', '95.6%', '-4.4%p']],
        link: { href: 'sales_report.html', label: '매출 분석으로 이동' } },
      { q: '미수 잔액 늘었네?',
        a: '미수 잔액은 842,110천원으로 전월보다 2건 늘었습니다. 신규 2건 모두 급식 거래처이고 결제 조건 변경 협의 중입니다. 30일 초과 건은 없습니다.',
        link: { href: 'settlement.html', label: '정산 내역 보기' } }
    ],
    'sales_report.html': [
      { q: '상위 거래처 집중도 괜찮아?',
        a: '상위 5개 거래처 비중이 41.2%로 전월(43.1%)보다 1.9%p 내려갔습니다. 신규 거래처 매출이 +18.4% 늘며 분산이 진행 중이라 방향은 건강합니다.',
        rows: [['상위 5개 비중', '41.2%', '-1.9%p'], ['신규 거래처 매출', '412,800', '+18.4%']],
        link: { href: 'clients.html', label: '거래처 관리로 이동' } },
      { q: '어느 채널이 크고 있어?',
        a: '온라인 채널이 +3.2%p로 3개월 연속 확대 중입니다. 현재 비중은 대리점 44%, 급식 27%, 온라인 17%, OEM 12%입니다.',
        link: { href: 'dashboard.html', label: '경영 대시보드 보기' } }
    ],
    'pnl.html': [
      { q: '이번 달 이익 흐름 요약해줘',
        a: '매출 12,232,412천원에서 매출원가와 판관비를 거쳐 영업이익까지의 단계는 화면의 단계형 바와 같습니다. 이익률을 가장 많이 깎은 항목은 원재료비(대두 시세 상승분)입니다.',
        link: { href: 'dashboard.html', label: '경영 대시보드 보기' } },
      { q: '판관비 늘어난 이유는?',
        a: '물류비가 배차 증편으로 늘었습니다. 다만 냉장 적재율이 86.2%로 올라 건당 비용은 오히려 내려갔습니다.',
        link: { href: 'dispatch.html', label: '배차 관리 보기' } }
    ],
    'production_report.html': [
      { q: '계획 대비 미달 원인이 뭐야?',
        a: '미달일은 대부분 5호 라인 점검 여파입니다. 점검일(8/12~13) 전후로 두부류 생산이 계획 대비 87.0%까지 내려갔고, 이후 회복했습니다.',
        rows: [['계획 달성', '91.4%', '—'], ['수율', '96.2%', '+0.4%p'], ['불량률', '1.5%', '-0.2%p']],
        link: { href: 'monitoring.html', label: '설비 관제 보기' } },
      { q: '수율은 개선되고 있어?',
        a: '수율은 96.2%로 전월 대비 +0.4%p 개선됐습니다. 두부 800g 라인의 응고 온도 표준화가 반영된 결과로 보입니다.',
        link: { href: 'quality.html', label: '품질 화면 보기' } }
    ],
    'stock_report.html': [
      { q: '소비기한 임박 재고 있어?',
        a: '7일 내 도래가 6건입니다. 가장 급한 건 두부 300g(L-0811) D-3이며, 세 건 모두 우선 출고가 지정돼 있습니다. 31일(월)에 도래가 몰려 있으니 그날 출고 순서를 확인하세요.',
        rows: [['두부 300g L-0811', '제1공장', 'D-3'], ['순두부 350g L-0812', '중앙물류', 'D-4'], ['콩나물 380g L-0815', '냉장센터', 'D-5']],
        link: { href: 'expiry.html', label: '소비기한 관리로 이동' } },
      { q: '장기 체류 재고는?',
        a: '15일 이상 체류가 3.2%로 부자재 라벨류에 집중돼 있습니다. 과다 발주분이라 안전재고 기준 재조정을 발주 담당에 제안해 둔 상태입니다.',
        link: { href: 'purchase.html', label: '발주 현황 보기' } }
    ],
    'temperature.html': [
      { q: '냉장센터 B 왜 오르고 있어?',
        a: '20:40부터 상승 추세입니다. 입고 작업으로 도어 개폐가 잦은 것이 원인이며, 이대로면 21:30경 상한 5.0°C에 도달해 알람과 담당 호출이 나갑니다.',
        rows: [['현재', '4.8°C', '상한 5.0°C'], ['추세', '+0.4°C/h', '21:30 도달 예상']],
        link: { href: 'alarms.html', label: '알람 이력 보기' } },
      { q: '센서 상태는 다 정상이야?',
        a: '24기 중 22기 정상 응답입니다. 숙성실 S-14가 60초 이상 지연, 상온 S-22가 무응답으로 점검 요청돼 있습니다.',
        link: { href: 'monitoring.html', label: '설비 관제 보기' } }
    ],
    'alarms.html': [
      { q: '오늘 알람 요약해줘',
        a: '금일 47건 중 미처리 3건입니다. 유형별로는 온도 이탈이 가장 많고, 반복 알람 상위는 냉장센터 B 도어 개폐입니다. 평균 조치 시간은 8.4분입니다.',
        link: { href: 'temperature.html', label: '온습도 현황 보기' } },
      { q: '반복되는 알람 패턴 있어?',
        a: '냉장센터 B 온도 알람이 입고 시간대(20~22시)에 반복됩니다. 같은 질문이 주 5회 이상 확인돼, 입고 시간대 설정값 완화를 개선 제안함에 올려두었습니다.',
        link: { href: 'evolve.html', label: '개선 제안함 보기' } }
    ],
    'dispatch.html': [
      { q: '배차 여유 있어?',
        a: '금일 배차 14건, 냉장 적재율 86.2%입니다. 41/52t 기준 여유가 있어 추가 1건까지는 증차 없이 소화 가능합니다. 냉장 온도는 전 차량 기준치 내입니다.',
        link: { href: 'delivery.html', label: '배송 조회 보기' } },
      { q: '지연 위험 있는 차량은?',
        a: '현재 지연 위험 0건입니다. 수도권 3호차가 상차 대기 중이지만 출발 여유 시간 내에 있습니다.',
        link: { href: 'shipping_mon.html', label: '출하 현황 보기' } }
    ],
    'monitoring.html': [
      { q: '라인 가동률 어때?',
        a: '전체 가동률 91.2%입니다. 살균기 온도 91.2°C, 냉각 4.8°C로 공정 지표는 기준 범위이고, 5호 라인만 예방 점검으로 정지 상태입니다.',
        link: { href: 'monitoring_analytics.html', label: '운영 지표 분석 보기' } },
      { q: '오늘 생산 목표 맞출 수 있어?',
        a: '현재 진도율 기준으로 두부류는 정시 마감, 음료류는 30분 초과가 예상됩니다. 2호 라인 속도를 5% 올리면 정시 마감 범위에 들어옵니다.',
        link: { href: 'production.html', label: '생산 화면 보기' } }
    ],
    'inventory.html': [
      { q: '재고 회전율 어때?',
        a: '월 9.4회로 전월 대비 +0.6 개선됐습니다. 평균 재고일수는 3.2일로 신선 기준 목표(3일)에 근접합니다. 창고별로는 수도권 배송거점이 12.3회로 가장 빠릅니다.',
        link: { href: 'stock_report.html', label: '재고 분석으로 이동' } },
      { q: '부족 예상 품목 있어?',
        a: '두부 300g이 현재 소진 속도 기준 D+2 오전에 안전재고를 하회할 것으로 보입니다. 내일 생산 계획에 1배치 추가를 권장합니다.',
        link: { href: 'plan_new.html', label: '생산 계획 등록' } }
    ],
    'orders.html': [
      { q: '이번 주 주문 몰리는 데 있어?',
        a: '금요일 급식 채널 주문이 평주 대비 +18% 많습니다. 대상마트 정기 발주와 겹치는 날이라, 목요일 생산분 선확보를 권장합니다.',
        link: { href: 'confirm.html', label: '생산량 확정 보기' } },
      { q: '미확정 주문 몇 건이야?',
        a: '미확정 7건입니다. 이 중 2건은 재고 기준 즉시 확정 가능하고, 나머지는 금요일 생산분 배정 대기입니다.',
        link: { href: 'client_orders.html', label: '거래처별 주문 보기' } }
    ],
    'evolve.html': [
      { q: '요즘 뭘 개선했어?',
        a: '이번 달 제안 12건 중 7건이 승낙·반영됐습니다. 대표적으로 "재고 질문 시 소비기한 임박분 함께 표시"가 반영돼 관련 재질문이 40% 줄었습니다.',
        link: { href: 'changelog.html', label: '반영 이력 보기' } },
      { q: '대기 중인 제안은 뭐야?',
        a: '4건이 검토 대기입니다. 가장 오래된 건 "월 마감 전 미수 알림 자동화"로, 경리팀 확인만 남아 있습니다.',
        link: { href: 'bpm.html', label: 'BPM에서 보기' } }
    ],
    'quality.html': [
      { q: '이번 주 불량 추이 어때?',
        a: '불량률 1.5%로 전주 대비 -0.2%p입니다. 유형별로는 포장 불량이 가장 많고, 두부 800g 라인 실링 온도 조정 후 감소 추세입니다.',
        link: { href: 'defects.html', label: '불량 관리 보기' } },
      { q: '검사 지연 건 있어?',
        a: '금일 검사 예정 14건 중 지연 1건입니다. 원료 입고 검사(대두 L-0902)가 시료 대기 중이며, 완료 예상은 15시입니다.',
        link: { href: 'inspections.html', label: '검사 현황 보기' } }
    ]
  };

  var qa = SCEN[PAGE] || COMMON;

  /* ── 스타일 ── */
  var css = ''
    + '.swai-fab{position:fixed;right:22px;bottom:22px;z-index:960;width:52px;height:52px;border-radius:50%;border:0;cursor:pointer;'
    + 'background:var(--brand);color:#fff;font:700 15px/1 Pretendard,sans-serif;letter-spacing:.02em;'
    + 'box-shadow:0 10px 28px rgba(0,0,0,.24);transition:transform .25s cubic-bezier(.22,.61,.36,1),background .2s}'
    + '.swai-fab:hover{transform:translateY(-2px) scale(1.05)}'
    + '.swai-fab .dot{position:absolute;top:3px;right:3px;width:10px;height:10px;border-radius:50%;background:var(--pos-fill);border:2px solid #fff}'
    + '.swai-panel{position:fixed;top:0;right:0;bottom:0;z-index:970;width:min(400px,100vw);background:var(--surface);'
    + 'border-left:1px solid var(--g02);box-shadow:-16px 0 48px rgba(0,0,0,.14);display:flex;flex-direction:column;'
    + 'transform:translateX(105%);transition:transform .38s cubic-bezier(.22,.61,.36,1)}'
    + '.swai-panel.on{transform:none}'
    + '.swai-head{display:flex;align-items:center;gap:8px;padding:16px 18px;border-bottom:1px solid var(--g02)}'
    + '.swai-head b{font-size:14px}'
    + '.swai-head .bdg{font-size:10px;font-weight:700;color:var(--brand);background:var(--tint-blue);padding:3px 8px;border-radius:20px}'
    + '.swai-x{margin-left:auto;border:0;background:none;cursor:pointer;color:var(--g05);font-size:16px;padding:4px 6px;border-radius:6px}'
    + '.swai-x:hover{background:var(--g01);color:var(--g08)}'
    + '.swai-body{flex:1;overflow-y:auto;padding:18px 18px 8px;display:flex;flex-direction:column;gap:12px}'
    + '.swai-hello{font-size:12px;color:var(--g08);line-height:1.65;background:var(--g01);border-radius:12px;padding:12px 14px}'
    + '.swai-chips{display:flex;flex-wrap:wrap;gap:8px}'
    + '.swai-chip{border:1px solid var(--g03);background:var(--surface);border-radius:20px;padding:8px 14px;font-size:12px;color:var(--g08);cursor:pointer;transition:all .15s}'
    + '.swai-chip:hover{border-color:var(--brand);color:var(--brand);background:var(--tint-blue)}'
    + '.swai-msg{max-width:86%;font-size:13px;line-height:1.7;border-radius:14px;padding:11px 14px;opacity:0;transform:translateY(8px);transition:opacity .35s,transform .35s}'
    + '.swai-msg.in{opacity:1;transform:none}'
    + '.swai-msg.u{align-self:flex-end;background:var(--brand);color:#fff;border-bottom-right-radius:4px}'
    + '.swai-msg.a{align-self:flex-start;background:var(--g01);color:var(--ink);border-bottom-left-radius:4px}'
    + '.swai-think{align-self:flex-start;display:flex;gap:5px;padding:14px 16px;background:var(--g01);border-radius:14px;border-bottom-left-radius:4px}'
    + '.swai-think i{width:6px;height:6px;border-radius:50%;background:var(--g05);animation:swaib 1s infinite}'
    + '.swai-think i:nth-child(2){animation-delay:.16s}.swai-think i:nth-child(3){animation-delay:.32s}'
    + '@keyframes swaib{0%,60%,100%{opacity:.35;transform:none}30%{opacity:1;transform:translateY(-3px)}}'
    + '.swai-tbl{align-self:flex-start;width:86%;border:1px solid var(--g02);border-radius:10px;overflow:hidden;font-size:11.5px;'
    + 'opacity:0;transform:translateY(8px);transition:opacity .35s,transform .35s}'
    + '.swai-tbl.in{opacity:1;transform:none}'
    + '.swai-tbl .r{display:flex;padding:8px 12px;border-top:1px solid var(--g02);background:var(--surface)}'
    + '.swai-tbl .r:first-child{border-top:0;background:var(--g01);font-weight:600}'
    + '.swai-tbl .r span{flex:1}.swai-tbl .r span:last-child{text-align:right;color:var(--g08)}'
    + '.swai-link{align-self:flex-start;display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:var(--brand);'
    + 'border:1px solid var(--brand);border-radius:8px;padding:8px 14px;text-decoration:none;opacity:0;transform:translateY(8px);transition:all .35s}'
    + '.swai-link.in{opacity:1;transform:none}'
    + '.swai-link:hover{background:var(--tint-blue)}'
    + '.swai-link svg{width:12px;height:12px}'
    + '.swai-foot{border-top:1px solid var(--g02);padding:12px 14px;display:flex;gap:8px}'
    + '.swai-in{flex:1;border:1px solid var(--g03);border-radius:10px;padding:10px 12px;font:400 13px Pretendard,sans-serif;color:var(--ink);background:var(--surface)}'
    + '.swai-in:focus{outline:none;border-color:var(--brand)}'
    + '.swai-send{border:0;border-radius:10px;background:var(--brand);color:#fff;font:600 13px Pretendard,sans-serif;padding:0 16px;cursor:pointer}'
    + '.swai-note{font-size:10px;color:var(--g05);padding:0 18px 10px;text-align:center}';
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  /* ── DOM ── */
  var fab = document.createElement('button');
  fab.className = 'swai-fab';
  fab.type = 'button';
  fab.innerHTML = 'AI<span class="dot"></span>';
  fab.title = 'AI 어시스턴트 (A)';

  var panel = document.createElement('div');
  panel.className = 'swai-panel';
  panel.innerHTML = ''
    + '<div class="swai-head"><b>AI 어시스턴트</b><span class="bdg">BETA</span>'
    + '<button class="swai-x" type="button" aria-label="닫기">✕</button></div>'
    + '<div class="swai-body"></div>'
    + '<div class="swai-foot"><input class="swai-in" placeholder="무엇이든 물어보세요"><button class="swai-send" type="button">전송</button></div>'
    + '<p class="swai-note">데모 화면 — 답변은 준비된 시나리오로 연출됩니다</p>';

  function mount() {
    document.body.appendChild(fab);
    document.body.appendChild(panel);
    var body = panel.querySelector('.swai-body');
    var hello = document.createElement('div');
    hello.className = 'swai-hello';
    hello.textContent = '안녕하세요, 데이터를 근거로 답하는 AI 어시스턴트입니다. 아래 질문을 눌러 보세요.';
    body.appendChild(hello);
    var chips = document.createElement('div');
    chips.className = 'swai-chips';
    qa.forEach(function (s, i) {
      var c = document.createElement('button');
      c.className = 'swai-chip';
      c.type = 'button';
      c.textContent = s.q;
      c.addEventListener('click', function () { play(i); });
      chips.appendChild(c);
    });
    body.appendChild(chips);
  }

  var busy = false;
  function scrollEnd() {
    var body = panel.querySelector('.swai-body');
    body.scrollTop = body.scrollHeight;
  }
  function addIn(el) {
    panel.querySelector('.swai-body').appendChild(el);
    void el.getBoundingClientRect();
    el.classList.add('in');
    scrollEnd();
  }

  function play(i, userText) {
    if (busy) return;
    busy = true;
    var s = qa[i];
    var u = document.createElement('div');
    u.className = 'swai-msg u';
    u.textContent = userText || s.q;
    addIn(u);

    var think = document.createElement('div');
    think.className = 'swai-think';
    think.innerHTML = '<i></i><i></i><i></i>';
    setTimeout(function () { panel.querySelector('.swai-body').appendChild(think); scrollEnd(); }, 350);

    setTimeout(function () {
      think.remove();
      var a = document.createElement('div');
      a.className = 'swai-msg a';
      addIn(a);
      var txt = s.a;
      if (REDUCE) { a.textContent = txt; after(); return; }
      /* 경과 시간 기반 — 백그라운드 탭 타이머 스로틀에도 총 시간 고정(최대 2초) */
      var t0 = Date.now(), DUR = Math.min(2000, txt.length * 14);
      var iv = setInterval(function () {
        var p = Math.min(1, (Date.now() - t0) / DUR);
        a.textContent = txt.slice(0, Math.ceil(txt.length * p));
        scrollEnd();
        if (p >= 1) { clearInterval(iv); after(); }
      }, 30);
      function after() {
        var wait = 250;
        if (s.rows) {
          setTimeout(function () {
            var t = document.createElement('div');
            t.className = 'swai-tbl';
            t.innerHTML = s.rows.map(function (r) {
              return '<div class="r">' + r.map(function (c) { return '<span>' + c + '</span>'; }).join('') + '</div>';
            }).join('');
            addIn(t);
          }, wait);
          wait += 300;
        }
        if (s.link) {
          setTimeout(function () {
            var l = document.createElement('a');
            l.className = 'swai-link';
            l.href = s.link.href;
            l.innerHTML = s.link.label
              + '<svg viewBox="0 0 12 12" fill="none"><path d="M2 6h8M6.5 2.5 10 6l-3.5 3.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
            addIn(l);
          }, wait);
        }
        setTimeout(function () { busy = false; }, wait + 200);
      }
    }, REDUCE ? 400 : 1250);
  }

  function open() {
    if (!panel.parentNode) mount();
    panel.classList.add('on');
  }
  function close() { panel.classList.remove('on'); }
  function toggle() { panel.classList.contains('on') ? close() : open(); }

  fab.addEventListener('click', toggle);

  document.addEventListener('DOMContentLoaded', function () {
    document.body.appendChild(fab);
  });
  if (document.readyState !== 'loading') document.body.appendChild(fab);

  /* 패널 내부 이벤트(마운트 후 위임) */
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('.swai-x')) close();
    if (e.target.closest && e.target.closest('.swai-send')) sendFree();
  });
  document.addEventListener('keydown', function (e) {
    if (/input|textarea|select/i.test(e.target.tagName)) {
      if (e.key === 'Enter' && e.target.classList.contains('swai-in')) sendFree();
      return;
    }
    if (e.key === 'a' || e.key === 'A') {
      open();
      if (!panel.dataset.auto) { panel.dataset.auto = '1'; setTimeout(function () { play(0); }, 700); }
    }
    if (e.key === 'Escape') close();
  });

  function sendFree() {
    var inp = panel.querySelector('.swai-in');
    var v = (inp.value || '').trim();
    if (!v || busy) return;
    inp.value = '';
    /* 데모: 입력 질문과 가장 비슷한 시나리오를 골라 재생, 없으면 첫 번째 */
    var best = 0, score = -1;
    qa.forEach(function (s, i) {
      var sc = 0;
      v.split(/\s+/).forEach(function (w) { if (w.length > 1 && s.q.indexOf(w) > -1) sc++; });
      if (sc > score) { score = sc; best = i; }
    });
    play(best, v);
  }
})();
