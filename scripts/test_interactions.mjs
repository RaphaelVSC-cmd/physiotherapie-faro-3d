import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require(path.join(process.env.LOCALAPPDATA, 'Temp', 'faro-pw', 'node_modules', 'playwright-core'));

const rootDir = process.argv[2];
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  const urlPath = (req.url || '/').split('?')[0];
  const fp = path.join(rootDir, urlPath === '/' ? 'index.html' : urlPath);
  if (!fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(fp).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/`;

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: ['--headless=new', '--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForFunction(() => Boolean(window.__faroExplorer));
await page.waitForTimeout(300);

// 1. Theme toggle
await page.click('#themeToggle');
const darkTheme = await page.getAttribute('html', 'data-theme');
await page.click('#themeToggle');
const lightTheme = await page.getAttribute('html', 'data-theme');

// 2. 3D Explorer hotspot + mode
await page.click('.hotspot-btn[data-zone="knie"]');
const zoneTitle = await page.textContent('#explorer-zone-title');
await page.click('.mode-pill[data-mode="fascia"]');

// 3. Therapy calculator
await page.click('.goal-chip[data-goal="kiefer"]');
const calcTitle = await page.textContent('#calc-rec-title');

// 4. Impressum modal open/close
await page.click('[data-open-modal="impressumModal"]');
const impOpen = await page.evaluate(() => document.getElementById('impressumModal').classList.contains('open'));
await page.keyboard.press('Escape');
const impClosed = await page.evaluate(() => !document.getElementById('impressumModal').classList.contains('open'));

// 5. Mobile hamburger
await page.setViewportSize({ width: 375, height: 812 });
await page.click('#hamburger');
const menuOpen = await page.evaluate(() => document.getElementById('mobileMenu').classList.contains('open'));
await page.click('#hamburger');
const menuClosed = await page.evaluate(() => !document.getElementById('mobileMenu').classList.contains('open'));

console.log(JSON.stringify({ darkTheme, lightTheme, zoneTitle: zoneTitle.trim(), calcTitle: calcTitle.trim(), impOpen, impClosed, menuOpen, menuClosed, errors }, null, 2));
await browser.close();
server.close();
