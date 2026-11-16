import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require(path.join(process.env.LOCALAPPDATA, 'Temp', 'faro-pw', 'node_modules', 'playwright-core'));

const rootDir = process.argv[2];
const outDir = process.argv[3];
fs.mkdirSync(outDir, { recursive: true });

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
};

const server = http.createServer((req, res) => {
  const urlPath = (req.url || '/').split('?')[0];
  let filePath = path.join(rootDir, urlPath === '/' ? 'index.html' : urlPath);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const baseUrl = `http://127.0.0.1:${port}/`;

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: [
    '--headless=new',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-webgl',
    '--ignore-gpu-blocklist',
    '--no-sandbox',
  ],
});

const consoleErrors = [];
const pageErrors = [];

const context = await browser.newContext({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1 });
const page = await context.newPage();
page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
page.on('pageerror', (err) => pageErrors.push(err.message));

await page.goto(baseUrl, { waitUntil: 'networkidle' });
await page.waitForTimeout(1800);

// S01: Hero + transition (matching R03 portrait-ish framing at 1440x1200)
await page.setViewportSize({ width: 1440, height: 1200 });
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(700);
await page.screenshot({ path: path.join(outDir, 'S01.png') });

// S02: Treatments 3D cards + Practice Bento + Stat Strip
await page.setViewportSize({ width: 1440, height: 1450 });
await page.evaluate(() => {
  const el = document.getElementById('leistungen');
  if (el) window.scrollTo(0, el.offsetTop - 75);
});
await page.waitForTimeout(1000);
await page.screenshot({ path: path.join(outDir, 'S02.png') });

// S03: Interactive 3D Explorer full anatomical framing
await page.setViewportSize({ width: 1440, height: 920 });
await page.evaluate(() => {
  const el = document.getElementById('explorer');
  if (el) window.scrollTo(0, el.offsetTop - 70);
  window.__faroExplorer?.selectZone('overview');
});
await page.waitForTimeout(1100);
await page.screenshot({ path: path.join(outDir, 'S03.png') });

// S04: Trust Banner + 3-Col Pathways
await page.setViewportSize({ width: 1440, height: 1280 });
await page.evaluate(() => {
  const el = document.getElementById('bewertungen');
  if (el) window.scrollTo(0, el.offsetTop - 70);
});
await page.waitForTimeout(1000);
await page.screenshot({ path: path.join(outDir, 'S04.png') });

// S05: Contact Swiss Split + Footer (cleanly framed from #kontakt top)
await page.setViewportSize({ width: 1440, height: 860 });
await page.evaluate(() => {
  const el = document.getElementById('kontakt');
  if (el) window.scrollTo(0, el.offsetTop);
});
await page.waitForTimeout(900);
await page.screenshot({ path: path.join(outDir, 'S05.png') });

// Mobile 375x812 check
await page.setViewportSize({ width: 375, height: 812 });
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(800);
const mobileMetrics = await page.evaluate(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
  fps: window.__faroPerf?.fps ?? null,
}));
await page.screenshot({ path: path.join(outDir, 'mobile.png') });

console.log(JSON.stringify({ consoleErrors, pageErrors, mobileMetrics }, null, 2));

await browser.close();
server.close();
