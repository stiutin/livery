/**
 * README screenshots and the social preview, reproducible from the code.
 *
 *   npm run screenshots                                            # a fresh production build, served locally
 *   BASE_URL=https://stiutin.github.io/livery/ npm run screenshots  # the live site
 *
 * Output: .github/screenshots/*.png (used by the README) and .github/social-preview.png (1280×640, upload it in
 * the repository settings). Set CHROMIUM_PATH to use a specific browser binary.
 */
import {spawn, spawnSync} from 'node:child_process';
import {mkdirSync, readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {setTimeout as sleep} from 'node:timers/promises';

import {chromium, devices} from '@playwright/test';

const OUT = '.github/screenshots';
const live = process.env.BASE_URL;
const base = (live ?? 'http://localhost:4173/livery/').replace(/\/?$/, '/');
// The mock invoices are dated relative to today; a fixed clock keeps the screenshots the same from run to run.
const NOW = new Date('2026-09-26T10:00:00Z');
mkdirSync(OUT, {recursive: true});

let server;
if (!live) {
  const built = spawnSync('npm', ['run', 'build'], {shell: true, stdio: 'inherit'});
  if (built.status !== 0) {
    process.exit(built.status ?? 1);
  }
  // Own process group, so the whole `npm → node` tree can be stopped at the end.
  server = spawn('npm', ['run', 'serve'], {detached: true, shell: true, stdio: 'ignore'});
  for (
    let attempt = 0;
    attempt < 100 &&
    !(await fetch(base).then(
      () => true,
      () => false
    ));
    attempt++
  ) {
    await sleep(100);
  }
}

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? {args: ['--no-sandbox'], executablePath: process.env.CHROMIUM_PATH} : {}
);

async function signedIn(contextOptions, tenant, language = 'en') {
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  await page.clock.setFixedTime(NOW);
  await page.goto(`${base}${tenant}/${language}/login`);
  await page.locator('input[type=email]').fill('ada@example.com');
  await page.locator('input[type=password]').fill('secret-password');
  await page.locator('button[type=submit]').click();
  await page.waitForURL(`**/${tenant}/${language}/account`);
  await page.goto(`${base}${tenant}/${language}/invoices`);
  await page.locator('main table').waitFor();
  return {context, page};
}

const DESKTOP = {viewport: {width: 1280, height: 800}, deviceScaleFactor: 1};

// The same invoices page in each brand: the README shows them side by side.
for (const tenant of ['harbour', 'onyx', 'meadow']) {
  const {context, page} = await signedIn(DESKTOP, tenant);
  await page.screenshot({path: `${OUT}/${tenant}.png`});
  await context.close();
  console.log(`✔ ${tenant}.png`);
}

{
  const context = await browser.newContext({viewport: {width: 1280, height: 900}, deviceScaleFactor: 1});
  const page = await context.newPage();
  await page.goto(`${base}studio`);
  await page.locator('[data-studio-preview] h1').waitFor();
  await page.screenshot({path: `${OUT}/studio.png`});
  await context.close();
  console.log('✔ studio.png');
}

// The social preview: the portfolio's layout, with Onyx on a desktop and Meadow on a phone.
const onyx = await signedIn({viewport: {width: 1280, height: 720}, deviceScaleFactor: 1}, 'onyx');
const desktopShot = await onyx.page.screenshot();
await onyx.context.close();
const meadow = await signedIn({...devices['Pixel 7'], viewport: {width: 390, height: 780}}, 'meadow', 'de');
const phoneShot = await meadow.page.screenshot();
await meadow.context.close();

const require = createRequire(import.meta.url);
const font = (weight) =>
  readFileSync(require.resolve(`@fontsource/poppins/files/poppins-latin-${weight}-normal.woff2`)).toString('base64');
const image = (buffer) => `data:image/png;base64,${buffer.toString('base64')}`;

const preview = await browser.newPage({viewport: {width: 1280, height: 640}, deviceScaleFactor: 1});
await preview.setContent(`<!doctype html>
<html><head><style>
  @font-face { font-family: Poppins; font-weight: 400; src: url(data:font/woff2;base64,${font(400)}) format('woff2'); }
  @font-face { font-family: Poppins; font-weight: 600; src: url(data:font/woff2;base64,${font(600)}) format('woff2'); }
  @font-face { font-family: Poppins; font-weight: 700; src: url(data:font/woff2;base64,${font(700)}) format('woff2'); }
  * { box-sizing: border-box; margin: 0; }
  body {
    width: 1280px; height: 640px; overflow: hidden; position: relative; font-family: Poppins, sans-serif; color: #fff;
    background: radial-gradient(ellipse at 20% 40%, #1b2140 0%, #0f1328 55%, #07080f 100%);
  }
  .text { position: absolute; left: 72px; top: 190px; width: 560px; }
  .eyebrow { color: #e0975a; font-size: 16px; font-weight: 600; letter-spacing: 0.3em; }
  h1 { font-size: 84px; font-weight: 700; line-height: 1.1; margin: 18px 0 16px; }
  p { color: #c9cfe6; font-size: 22px; line-height: 1.45; }
  .chips { display: flex; gap: 10px; margin-top: 28px; flex-wrap: wrap; }
  .chips span { border: 1px solid rgba(255,255,255,0.28); border-radius: 999px; padding: 7px 14px; font-size: 16px; font-weight: 600; }
  .author { position: absolute; left: 72px; bottom: 36px; color: #8b93b3; font-size: 16px; }
  .desktop { position: absolute; left: 750px; top: 86px; width: 640px; border-radius: 10px 0 0 10px; box-shadow: 0 30px 80px rgba(0,0,0,0.55); }
  .phone {
    position: absolute; left: 742px; top: 146px; width: 214px; padding: 8px; border-radius: 30px; background: #0a0a0f;
    box-shadow: 0 30px 70px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08);
  }
  .phone img { width: 100%; border-radius: 22px; display: block; }
</style></head><body>
  <div class="text">
    <div class="eyebrow">REACT 19 · WHITE-LABEL</div>
    <h1>Livery</h1>
    <p>One product, many brands: design tokens checked for WCAG AA at build time, prerendered pages, three languages.</p>
    <div class="chips"><span>Design tokens</span><span>OKLCH</span><span>React Router</span><span>Playwright</span></div>
  </div>
  <img class="desktop" src="${image(desktopShot)}" alt="">
  <div class="phone"><img src="${image(phoneShot)}" alt=""></div>
  <div class="author">Serge Tiutin · github.com/stiutin</div>
</body></html>`);
await preview.evaluate(() => document.fonts.ready);
await preview.screenshot({path: '.github/social-preview.png'});
console.log('✔ social-preview.png');

await browser.close();
if (server?.pid) {
  process.kill(-server.pid);
}
