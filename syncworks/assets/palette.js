/* ⌘K 커맨드 팔레트 — 화면 이름·카테고리로 110개 화면을 검색해 바로 이동.
   질문형 입력은 AI 어시스턴트로 넘김(window.swai.ask — ai.js 연동).
   PAGES는 빌드 스크립트가 각 페이지 <title>·활성 메뉴에서 추출해 채움(수동 수정 X).
   실서비스에서도 화면 이동은 이 구조 그대로, AI 문답만 API로 교체. */
(function () {
  var PAGE = (location.pathname.split('/').pop() || 'index.html');
  if (PAGE === 'login.html' || PAGE === 'index.html' || PAGE === '_cap.html') return;

  var PAGES = [{"n": "알람 이력", "c": "모니터링", "h": "alarms.html"}, {"n": "결재선 등록", "c": "결재선 관리", "h": "aplines_new.html"}, {"n": "결재선 관리", "c": "결재선 관리", "h": "approval_lines.html"}, {"n": "보관함", "c": "보관함", "h": "archive.html"}, {"n": "받은 결재", "c": "BPM", "h": "bpm.html"}, {"n": "새 보고서", "c": "보고서 만들기", "h": "builder_new.html"}, {"n": "성적서 발행", "c": "성적서 발행", "h": "certificates.html"}, {"n": "성적서 발행", "c": "성적서 발행", "h": "certificates_new.html"}, {"n": "업데이트 로그", "c": "업데이트 로그", "h": "changelog.html"}, {"n": "거래처별 주문", "c": "거래처별 주문", "h": "client_orders.html"}, {"n": "거래처 관리", "c": "거래처 관리", "h": "clients.html"}, {"n": "거래처 등록", "c": "거래처 관리", "h": "clients_new.html"}, {"n": "마감 설정", "c": "마감 설정", "h": "closing.html"}, {"n": "생산량 확정", "c": "생산량 확정", "h": "confirm.html"}, {"n": "확정 이력", "c": "확정 이력", "h": "confirm_history.html"}, {"n": "법인 통합 현황", "c": "기초정보", "h": "corp.html"}, {"n": "매출 대시보드", "c": "기초정보", "h": "dashboard.html"}, {"n": "부적합 관리", "c": "부적합 관리", "h": "defects.html"}, {"n": "부적합 등록", "c": "부적합 관리", "h": "defects_new.html"}, {"n": "배송 조회", "c": "배송 조회", "h": "delivery.html"}, {"n": "배차 관리", "c": "배차 관리", "h": "dispatch.html"}, {"n": "배차 등록", "c": "배차 관리", "h": "dispatch_new.html"}, {"n": "AI 어시스턴트 — 개선 제안", "c": "", "h": "evolve.html"}, {"n": "소비기한 관리", "c": "소비기한 관리", "h": "expiry.html"}, {"n": "완제품 불량", "c": "완제품 불량", "h": "finished_defects.html"}, {"n": "양식 관리", "c": "양식 관리", "h": "forms.html"}, {"n": "양식 등록", "c": "양식 관리", "h": "forms_new.html"}, {"n": "입고 관리", "c": "입고 관리", "h": "goods_in.html"}, {"n": "입고 등록", "c": "입고 관리", "h": "goods_in_new.html"}, {"n": "출고 관리", "c": "출고 관리", "h": "goods_out.html"}, {"n": "출고 등록", "c": "출고 관리", "h": "goods_out_new.html"}, {"n": "홀딩스 출고", "c": "홀딩스 출고 · 마감", "h": "holdings.html"}, {"n": "홀딩스 이관 등록", "c": "홀딩스 출고 · 마감", "h": "holdings_new.html"}, {"n": "개선 제안함", "c": "개선 제안함", "h": "inbox.html"}, {"n": "검사 항목 설정", "c": "검사 항목 설정", "h": "inspection_items.html"}, {"n": "검수 관리", "c": "검수 관리", "h": "inspections.html"}, {"n": "검수 등록", "c": "검수 관리", "h": "inspections_new.html"}, {"n": "재고 현황", "c": "재고", "h": "inventory.html"}, {"n": "검사 항목 등록", "c": "검사 항목 설정", "h": "items_new.html"}, {"n": "시험 성적 관리", "c": "연구소", "h": "lab.html"}, {"n": "수불 이력", "c": "수불 이력", "h": "ledger.html"}, {"n": "라인 관리", "c": "라인 관리", "h": "lines.html"}, {"n": "라인 등록", "c": "라인 관리", "h": "lines_new.html"}, {"n": "로트별 재고", "c": "재고", "h": "lots.html"}, {"n": "원/부자재 이동", "c": "원/부자재 이동", "h": "material_moves.html"}, {"n": "설비 관제", "c": "모니터링", "h": "monitoring.html"}, {"n": "운영 지표 분석", "c": "모니터링", "h": "monitoring_analytics.html"}, {"n": "실시간 관제", "c": "모니터링", "h": "monitoring_live.html"}, {"n": "원/부자재 이동 등록", "c": "원/부자재 이동", "h": "moves_new.html"}, {"n": "알림 센터", "c": "알림 센터", "h": "notifications.html"}, {"n": "주문 등록", "c": "주문", "h": "order_new.html"}, {"n": "주문 목록", "c": "주문", "h": "orders.html"}, {"n": "생산계획 등록", "c": "생산", "h": "plan_new.html"}, {"n": "손익계산서", "c": "기초정보", "h": "pnl.html"}, {"n": "단가 이력", "c": "단가 이력", "h": "price_history.html"}, {"n": "출력 이력", "c": "출력 이력", "h": "print_history.html"}, {"n": "서식 출력", "c": "출력물", "h": "prints.html"}, {"n": "공정 관리", "c": "생산", "h": "process.html"}, {"n": "생산 현황", "c": "생산", "h": "production.html"}, {"n": "생산 실적 분석", "c": "보고서", "h": "production_report.html"}, {"n": "제품정보 관리", "c": "제품정보 관리", "h": "products.html"}, {"n": "품목 등록", "c": "제품정보 관리", "h": "products_new.html"}, {"n": "발주 현황", "c": "발주", "h": "purchase.html"}, {"n": "발주 등록", "c": "발주", "h": "purchase_new.html"}, {"n": "품질검사 그룹", "c": "품질검사 그룹", "h": "qc_groups.html"}, {"n": "검사 그룹 등록", "c": "품질검사 그룹", "h": "qc_groups_new.html"}, {"n": "품질 현황", "c": "품질", "h": "quality.html"}, {"n": "검사 등록", "c": "품질", "h": "quality_new.html"}, {"n": "배합(레시피) 연구", "c": "연구소", "h": "recipes.html"}, {"n": "처방전 등록", "c": "연구소", "h": "recipes_new.html"}, {"n": "참조 문서", "c": "참조 문서", "h": "references.html"}, {"n": "반려 관리", "c": "반려 관리", "h": "rejects.html"}, {"n": "세트/소분 재구성", "c": "세트/소분 재구성", "h": "repack.html"}, {"n": "재구성 작업 등록", "c": "세트/소분 재구성", "h": "repack_new.html"}, {"n": "보고서 만들기", "c": "보고서 만들기", "h": "report_builder.html"}, {"n": "정기 보고서", "c": "보고서", "h": "reports.html"}, {"n": "시험 의뢰 등록", "c": "시험 의뢰", "h": "requests_new.html"}, {"n": "반품 관리", "c": "주문", "h": "returns.html"}, {"n": "반품 접수", "c": "주문", "h": "returns_new.html"}, {"n": "안전/적정재고 설정", "c": "재고", "h": "safety_stock.html"}, {"n": "매출 분석", "c": "보고서", "h": "sales_report.html"}, {"n": "샘플 관리", "c": "샘플 관리", "h": "samples.html"}, {"n": "샘플 등록", "c": "샘플 관리", "h": "samples_new.html"}, {"n": "정산 내역", "c": "정산 내역", "h": "settlement.html"}, {"n": "정산 실행", "c": "정산 내역", "h": "settlement_run.html"}, {"n": "출하 현황", "c": "출하 현황", "h": "shipping_mon.html"}, {"n": "재고 현황 모니터링", "c": "재고 현황", "h": "stock_mon.html"}, {"n": "재고 분석", "c": "보고서", "h": "stock_report.html"}, {"n": "재고 실사", "c": "재고 실사", "h": "stocktake.html"}, {"n": "구독 설정", "c": "구독 설정", "h": "subscriptions.html"}, {"n": "구독 추가", "c": "구독 설정", "h": "subscriptions_new.html"}, {"n": "공급처 관리", "c": "공급처 관리", "h": "suppliers.html"}, {"n": "공급처 등록", "c": "공급처 관리", "h": "suppliers_new.html"}, {"n": "매출목표 및 계획", "c": "매출목표 및 계획", "h": "targets.html"}, {"n": "목표 편성", "c": "매출목표 및 계획", "h": "targets_new.html"}, {"n": "온습도 현황", "c": "모니터링", "h": "temperature.html"}, {"n": "서식 관리", "c": "서식 관리", "h": "templates.html"}, {"n": "서식 등록", "c": "서식 관리", "h": "templates_new.html"}, {"n": "시험 의뢰", "c": "시험 의뢰", "h": "test_requests.html"}, {"n": "사용자", "c": "사용자 · 권한", "h": "users.html"}, {"n": "계정 등록", "c": "사용자 · 권한", "h": "users_new.html"}, {"n": "입출고 현황", "c": "입출고", "h": "warehouse.html"}, {"n": "창고 관리", "c": "창고 관리", "h": "warehouses.html"}, {"n": "창고 등록", "c": "창고 관리", "h": "warehouses_new.html"}, {"n": "창고별 재고", "c": "창고별 재고", "h": "wh_stock.html"}, {"n": "작업 지시", "c": "작업 지시", "h": "workorders.html"}, {"n": "작업 지시 등록", "c": "작업 지시", "h": "workorders_new.html"}];

  var css = ''
    + '.swpl-ov{position:fixed;inset:0;z-index:990;background:rgba(15,23,42,.38);display:flex;justify-content:center;'
    + 'align-items:flex-start;padding-top:16vh;opacity:0;transition:opacity .18s}'
    + '.swpl-ov.on{opacity:1}'
    + '.swpl-box{width:min(560px,92vw);background:var(--surface);border-radius:14px;overflow:hidden;'
    + 'box-shadow:0 24px 64px rgba(0,0,0,.3);transform:translateY(-8px) scale(.98);transition:transform .18s cubic-bezier(.22,.61,.36,1)}'
    + '.swpl-ov.on .swpl-box{transform:none}'
    + '.swpl-in{display:flex;align-items:center;gap:10px;padding:14px 18px;border-bottom:1px solid var(--g02)}'
    + '.swpl-in svg{width:16px;height:16px;color:var(--g05);flex:none}'
    + '.swpl-in input{flex:1;border:0;outline:none;font:400 15px Pretendard,sans-serif;color:var(--ink);background:none}'
    + '.swpl-in input::placeholder{color:var(--g05)}'
    + '.swpl-ls{max-height:46vh;overflow-y:auto;padding:6px}'
    + '.swpl-it{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:9px;cursor:pointer;font-size:13px;color:var(--ink)}'
    + '.swpl-it .cat{margin-left:auto;font-size:11px;color:var(--g05)}'
    + '.swpl-it.sel,.swpl-it:hover{background:var(--g01)}'
    + '.swpl-it.sel .cat{color:var(--g08)}'
    + '.swpl-it .ic{width:26px;height:26px;border-radius:7px;background:var(--g01);display:flex;align-items:center;justify-content:center;flex:none}'
    + '.swpl-it.sel .ic,.swpl-it:hover .ic{background:var(--surface)}'
    + '.swpl-it .ic svg{width:13px;height:13px;color:var(--g08)}'
    + '.swpl-it.ai .ic{background:var(--tint-blue)}'
    + '.swpl-it.ai .ic svg{color:var(--brand)}'
    + '.swpl-it.ai b{color:var(--brand);font-weight:600}'
    + '.swpl-emp{padding:22px 12px;text-align:center;font-size:12px;color:var(--g05)}'
    + '.swpl-ft{display:flex;gap:14px;padding:10px 18px;border-top:1px solid var(--g02);font-size:11px;color:var(--g05)}'
    + '.swpl-ft b{font-weight:600;color:var(--g08);background:var(--g01);border-radius:4px;padding:1px 5px;margin-right:3px}';
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  var ICON_PAGE = '<svg viewBox="0 0 14 14" fill="none"><rect x="1.5" y="1.5" width="11" height="11" rx="2" stroke="currentColor" stroke-width="1.3"/><path d="M4.5 5h5M4.5 7.5h5M4.5 10h3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>';
  var ICON_AI = '<svg viewBox="0 0 14 14" fill="none"><path d="M7 1.5 8.4 5 12 6.4 8.4 7.8 7 11.3 5.6 7.8 2 6.4 5.6 5 7 1.5Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>';
  var ICON_SRCH = '<svg viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="currentColor" stroke-width="1.4"/><path d="m10.5 10.5 3 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';

  var ov = null, sel = 0, items = [];

  function score(p, q) {
    var s = 0;
    var hay = (p.n + ' ' + p.c + ' ' + p.h).toLowerCase();
    q.toLowerCase().split(/\s+/).forEach(function (w) {
      if (!w) return;
      if (p.n.toLowerCase().indexOf(w) === 0) s += 4;
      else if (p.n.toLowerCase().indexOf(w) > -1) s += 3;
      else if (hay.indexOf(w) > -1) s += 1;
      else s -= 99;
    });
    return s;
  }

  function render(q) {
    var ls = ov.querySelector('.swpl-ls');
    var res = [];
    if (q) {
      res = PAGES.map(function (p) { return { p: p, s: score(p, q) }; })
        .filter(function (r) { return r.s > 0; })
        .sort(function (a, b) { return b.s - a.s; })
        .slice(0, 8);
    } else {
      res = PAGES.filter(function (p) {
        return ['dashboard.html', 'sales_report.html', 'monitoring_live.html', 'lots.html', 'dispatch.html', 'temperature.html', 'evolve.html'].indexOf(p.h) > -1;
      }).map(function (p) { return { p: p, s: 1 }; });
    }
    var html = res.map(function (r) {
      return '<div class="swpl-it" data-h="' + r.p.h + '"><span class="ic">' + ICON_PAGE + '</span>'
        + r.p.n + '<span class="cat">' + r.p.c + '</span></div>';
    }).join('');
    if (q) {
      html += '<div class="swpl-it ai" data-ai="1"><span class="ic">' + ICON_AI + '</span>'
        + '<span>AI에게 물어보기 — <b>' + q.replace(/</g, '&lt;') + '</b></span></div>';
    }
    if (!html) html = '<div class="swpl-emp">결과가 없습니다</div>';
    ls.innerHTML = html;
    items = [].slice.call(ls.querySelectorAll('.swpl-it'));
    sel = 0;
    mark();
    items.forEach(function (it, i) {
      it.addEventListener('mouseenter', function () { sel = i; mark(); });
      it.addEventListener('click', go);
    });
  }

  function mark() {
    items.forEach(function (it, i) { it.classList.toggle('sel', i === sel); });
    if (items[sel]) items[sel].scrollIntoView({ block: 'nearest' });
  }

  function go() {
    var it = items[sel];
    if (!it) return;
    if (it.dataset.ai) {
      var q = ov.querySelector('input').value.trim();
      close();
      if (window.swai && window.swai.ask) window.swai.ask(q);
      return;
    }
    location.href = it.dataset.h;
  }

  function open() {
    if (ov) return;
    ov = document.createElement('div');
    ov.className = 'swpl-ov';
    ov.innerHTML = '<div class="swpl-box">'
      + '<div class="swpl-in">' + ICON_SRCH + '<input placeholder="화면 이름이나 질문을 입력하세요" /></div>'
      + '<div class="swpl-ls"></div>'
      + '<div class="swpl-ft"><span><b>↑↓</b>이동</span><span><b>Enter</b>열기</span><span><b>Esc</b>닫기</span>'
      + '<span style="margin-left:auto">질문하면 AI가 답해요</span></div></div>';
    document.body.appendChild(ov);
    void ov.getBoundingClientRect();
    ov.classList.add('on');
    var inp = ov.querySelector('input');
    render('');
    inp.focus();
    inp.addEventListener('input', function () { render(inp.value.trim()); });
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(sel + 1, items.length - 1); mark(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(sel - 1, 0); mark(); }
      else if (e.key === 'Enter' && !e.isComposing) { entered = true; go(); }
      else if (e.key === 'Escape') close();
    });
    /* 한글 IME가 keydown(229)을 삼킨 경우 keyup으로 보완 */
    var entered = false;
    inp.addEventListener('keyup', function (e) {
      if (e.key === 'Enter' && !e.isComposing && !entered) go();
      if (e.key === 'Enter') entered = false;
    });
    ov.addEventListener('mousedown', function (e) { if (e.target === ov) close(); });
  }

  function close() {
    if (!ov) return;
    var o = ov; ov = null;
    o.classList.remove('on');
    setTimeout(function () { o.remove(); }, 180);
  }

  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      ov ? close() : open();
    }
  });
})();
