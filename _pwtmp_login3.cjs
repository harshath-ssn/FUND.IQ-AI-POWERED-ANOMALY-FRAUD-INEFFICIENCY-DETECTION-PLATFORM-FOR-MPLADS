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
  await page.evaluate(() => {
    const wrapper = document.getElementById('root').firstElementChild;
    wrapper.scrollTop = 999;
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, 'F_roles_scrolled_to_bottom.png') });
  await browser.close();
})();
