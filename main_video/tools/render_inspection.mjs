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
  const urlPath = decodeURIComponent((request.url || '/').split('?')[0]).replace(/^\/+/, '');
  const filePath = path.resolve(repo, urlPath);
  if (filePath !== repo && !filePath.startsWith(repo + path.sep) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    console.log(`PREVIEW_404 url=${request.url} file=${filePath}`);
    response.writeHead(404); response.end('not found'); return;
  }
  response.writeHead(200, { 'content-type': mime[path.extname(filePath)] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(response);
});
const port = await new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server.address().port)));
const useGpu = process.env.RICKS_GPU === '1';
const browser = await chromium.launch({
  headless: true,
  ignoreDefaultArgs: useGpu ? ['--use-angle=swiftshader-webgl', '--disable-gpu'] : [],
  args: useGpu ? [
    '--no-sandbox', '--headless=new', '--disable-dev-shm-usage',
    '--use-gl=angle', '--use-angle=vulkan', '--enable-features=Vulkan',
    '--disable-vulkan-surface', '--ignore-gpu-blocklist', '--disable-gpu-vsync'
  ] : [
    '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu-sandbox',
    '--use-gl=swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'
  ]
});
try {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('console', message => console.log(`[browser:${message.type()}] ${message.text()}`));
  page.on('pageerror', error => console.log(`[browser:pageerror] ${error.stack || error.message}`));
  for (const mode of ['day', 'dusk', 'night', 'storm']) {
    await page.goto(`http://127.0.0.1:${port}/main_video/08_preview/world_preview.html?mode=${mode}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForFunction(() => window.__WORLD_READY__ === true, null, { timeout: 30000 });
    await page.screenshot({ path: path.join(repo, `main_video/08_preview/world_${mode}.png`) });
  }
  console.log('INSPECTION_RENDER_PASS world_day.png world_dusk.png world_night.png world_storm.png');
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
