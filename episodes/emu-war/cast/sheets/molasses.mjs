// CAST of "The 1919 Boston Great Molasses Flood" (Boston North End, January 1919).
// Built strictly from the locked Rick's Clips character bible:
// Three body sizes (standard, fat, kid), hair_lib, head_wear, outfit_lib recipes and signatures.
// Puppets:
//   "cast:molasses/anthony"      - Young Boston North End workman (Hero/protagonist)
//   "cast:molasses/usaa_boss"    - Arthur Jell, Purity Distilling / USAA treasurer (Greedy executive)
//   "cast:molasses/chief"        - Peter Walsh, Boston Fire Chief (First responder)
//   "cast:molasses/kid_sal"      - North End street kid with syrup bucket
//   "cast:molasses/resident"     - Boston North End resident

import { wear, HATS2 } from '../head_wear.mjs';
import { O, SK, skPat, SKIN, WHITE } from '../outfit_lib.mjs';

export const TITLE = 'The 1919 Boston Great Molasses Flood: Cast';

const INK = '#2a1a1f', f = n => (+n).toFixed(1);

// 1919 Boston North End Palette
const SHIRT_CREAM = '#f4eee1';
const VEST_SLATE = '#3a4454';
const PANTS_CHARCOAL = '#2b2d35';
const LEATHER_BROWN = '#5c3a21';
const MOLASSES_DARK = '#241208';
const SUIT_NAVY = '#1e2436';
const SUIT_PINSTRIPE = '#2a324b';
const GOLD_WATCH = '#e5b83b';
const FIRE_RED = '#b52b27';
const FIRE_BLACK = '#222326';
const BRASS_YELLOW = '#d4a437';

// ---------- OUTFIT RECIPES ----------
// Anthony: 1919 Workman - buttoned slate vest over cream work shirt, rolled sleeves, braces
O('workman1919', 'Boston Workman 1919: cream shirt, slate vest, braces', 'America history', 'm', [SHIRT_CREAM, VEST_SLATE, PANTS_CHARCOAL],
  [['vest', 'b', .06, .45], ['shirtCollar', 'a'], ['buttons', 4, '#1b1d22', .45, .88], ['suspenders', '#1b1d22', .18], ['low', PANTS_CHARCOAL, .88], ['seams']]);

// Arthur Jell: 1919 USAA Executive - 3-piece pinstripe suit, high white collar, tie
O('executive1919', 'USAA Executive: dark 3-piece wool suit, necktie, vest', 'America history', 'm', [SUIT_NAVY, WHITE, SUIT_PINSTRIPE],
  [['lapels', 'a', WHITE, 'tie', '#781c1c'], ['vest', 'c', .2, .55], ['buttons', 4, GOLD_WATCH, .55, .88], ['low', SUIT_NAVY, .88], ['seams']]);

// Chief Walsh: 1919 Boston Fire Chief - double-breasted heavy coat, brass buttons
O('firechief1919', 'Boston Fire Chief 1919: heavy turnout coat, brass buttons', 'America history', 'm', [FIRE_BLACK, FIRE_RED, BRASS_YELLOW],
  [['top', 'a', .3], ['mandarin', FIRE_RED], ['buttons', 6, BRASS_YELLOW, .32, .88, .22], ['low', '#1a1a1d', .88], ['seams']]);

// Street Kid: 1919 Boston Kid - striped shirt, short pants, suspenders
O('kid1919', 'Boston Street Kid 1919: striped shirt, suspenders, short pants', 'America history', 'm', ['#e8e2d5', '#3d526e', '#4a3b32'],
  [['top', 'a', .3], ['suspenders', '#2b231f', .16], ['low', '#4a3b32', .75], ['seams']]);

// North End Matriarch: 1919 North End Woman - dark wool dress with checkered apron
O('matriarch1919', 'North End Matriarch 1919: wool dress, apron', 'America history', 'f', ['#3c3242', SHIRT_CREAM, '#694a38'],
  [['top', 'a', .3], ['vneck', SKIN, .15], ['apron', SHIRT_CREAM, .4, .85]], { skirt: P => SK('ankle', P.a, { pat: skPat.front(SHIRT_CREAM, 65), folds: 4 }) });


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

// ANTHONY'S SIGNATURE: Dark molasses smear on right forearm + red workman kerchief at neck
const anthonySig = (ctx, G) => {
  const o = [];
  const k = G.k;
  // Red bandana / neckerchief at throat
  const kx = G.X(G.side ? .18 : .0);
  const ky = G.Y(.10);
  o.push(`<path d="M${f(kx - 14 * k)},${f(ky)} L${f(kx + 14 * k)},${f(ky)} L${f(kx)},${f(ky + 18 * k)} Z" fill="${FIRE_RED}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`);
  // Molasses splatter smudge on right hip/forearm area
  const mx = G.X(G.side ? -.15 : -.42);
  const my = G.Y(.65);
  o.push(`<g opacity="0.92">
    <ellipse cx="${f(mx)}" cy="${f(my)}" rx="${f(10 * k)}" ry="${f(14 * k)}" fill="${MOLASSES_DARK}"/>
    <path d="M${f(mx - 4 * k)},${f(my + 10 * k)} Q${f(mx - 2 * k)},${f(my + 22 * k)} ${f(mx - 3 * k)},${f(my + 26 * k)}" stroke="${MOLASSES_DARK}" stroke-width="${f(4 * k)}" stroke-linecap="round" fill="none"/>
    <circle cx="${f(mx + 6 * k)}" cy="${f(my + 16 * k)}" r="${f(3 * k)}" fill="${MOLASSES_DARK}"/>
  </g>`);
  return o;
};

// USAA BOSS SIGNATURE: Albert gold pocket-watch chain across belly + cigar smoke curl
const bossSig = (ctx, G) => {
  const o = [];
  const k = G.k;
  const x1 = G.X(-.28), y1 = G.Y(.56);
  const x2 = G.X(.22), y2 = G.Y(.62);
  const cx = G.X(-.03), cy = G.Y(.68);
  // Gold watch chain loop
  o.push(`<path d="M${f(x1)},${f(y1)} Q${f(cx)},${f(cy)} ${f(x2)},${f(y2)}" fill="none" stroke="${GOLD_WATCH}" stroke-width="${f(3.5 * k)}" stroke-linecap="round"/>`);
  o.push(`<circle cx="${f(x1)}" cy="${f(y1)}" r="${f(4 * k)}" fill="${GOLD_WATCH}" stroke="${INK}" stroke-width="1.5"/>`);
  o.push(`<circle cx="${f(x2)}" cy="${f(y2)}" r="${f(4 * k)}" fill="${GOLD_WATCH}" stroke="${INK}" stroke-width="1.5"/>`);
  return o;
};

// CHIEF WALSH SIGNATURE: Brass Boston Fire Department shield badge + hose clasp
const chiefSig = (ctx, G) => {
  const o = [];
  const k = G.k;
  const bx = G.X(G.side ? .22 : -.26);
  const by = G.Y(.32);
  // Shield badge on chest
  o.push(`<path d="M${f(bx - 8 * k)},${f(by - 10 * k)} L${f(bx + 8 * k)},${f(by - 10 * k)} L${f(bx + 8 * k)},${f(by + 2 * k)} L${f(bx)},${f(by + 12 * k)} L${f(bx - 8 * k)},${f(by + 2 * k)} Z" fill="${BRASS_YELLOW}" stroke="${INK}" stroke-width="2"/>`);
  o.push(`<circle cx="${f(bx)}" cy="${f(by)}" r="${f(3 * k)}" fill="${FIRE_RED}"/>`);
  return o;
};

// STREET KID SIGNATURE: Molasses dribble on clothes
const kidSig = (ctx, G) => {
  const o = [];
  const k = G.k;
  const mx = G.X(G.side ? .1 : .25);
  const my = G.Y(.72);
  o.push(`<circle cx="${f(mx)}" cy="${f(my)}" r="${f(5 * k)}" fill="${MOLASSES_DARK}"/>`);
  o.push(`<path d="M${f(mx)},${f(my)} L${f(mx + 2 * k)},${f(my + 14 * k)}" stroke="${MOLASSES_DARK}" stroke-width="3" stroke-linecap="round"/>`);
  return o;
};

// ---------- THE CAST DEFINITION ----------
const base = spec => ({ form: 'standard', face: 'standard', views: true, sideFarArm: true, ...spec });

export const CAST = [
  // 1. ANTHONY (Hero / North End Workman):
  // Signature flat cap, rolled sleeves, neckerchief, molasses smear, curly dark hair.
  wear(
    base({
      name: 'anthony',
      label: 'Anthony (Hero Workman)',
      size: 'standard',
      outfit: 'workman1919',
      outfitPal: { a: SHIRT_CREAM, b: VEST_SLATE, c: PANTS_CHARCOAL },
      dress: addSig(anthonySig)
    }),
    'curlyCrop',
    { col: '#2a1e17', hat: 'flatcap', hatCol: '#45474f' }
  ),

  // 2. USAA EXECUTIVE (Arthur Jell):
  // Fat body, bowler derby hat, gold pocket watch chain, cigar-smoking corporate boss.
  wear(
    base({
      name: 'usaa_boss',
      label: 'Arthur Jell (USAA Boss)',
      size: 'fat',
      outfit: 'executive1919',
      outfitPal: { a: SUIT_NAVY, b: WHITE, c: SUIT_PINSTRIPE },
      dress: addSig(bossSig)
    }),
    'baldTufts',
    { col: '#6b6770', hat: 'bowler', hatCol: '#212026' }
  ),

  // 3. BOSTON FIRE CHIEF (Peter Walsh):
  // Standard body, leather fire helmet, heavy double-breasted turnout coat, brass shield badge.
  wear(
    base({
      name: 'chief',
      label: 'Chief Peter Walsh (Fire Chief)',
      size: 'standard',
      outfit: 'firechief1919',
      outfitPal: { a: FIRE_BLACK, b: FIRE_RED, c: BRASS_YELLOW },
      dress: addSig(chiefSig)
    }),
    'sidePart',
    { col: '#332924', hat: 'police', hatCol: '#1e1f24', bandCol: FIRE_RED }
  ),

  // 4. NORTH END STREET KID (Sal):
  // Kid form, running with a tin pail to collect leaking syrup.
  wear(
    base({
      name: 'kid_sal',
      label: 'Sal (North End Kid)',
      form: 'kid',
      outfit: 'kid1919',
      outfitPal: { a: '#e8e2d5', b: '#3d526e', c: '#4a3b32' },
      dress: addSig(kidSig)
    }),
    'cowlick',
    { col: '#4a3222', hat: 'beanie', hatCol: '#8a4232' }
  ),

  // 5. NORTH END RESIDENT (Mrs. Clougherty):
  // Fat female body, headscarf, apron, witnessing the wall of molasses.
  wear(
    base({
      name: 'resident',
      label: 'Mrs. Clougherty (Resident)',
      size: 'fat',
      outfit: 'matriarch1919',
      outfitPal: { a: '#3c3242', b: SHIRT_CREAM, c: '#694a38' }
    }),
    'grannyBun',
    { col: '#a8a2a0', hat: 'headscarf', hatCol: '#52435e' }
  )
];
