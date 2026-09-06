const { chromium } = require('playwright');
const path = require('path');
const OUT = path.join(__dirname, '_pw_shots');
require('fs').mkdirSync(OUT, { recursive: true });

async function shotFresh(browser, viewport, label, afterLoad) {
  const page = await browser.newPage({ viewport });
  await page.goto('http://localhost:5183', { waitUntil: 'networkidle', timeout: 30000 });
  const skip = page.getByText(/skip intro/i).first();
  await skip.waitFor({ timeout: 15000 }).catch(() => {});
  await skip.click({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(1200);
  if (afterLoad) await afterLoad(page);
  await page.screenshot({ path: path.join(OUT, `${label}.png`) });
  const info = await page.evaluate(() => {
    const el = document.scrollingElement || document.documentElement;
    return { scrollHeight: el.scrollHeight, clientHeight: el.clientHeight };
  });
  console.log(`${label}: scrollHeight=${info.scrollHeight} clientHeight=${info.clientHeight}`);
  await page.close();
}

(async () => {
  const browser = await chromium.launch();

  await shotFresh(browser, { width: 1366, height: 768 }, 'A_roles_1366x768');
  await shotFresh(browser, { width: 1920, height: 1080 }, 'B_roles_1920x1080');
  await shotFresh(browser, { width: 1366, height: 768 }, 'C_mpform_1366x768', async (page) => {
    await page.getByText('Enter MP Dashboard').first().click();
    await page.waitForTimeout(800);
  });
  await shotFresh(browser, { width: 1920, height: 1080 }, 'D_mpform_1920x1080', async (page) => {
    await page.getByText('Enter MP Dashboard').first().click();
    await page.waitForTimeout(800);
  });
  await shotFresh(browser, { width: 1440, height: 900 }, 'E_districtform_1440x900', async (page) => {
    await page.getByText('Enter Collectorate Node').first().click();
    await page.waitForTimeout(800);
  });

  await browser.close();
})();
