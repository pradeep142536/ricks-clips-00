import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../..');
const require = createRequire(import.meta.url);
const { chromium } = require('../../templates/threejs_film/node_modules/playwright');
const mime = { '.html':'text/html', '.js':'text/javascript', '.mjs':'text/javascript', '.json':'application/json' };
const server = http.createServer((request, response) => {
  const urlPath = decodeURIComponent(request.url.split('?')[0]);
  const filePath = path.normalize(path.join(repo, urlPath));
  if (!filePath.startsWith(repo) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) { response.writeHead(404); response.end('not found'); return; }
  response.writeHead(200, { 'content-type': mime[path.extname(filePath)] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(response);
});
const port = await new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server.address().port)));
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
try {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await page.goto(`http://127.0.0.1:${port}/main_video/08_preview/world_preview.html`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(() => window.__WORLD_READY__ === true, null, { timeout: 30000 });
  await page.screenshot({ path: path.join(repo, 'main_video/08_preview/world_inspection_contact_sheet.png') });
  console.log('INSPECTION_RENDER_PASS world_inspection_contact_sheet.png');
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
