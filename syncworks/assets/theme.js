/* 브랜드 테마 스위처 — URL ?theme=malgeunmule 로 지정, localStorage로 페이지 이동 간 유지.
   ?theme= (빈 값) 또는 ?theme=blue 로 기본(블루) 복귀. head에서 로드해 FOUC 방지. */
(function () {
  try {
    var q = new URLSearchParams(location.search).get('theme');
    if (q !== null) {
      if (q && q !== 'blue') localStorage.setItem('sw_theme', q);
      else localStorage.removeItem('sw_theme');
    }
    var t = localStorage.getItem('sw_theme');
    if (t) document.documentElement.setAttribute('data-theme', t);
  } catch (e) {}
})();
