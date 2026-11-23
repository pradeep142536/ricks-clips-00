// CAST of "The Great Emu War of 1932" (Western Australia, November 1932).
// Built strictly from the locked Rick's Clips character bible:
// Standard, thin, and fat bodies, authentic 1930s Australian uniforms and Outback farmer workwear.
// Puppets:
//   "cast:emu/major_meredith" - Major G.P.W. Meredith, Seventh Heavy Battery, Royal Australian Artillery
//   "cast:emu/gunner"         - Sergeant S. McMurray / Gunner J. O'Halloran (Lewis machine gunner)
//   "cast:emu/farmer"         - Western Australian wheat farmer (Campion district)
//   "cast:emu/bird"           - Australian Emu (Dromaius novaehollandiae), fast, agile guerrilla runner

import { wear, HATS2 } from '../head_wear.mjs';
import { O, SK, skPat, SKIN, WHITE } from '../outfit_lib.mjs';

export const TITLE = 'The Great Emu War of 1932: Cast';

const INK = '#2a1a1f', f = n => (+n).toFixed(1);

// 1930s Australian Outback Palette
const KHAKI_TUNIC = '#5c5836';
const KHAKI_LIGHT = '#827b54';
const KHAKI_PANTS = '#4a462b';
const LEATHER_BROWN = '#4a2c16';
const BRASS_GOLD = '#d4a437';
const FARMER_SHIRT = '#8b4513';
const FARMER_PANTS = '#38424d';
const EMU_FEATHER = '#4a423a';
const EMU_NECK = '#665d54';
const EMU_BEAK = '#c49a3c';

// ---------- OUTFIT RECIPES ----------
// Major Meredith: Officer tunic with brass buttons, sam browne belt, collar badges
O('officer1932', 'Australian Artillery Officer: khaki tunic, brass buttons, sam browne belt', 'Military', 'm', [KHAKI_TUNIC, WHITE, KHAKI_PANTS],
  [['lapels', 'a', WHITE, 'tie', '#3a3424'], ['buttons', 5, BRASS_GOLD, .35, .88], ['suspenders', LEATHER_BROWN, .16], ['low', KHAKI_PANTS, .88], ['seams']]);

// Gunner: Rolled sleeves, ammo bandolier over khaki shirt, sturdy work pants
O('gunner1932', 'Australian Digger Gunner: rolled sleeve khaki, webbing belt', 'Military', 'm', [KHAKI_LIGHT, KHAKI_TUNIC, KHAKI_PANTS],
  [['shirtCollar', 'a'], ['buttons', 4, '#22231c', .42, .88], ['suspenders', LEATHER_BROWN, .18], ['low', KHAKI_PANTS, .88], ['seams']]);

// Farmer: Dusty Outback flannel work shirt, heavy trousers, leather braces
O('farmer1932', 'Outback Wheat Farmer: flannel work shirt, suspenders, canvas trousers', 'Civilian', 'm', [FARMER_SHIRT, '#c8b898', FARMER_PANTS],
  [['top', 'a', .3], ['shirtCollar', 'a'], ['suspenders', LEATHER_BROWN, .20], ['low', FARMER_PANTS, .82], ['seams']]);

// Emu Puppet Outfit: Feathery plumage body
O('emuBody', 'Emu Plumage: shaggy grey-brown body with feather layers', 'Fauna', 'm', [EMU_FEATHER, EMU_NECK, EMU_BEAK],
  [['top', 'a', .25], ['low', EMU_FEATHER, .90], ['seams']]);

// ---------- SIGNATURE PIECES ----------
const geo = ctx => {
  const { cx, bodyTop: t, bodyBot: b, wB: w, side } = ctx;
  const H = b - t;
  const k = Math.max(.75, Math.min(1.35, w / (side ? 83 : 104)));
  return { X: u => cx + u * w, Y: v => t + v * H, H, k, side };
};

const addSig = (front, back) => S => {
  const d = S.details, bd = S.backDetails;
  if (front) S.details = ctx => [...(d ? d(ctx) : []), ...front(ctx, geo(ctx))];
  if (back) S.backDetails = ctx => [...(bd ? bd(ctx) : []), ...back(ctx, geo(ctx))];
};

// MAJOR MEREDITH SIGNATURE: Leather Sam Browne cross-belt + brass Rising Sun collar badges + swagger stick
const meredithSig = (ctx, G) => {
  const o = [];
  const k = G.k;
  const x1 = G.X(G.side ? .25 : -.35), y1 = G.Y(.18);
  const x2 = G.X(G.side ? -.20 : .32), y2 = G.Y(.75);
  // Diagonal leather cross-strap
  o.push(`<path d="M${f(x1)},${f(y1)} L${f(x2)},${f(y2)}" stroke="${LEATHER_BROWN}" stroke-width="${f(10 * k)}" stroke-linecap="round"/>`);
  o.push(`<path d="M${f(x1)},${f(y1)} L${f(x2)},${f(y2)}" stroke="${INK}" stroke-width="2" fill="none"/>`);
  // Brass belt buckle
  const bx = G.X(G.side ? .05 : .0), by = G.Y(.75);
  o.push(`<rect x="${f(bx - 8 * k)}" y="${f(by - 6 * k)}" width="${f(16 * k)}" height="${f(12 * k)}" fill="${BRASS_GOLD}" stroke="${INK}" stroke-width="2" rx="2"/>`);
  return o;
};

// GUNNER SIGNATURE: Canvas ammunition bandolier with copper .303 cartridge clips + goggles on hat
const gunnerSig = (ctx, G) => {
  const o = [];
  const k = G.k;
  const x1 = G.X(G.side ? -.30 : .35), y1 = G.Y(.20);
  const x2 = G.X(G.side ? .20 : -.30), y2 = G.Y(.72);
  // Ammunition bandolier strap
  o.push(`<path d="M${f(x1)},${f(y1)} L${f(x2)},${f(y2)}" stroke="#3a3222" stroke-width="${f(12 * k)}" stroke-linecap="round"/>`);
  // 4 Brass cartridge loops
  for (let i = 0; i < 4; i++) {
    const t = 0.25 + i * 0.16;
    const px = x1 + (x2 - x1) * t;
    const py = y1 + (y2 - y1) * t;
    o.push(`<rect x="${f(px - 3 * k)}" y="${f(py - 5 * k)}" width="${f(6 * k)}" height="${f(10 * k)}" fill="${BRASS_GOLD}" stroke="${INK}" stroke-width="1.5" transform="rotate(25 ${f(px)} ${f(py)})"/>`);
  }
  return o;
};

// FARMER SIGNATURE: Stained leather suspenders + wheat stalk stuck in buttonhole
const farmerSig = (ctx, G) => {
  const o = [];
  const k = G.k;
  const wx = G.X(G.side ? .18 : -.22), wy = G.Y(.30);
  // Golden wheat stalk
  o.push(`<path d="M${f(wx)},${f(wy + 20 * k)} Q${f(wx + 4 * k)},${f(wy)} ${f(wx + 10 * k)},${f(wy - 18 * k)}" stroke="#bfa034" stroke-width="3" fill="none" stroke-linecap="round"/>`);
  o.push(`<ellipse cx="${f(wx + 10 * k)}" cy="${f(wy - 18 * k)}" rx="${f(4 * k)}" ry="${f(8 * k)}" fill="#dec568" stroke="${INK}" stroke-width="1.5" transform="rotate(20 ${f(wx + 10 * k)} ${f(wy - 18 * k)})"/>`);
  return o;
};

// EMU SIGNATURE: Feathery texture edges and long neck collar
const emuSig = (ctx, G) => {
  const o = [];
  const k = G.k;
  // Shaggy feathers on body sides
  for (let y = 0.3; y <= 0.8; y += 0.12) {
    const lx = G.X(-0.55), ly = G.Y(y);
    const rx = G.X(0.55), ry = G.Y(y);
    o.push(`<path d="M${f(lx)},${f(ly)} l-12,8 l10,-2" stroke="${INK}" stroke-width="2.5" fill="${EMU_FEATHER}"/>`);
    o.push(`<path d="M${f(rx)},${f(ry)} l12,8 l-10,-2" stroke="${INK}" stroke-width="2.5" fill="${EMU_FEATHER}"/>`);
  }
  return o;
};

// ---------- THE CAST DEFINITION ----------
const base = spec => ({ form: 'standard', face: 'standard', views: true, sideFarArm: true, ...spec });

export const CAST = [
  // 1. MAJOR MEREDITH (Artillery Commander):
  // Confident officer, slouch hat with turned-up left brim and rising sun badge, khaki tunic, leather belt
  wear(
    base({
      name: 'major_meredith',
      label: 'Major Meredith (Artillery Commander)',
      size: 'standard',
      outfit: 'officer1932',
      outfitPal: { a: KHAKI_TUNIC, b: WHITE, c: KHAKI_PANTS },
      dress: addSig(meredithSig)
    }),
    'sidePart',
    { col: '#3a2d24', hat: 'slouch', hatCol: '#524b33', bandCol: LEATHER_BROWN }
  ),

  // 2. GUNNER (Lewis Machine Gunner):
  // Thin nervous soldier, rolled sleeves, slouch hat, ammo bandolier
  wear(
    base({
      name: 'gunner',
      label: 'Gunner (Lewis Machine Gunner)',
      size: 'thin',
      outfit: 'gunner1932',
      outfitPal: { a: KHAKI_LIGHT, b: KHAKI_TUNIC, c: KHAKI_PANTS },
      dress: addSig(gunnerSig)
    }),
    'buzz',
    { col: '#2c221a', hat: 'slouch', hatCol: '#585139', bandCol: '#25231c' }
  ),

  // 3. WHEAT FARMER (Outback Settler):
  // Fat body, sunburnt, broad felt hat, flannel shirt, suspenders
  wear(
    base({
      name: 'farmer',
      label: 'Outback Wheat Farmer',
      size: 'fat',
      outfit: 'farmer1932',
      outfitPal: { a: FARMER_SHIRT, b: '#c8b898', c: FARMER_PANTS },
      dress: addSig(farmerSig)
    }),
    'baldTufts',
    { col: '#5c544c', hat: 'farmStraw', hatCol: '#755836', bandCol: '#2a1a12' }
  ),

  // 4. EMU BIRD (Sprinting Emu):
  // Feathered runner, inquisitive eyes
  wear(
    base({
      name: 'bird',
      label: 'Australian Emu',
      size: 'standard',
      outfit: 'emuBody',
      outfitPal: { a: EMU_FEATHER, b: EMU_NECK, c: EMU_BEAK },
      dress: addSig(emuSig)
    }),
    'texturedCrop',
    { col: EMU_FEATHER, hat: null }
  )
];
