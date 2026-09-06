const { chromium } = require('playwright');
const path = require('path');
const OUT = path.join(__dirname, '_pw_shots');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await page.goto('http://localhost:5183', { waitUntil: 'networkidle', timeout: 30000 });
  const skip = page.getByText(/skip intro/i).first();
  await skip.waitFor({ timeout: 15000 }).catch(() => {});
  await skip.click({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(1200);

  const info = await page.evaluate(() => {
    // Find the root LoginPage wrapper: direct child of #root
    const root = document.getElementById('root');
    const wrapper = root ? root.firstElementChild : null;
    if (!wrapper) return { error: 'no wrapper found' };
    const cs = getComputedStyle(wrapper);
    return {
      tag: wrapper.tagName,
      className: wrapper.className,
      overflowY: cs.overflowY,
      height: cs.height,
      scrollHeight: wrapper.scrollHeight,
      clientHeight: wrapper.clientHeight,
      rootOverflow: getComputedStyle(root).overflow,
      rootHeight: getComputedStyle(root).height,
      bodyOverflow: getComputedStyle(document.body).overflow,
      bodyHeight: getComputedStyle(document.body).height,
    };
  });
  console.log('WRAPPER INFO:', JSON.stringify(info, null, 2));

  await browser.close();
})();
