/* 라이브 관제 시뮬레이션 — 실시간 화면(실시간 관제·온습도)에서 숫자·차트가 실제로 흐르는 연출.
   스트림 차트는 좌로 스크롤(마지막 점 추가), KPI는 랜덤워크로 갱신, 헤더 시계 1초 틱.
   촬영·시연용 정적 연출 — 실서비스에서는 이 갱신부가 웹소켓 수신으로 바뀜. */
(function () {
  var PAGE = (location.pathname.split('/').pop() || '');
  if (PAGE !== 'monitoring_live.html' && PAGE !== 'temperature.html') return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var seed = 7;
  function rand() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
  function walk(last, amp, min, max) {
    return Math.max(min, Math.min(max, last + (rand() - 0.5) * amp));
  }
  /* polyline points="x0,y0 x1,y1 …" — y를 한 칸씩 좌로 밀고 새 값 추가 */
  function shiftPoly(el, newY) {
    var pts = el.getAttribute('points').trim().split(/\s+/).map(function (p) {
      return p.split(',').map(Number);
    });
    for (var i = 0; i < pts.length - 1; i++) pts[i][1] = pts[i + 1][1];
    pts[pts.length - 1][1] = newY;
    el.setAttribute('points', pts.map(function (p) { return p[0] + ',' + p[1]; }).join(' '));
    return pts;
  }

  /* ── 실시간 관제 ── */
  if (PAGE === 'monitoring_live.html') {
    var clockEl = null, h = 21, m = 4, s = 35;
    document.querySelectorAll('.page-head .sub').forEach(function (el) {
      if (el.textContent.indexOf(':') > -1) clockEl = el;
    });
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    setInterval(function () {
      s++; if (s > 59) { s = 0; m++; } if (m > 59) { m = 0; h = (h + 1) % 24; }
      if (clockEl) clockEl.innerHTML = clockEl.innerHTML.replace(/\d{2}:\d{2}:\d{2}/, pad(h) + ':' + pad(m) + ':' + pad(s));
    }, 1000);

    var speedEl = null, cumEl = null;
    document.querySelectorAll('.kpi').forEach(function (k) {
      var lb = k.querySelector('.lb'); if (!lb) return;
      if (lb.textContent.indexOf('생산 속도') > -1) speedEl = k.querySelector('.num');
      if (lb.textContent.indexOf('누적 생산') > -1) cumEl = k.querySelector('.num');
    });
    var speed = 142, cum = 91240;
    var line = document.querySelector('.panel svg polyline[stroke-width="2.5"], .panel svg polyline');
    var area = document.querySelector('.panel svg polygon');
    var marker = document.querySelector('.panel svg circle');
    var mLabel = document.querySelector('.panel span[style*="left:36%"]');
    var caption = null;
    document.querySelectorAll('.panel p').forEach(function (p) {
      if (p.textContent.indexOf('개/분') > -1) caption = p;
    });

    setTimeout(function () {
      setInterval(function () {
        speed = Math.round(walk(speed, 7, 132, 152));
        cum += Math.round(50 + rand() * 30);
        if (speedEl) speedEl.childNodes[0].textContent = speed;
        if (cumEl) cumEl.childNodes[0].textContent = cum.toLocaleString('ko-KR');
        if (caption) caption.textContent = '현재 ' + speed + '개/분 — 계획 페이스(140) ' + (speed >= 140 ? '상회' : '하회') + ' 중';
        /* 스트림 좌로 스크롤: 속도 → y (140개/분 ≈ y60, 1개/분 ≈ 2.2px) */
        var y = Math.max(8, Math.min(180, 60 - (speed - 140) * 2.2 + (rand() - 0.5) * 8));
        if (line) {
          var pts = shiftPoly(line, y);
          if (area) area.setAttribute('points', pts.map(function (p) { return p[0] + ',' + p[1]; }).join(' ') + ' 680,270 0,270');
        }
        /* 이벤트 마커는 시간에 붙어 좌로 이동, 화면 밖이면 숨김 */
        if (marker) {
          var cx = parseFloat(marker.getAttribute('cx')) - 31;
          if (cx < 0) { marker.style.display = 'none'; if (mLabel) mLabel.style.display = 'none'; }
          else {
            marker.setAttribute('cx', cx);
            if (mLabel) mLabel.style.left = (cx / 680 * 100 - 7) + '%';
          }
        }
      }, 2500);
    }, 3500); /* 진입 카운트업(3초 복원)과 충돌 방지 */
  }

  /* ── 온습도 현황 ── */
  if (PAGE === 'temperature.html') {
    var zones = [];
    document.querySelectorAll('.zcard').forEach(function (c) {
      var zt = c.querySelector('.zt');
      var poly = c.querySelector('svg polyline');
      if (!zt || !poly) return;
      var v = parseFloat(zt.textContent);
      if (isNaN(v)) return;
      zones.push({ zt: zt, poly: poly, v: v, warn: c.classList.contains('warn') });
    });
    var bigLabel = null;
    document.querySelectorAll('.band span').forEach(function (sp) {
      if (/°C/.test(sp.textContent) && sp.style.right === '0px') bigLabel = sp;
    });

    setTimeout(function () {
      setInterval(function () {
        zones.forEach(function (z) {
          /* 냉장B(warn)는 4.7~4.9 사이에서 서서히, 나머지는 ±0.15 지터 */
          z.v = z.warn ? walk(z.v, 0.1, 4.7, 4.9)
                       : walk(z.v, 0.3, z.v - 1.2, z.v + 1.2);
          z.zt.textContent = z.v.toFixed(1) + '°C';
          /* 스파크라인: viewBox 100x30 — 값 변화를 y로 반영해 흘림 */
          var pts = z.poly.getAttribute('points').trim().split(/\s+/);
          var lastY = parseFloat(pts[pts.length - 1].split(',')[1]);
          shiftPoly(z.poly, Math.max(4, Math.min(26, lastY + (rand() - 0.5) * 6)));
        });
        var warn = zones.filter(function (z) { return z.warn; })[0];
        if (warn && bigLabel) bigLabel.textContent = warn.v.toFixed(1) + '°C';
      }, 2500);
    }, 3500);
  }
})();
