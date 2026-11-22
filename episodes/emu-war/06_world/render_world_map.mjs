import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = path.dirname(fileURLToPath(import.meta.url));
const map = JSON.parse(await fs.readFile(path.join(here, 'world_map.json'), 'utf8'));
const require = createRequire(import.meta.url);
const { chromium } = require('../../../templates/threejs_film/node_modules/playwright');

// The playable map is 440m wide by 420m deep.  These transforms keep the
// whole declared world inside the cream border; they are not camera guesses.
const sx = x => 540 + x * 2.12;
const sy = z => 700 - z * 2.12;
const colors = ['#e9c86d','#d8ae54','#91a269','#c49561','#dbbd73','#77b1ae','#c97852','#d6ae5e'];
const byId = Object.fromEntries(map.locations.map((x, i) => [x.id, {...x, color: colors[i]}]));
const road = c => { const a=byId[c.from], b=byId[c.to]; return `<path d="M${sx(a.center[0])} ${sy(a.center[1])} L${sx(b.center[0])} ${sy(b.center[1])}" stroke="#714a31" stroke-width="${c.width*2.2}" stroke-linecap="round"/><path d="M${sx(a.center[0])} ${sy(a.center[1])} L${sx(b.center[0])} ${sy(b.center[1])}" stroke="#d59755" stroke-width="${Math.max(2,c.width*.8)}" stroke-dasharray="12 12" opacity=".7"/>`; };
const location = l => { const x=sx(l.center[0]-l.size[0]/2), y=sy(l.center[1]+l.size[1]/2), w=l.size[0]*2.05, h=l.size[1]*2.05; const tx=x+18, ty=y+35; return `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="22" fill="${l.color}" fill-opacity=".82" stroke="#26313d" stroke-width="5"/><rect x="${tx-9}" y="${ty-25}" width="${Math.min(w-18, 270)}" height="58" rx="9" fill="#172534" fill-opacity=".88"/><text x="${tx}" y="${ty-3}" font-family="Arial" font-size="21" font-weight="700" fill="#fff7dc">${l.id.replaceAll('_',' ')}</text><text x="${tx}" y="${ty+20}" font-family="Arial" font-size="13" fill="#dce9ef">${l.purpose}</text></g>`; };
const landmark = p => `<g><circle cx="${sx(p.position[0])}" cy="${sy(p.position[1])}" r="9" fill="#f8efca" stroke="#322016" stroke-width="4"/><text x="${sx(p.position[0])+13}" y="${sy(p.position[1])-10}" font-family="Arial" font-size="14" font-weight="700" stroke="#162331" stroke-width="4" paint-order="stroke" fill="#fff7dc">${p.id}</text></g>`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1440" viewBox="0 0 1080 1440"><defs><linearGradient id="ground" x2="0" y2="1"><stop stop-color="#7a9e88"/><stop offset=".48" stop-color="#c69f5c"/><stop offset="1" stop-color="#8d613b"/></linearGradient></defs><rect width="1080" height="1440" fill="#111b27"/><rect x="50" y="150" width="980" height="920" rx="34" fill="url(#ground)" stroke="#f4e7c5" stroke-width="4"/>${map.connections.map(road).join('')}${map.locations.map(location).join('')}${map.landmarks.map(landmark).join('')}<text x="50" y="60" font-family="Arial" font-size="32" font-weight="700" fill="#fff">${map.title}</text><text x="50" y="100" font-family="Arial" font-size="19" fill="#d5dfeb">ONE CONTINUOUS WORLD · 1 unit = 1 metre · no floating sets</text><g transform="translate(70 1120)"><rect width="940" height="240" rx="20" fill="#1c2a39"/><text x="25" y="40" font-family="Arial" font-size="23" font-weight="700" fill="#fff">Continuity requirements</text><text x="25" y="78" font-family="Arial" font-size="17" fill="#d5dfeb">• Connected roads, tracks and fences     • Same sun direction in every location</text><text x="25" y="110" font-family="Arial" font-size="17" fill="#d5dfeb">• Soldier 1.7 m · emu 1.9 m · truck 5 m     • No holes, floating props or teleports</text><text x="25" y="142" font-family="Arial" font-size="17" fill="#d5dfeb">• Every camera stays inside this map     • Every view has foreground, subject and background</text><text x="25" y="190" font-family="Arial" font-size="18" font-weight="700" fill="#f4d67d">Next proof: scale test + full world flythrough before character animation.</text></g></svg>`;
await fs.writeFile(path.join(here, 'world_map.svg'), svg);
const browser = await chromium.launch({headless:true});
const page = await browser.newPage({viewport:{width:1080,height:1440}});
await page.setContent(`<body style="margin:0">${svg}</body>`);
await page.locator('svg').screenshot({path:path.join(here,'world_map.png')});
await browser.close();
console.log('wrote world_map.svg and world_map.png');
