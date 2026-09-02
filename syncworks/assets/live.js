/* 데모 라이브 주입 — 대시보드 URL에 ?live=1 이 있을 때만 브리지(8891)의 el-bigs 실데이터로 KPI를 교체.
   더미 화면은 그대로 두고, 라이브 모드에서만 동작. dev 실데이터이므로 촬영/공유 화면에는 쓰지 말 것. */
(function () {
  var q = new URLSearchParams(location.search);
  if (q.get('live') !== '1') return;
  var BRIDGE = 'http://127.0.0.1:8891';

  function banner(text, tone) {
    var b = document.createElement('div');
    b.style.cssText = 'position:fixed;left:50%;bottom:20px;transform:translateX(-50%);z-index:999;'
      + 'background:' + (tone === 'err' ? '#ff4040' : tone === 'ok' ? '#38acba' : '#1c1d1f')
      + ';color:#fff;font-size:12px;font-weight:600;padding:10px 18px;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.25)';
    b.textContent = text;
    document.body.appendChild(b);
    return b;
  }

  function inject(data) {
    // 대시보드 KPI 카드에 실측 매출/영업이익 주입 (있는 값만)
    var map = { '매출합계': '매출', '경상이익': '경상이익', '매출': '매출', '영업이익': '영업이익' };
    var kpis = data.kpis || {};
    document.querySelectorAll('.kpi').forEach(function (card) {
      var lb = card.querySelector('.lb');
      var num = card.querySelector('.num');
      if (!lb || !num) return;
      var key = map[lb.textContent.trim()];
      if (key && kpis[key] != null) {
        var node = num.childNodes[0];
        var val = kpis[key].toLocaleString('ko-KR');
        if (node && node.nodeType === 3) node.textContent = val;
        else num.textContent = val;
        card.style.outline = '2px solid #38acba';
        card.style.outlineOffset = '2px';
      }
    });
  }

  async function run() {
    var loading = banner('el-bigs 실데이터 불러오는 중…');
    try {
      var st = await fetch(BRIDGE + '/bridge/status').then(function (r) { return r.json(); });
      if (!st.logged_in) {
        loading.remove();
        var msg = banner('브리지 로그인 필요 — 터미널에서 로그인 후 새로고침', 'err');
        setTimeout(function () { msg.remove(); }, 6000);
        return;
      }
      var data = await fetch(BRIDGE + '/bridge/home').then(function (r) { return r.json(); });
      loading.remove();
      if (data.error) { banner('조회 실패: ' + data.error, 'err'); return; }
      inject(data);
      var ok = banner('LIVE · el-bigs dev 실데이터 (' + st.user + ')', 'ok');
      setTimeout(function () { ok.remove(); }, 5000);
    } catch (e) {
      loading.remove();
      var er = banner('브리지 연결 실패 — bridge.py 실행 확인 (127.0.0.1:8891)', 'err');
      setTimeout(function () { er.remove(); }, 6000);
    }
  }

  if (document.readyState !== 'loading') run();
  else document.addEventListener('DOMContentLoaded', run);
})();
