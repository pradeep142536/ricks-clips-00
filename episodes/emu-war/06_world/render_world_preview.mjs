import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../../..');
const require=createRequire(import.meta.url);
const { chromium }=require('../../../templates/threejs_film/node_modules/playwright');
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.png':'image/png'};
const server=http.createServer((req,res)=>{const pathname=decodeURIComponent(req.url.split('?')[0]); const file=path.normalize(path.join(root,pathname)); if(!file.startsWith(root)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);return res.end('not found')} res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream','cache-control':'no-store'}); fs.createReadStream(file).pipe(res);});
const port=await new Promise(resolve=>server.listen(0,'127.0.0.1',()=>resolve(server.address().port)));
console.log(`preview server http://127.0.0.1:${port}`);
// CI and this laptop can lack a usable hardware WebGL driver.  SwiftShader
// renders the identical scene in software, so visual inspection is repeatable.
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist']});
console.log('preview browser launched');
try {
  const page=await browser.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});
  page.on('console', message => { if (message.type()==='error') console.error('[page]', message.text()); });
  page.on('pageerror', error => console.error('[pageerror]', error.message));
  console.log('loading preview page');
  await page.goto(`http://127.0.0.1:${port}/episodes/emu-war/06_world/world_preview.html`,{waitUntil:'domcontentloaded',timeout:10000});
  console.log('waiting for scene');
  await page.waitForFunction(()=>window.__WORLD_READY__===true,null,{timeout:10000});
  await page.waitForTimeout(500);
  await page.screenshot({path:path.join(here,'world_inspection.png')});
  console.log('wrote world_inspection.png');
} catch (error) { console.error('preview failed:', error.stack || error.message); process.exitCode=1; }
finally { await browser.close(); await new Promise(resolve=>server.close(resolve)); }
