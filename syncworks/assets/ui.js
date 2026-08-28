/* Smart SYNCWORKS 퍼블 공통 UI — 커스텀 드롭다운
   select.sel / select.ctl 을 스타일드 메뉴로 자동 변환 (원본 select는 숨겨 값 보존) */
(function () {
  function build(sel) {
    var isBlock = sel.classList.contains('ctl');
    var wrap = document.createElement('div');
    wrap.className = 'dd' + (isBlock ? ' dd-block' : '');
    sel.parentNode.insertBefore(wrap, sel);
    wrap.appendChild(sel);
    sel.classList.add('dd-hidden');

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = sel.className.replace('dd-hidden', '').trim() + ' dd-btn';
    btn.textContent = sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].text : '선택';
    wrap.appendChild(btn);

    var menu = document.createElement('div');
    menu.className = 'dd-menu';
    Array.prototype.forEach.call(sel.options, function (o, i) {
      var it = document.createElement('div');
      it.className = 'dd-item' + (i === sel.selectedIndex ? ' on' : '');
      it.textContent = o.text;
      it.addEventListener('click', function () {
        sel.selectedIndex = i;
        sel.dispatchEvent(new Event('change', { bubbles: true }));
        btn.textContent = o.text;
        menu.querySelectorAll('.dd-item').forEach(function (e) { e.classList.remove('on'); });
        it.classList.add('on');
        wrap.classList.remove('open');
      });
      menu.appendChild(it);
    });
    wrap.appendChild(menu);

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      document.querySelectorAll('.dd.open').forEach(function (d) { if (d !== wrap) d.classList.remove('open'); });
      wrap.classList.toggle('open');
    });
  }
  document.querySelectorAll('select.sel, select.ctl').forEach(build);
  document.addEventListener('click', function () {
    document.querySelectorAll('.dd.open').forEach(function (d) { d.classList.remove('open'); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') document.querySelectorAll('.dd.open').forEach(function (d) { d.classList.remove('open'); });
  });
})();

/* 단일 날짜 입력 — AF-10 테마 flatpickr (vendor 로드된 페이지에서만) */
(function () {
  if (!window.flatpickr) return;
  function koHeader(_d, _s, inst) {
    var el = inst.monthNav && inst.monthNav.querySelector('.flatpickr-current-month');
    if (el) el.textContent = inst.currentYear + '년 ' + (inst.currentMonth + 1) + '월';
  }
  document.querySelectorAll('input.fp-date').forEach(function (inp) {
    flatpickr(inp, { locale: 'ko', dateFormat: 'Y-m-d', minDate: 'today',
      disableMobile: true, defaultDate: inp.value || null,
      onReady: koHeader, onMonthChange: koHeader, onYearChange: koHeader });
  });
})();
