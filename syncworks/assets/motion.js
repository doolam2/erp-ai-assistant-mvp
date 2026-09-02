/* 촬영용 진입 모션 — 그래프·패널·타임라인 스태거 애니메이션.
   포함된 페이지에서만 동작. R 키 = 모션 재생(리로드). prefers-reduced-motion 존중.
   rAF 대신 강제 리플로우로 트리거 — 백그라운드 탭에서도 상태가 멈추지 않음. */
(function () {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var EASE = 'cubic-bezier(.22,.61,.36,1)';

  /* 초기 상태 적용 → 강제 리플로우 → 트랜지션+최종 상태 (동기, rAF 불필요) */
  function anim(el, initial, transition, final_) {
    el.style.transition = 'none';
    for (var k in initial) el.style[k] = initial[k];
    void el.getBoundingClientRect();
    el.style.transition = transition;
    for (var k2 in final_) el.style[k2] = final_[k2];
  }

  function onReady(fn) {
    if (document.readyState !== 'loading') setTimeout(fn, 60);
    else document.addEventListener('DOMContentLoaded', function () { setTimeout(fn, 60); });
  }

  function runMotion() {
    /* 0. 패널·카드 라이즈 인 */
    document.querySelectorAll('.panel, .kpi, .zcard, .lg-card').forEach(function (el, i) {
      anim(el, { opacity: '0', transform: 'translateY(14px)' },
        'opacity .5s ' + EASE + ' ' + (i * 60) + 'ms, transform .5s ' + EASE + ' ' + (i * 60) + 'ms',
        { opacity: '1', transform: 'none' });
    });

    /* 1. 세로 막대 — 아래에서 자라남 */
    var seen = new Set();
    document.querySelectorAll('i[style*="3px 3px 0 0"], .combo .bars > i').forEach(function (el, i) {
      if (seen.has(el)) return; seen.add(el);
      el.style.transformOrigin = '50% 100%';
      anim(el, { transform: 'scaleY(0)' },
        'transform .7s ' + EASE + ' ' + (250 + i * 45) + 'ms',
        { transform: 'scaleY(1)' });
    });

    /* 2. 가로 바·게이지 — 폭 채워짐 */
    document.querySelectorAll('.hbar i, .gauge i, .stack .bar i').forEach(function (el, i) {
      var w = el.style.width || getComputedStyle(el).width;
      anim(el, { width: '0%' },
        'width .8s ' + EASE + ' ' + (300 + i * 70) + 'ms',
        { width: w });
    });

    /* 3. 라인 차트 — clip-path 와이프 (점선·마커는 페이드) */
    document.querySelectorAll('svg polyline, svg line').forEach(function (el, i) {
      var dashed = el.getAttribute('stroke-dasharray') || el.style.strokeDasharray;
      if (dashed) {
        anim(el, { opacity: '0' }, 'opacity .6s ease ' + (700 + i * 80) + 'ms', { opacity: '1' });
      } else {
        anim(el, { clipPath: 'inset(-10% 100% -10% 0)' },
          'clip-path 1s ' + EASE + ' ' + (450 + i * 90) + 'ms',
          { clipPath: 'inset(-10% 0% -10% 0)' });
      }
    });

    /* 4. 도넛·아크 조각 순차, 마커 페이드 */
    document.querySelectorAll('svg circle').forEach(function (el, i) {
      anim(el, { opacity: '0' }, 'opacity .5s ease ' + (500 + i * 140) + 'ms', { opacity: '1' });
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
      /* 카운트업은 rAF라 숨김 탭에서 멈출 수 있음 → 3초 후 원본 강제 복원 */
      setTimeout(function () { requestAnimationFrame(step); }, 350);
      setTimeout(function () { node.textContent = raw; }, 3000);
    });

    /* 6. 타임라인 — 시간순 스르륵 */
    document.querySelectorAll('.atl .aev, .tl .ev, .vline .v').forEach(function (el, i) {
      anim(el, { opacity: '0', transform: 'translateY(16px)' },
        'opacity .55s ' + EASE + ' ' + (400 + i * 220) + 'ms, transform .55s ' + EASE + ' ' + (400 + i * 220) + 'ms',
        { opacity: '1', transform: 'none' });
    });

    /* 7. 표 행 스태거 */
    document.querySelectorAll('table.grid tr').forEach(function (el, i) {
      anim(el, { opacity: '0' }, 'opacity .4s ease ' + (350 + i * 40) + 'ms', { opacity: '1' });
    });

    /* 8. 히트맵 셀 팝 */
    document.querySelectorAll('.hm .cell, .hmc').forEach(function (el, i) {
      anim(el, { opacity: '0', transform: 'scale(.6)' },
        'opacity .35s ease ' + (300 + i * 22) + 'ms, transform .35s ' + EASE + ' ' + (300 + i * 22) + 'ms',
        { opacity: '1', transform: 'scale(1)' });
    });

    /* 9. 카드 스태거 */
    document.querySelectorAll('.rcard, .sug-card, .spark .cell').forEach(function (el, i) {
      anim(el, { opacity: '0', transform: 'translateY(10px)' },
        'opacity .45s ' + EASE + ' ' + (350 + i * 90) + 'ms, transform .45s ' + EASE + ' ' + (350 + i * 90) + 'ms',
        { opacity: '1', transform: 'none' });
    });

    /* 안전장치: 어떤 이유로든 멈춘 요소를 5초 후 최종 상태로 강제 */
    setTimeout(function () {
      document.querySelectorAll('svg polyline, svg line, svg circle, .panel, .kpi, .zcard, .lg-card, .atl .aev, .tl .ev, .vline .v, table.grid tr, .hm .cell, .hmc, .rcard, .sug-card, .spark .cell').forEach(function (el) {
        el.style.transition = 'none';
        el.style.opacity = '';
        el.style.clipPath = '';
        if (el.style.transform && el.style.transform !== 'none') el.style.transform = '';
      });
    }, 5000);
  }
  onReady(runMotion);
  /* 필터 리드로우 등 외부에서 재생 (demo.js) */
  window.swmotion = { replay: runMotion };

  /* R 키 = 모션 다시 재생 (촬영용) */
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'r' || e.key === 'R') && !/input|textarea|select/i.test(e.target.tagName)) {
      location.reload();
    }
  });
})();
