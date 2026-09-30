/* 데이트피커 공통 — 헤더 [오늘] 버튼 (피그마 Date picker 정본).
   ‹ 오늘 › : 화살표 사이 버튼, 누르면 오늘이 있는 달로 점프. */
(function () {
  function addToday(fp) {
    var months = fp.calendarContainer && fp.calendarContainer.querySelector('.flatpickr-months');
    if (!months || months.querySelector('.fp-today-btn')) return;
    var next = months.querySelector('.flatpickr-next-month');
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'fp-today-btn';
    b.textContent = '오늘';
    b.addEventListener('click', function () {
      fp.jumpToDate(new Date());
      fp.redraw();
      /* jumpToDate는 onMonthChange를 안 쏨 — 커스텀 헤더(ui.js koHeader) 수동 갱신 */
      (fp.config.onMonthChange || []).forEach(function (fn) { fn(fp.selectedDates, fp.input.value, fp); });
    });
    months.insertBefore(b, next);
  }
  function initAll() {
    document.querySelectorAll('input').forEach(function (i) { if (i._flatpickr) addToday(i._flatpickr); });
  }
  if (document.readyState !== 'loading') setTimeout(initAll, 0);
  else document.addEventListener('DOMContentLoaded', function () { setTimeout(initAll, 0); });
})();
