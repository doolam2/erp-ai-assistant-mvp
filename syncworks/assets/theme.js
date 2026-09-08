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

    /* 목업 캡처 모드 — ?mock=1 로 켜고 ?mock=0 으로 해제 (localStorage 유지).
       켜면 온보딩 비컨·데모 토스트 숨김, AI 버튼 우상단 이동 (style.css [data-mock]) */
    var m = new URLSearchParams(location.search).get('mock');
    if (m !== null) {
      if (m === '1') localStorage.setItem('sw_mock', '1');
      else localStorage.removeItem('sw_mock');
    }
    if (localStorage.getItem('sw_mock')) document.documentElement.setAttribute('data-mock', '1');
  } catch (e) {}
})();
