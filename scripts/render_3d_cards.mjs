import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require(path.join(process.env.LOCALAPPDATA, 'Temp', 'faro-pw', 'node_modules', 'playwright-core'));

const rootDir = process.argv[2];
const server = http.createServer((req, res) => {
  const urlPath = (req.url || '/').split('?')[0];
  const fp = path.join(rootDir, urlPath);
  if (!fs.existsSync(fp)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(fp).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: ['--headless=new', '--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 780, height: 980 } });

for (const [mode, outName] of [['reha', 'therapy-reha.png'], ['cmd', 'therapy-cmd.png']]) {
  await page.goto(`http://127.0.0.1:${port}/scripts/render_card_3d.html?mode=${mode}`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__renderDone === true);
  await page.screenshot({ path: path.join(rootDir, 'assets', 'images', outName) });
}
await browser.close();
server.close();
console.log('Rendered 3D card artworks.');
