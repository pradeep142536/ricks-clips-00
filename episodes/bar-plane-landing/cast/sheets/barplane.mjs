// CAST of "The Man Who Landed a Plane at a Bar—Twice" (1956 Manhattan NYC)
// Locked RicksClips vector style: crisp #2a1a1f ink lines, pure white faces (faceShadow: false),
// unlit self-illuminated legibility on every turn, full 4-view support.

import { wear } from '../head_wear.mjs';
import { O, WHITE } from '../outfit_lib.mjs';

export const TITLE = '1956 Bar Plane Landing: Cast';

const INK = '#2a1a1f', f = n => (+n).toFixed(1);

const BOMBER_BROWN  = '#6a4024';
const BOMBER_COLLAR = '#d8c5a0';
const SLACKS_GREY   = '#3a3d46';
const PATRON_BURG   = '#7b2f34';
const PATRON_SHIRT  = '#d9ceb8';
const PATRON_PANTS  = '#2d323b';
const COP_NAVY      = '#22314d';
const COP_PANTS     = '#192338';
const BRASS_GOLD    = '#e0b13a';

O('pilot1956', '1956 NYC Pilot: leather bomber jacket with shearling collar, slacks', 'Civilian', 'm',
  [BOMBER_BROWN, BOMBER_COLLAR, SLACKS_GREY],
  [
    ['lapels', 'b', WHITE, 'tie', '#4b2d18'],
    ['pocket', .38, .22],
    ['low', SLACKS_GREY, .86],
    ['seams']
  ]);

O('patron1956', '1956 Bar Regular: knit sweater vest over crisp collar shirt, suspenders', 'Civilian', 'm',
  [PATRON_BURG, PATRON_SHIRT, PATRON_PANTS],
  [
    ['shirtCollar', 'b'],
    ['buttons', 4, '#241a18', .40, .86],
    ['pocket', .34, .20],
    ['suspenders', '#3e261a', .18],
    ['low', PATRON_PANTS, .84],
    ['seams']
  ]);

O('cop1956', '1956 NYPD Patrolman: double-breasted navy police uniform, brass badge & belt', 'Uniform', 'm',
  [COP_NAVY, WHITE, COP_PANTS],
  [
    ['lapels', 'a', WHITE, 'tie', '#161b26'],
    ['buttons', 6, BRASS_GOLD, .32, .88],
    ['pocket', .36, .20],
    ['low', COP_PANTS, .86],
    ['seams']
  ]);

const geo = ctx => {
  const { cx, bodyTop: t, bodyBot: b, wB: w, side } = ctx;
  const H = b - t;
  const k = Math.max(.75, Math.min(1.35, w / (side ? 83 : 104)));
  return { X: u => cx + u * w, Y: v => t + v * H, H, k, side };
};

const addSig = (fn) => S => {
  const d = S.details;
  if (fn) S.details = ctx => [...(d ? d(ctx) : []), ...fn(ctx, geo(ctx))];
};

const pilotSig = (ctx, G) => {
  const o = [], k = G.k;
  const zx = G.X(G.side ? .16 : 0), y1 = G.Y(.22), y2 = G.Y(.78);
  o.push(`<path d="M${f(zx)},${f(y1)} L${f(zx)},${f(y2)}" stroke="${BRASS_GOLD}" stroke-width="${f(3.2 * k)}" stroke-linecap="round"/>`);
  if (!G.side) {
    const bx = G.X(-.24), by = G.Y(.34);
    o.push(`<rect x="${f(bx - 11 * k)}" y="${f(by - 5 * k)}" width="${f(22 * k)}" height="${f(10 * k)}" fill="${BRASS_GOLD}" stroke="${INK}" stroke-width="1.8" rx="2"/>`);
  }
  return o;
};

const copSig = (ctx, G) => {
  const o = [], k = G.k;
  const x = G.X(G.side ? .24 : -.25), y = G.Y(.30);
  // Shield badge
  o.push(`<path d="M${f(x)},${f(y - 11 * k)} L${f(x + 9 * k)},${f(y - 5 * k)} L${f(x + 7 * k)},${f(y + 9 * k)} L${f(x)},${f(y + 13 * k)} L${f(x - 7 * k)},${f(y + 9 * k)} L${f(x - 9 * k)},${f(y - 5 * k)} Z" fill="${BRASS_GOLD}" stroke="${INK}" stroke-width="2"/>`);
  // Leather patrol belt
  o.push(`<rect x="${f(G.X(-.82))}" y="${f(G.Y(.72))}" width="${f(G.X(.82) - G.X(-.82))}" height="${f(10 * k)}" fill="#1f1a1c" stroke="${INK}" stroke-width="2" rx="2"/>`);
  o.push(`<rect x="${f(G.X(-.1))}" y="${f(G.Y(.71))}" width="${f(G.X(.1) - G.X(-.1))}" height="${f(12 * k)}" fill="${BRASS_GOLD}" stroke="${INK}" stroke-width="1.8" rx="2"/>`);
  return o;
};

const base = spec => ({
  form: 'standard',
  face: 'standard',
  views: true,
  sideFarArm: true,
  faceShadow: false,
  ...spec
});

export const CAST = [
  wear(
    base({
      name: 'tommy',
      label: 'Tommy Fitzpatrick (1956 Pilot)',
      size: 'standard',
      outfit: 'pilot1956',
      outfitPal: { a: BOMBER_BROWN, b: BOMBER_COLLAR, c: SLACKS_GREY },
      dress: addSig(pilotSig)
    }),
    'sidePart',
    { col: '#2d1f16', hat: 'baseball', hatCol: '#4f3b2e' }
  ),
  wear(
    base({
      name: 'patron',
      label: 'Manhattan Bar Patron',
      size: 'fat',
      outfit: 'patron1956',
      outfitPal: { a: PATRON_BURG, b: PATRON_SHIRT, c: PATRON_PANTS },
    }),
    'combOver',
    { col: '#4a413b', hat: 'fedora', hatCol: '#5f564e' }
  ),
  wear(
    base({
      name: 'officer',
      label: 'NYPD Patrol Officer',
      size: 'standard',
      outfit: 'cop1956',
      outfitPal: { a: COP_NAVY, b: WHITE, c: COP_PANTS },
      dress: addSig(copSig)
    }),
    'buzz',
    { col: '#231d19', hat: 'police', hatCol: COP_NAVY }
  )
];
