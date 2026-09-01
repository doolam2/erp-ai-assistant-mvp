/* 촬영용 진입 모션 — 그래프·패널·타임라인 스태거 애니메이션.
   포함된 페이지에서만 동작. R 키 = 모션 재생(리로드). prefers-reduced-motion 존중. */
(function () {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var EASE = 'cubic-bezier(.22,.61,.36,1)';

  function onReady(fn) {
    if (document.readyState === 'complete') setTimeout(fn, 60);
    else window.addEventListener('load', function () { setTimeout(fn, 60); });
  }

  onReady(function () {
    var t0 = 0;

    /* 0. 패널·카드 라이즈 인 */
    var blocks = document.querySelectorAll('.panel, .kpi, .zcard, .lg-card');
    blocks.forEach(function (el, i) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(14px)';
      el.style.transition = 'none';
      requestAnimationFrame(function () {
        el.style.transition = 'opacity .5s ' + EASE + ' ' + (i * 60) + 'ms, transform .5s ' + EASE + ' ' + (i * 60) + 'ms';
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
    });

    /* 1. 세로 막대 — 아래에서 자라남 */
    var vbars = document.querySelectorAll('i[style*="3px 3px 0 0"], .combo .bars > i');
    var seen = new Set();
    vbars.forEach(function (el, i) {
      if (seen.has(el)) return; seen.add(el);
      el.style.transformOrigin = '50% 100%';
      el.style.transform = 'scaleY(0)';
      el.style.transition = 'none';
      requestAnimationFrame(function () {
        el.style.transition = 'transform .7s ' + EASE + ' ' + (250 + i * 45) + 'ms';
        el.style.transform = 'scaleY(1)';
      });
    });

    /* 2. 가로 바·게이지 — 폭 채워짐 */
    document.querySelectorAll('.hbar i, .gauge i, .stack .bar i').forEach(function (el, i) {
      var w = el.style.width || getComputedStyle(el).width;
      el.style.transition = 'none';
      el.style.width = '0%';
      requestAnimationFrame(function () {
        el.style.transition = 'width .8s ' + EASE + ' ' + (300 + i * 70) + 'ms';
        el.style.width = w;
      });
    });

    /* 3. 라인 차트 — 선이 그려짐 (점선·마커는 페이드) */
    document.querySelectorAll('svg polyline, svg line').forEach(function (el, i) {
      var dashed = el.getAttribute('stroke-dasharray') || (el.getAttribute('style') || '').indexOf('dash') > -1;
      if (el.style.strokeDasharray) dashed = true;
      if (dashed) {
        el.style.opacity = '0';
        el.style.transition = 'opacity .6s ease ' + (700 + i * 80) + 'ms';
        requestAnimationFrame(function () { el.style.opacity = '1'; });
      } else {
        /* non-scaling-stroke에서는 dash 트릭이 화면 단위로 계산돼 선이 끊겨 보임
           → clip-path 와이프로 좌→우 그려지는 효과를 냄 */
        el.style.clipPath = 'inset(-10% 100% -10% 0)';
        el.style.transition = 'none';
        requestAnimationFrame(function () {
          el.style.transition = 'clip-path 1s ' + EASE + ' ' + (450 + i * 90) + 'ms';
          el.style.clipPath = 'inset(-10% 0% -10% 0)';
        });
      }
    });

    /* 4. 도넛·아크 — 조각 순차 등장, 마커 원 페이드 */
    document.querySelectorAll('svg circle').forEach(function (el, i) {
      el.style.opacity = '0';
      el.style.transition = 'opacity .5s ease ' + (500 + i * 140) + 'ms';
      requestAnimationFrame(function () { el.style.opacity = '1'; });
    });

    /* 5. KPI 숫자 카운트업 */
    document.querySelectorAll('.kpi .num, .zcard .zt').forEach(function (el) {
      var node = el.childNodes[0];
      if (!node || node.nodeType !== 3) return;
      var raw = node.textContent.trim();
      var m = raw.match(/^([+-]?)([\d,]+)(\.\d+)?(.*)$/);
      if (!m) return;
      var sign = m[1], intPart = parseInt(m[2].replace(/,/g, ''), 10),
          dec = m[3] ? m[3] : '', suffix = m[4] || '';
      if (isNaN(intPart)) return;
      var hasComma = m[2].indexOf(',') > -1;
      var start = null, DUR = 900;
      function fmt(v) {
        var s = Math.round(v).toString();
        if (hasComma) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return sign + s + dec + suffix;
      }
      node.textContent = fmt(0);
      function step(ts) {
        if (!start) start = ts;
        var p = Math.min(1, (ts - start) / DUR);
        p = 1 - Math.pow(1 - p, 3);
        node.textContent = fmt(intPart * p);
        if (p < 1) requestAnimationFrame(step);
        else node.textContent = raw;
      }
      setTimeout(function () { requestAnimationFrame(step); }, 350);
    });

    /* 6. 타임라인 — 시간순 스르륵 (알람·로트 추적·실사 단계) */
    document.querySelectorAll('.atl .aev, .tl .ev, .vline .v').forEach(function (el, i) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(16px)';
      el.style.transition = 'none';
      requestAnimationFrame(function () {
        el.style.transition = 'opacity .55s ' + EASE + ' ' + (400 + i * 220) + 'ms, transform .55s ' + EASE + ' ' + (400 + i * 220) + 'ms';
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
    });

    /* 7. 표 행 스태거 */
    document.querySelectorAll('table.grid tr').forEach(function (el, i) {
      el.style.opacity = '0';
      el.style.transition = 'none';
      requestAnimationFrame(function () {
        el.style.transition = 'opacity .4s ease ' + (350 + i * 40) + 'ms';
        el.style.opacity = '1';
      });
    });

    /* 8. 히트맵 셀 팝 */
    document.querySelectorAll('.hm .cell, .hmc').forEach(function (el, i) {
      el.style.opacity = '0';
      el.style.transform = 'scale(.6)';
      el.style.transition = 'none';
      requestAnimationFrame(function () {
        el.style.transition = 'opacity .35s ease ' + (300 + i * 22) + 'ms, transform .35s ' + EASE + ' ' + (300 + i * 22) + 'ms';
        el.style.opacity = '1';
        el.style.transform = 'scale(1)';
      });
    });

    /* 9. 제안·레시피 카드 스태거 */
    document.querySelectorAll('.rcard, .sug-card, .spark .cell').forEach(function (el, i) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(10px)';
      el.style.transition = 'none';
      requestAnimationFrame(function () {
        el.style.transition = 'opacity .45s ' + EASE + ' ' + (350 + i * 90) + 'ms, transform .45s ' + EASE + ' ' + (350 + i * 90) + 'ms';
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
    });
  });

  /* R 키 = 모션 다시 재생 (촬영용) */
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'r' || e.key === 'R') && !/input|textarea|select/i.test(e.target.tagName)) {
      location.reload();
    }
  });
})();
