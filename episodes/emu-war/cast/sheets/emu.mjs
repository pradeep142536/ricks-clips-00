// CAST of "The Great Emu War of 1932" (Western Australia, November 1932).
// Upgraded to the locked Rick's Clips Image 5 standard:
// Crisp #2a1a1f ink line art, pure white skin (no grey face shadow), authentic 1930s Australian uniforms,
// Sam Browne belts, brass Rising Sun badges, ammo bandoliers, and full 4-view turnaround support.

import { wear, HATS2 } from '../head_wear.mjs';
import { O, SK, skPat, SKIN, WHITE } from '../outfit_lib.mjs';

export const TITLE = 'The Great Emu War of 1932: Cast';

const INK = '#2a1a1f', f = n => (+n).toFixed(1);

// 1930s Australian Historical Palette
const KHAKI_TUNIC   = '#545032';
const KHAKI_LIGHT   = '#78734e';
const KHAKI_PANTS   = '#423e27';
const LEATHER_BROWN = '#482a16';
const BRASS_GOLD    = '#d6a636';
const FARMER_SHIRT  = '#7d3f18';
const FARMER_PANTS  = '#323a44';
const EMU_FEATHER   = '#3d3832';
const EMU_NECK      = '#5c5348';
const EMU_BEAK      = '#bfa034';

// ---------- OUTFIT RECIPES ----------
// Major Meredith: Officer tunic with brass buttons, Sam Browne belt, lapels, tie, chest pockets
O('officer1932', 'Australian Artillery Officer: tailored khaki tunic, brass buttons, Sam Browne cross-belt', 'Military', 'm',
  [KHAKI_TUNIC, WHITE, KHAKI_PANTS],
  [
    ['lapels', 'a', WHITE, 'tie', '#2e2b1d'],
    ['buttons', 5, BRASS_GOLD, .35, .88],
    ['pocket', .38, .22],
    ['suspenders', LEATHER_BROWN, .16],
    ['low', KHAKI_PANTS, .88],
    ['seams']
  ]);

// Gunner: Rolled sleeve khaki shirt, dual ammo bandolier, sturdy combat pants
O('gunner1932', 'Australian Lewis Gunner: rolled sleeve khaki shirt, ammunition webbing', 'Military', 'm',
  [KHAKI_LIGHT, KHAKI_TUNIC, KHAKI_PANTS],
  [
    ['shirtCollar', 'a'],
    ['buttons', 4, '#1e2018', .40, .88],
    ['pocket', .36, .20],
    ['suspenders', LEATHER_BROWN, .18],
    ['low', KHAKI_PANTS, .88],
    ['seams']
  ]);

// Farmer: Rugged Outback flannel work shirt, heavy trousers, leather suspenders
O('farmer1932', 'Outback Wheat Farmer: flannel work shirt, suspenders, canvas trousers', 'Civilian', 'm',
  [FARMER_SHIRT, '#c2b292', FARMER_PANTS],
  [
    ['top', 'a', .32],
    ['shirtCollar', 'a'],
    ['suspenders', LEATHER_BROWN, .22],
    ['low', FARMER_PANTS, .82],
    ['seams']
  ]);

// Emu Plumage Puppet
O('emuBody', 'Emu Plumage: shaggy grey-brown body with feather layers', 'Fauna', 'm',
  [EMU_FEATHER, EMU_NECK, EMU_BEAK],
  [
    ['top', 'a', .25],
    ['low', EMU_FEATHER, .90],
    ['seams']
  ]);

// ---------- SIGNATURE PIECES (Vector Ink Detailing) ----------
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

// MAJOR MEREDITH: Sam Browne diagonal leather strap + brass buckle + Rising Sun badge + swagger stick
const meredithSig = (ctx, G) => {
  const o = [];
  const k = G.k;
  const x1 = G.X(G.side ? .22 : -.36), y1 = G.Y(.16);
  const x2 = G.X(G.side ? -.22 : .34), y2 = G.Y(.76);

  // Diagonal leather cross-strap with highlight streak
  o.push(`<path d="M${f(x1)},${f(y1)} L${f(x2)},${f(y2)}" stroke="${LEATHER_BROWN}" stroke-width="${f(11 * k)}" stroke-linecap="round"/>`);
  o.push(`<path d="M${f(x1)},${f(y1)} L${f(x2)},${f(y2)}" stroke="${INK}" stroke-width="2.5" fill="none"/>`);
  o.push(`<path d="M${f(x1 - 1.5 * k)},${f(y1)} L${f(x2 - 1.5 * k)},${f(y2)}" stroke="#7a4e28" stroke-width="${f(2.5 * k)}" fill="none"/>`);

  // Brass belt buckle with shine glint
  const bx = G.X(G.side ? .04 : .0), by = G.Y(.76);
  o.push(`<rect x="${f(bx - 9 * k)}" y="${f(by - 7 * k)}" width="${f(18 * k)}" height="${f(14 * k)}" fill="${BRASS_GOLD}" stroke="${INK}" stroke-width="2.5" rx="3"/>`);
  o.push(`<rect x="${f(bx - 5 * k)}" y="${f(by - 4 * k)}" width="${f(10 * k)}" height="${f(8 * k)}" fill="${INK}" rx="1"/>`);
  o.push(`<circle cx="${f(bx - 3 * k)}" cy="${f(by - 2 * k)}" r="1.5" fill="#ffffff"/>`);

  // Gold Collar Badges
  if (!G.side) {
    for (const s of [-1, 1]) {
      const cx = G.X(s * 0.16), cy = G.Y(0.19);
      o.push(`<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(3.5 * k)}" fill="${BRASS_GOLD}" stroke="${INK}" stroke-width="1.5"/>`);
    }
  }
  return o;
};

// GUNNER: Canvas ammunition bandolier with copper .303 cartridges + chest webbing
const gunnerSig = (ctx, G) => {
  const o = [];
  const k = G.k;
  const x1 = G.X(G.side ? -.28 : .36), y1 = G.Y(.18);
  const x2 = G.X(G.side ? .22 : -.32), y2 = G.Y(.74);

  // Bandolier strap
  o.push(`<path d="M${f(x1)},${f(y1)} L${f(x2)},${f(y2)}" stroke="#3e3828" stroke-width="${f(13 * k)}" stroke-linecap="round"/>`);
  o.push(`<path d="M${f(x1)},${f(y1)} L${f(x2)},${f(y2)}" stroke="${INK}" stroke-width="2.5" fill="none"/>`);

  // 5 Copper cartridge loops with bullet tips
  for (let i = 0; i < 5; i++) {
    const t = 0.20 + i * 0.15;
    const px = x1 + (x2 - x1) * t;
    const py = y1 + (y2 - y1) * t;
    o.push(`<rect x="${f(px - 3.5 * k)}" y="${f(py - 6 * k)}" width="${f(7 * k)}" height="${f(12 * k)}" fill="${BRASS_GOLD}" stroke="${INK}" stroke-width="1.8" rx="1.5" transform="rotate(28 ${f(px)} ${f(py)})"/>`);
    o.push(`<circle cx="${f(px)}" cy="${f(py - 5 * k)}" r="${f(2 * k)}" fill="#b85c32"/>`);
  }
  return o;
};

// FARMER: Leather braces with metal buckles + wheat stalk
const farmerSig = (ctx, G) => {
  const o = [];
  const k = G.k;
  const wx = G.X(G.side ? .18 : -.22), wy = G.Y(.28);

  // Golden wheat stalk tucked in suspender
  o.push(`<path d="M${f(wx)},${f(wy + 22 * k)} Q${f(wx + 5 * k)},${f(wy)} ${f(wx + 12 * k)},${f(wy - 20 * k)}" stroke="#bfa034" stroke-width="3" fill="none" stroke-linecap="round"/>`);
  o.push(`<ellipse cx="${f(wx + 12 * k)}" cy="${f(wy - 20 * k)}" rx="${f(4.5 * k)}" ry="${f(9 * k)}" fill="#dec568" stroke="${INK}" stroke-width="1.8" transform="rotate(22 ${f(wx + 12 * k)} ${f(wy - 20 * k)})"/>`);

  // Suspender buckles
  if (!G.side) {
    for (const s of [-1, 1]) {
      const sx = G.X(s * 0.24), sy = G.Y(0.48);
      o.push(`<rect x="${f(sx - 4 * k)}" y="${f(sy - 3 * k)}" width="${f(8 * k)}" height="${f(6 * k)}" fill="#c0c0c0" stroke="${INK}" stroke-width="1.5" rx="1"/>`);
    }
  }
  return o;
};

// EMU: Feather fringes
const emuSig = (ctx, G) => {
  const o = [];
  for (let y = 0.28; y <= 0.82; y += 0.11) {
    const lx = G.X(-0.58), ly = G.Y(y);
    const rx = G.X(0.58), ry = G.Y(y);
    o.push(`<path d="M${f(lx)},${f(ly)} l-14,9 l12,-3" stroke="${INK}" stroke-width="2.8" fill="${EMU_FEATHER}"/>`);
    o.push(`<path d="M${f(rx)},${f(ry)} l14,9 l-12,-3" stroke="${INK}" stroke-width="2.8" fill="${EMU_FEATHER}"/>`);
  }
  return o;
};

// ---------- THE CAST DEFINITION (Pure White Skin, No Grey Face Shadow) ----------
const base = spec => ({
  form: 'standard',
  face: 'standard',
  views: true,
  sideFarArm: true,
  faceShadow: false, // MANDATORY: Crisp white comic face matching Image 5
  ...spec
});

export const CAST = [
  // 1. MAJOR MEREDITH (Artillery Commander)
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
    { col: '#32261e', hat: 'slouch', hatCol: '#524b33', bandCol: LEATHER_BROWN }
  ),

  // 2. GUNNER (Lewis Machine Gunner)
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
    { col: '#221a14', hat: 'slouch', hatCol: '#585139', bandCol: '#201e18' }
  ),

  // 3. WHEAT FARMER (Outback Settler)
  wear(
    base({
      name: 'farmer',
      label: 'Outback Wheat Farmer',
      size: 'fat',
      outfit: 'farmer1932',
      outfitPal: { a: FARMER_SHIRT, b: '#c2b292', c: FARMER_PANTS },
      dress: addSig(farmerSig)
    }),
    'baldTufts',
    { col: '#504840', hat: 'farmStraw', hatCol: '#755836', bandCol: '#24160e' }
  ),

  // 4. EMU BIRD (Guerrilla Runner)
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
