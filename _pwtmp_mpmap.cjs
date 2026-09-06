const { chromium } = require('playwright');
const path = require('path');
const OUT = path.join(__dirname, '_pw_shots');
require('fs').mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('[pageerror] ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('[console] ' + m.text()); });

  await page.goto('http://localhost:5183', { waitUntil: 'networkidle', timeout: 30000 });
  const skip = page.getByText(/skip intro/i).first();
  await skip.waitFor({ timeout: 15000 }).catch(() => {});
  await skip.click({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(1000);

  await page.getByText('Enter MP Dashboard').first().click();
  await page.waitForTimeout(800);
  const selects = page.locator('select');
  await selects.first().selectOption({ label: 'Tamil Nadu' });
  await page.waitForTimeout(400);
  const opts = await selects.nth(1).locator('option').allTextContents();
  const match = opts.find(o => /Madurai/i.test(o));
  if (match) await selects.nth(1).selectOption({ label: match });
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: /authorize/i }).first().click();
  await page.waitForTimeout(2000);

  // Should default to the Satellite GIS tab which shows the map
  await page.screenshot({ path: path.join(OUT, 'mp_madurai_map.png') });
  console.log('ERRORS:', errors.join('\n') || '(none)');

  await browser.close();
})();
