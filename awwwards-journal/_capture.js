// 어워드 저널용 페이지 캡처 도구
// 사용법: node _capture.js <url> <출력파일.png> [대기초=6] [셀렉터클릭...]
// 시스템 크롬 + SwiftShader(WebGL 소프트웨어 렌더링)로 실제 시간 대기 후 캡처
const puppeteer = require('puppeteer-core');

(async () => {
  const [url, out, waitSec = '6'] = process.argv.slice(2);
  if (!url || !out) { console.error('usage: node _capture.js <url> <out.png> [waitSec]'); process.exit(1); }
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  // networkidle은 WebGL 사이트에서 안 끝나는 경우가 있어 load + 고정 대기 사용
  await page.goto(url, { waitUntil: 'load', timeout: 45000 });
  await new Promise(r => setTimeout(r, parseFloat(waitSec) * 1000)); // 프리로더·인트로 애니메이션 대기
  await page.screenshot({ path: out });
  await browser.close();
  console.log('saved:', out);
})().catch(e => { console.error(e.message); process.exit(1); });
