import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { CHARACTERS, renderCharacter, renderSheet, POSES } from './rig.mjs';
const require=createRequire(import.meta.url); const { chromium }=require('../../../templates/threejs_film/node_modules/playwright');
const out=path.dirname(fileURLToPath(import.meta.url));
const browser=await chromium.launch({headless:true}); const page=await browser.newPage({viewport:{width:2160,height:2160}});
async function shot(svg,file){
  await page.setContent(`<body style="margin:0;background:#101722">${svg}</body>`,{waitUntil:'domcontentloaded'});
  await page.locator('svg').first().screenshot({path:path.join(out,file),timeout:120000});
}
for(const spec of Object.values(CHARACTERS)){
  if(spec.build==='emu') await shot(renderSheet(spec,POSES.map(p=>renderCharacter(spec,p==='run'?'three-quarter-right':'front','determined',p)),`${spec.label} · POSES`,4),`${spec.id}_poses.png`);
  const frameDir=path.join(out,`${spec.id}_walk_png`); await fs.mkdir(frameDir,{recursive:true});
  for(let i=0;i<8;i++) await shot(renderCharacter(spec,'three-quarter-right',i%4===0?'determined':i%4===2?'worried':'determined',`walk${i}`),path.join(`${spec.id}_walk_png`,`frame_${String(i).padStart(2,'0')}.png`));
}
await browser.close(); console.log('Finished pose sheets and walk PNG frames');
