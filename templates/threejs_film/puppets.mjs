// PUPPET ADAPTER: film state -> one SVG card, using the character package exactly as it is (never edited from here).
// The package is injected (initPuppets) so its folder is one config value: film.json "puppet_pkg" or --puppets.
// A new character = a new export in the package's cast.mjs, or a body form; nothing changes in this file.
import { applyPose } from './poses.mjs';
export const CARD = { W: 800, H: 1500, CX: 400, GY: 1440 };      // card canvas in rig pixels; GY = the ground line (feet), kept explicit so cards stand on the floor
let M = null;
export function initPuppets(mods) { M = mods; }                  // { char2d, memes, memes2, memes3?, bodies, cast, castkit?, castIndex?, grips? (grips.mjs: hands closed round held things, 2026-11-12) }

// which face set and hair a body form uses. The forms carry hair INSIDE their default meme, so the adapter has to
// re-attach it for every other face (rig hook wanted: forms export hair separately).
const FORM_SET = { lady: ['FEMALE', 'bob', 'egg'], elder: ['ELDER', 'gramps', 'potato'], baby: ['BABY', 'curl', 'BABY_HEAD'] };
const DROP_PROPS = { stationmaster: true };                      // its props() bakes an arm holding the watch; poses redraw arm + watch
const warned = new Set(); const warn = m => { if (!warned.has(m)) { warned.add(m); console.warn('puppets.mjs: ' + m); } };

function baseS(entry, view, dir) {
  const p = entry.puppet || 'form:standard'; let S, form = null;
  let spec = null;
  if (p.startsWith('cast:') && M.castkit && M.castIndex && M.castIndex[p.slice(5)]) { spec = M.castIndex[p.slice(5)]; S = M.castkit.buildChar({ ...spec, face: 'standard' }, CARD.CX); }   // hat, hair, costume and props from the sheet; the face is set per frame in svgFor
  else if (p.startsWith('form:') && M.bodies.FORMS[p.slice(5)]) { form = p.slice(5); S = M.bodies.formChar(form, CARD.CX, view, dir); }
  else if (M.cast && typeof M.cast[p] === 'function') S = M.cast[p](CARD.CX, view, dir, 'standard');
  else { warn('unknown puppet "' + p + '", using form:standard'); S = M.bodies.formChar('standard', CARD.CX, view, dir); }
  S = { ...S, x: CARD.CX, view, dir }; S.dy = CARD.GY - (S.ground ?? 900);       // feet always on the card's ground line
  // NO SHADOW ON FACES (CB 2026-11-15, lightning spear final v1): char2d draws a grey face shadow unless S.faceShadow === false. castkit.buildChar used to drop
  // spec.faceShadow, so a sheet's switch never reached the drawing. Off when film.json "face_shadow": false (whole cast), the cast entry's "face_shadow": false,
  // or the sheet spec's faceShadow: false. Default (none of these) = unchanged, the template's own face shadow stays.
  if (M.faceShadow === false || entry.face_shadow === false || (spec && spec.faceShadow === false)) S.faceShadow = false;
  for (const k of ['build', 'palette', 'shoes', 'eyewear', 'facialHair', 'facialHairCol', 'scarf', 'bowtie', 'badge', 'cuffs', 'rolledSleeves', 'plain', 'handShape']) {
    if (entry[k] !== undefined && S[k] === undefined) S[k] = entry[k];
  }
  if (S.build && M.char2d && M.char2d.applyBuild) S = M.char2d.applyBuild(S);
  return { S, form, name: p, spec };
}
function faceFn(setName, face) {
  const more = M.memes3 ? [M.memes3.TEEN, M.memes3.VILLAIN, M.memes3.MONSTER] : [];
  const order = setName ? [M.memes2[setName], M.memes.MEMES, M.memes2.FEMALE, M.memes2.ELDER, M.memes2.BABY, ...more] : [M.memes.MEMES, M.memes2.FEMALE, M.memes2.ELDER, M.memes2.BABY, ...more];
  for (const set of order) if (set && set[face]) return set[face];
  return null;
}
export const stateKey = (who, st) => [who, st.view, st.dir, st.pose, st.face, st.mouth, st.blink, st.prop, st.hand, st.handShape || '', st.shoes || '', st.build || '', st.tw ? st.tw.pose + '>' + st.tw.prop + '>' + st.tw.hand + '>' + st.u : '', st.idle || '', st.mt ?? '', st.fw ? (st.fw.face || '') + '>' + st.fu : '', st.lie_art || '', st.tgt ? st.tgt.join(',') : '', st.pop || '', st.lookX ?? '', st.lookY ?? '', st.headTilt ?? '', st._fxPhase ?? '', st._hatLag ? st._hatLag.join(',') : '', st._tieLag ? st._tieLag.join(',') : '', st._gait || '', st._walkPhase ?? '', st._talkPulse ?? ''].join('|') + (st.h3 || st.hat ? '|h3:' + (st.h3 || '') + ':' + (st.hat ? ['R', 'L'].map(k => st.hat[k] ? st.hat[k].join(',') : '').join(';') : '') : '');   // V4.0: visemes, fxPhase, secondary lag, hand/shoe/build keys

// character height in rig pixels (ground to top of the bare head), so a card can be sized in metres
const customCard = entry => { const p = entry.puppet || ''; const sp = p.startsWith('cast:') && M.castIndex && M.castIndex[p.slice(5)]; return sp && sp.card ? sp : null; };   // kit_patch (character-artist 2026-11-13): a cast spec with its own card drawer (the cat: a new body form, spec.card = { svg(st, CARD), metrics })
export function metrics(entry) {
  { const cc = customCard(entry); if (cc) return { ...cc.card.metrics, hy: cc.card.metrics.hy }; }
  const { S } = baseS(entry, 'front', 1), K = S.headK ?? 1.5, bodyTop = S.bodyTop ?? 333, hy = bodyTop - 100 * K * .78;
  const top = Math.min(...M.char2d.headPts(CARD.CX, hy, 100, S.head || 'rick').map(p => hy + (p[1] - hy) * K));
  return { px: (S.ground ?? 900) - top, headPx: 200 * K, hy: hy + S.dy };
}

// A cast character (castkit spec). Its sheet gives the hat, hair, beard, costume and held things; the film gives the face, mouth, blink and pose.
// "standard" (or no face) = the character's own face from its sheet. With pose "stand" it keeps its own arms, so a sword or a staff stays in the hand it was drawn in.
const SETS = () => ({ meme: M.memes.MEMES, female: M.memes2.FEMALE, baby: M.memes2.BABY, elder: M.memes2.ELDER, teen: M.memes3 && M.memes3.TEEN, villain: M.memes3 && M.memes3.VILLAIN, monster: M.memes3 && M.memes3.MONSTER });
// KIT FACES (2026-11-10, CB: one standard face that changes smoothly with the narration): "k:angry", "k:smirk", ... are the rig's own
// calm face family (char2d FACES). Their brows are numbers, so a change is in-betweened; eyes and mouth swap at the half-way frame.
function kitFace(st) {
  const F = { ...M.char2d.FACES, ...(M.epFaces || {}) };
  const raw = st.face || '';
  const n = raw.startsWith('k:') ? raw.slice(2) : (!(M.memes && M.memes.MEMES && M.memes.MEMES[raw]) && F[raw] ? raw : null);
  if (!n || !F[n]) return null;   // V4.0: supports 'k:<name>' & bare presets + non-destructive mouth viseme override & fxPhase
  const extra = {
    ...(st.lookX != null ? { lookX: st.lookX } : {}),
    ...(st.lookY != null ? { lookY: st.lookY } : {}),
    ...(st.mouth ? { mouth: st.mouth } : {}),
    ...(st._fxPhase != null ? { fxPhase: st._fxPhase } : {}),
  };
  const fromRaw = (st.fw && st.fw.face) || '';
  const fromN = fromRaw.startsWith('k:') ? fromRaw.slice(2) : (fromRaw && F[fromRaw] ? fromRaw : null);
  const b = F[n], a = fromN ? F[fromN] : st.fw && (!fromRaw || fromRaw === 'standard') ? F.standard : null, u = st.fu ?? 1;
  if (!a || u >= 1) return M.epFaces && M.epFaces[n] ? { ...M.epFaces[n], ...extra } : { expr: n, ...extra };
  const L = (x, y) => x + (y - x) * u, srcN = u < .5 ? (fromN || 'standard') : n;
  return { expr: srcN, brows: b.brows && a.brows ? b.brows.map((e, i) => e.map((v, j) => L(a.brows[i][j], v))) : b.brows, lidTilt: L(a.lidTilt || 0, b.lidTilt || 0), ...extra };
}
// 3/4 (CB 2026-11-10 03:22): head, hair and body stay exactly as in the front view; only eyes, brows and mouth shift. The rig slides the whole
// drawn-face layer, so hair that lives in that layer is wrapped in the inverse of that slide and stays where the front view has it.
const unslide = (parts, cx, view, dir) => { if (view !== '34' || !parts.length) return parts; const t = M.char2d.VIEWS['34'] * dir, k = 1 - .22 * Math.abs(t), sl = t * 100 * .42;
  return [`<g transform="translate(${cx},0) scale(${(1 / k).toFixed(4)},1) translate(${-cx},0) translate(${(-sl).toFixed(1)},0)">${parts.join('')}</g>`]; };
// TURNED HAIR (CB 2026-11-10: "the hair needs to cover the side view ... in 3/4 the head stays front, only the eyes point to the side"):
// in the SIDE view the hair is redrawn round the BACK of the head (it does not slide with the face). 3/4 keeps the front head (CB 03:22).
// soft shaded hair colour (CB 2026-11-11: turned and back hair need the graded hair colour): lighter crown, mid, darker ends; smooth, not banded
let HGID = 0;
const softHair = (c0, col, y0, y1) => { if (!c0.defs) return col; const C = M.char2d, id = 'hs' + (HGID++);
  c0.defs.push(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="${y0}" x2="0" y2="${y1}"><stop offset="0" stop-color="${C.tint(col, .28)}"/><stop offset=".45" stop-color="${col}"/><stop offset="1" stop-color="${C.shade(col, .62)}"/></linearGradient>`); return `url(#${id})`; };
function turnedHair(key, shape, view, dir) {
  return (c0) => { const { cx, hy } = c0, C = M.char2d, h = M.memes2.hairFor(key, cx, hy, shape), all = h.back.join('') + h.front.join(''), col = (all.match(/fill="(#[0-9a-fA-F]{6})"/) || [])[1], side = view === 'side';
    const hf = () => col;   // CB 2026-11-11: same hair colour as front and 3/4 (flat colour + light highlight strokes + dark lines), not a gradient
    const LITE = '#b07a4f', DARK = '#4f2c1a', TIE = '#e8668a';   // CB 2026-11-11: turned hair keeps the shaded hair colour (light / mid / dark bands), like the front
    if (!col) return h.front;
    if (key !== 'bob') return [...h.front.join('').matchAll(/<circle cx="([-\d.]+)"[^>]*\/>/g)].filter(m => (parseFloat(m[1]) - cx) * dir < (side ? 10 : 60)).map(m => m[0]);   // tufts: only the ones on the back half
    const X = u => cx + dir * u, a0 = -46, a1 = 124;   // CB 2026-11-10 03:29: the women's side hair = the shape first drawn for 3/4 (more face, hair round the back)
    const HP = C.headPts(cx, hy, 100, typeof shape === 'string' ? shape : 'egg', dir < 0).map(([x, y]) => [cx + (x - cx) * 1.06, hy + (y - hy) * 1.06]);
    const A = ([x, y]) => { const a = Math.atan2(y - hy, (x - cx) * dir) * 180 / Math.PI; return a <= 0 ? a : a - 360; };       // 0 = the way the face looks, -90 = top, -180 = back of the head
    const rim = HP.map(p => [A(p), p]).filter(([a]) => a <= a0 && a >= a1 - 360).sort((p, q) => q[0] - p[0]).map(([, p]) => p);
    const line = [[X(-58), hy + 52], [X(-50), hy + 6], [X(-34), hy - 40], [X(-2), hy - 66], [X(40), hy - 70]];
    const bun = `<ellipse cx="${X(-26)}" cy="${hy - 124}" rx="34" ry="32" fill="${hf(hy - 156, hy - 92)}" stroke="${C.INK}" stroke-width="5"/>`;
    const shine = [C.brush(X(-62), hy - 40, X(-50), hy - 84, X(-10), hy - 92, 7, { col: LITE, tip: .25 }), C.brush(X(-30), hy - 128, X(-22), hy - 144, X(-6), hy - 138, 6, { col: LITE, tip: .3 }),
      `<path d="M${X(-40)},${hy - 128} q${dir * 12},-14 ${dir * 28},-2" fill="none" stroke="${DARK}" stroke-width="3.4" stroke-linecap="round"/>`,
      `<ellipse cx="${X(-26)}" cy="${hy - 94}" rx="18" ry="7" fill="${TIE}" stroke="${C.INK}" stroke-width="3"/>`].join('');
    const strands = [0, 1, 2].map(i => `<path d="M${X(-30 - i * 22)},${hy - 78 + i * 16} q${-dir * (10 + i * 4)},40 ${-dir * (2 - i * 4)},${86 - i * 14}" fill="none" stroke="${DARK}" stroke-width="3.4" stroke-linecap="round"/>`);
    return [bun, `<path d="${C.smooth([...rim, ...line])}" fill="${hf(hy - 110, hy + 60)}" stroke="${C.INK}" stroke-width="5" stroke-linejoin="round"/>`, shine, ...strands]; };
}
// BACK VIEW (2026-11-10, CB: full silhouette from front, 3/4, side or back): from behind the head is covered by its hair, never bald,
// and face parts (beards, moustaches) go UNDER the head so only the ends that stick out past it show.
function backHair(key, shape) {
  return (c0) => { const { cx, hy } = c0, h = M.memes2.hairFor(key, cx, hy, shape), col = ((h.back.join('') + h.front.join('')).match(/fill="(#[0-9a-fA-F]{6})"/) || [])[1];
    if (key !== 'bob' || !col) return h.front;                  // side tufts and a baby curl read the same from behind
    const C = M.char2d, HP = C.headPts(cx, hy, 100, typeof shape === 'string' ? shape : 'egg').map(([x, y]) => [cx + (x - cx) * 1.05, Math.min(hy + (y - hy) * 1.05, hy + 58 + 9 * Math.cos((x - cx) / 16))]);
    const strands = [-44, -14, 18, 46].map((dx, i) => `<path d="M${cx + dx},${hy - 70 + (i % 2) * 14} q${6 - i * 3},48 ${-4 + i * 2},${96 - (i % 2) * 10}" fill="none" stroke="#4f2c1a" stroke-width="3.4" stroke-linecap="round"/>`);
    const hf = col, LITE = '#b07a4f', TIE = '#e8668a';   // CB 2026-11-11: same colour, highlights, lines and pink tie as the front
    const extra = [C.brush(cx - 70, hy - 50, cx - 50, hy - 92, cx - 6, hy - 100, 7, { col: LITE, tip: .25 }), C.brush(cx + 14, hy - 98, cx + 46, hy - 96, cx + 70, hy - 62, 6, { col: LITE, tip: .25 }),
      `<ellipse cx="${cx + 6}" cy="${hy - 104}" rx="19" ry="7" fill="${TIE}" stroke="${C.INK}" stroke-width="3"/>`];
    return [`<path d="${C.smooth(HP)}" fill="${hf}" stroke="${C.INK}" stroke-width="5" stroke-linejoin="round"/>`, ...strands, ...extra]; };
}

// ---- MOTION LIBRARY BRIDGE (2026-11-11). A pose "m:<id>[@offset | @=frozen time][+props]" plays a move from templates/motion_styles on ANY puppet (cast or form):
// <id> = a library id (hammer/A, sleep/B, walk/A ...) or "<module>[#export]/<style>". The move gives view, body lean, planted bending legs, hands and head tilt;
// the film keeps the face (CB: faces change on the word). The move's own drawn props (post, chair, hammer) are left out unless "+props": the film's props are 3D.
// Same drawing rules as motion_styles/rig.mjs drawPose, but on the film's character and in card pixels.
const MG = 1010, CENTRE = /^(walk|run|crawl|sneak|carry|push|bike|dragged|queue)\b/;
const rotP = (p, deg, c) => { const r = deg * Math.PI / 180, s = Math.sin(r), k = Math.cos(r), dx = p[0] - c[0], dy = p[1] - c[1]; return [c[0] + dx * k - dy * s, c[1] + dx * s + dy * k]; };
const chNums = new Map();
function chOf(entry) {
  const k = entry.puppet || 'form:standard'; if (chNums.has(k)) return chNums.get(k);
  const { S } = baseS(entry, 'front', 1), bodyTop = S.bodyTop ?? 333, bodyBot = S.bodyBot ?? 640, ground = S.ground ?? 900, K = S.headK ?? 1.5, hipY = bodyBot - 30, legL = Math.hypot(23, (ground - 7) - hipY);
  const fr = S.arms({ cx: CARD.CX, view: 'front', dir: 1, turn: 0 }).front, a = fr[fr.length - 1], m = /M\s*([-\d.]+)[ ,]+([-\d.]+)/.exec(a.d), sh = [Math.abs(+m[1] - CARD.CX), +m[2]], armL = (a.len0 ?? Math.hypot(a.hand[0] - +m[1], a.hand[1] - +m[2])) * 1.24;   /* len0: cast-size arms are drawn long now (bodies.mjs castArms); film length unchanged */   // CB 2026-11-15 (gold mine clip): arms a little LONGER, a hanging hand almost at the body's bottom edge (was x1.06)
  const ch = { form: 'cast', bodyTop, bodyBot, ground, K, hipY, legL, sh, armL, handX: Math.abs(a.hand[0] - CARD.CX), hy: bodyTop - 100 * K * .78, hipW: S.hipW ?? 13 }; chNums.set(k, ch); return ch;
}
// ---- CHARACTER ENGINE V3.5 ARTICULATED GAIT SYNTHESIZER (walk, sneak, run, idle_alive) ----
function solveKnee2Seg(H, A, L, bendDir) {
  let dx = A[0] - H[0], dy = A[1] - H[1], d = Math.hypot(dx, dy) || 1;
  const maxD = L * 0.985;
  if (d > maxD) { A = [H[0] + dx * maxD / d, H[1] + dy * maxD / d]; dx = A[0] - H[0]; dy = A[1] - H[1]; d = maxD; }
  const h = Math.sqrt(Math.max(16, (L * 0.5) ** 2 - (d * 0.5) ** 2));
  let nx = -dy / d, ny = dx / d;
  if (nx * bendDir < 0) { nx = -nx; ny = -ny; }
  const K = [(H[0] + A[0]) * 0.5 + nx * h, (H[1] + A[1]) * 0.5 + ny * h];
  return [H, K, A];
}
function gaitArmSeg(sh, uDeg, elDeg, L, sd, behind, over, handShape = 'open_palm') {
  const rU = uDeg * Math.PI / 180, rF = (uDeg + elDeg) * Math.PI / 180, l2 = L * 0.5;
  const E = [sh[0] + sd * Math.sin(rU) * l2, sh[1] + Math.cos(rU) * l2];
  const H = [E[0] + sd * Math.sin(rF) * l2, E[1] + Math.cos(rF) * l2];
  return { s: sh, c: E, h: H, behind, over, twoSeg: true, handShape };
}
function gaitOf(entry, st) {
  const gm = /^gait:(walk|sneak|run|idle_alive)$/.exec(st.pose || '');
  if (!gm) return null;
  const gait = gm[1], ch = chOf(entry), ph = st._walkPhase || 0, t = st.mt || 0;
  const view = st._walkView || st.view || (gait === 'idle_alive' ? '34' : 'side');
  const dir = st._walkDir || st.dir || 1, side = view === 'side', front = view === 'front' || view === 'back';
  const bx = 0, proj = side ? 1 : (view === '34' ? 0.76 : 0.22), sin = Math.sin, cos = Math.cos, PI = Math.PI;
  const shY = ch.sh[1] + (side || view === '34' ? 30 : 0);
  const shPts = side ? [[dir * 12, shY], [dir * 12, shY]] : [[-ch.sh[0], shY], [ch.sh[0], shY]];
  const farArmIdx = side ? 0 : (view === '34' ? (dir === 1 ? 1 : 0) : -1);

  if (gait === 'idle_alive') {
    const br = sin(t * PI * 2 / 2.6), sway = sin(t * PI * 2 / 3.8);
    const pulse = st._talkPulse || 0, talking = pulse > 0.01;
    const gSide = Math.sin(t * 7.2) >= 0 ? 1 : 0;
    const hSh = st.handShape || (M.char2d.inferHandShape ? M.char2d.inferHandShape(st) : 'open_palm');
    const arms = [0, 1].map(i => {
      const s = side ? dir : (i ? 1 : -1), isGest = talking && (i === gSide || pulse > 0.65);
      const uDeg = isGest ? (30 + 24 * pulse) : (8 + 4 * br * (i ? 1 : -1));
      const eDeg = isGest ? (56 + 34 * pulse) : (18 + 5 * br);
      return gaitArmSeg(shPts[i], uDeg, eDeg, ch.armL, s, i === farArmIdx, false, hSh);
    });
    const feet = side ? [{ x: -24 * dir, lift: 0, toe: 0 }, { x: 26 * dir, lift: 0, toe: 0 }] : [{ x: -36, lift: 0, toe: -12 }, { x: 36, lift: 0, toe: -12 }];
    const P = { view, dir, x: 3 * sway, y: 2.5 * br, rot: 1.4 * sway, feet, arms, head: 2.5 * sway + (talking ? -3 * pulse * dir : 0), twoSegArms: true };
    return { P, ch, lag: st._clothLag || [0, 0], dark: !!st.dark, lit: !!st.lit, pop: st.pop || 0, centre: false, props: false, mirror: false };
  }

  // Confident Walk / Crouched Sneak / Dash Run: V4.0 +25%+ wider arm-swing arc clearing torso silhouette cleanly
  const cfg = gait === 'run'
    ? { half: 148 * proj, duty: 0.36, lift: 150, lean: 25, dropBase: 36, bob: 44, armU: 74, armElBase: 68, armElAmp: 28, toeSw: [-38, 18], toeSt: [16, -24], stepBias: 0 }
    : gait === 'sneak'
    ? { half: 92 * proj, duty: 0.56, lift: 142, lean: 20, dropBase: 68, bob: 14, armU: 34, armElBase: 76, armElAmp: 20, toeSw: [36, 48], toeSt: [34, 42], crouchLift: 8 }
    : { half: 115 * proj, duty: 0.55, lift: 78, lean: 8, dropBase: 26, bob: 22, armU: 48, armElBase: 26, armElAmp: 30, toeSw: [-18, 16], toeSt: [12, -16], crouchLift: 0 };

  const feet = [];
  const hipBase = ch.hipY;
  // Pass 1: compute raw foot anchors & contact drop needed across both legs
  const legSpecs = [0, 1].map(i => {
    const phi0 = (ph + i * 0.5), phi = phi0 - Math.floor(phi0);
    const onGround = phi < cfg.duty;
    let fx, lift, toe;
    if (onGround) {
      const u = phi / cfg.duty;
      fx = (1 - 2 * u) * cfg.half;
      lift = cfg.crouchLift || 0;
      toe = cfg.toeSt[0] + (cfg.toeSt[1] - cfg.toeSt[0]) * u;
    } else {
      const u = (phi - cfg.duty) / (1 - cfg.duty), su = sin(PI * u);
      const easeU = u < 0.5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u);
      fx = (-1 + 2 * easeU) * cfg.half;
      lift = cfg.lift * Math.pow(Math.max(0, su), gait === 'sneak' ? 0.85 : 0.95);
      toe = cfg.toeSw[0] + (cfg.toeSw[1] - cfg.toeSw[0]) * u;
    }
    const worldX = side ? bx + dir * fx : (view === '34' ? bx + dir * fx + (i ? 26 : -26) : (i ? 38 : -38));
    const frontFootLiftForeshorten = front ? (!onGround ? lift * 0.72 : 0) : lift;
    return { worldX, lift: frontFootLiftForeshorten, toe, swingCos: cos(2 * PI * phi) };
  });

  const hipLocal = side ? [[-12 * dir, hipBase], [10 * dir, hipBase]] : [[-(ch.hipW ?? 13) * 2.4, hipBase], [(ch.hipW ?? 13) * 2.4, hipBase]];
  const leanDeg = (front ? 3 : cfg.lean) * dir;
  const osc = Math.abs(sin(2 * PI * ph));
  let bodyY = gait === 'sneak' ? cfg.dropBase + cfg.bob * osc : cfg.dropBase - cfg.bob * (1 - osc);
  // Guarantee planted legs always reach floor without hyperextension
  let needY = 0;
  for (let i = 0; i < 2; i++) {
    const ay = MG - 7 - legSpecs[i].lift, dx = legSpecs[i].worldX - hipLocal[i][0], maxSpan = ch.legL - (gait === 'sneak' ? 28 : 10);
    const can = Math.sqrt(Math.max(0, maxSpan * maxSpan - dx * dx));
    needY = Math.max(needY, (ay - can) - hipLocal[i][1]);
  }
  bodyY = Math.max(needY, bodyY);
  const piv = [bx, hipBase + bodyY], toW = p => rotP([p[0] + bx, p[1] + bodyY], leanDeg, piv);
  const bendDir = side ? dir : (view === '34' ? dir : 0);

  for (let i = 0; i < 2; i++) {
    const hp = toW(hipLocal[i]), ay = MG - 7 - legSpecs[i].lift, ax = legSpecs[i].worldX;
    const fdir = side ? dir : (view === '34' ? dir : (i ? 1 : -1)), fl = side ? 44 : 32, ta = legSpecs[i].toe * PI / 180;
    const kd = bendDir || (i ? 1 : -1);
    const [H, K, A] = solveKnee2Seg(hp, [ax, ay], ch.legL, kd);
    const toePt = [A[0] + fdir * fl * cos(ta), A[1] - fl * sin(ta)];
    feet.push({ x: ax, lift: legSpecs[i].lift, toe: legSpecs[i].toe, pts: [H, K, A, toePt], curve: true });
  }

  // Opposite arms with true 2-segment shoulder -> elbow -> hand articulation (+25%+ outer arc clearance)
  const strideCos = cos(2 * PI * ph);   // +1 when leg[0] forward -> arm[0] swings BACK (-1), arm[1] swings FRONT (+1)
  const armHandShape = st.handShape || (gait === 'run' ? 'clenched_fist' : 'open_palm');
  const arms = [0, 1].map(i => {
    const s = side ? dir : (i ? 1 : -1);
    const swing = (i === 0 ? -strideCos : strideCos);
    const uDeg = view === '34' ? (24 + swing * cfg.armU * 0.72) : (gait === 'sneak' ? (cfg.armU + 16 * swing) : (cfg.lean * 0.25 + swing * cfg.armU));
    const eDeg = cfg.armElBase + cfg.armElAmp * Math.max(0, swing);
    return gaitArmSeg(shPts[i], uDeg, eDeg, ch.armL, s, i === farArmIdx, false, armHandShape);
  });

  const headBob = (gait === 'sneak' ? -8 : gait === 'run' ? -10 : -2) * dir + 3.5 * sin(2 * PI * ph - 0.8) * dir;
  const P = { view, dir, x: bx, y: bodyY, rot: leanDeg, pivot: piv, feet, arms, head: headBob, twoSegArms: true };
  return { P, ch, lag: st._clothLag || [0, 0], dark: !!st.dark, lit: !!st.lit, pop: st.pop || 0, centre: false, props: false, mirror: false };
}
function moveOf(entry, st) {
  if (/^gait:/.test(st.pose || '')) return gaitOf(entry, st);
  if (!M.motion || !/^m:/.test(st.pose || '')) return null;
  const m = /^m:([^@+]+)(?:@(=?)([-\d.]+))?(\+props)?/.exec(st.pose), id = m[1], e = M.motion.LIB.find(x => x.id === id), k = id.lastIndexOf('/');
  const [mn, ex = 'default'] = (e ? e.module : id.slice(0, k)).split('#'), style = e ? e.style : id.slice(k + 1), mod = M.motion.mods[mn]; if (!mod) { warn('move "' + id + '" not loaded'); return null; }
  const walkKind = /^(walk|run)$/.test(mn) ? st._walkView : null;
  const frontal = walkKind ? (walkKind === 'front' || walkKind === 'back') : (st.view === 'front' || st.view === '34');
  let v = mod[ex]; if (frontal) v = (ex === 'default' ? mod.front || (M.motion.mods[mn + '_front'] || {}).default : mod[ex.replace(/Side$/, '') + 'Front']) || v;
  const sty = v && v.styles && v.styles.find(s => s.key === style); if (!sty) { warn('move "' + id + '" has no style ' + style); return null; }
  const ch0 = chOf(entry), t = m[2] ? +m[3] : (st.mt || 0) + (m[3] ? +m[3] : 0), flipT = (st.dir || 1) === -1, ch = st.tgt ? { ...ch0, tgt: flipT ? [-st.tgt[0], st.tgt[1]] : st.tgt } : ch0; let P = sty.pose(t, ch);   /* kit_patch: ch.tgt = film.json hand_at, projected on the card (mirrored when the card is) */ const lag = M.motion.cloth && !m[2] ? M.motion.cloth.clothLag(u => sty.pose(u, ch), t, ch) : [0, 0]; /* LIVE CLOTH 2026-11-12: follow-through of long cloth and capes (a frozen pose has none) */ const extra = P.poses ? P : null; if (P.poses) P = P.poses[0];
  let view = P.view || 'side', dir = P.dir || 1;
  if (walkKind === '34') {
    const d = st._walkDir || st.dir || 1, bx = P.x || 0;
    view = '34'; dir = d;
    P = {
      ...P, view: '34', dir: d,
      rot: (P.rot || 0) * d,
      head: (P.head || 0) * d,
      feet: (P.feet || []).map(ft => ({ ...ft, x: bx + (ft.x - bx) * 0.72 * d })),
      hands: (P.hands || [null, null]).map((h, i) => !h || h.wx != null || h.lx != null ? h : {
        lx: (i ? ch.sh[0] : -ch.sh[0]) + d * (h.f || 0) * 0.62 * ch.armL,
        ly: ch.sh[1] + (h.d ?? 0.8) * ch.armL,
        bow: h.bow ?? 0.45,
        bias: [-d * 0.8, 0.6]
      })
    };
  } else if (walkKind === 'back') {
    view = 'back'; dir = st._walkDir || st.dir || 1;
    P = { ...P, view: 'back', dir };
  } else if (st.tgt && flipT && (view === 'front' || view === 'back')) {
    P = sty.pose(t, { ...ch0, tgt: st.tgt }); if (P.poses) P = P.poses[0];
  }
  return { P, ch, lag, dark: !!st.dark, lit: !!st.lit, pop: st.pop || 0, centre: CENTRE.test(e ? e.action : mn), props: !!m[4], back: (extra || P).back, front: (extra || P).front, mirror: (st.dir || 1) === -1 && view === 'side' };
}
function moveArms(P, ch, xo) {
  const view = P.view || 'side', dir = P.dir || 1, side = view === 'side', x = (P.x || 0) - xo, y = P.y || 0, rot = P.rot || 0, piv = P.pivot ? [P.pivot[0] - xo, P.pivot[1]] : [x, ch.hipY + y];
  const toLocal = w => { const q = rotP([w[0] - xo, w[1]], -rot, piv); return [q[0] - x, q[1] - y]; }, toW = p => rotP([p[0] + x, p[1] + y], rot, piv);
  const shg = Array.isArray(P.shrug) ? P.shrug : [P.shrug || 0, P.shrug || 0], shY = [ch.sh[1] - shg[0], ch.sh[1] - shg[1]];   /* animator fix 6: P.shrug = shoulders hunched up (card units, one or per hand), e.g. fists on the ears */
  const near34 = view === '34' ? (dir === 1 ? 0 : 1) : -1;   // CB 2026-11-15: 3/4 facing right = the screen-RIGHT arm goes behind the body and the screen-LEFT (near) arm hangs from the MIDDLE of the body; facing left mirrored
  const shL = side ? [[dir * 8, shY[0] + 35], [dir * 8, shY[1] + 35]]   /* CB 2026-11-15 era preview: side shoulder lower, clear of the head */ : [[-ch.sh[0], shY[0]], [ch.sh[0], shY[1]]];
  const W34 = (ch.handX ?? 120) - 14;   /* body half width */
  if (near34 >= 0) shL[near34] = [-dir * ch.sh[0], shY[near34] + 35];   // CB 2026-11-15: "a little bit more down, not too close to the head"
  const restH = side ? [[dir * 16, ch.bodyBot - 22], [dir * 16, ch.bodyBot - 22]] : [[-110, ch.bodyBot - 22], [110, ch.bodyBot - 22]]; if (near34 >= 0) { restH[near34] = [-dir * .85 * W34, ch.bodyBot - 22]; restH[1 - near34] = [dir * (W34 + 14), ch.bodyBot - 22]; }   /* CB 2026-11-15: arms on the side, not the middle */ const f = v => (+v + 0).toFixed(1), cx = CARD.CX;
  const H = (P.hands || [null, null]).map((h, i) => {
    const sh = shL[i], s = side ? dir : (i ? 1 : -1), L = ch.armL; let hand = restH[i];
    if (h && h.wx != null) hand = toLocal([h.wx, h.wy]); else if (h && h.lx != null) hand = [h.lx, h.ly]; else if (h) hand = [sh[0] + s * h.f * L, sh[1] + h.d * L];
    const bias = h && h.bias ? h.bias : side ? [-dir * .8, .6] : [s, .6], bow = h && h.bow != null ? h.bow : .5;
    let dx = hand[0] - sh[0], dy = hand[1] - sh[1]; const d = Math.hypot(dx, dy) || 1; if (d > L) { hand = [sh[0] + dx * L / d, sh[1] + dy * L / d]; }
    const dd = Math.min(d, L), off = Math.max(.10 * L, Math.sqrt(Math.max(0, (L / 2) ** 2 - (dd / 2) ** 2)) * 1.25) * bow * 2;
    let nx = -dy / d, ny = dx / d; if (nx * bias[0] + ny * bias[1] < 0) { nx = -nx; ny = -ny; }
    return { d: `M${f(sh[0] + cx)},${f(sh[1])} Q${f(sh[0] + (hand[0] - sh[0]) / 2 + nx * off + cx)},${f(sh[1] + (hand[1] - sh[1]) / 2 + ny * off)} ${f(hand[0] + cx)},${f(hand[1])}`, hand: [+f(hand[0] + cx), +f(hand[1])], world: toW(hand), over: !!(h && h.over), behind: !!(h && h.behind), sh: [sh[0] + cx, sh[1]] };
  });
  if (P.arms) { H.length = 0; P.arms.forEach(a => { const s0 = toLocal(a.s), c0 = toLocal(a.c), h0 = toLocal(a.h);   // CB 2026-11-15 + V3.5 2-seg elbow support
    let d;
    if (a.twoSeg) {
      const rEl = 24, clipPt = q => { const qq = Math.hypot(q[0] - c0[0], q[1] - c0[1]) || 1, t = Math.min(rEl, qq * 0.45) / qq; return [c0[0] + (q[0] - c0[0]) * t, c0[1] + (q[1] - c0[1]) * t]; }, pi = clipPt(s0), po = clipPt(h0);
      d = `M${f(s0[0] + cx)},${f(s0[1])} L${f(pi[0] + cx)},${f(pi[1])} Q${f(c0[0] + cx)},${f(c0[1])} ${f(po[0] + cx)},${f(po[1])} L${f(h0[0] + cx)},${f(h0[1])}`;
    } else {
      d = `M${f(s0[0] + cx)},${f(s0[1])} Q${f(c0[0] + cx)},${f(c0[1])} ${f(h0[0] + cx)},${f(h0[1])}`;
    }
    H.push({ d, hand: [+f(h0[0] + cx), +f(h0[1])], world: toW(h0), ang: Math.atan2(h0[1] - c0[1], h0[0] - c0[0]), handShape: a.handShape, over: a.over ?? !a.behind, behind: !!a.behind }); }); }
  return { H, x, y, rot, piv, toW, side, dir, view };
}
// hands of a move in CARD pixels (after lean and mirror) + the angle the move holds its tool at: the film's 3D held prop follows these (ep_kit "hand")
export function moveHands(entry, st) {
  const mv = moveOf(entry, st); if (!mv) return null; const xo = mv.centre ? (mv.P.x || 0) : 0, A = moveArms(mv.P, mv.ch, xo), oy = CARD.GY - MG;
  const hs = (mv.P.held || [])[0], am = hs ? /rotate\(([-\d.]+)\)/.exec(hs.svg(0, 0)) : null;
  const obj = mv.props ? (mv.P.held || []).find(x => x.obj) : null;   // kit_patch: a held 3D object (film.json held3d): which hand, lid, flame
  return { hands: A.H.map(h => [mv.mirror ? CARD.CX - h.world[0] : CARD.CX + h.world[0], h.world[1] + oy]), ang: am ? +am[1] * (mv.mirror ? -1 : 1) : 0, mirror: mv.mirror, held_hand: hs ? hs.hand : 1, obj: obj ? { obj: obj.obj, hand: obj.hand, lid: obj.lid ?? 0, fl: obj.fl ?? 0 } : null, view: A.view, handR: 15 };   // kit 2026-11-13: + view, fist radius (data only)
}
// kit 2026-11-13 HELD 3D, generic (props-hero): both fists of a PLAIN pose in CARD px, exactly where svgFor draws them (same applyPose, then the pose's lean and drop),
// with their shoulders, the far-hand flags (that fist is behind the body), the side a held thing points to and the fist radius. null for moves (use moveHands) and own-drawer cast.
export function poseHands(entry, st) {
  if (customCard(entry) || /^m:/.test(st.pose || '')) return null;
  const view = st.view || 'front', dir = st.dir || 1, { S, name } = baseS(entry, view, dir), K = S.headK ?? 1.5, hy = (S.bodyTop ?? 333) - 100 * K * .78;
  const pose = applyPose(S, { ...st, view, dir }, { INK: M.char2d.INK, headK: K, hy, dropProps: !!DROP_PROPS[name], grip: M.grips && M.grips.grip }); if (!pose.hands) return null;
  const tf = q => { const a = [q[0], q[1] + (S.dy || 0)], b = pose.rot ? rotP(a, pose.rot, [CARD.CX, CARD.GY]) : a; return [b[0], b[1] + (pose.dy || 0)]; };
  return { hands: { R: tf(pose.hands.R), L: tf(pose.hands.L) }, sh: { R: tf(pose.sh.R), L: tf(pose.sh.L) }, far: pose.far, gdir: pose.gdir, handR: pose.handR, view, dir };
}
function moveDraw(S, mv) {
  const C = M.char2d, { P, ch } = mv, xo = mv.centre ? (P.x || 0) : 0, A = moveArms(P, ch, xo), { H, x, y, rot, piv, toW, side, dir, view } = A, cx = CARD.CX, oy = CARD.GY - MG, f = v => (+v + 0).toFixed(1);
  S.view = view; S.dir = dir; S.noLegs = true; S.legPose = null; S.dy = oy; S.headTilt = (P.head || 0) + (mv._headTilt || 0); if (mv.pop) S.headK = (S.headK ?? 1.5) * (1 + mv.pop);   // V4.0 head tilt + pop
  const armW = S.armW ?? (S.legW ?? 17) + 2, handR = (S.handR ?? 15) + 10, defShape = C.inferHandShape ? C.inferHandShape({ ...mv._st, pose: mv._st?.pose }) : 'open_palm';
  const armSvg = a => `<path d="${a.d}" fill="none" stroke="${C.INK}" stroke-width="${armW}" stroke-linecap="round" stroke-linejoin="round"/>${C.drawHand ? C.drawHand(a.hand[0], a.hand[1], a.handShape || defShape, Math.sign(a.hand[0] - cx) || dir, a.ang ?? (Math.PI / 2), handR) : `<circle cx="${a.hand[0]}" cy="${a.hand[1]}" r="${handR}" fill="${C.INK}"/>`}`;
  const heldSvg = mv.props ? (P.held || []).map(h => h.obj && (M.held3d || []).includes(h.obj) ? { ...h, svg: () => '' } : h).map(h => ({ over: H[h.hand].over, s: M.grips && M.grips.heldSvg ? M.grips.heldSvg(h, H, S.handR ?? 15, C.INK) : h.svg(H[h.hand].hand[0], H[h.hand].hand[1]) })) : [];   // grips.mjs: held.wrap / held.grip close the fist round the tool
  // CB 2026-11-15 (references/rick_pose_traces): the limb AWAY from the lens = index farIdx (side 0; 3/4 the screen side behind the facing). The far arm goes
  // BEHIND the body in side and 3/4 (P.farArmFront keeps it in front); hand.behind / P.arms behind still choose it by hand (animator fix 7).
  const farIdx = side ? 0 : view === '34' ? (dir === 1 ? 1 : 0) : -1, overs = H.filter(a => a.over && !a.behind), ownProps = S.props;
  const behindArms = H.some(a => a.behind) ? H.filter(a => a.behind) : farIdx >= 0 && H[farIdx] && !H[farIdx].over && !P.farArmFront ? [H[farIdx]] : [];
  const frontArms = H.filter(a => !behindArms.includes(a)), extraBack = behindArms.slice(1);   /* animator fix 7: hand.behind = the arm goes BEHIND body + head (its held fist still draws over), e.g. a fist on the far side of a big head */   /* animator fix 7: hand.behind = the arm goes BEHIND body + head (its held fist still draws over), e.g. a fist on the far side of a big head */
  S.arms = () => ({ back: behindArms[0], front: frontArms.filter(a => !a.over) });
  S.over = () => [...overs.map(armSvg), ...heldSvg.filter(h => h.over).map(h => h.s)];
  S.props = () => heldSvg.filter(h => !h.over).map(h => h.s);
  const HIPW = (S.hipW ?? 13) * 2.4, spreadD = HIPW - (S.hipW ?? 13);   // CB 2026-11-15 (Rick, gold mine): front / 3/4 / back hips 2.4x wider, feet out by the same amount
  const hipLocal = side ? [[-12 * dir, ch.hipY], [10 * dir, ch.hipY]] : [[-HIPW, ch.hipY], [HIPW, ch.hipY]], hips = hipLocal.map(toW);
  // CB 2026-11-15: "when he looks to the right side, the left leg is the one at the front, the right leg behind the body": side = feet[0] (the rear hip) is the NEAR leg,
  // feet[1] the far one; 3/4 facing right = the screen-left leg near (mirrored facing left). Arms keep farIdx.
  const legFarIdx = side ? 1 : view === '34' ? (dir === 1 ? 1 : 0) : -1;
  const LEG = P.legW ?? S.legW ?? 17, legs = [], legsF = [], legsW = [], FAR = '#544656';   // FAR: the far leg one tone lighter when lit (Rick: near ~7 %, far ~19 % lightness)
  const shoeStyle = S.shoes === false ? 'none' : (S.shoes || 'loafers');
  (P.feet || []).forEach((ft, i) => {
    const hp = hips[i]; let Aa = [ft.x - xo + (side ? 0 : (i ? 1 : -1) * spreadD), MG - 7 - (ft.lift || 0)], dx = Aa[0] - hp[0], dy = Aa[1] - hp[1], d = Math.hypot(dx, dy) || 1; const L = ch.legL * (ft.len || 1);
    if (d > L) { Aa = [hp[0] + dx * L / d, hp[1] + dy * L / d]; dx = Aa[0] - hp[0]; dy = Aa[1] - hp[1]; d = L; }
    const sd = side ? dir : (i ? 1 : -1), kd = side ? dir * (ft.knee || 1) : sd * (ft.knee || 1);
    let nx = -dy / d, ny = dx / d; if (nx * kd < 0) { nx = -nx; ny = -ny; }
    const off = Math.max(7, Math.sqrt(Math.max(0, (L / 2) ** 2 - (d / 2) ** 2)) * (ft.kneeK ?? 1)); let K = ft.kneeAt ? [ft.kneeAt[0] - xo, ft.kneeAt[1]] : [(hp[0] + Aa[0]) / 2 + nx * off, (hp[1] + Aa[1]) / 2 + ny * off];   // ft.kneeAt: exact knee (world)
    if (ft.thigh != null) { const a = ft.thigh * Math.PI / 180, kd2 = side ? dir : sd, K2 = [hp[0] + kd2 * L / 2 * Math.cos(a), hp[1] + L / 2 * Math.sin(a)], vx = Aa[0] - K2[0], vy = Aa[1] - K2[1], vl = Math.hypot(vx, vy) || 1, A2 = [K2[0] + vx / vl * L / 2, K2[1] + vy / vl * L / 2], mx = ft.mix ?? 1, L2 = (p, q) => p + (q - p) * mx;
      K = [L2(K[0], K2[0]), L2(K[1], K2[1])]; Aa = [L2(Aa[0], A2[0]), L2(Aa[1], A2[1])]; }
    const fdir = side ? dir : view === '34' ? (sd === dir ? dir : sd * .6) : sd, fl = side ? 44 : view === '34' && sd === dir ? 40 : 28, ta = (ft.toe ?? (side ? 0 : -25)) * Math.PI / 180, toe = [Aa[0] + fdir * fl * Math.cos(ta), Aa[1] - fl * Math.sin(ta)];
    const pts = ft.pts ? ft.pts.map(q => [q[0] - xo, q[1]]) : null;   // ft.pts: the whole leg as exact world points (CB's editor legs)
    legsW.push(pts ? { H: pts[0], K: pts[1] || pts[0], A: pts[2] || pts[pts.length - 1] } : { H: hp, K, A: Aa });
    const legSegs = pts ? (ft.curve ? C.smooth(pts.slice(0, 3), false, .55) : 'M' + pts.slice(0, 3).map(q => `${f(q[0])},${f(q[1])}`).join(' L')) : C.smooth([hp, K, Aa], false, .55);
    const ankPt = pts ? (pts[2] || Aa) : Aa, toeEnd = pts ? (pts[3] || toe) : toe;
    const line = shoeStyle === 'none' ? (pts ? (ft.curve ? legSegs + pts.slice(3).map(q => ` L${f(q[0])},${f(q[1])}`).join('') : 'M' + pts.map(q => `${f(q[0])},${f(q[1])}`).join(' L')) : legSegs + ` L${f(toe[0])},${f(toe[1])}`) : legSegs;
    const join = pts && !ft.curve ? 'round' : 'miter';
    const far = ft.far ?? i === legFarIdx, overBody = !S.skirt && (ft.over || (legFarIdx >= 0 && !far && !P.legsBehind && !ft.behind)), col = legFarIdx < 0 || ft.ink ? C.INK : far && (P.lit || mv.lit) && !(P.dark || mv.dark) ? FAR : C.INK;
    const footSvg = (shoeStyle !== 'none' && C.drawFoot) ? C.drawFoot(ankPt, toeEnd, shoeStyle, LEG, far) : '';
    (overBody ? legsF : legs).push(`<path d="${line}" fill="none" stroke="${col}" stroke-width="${LEG}" stroke-linecap="round" stroke-linejoin="${join}" stroke-miterlimit="4"/>${footSvg}`);
  });
  // LIVE CLOTH (2026-11-12): long cloth and capes follow the move's legs, gravity and follow-through (motion_styles/cloth_live.mjs + char2d S.legsLive)
  if (M.motion && M.motion.cloth) { const toLocal = w => { const q = rotP(w, -rot, piv); return [q[0] - x, q[1] - y]; }; legsW.legL = ch.legL; M.motion.cloth.applyLive(S, legsW, toLocal, rot, MG, mv.lag || [0, 0], cx); }
  const r = C.drawCharacter(S), body = r.body.replace(/<ellipse [^>]*opacity="\.18"\/>/, '');
  const W2C = `translate(${cx},${oy})`, shiftX = xo ? `translate(${-xo},0)` : '';
  const inner = `${mv.props && mv.back ? `<g transform="${W2C} ${shiftX}">${mv.back}</g>` : ''}<g transform="${W2C}">${legs.join('')}</g><g transform="rotate(${f(rot)},${f(piv[0] + cx)},${f(piv[1] + oy)}) translate(${f(x)},${f(y)})">${extraBack.length ? `<g transform="translate(0,${f(oy)})">${extraBack.map(armSvg).join('')}</g>` : ''}${body}${P.arms && view === 'back' ? `<g transform="translate(0,${f(oy)})">${H.filter(a => a.over && !a.behind).map(armSvg).join('')}</g>` : ''}</g><g transform="${W2C}">${legsF.join('')}</g>${mv.props && mv.front ? `<g transform="${W2C} ${shiftX}">${mv.front}</g>` : ''}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD.W}" height="${CARD.H}" viewBox="0 0 ${CARD.W} ${CARD.H}"><defs>${r.defs}</defs>${mv.mirror ? `<g transform="translate(${2 * cx},0) scale(-1,1)">${inner}</g>` : inner}</svg>`;
}
function castSvg(entry, st, S, spec, name) {
  const own = spec.face, ownSet = Array.isArray(own) ? own[0] : null, woman = ownSet === 'female' || spec.hair === 'bob' || spec.form === 'lady', B = M.memes2.BLINKS;
  const ownFn = !own || own === 'standard' ? null : typeof own === 'string' ? M.memes.MEMES[own] : (SETS()[own[0]] || {})[own[1]];
  let fn = null;
  if (st.mouth && !kitFace(st) && M.memes2.VISEMES[st.mouth]) fn = M.memes2.VISEMES[st.mouth];
  else if (st.blink && (!st.face || st.face === 'standard') && !ownFn) fn = B[woman ? (st.blink === 'half' ? 'womanHalf' : 'womanClosed') : st.blink];
  else if (kitFace(st)) { fn = null; S.face = kitFace(st); if (st.blink) S.face = { ...S.face, eyes: st.blink === 'half' ? 'lidHalf' : 'closed' };   // V4.0: viseme + smooth blink + eye tracking
    if (S.meme) { const shape = S.head, V = c => ({ cx: c.cx, hy: c.hy, R: 100, view: c.view, dir: c.dir, turn: c.turn }); delete S.meme; S.slideExtras = true;       /* a sheet with its own drawn face: the calm kit face replaces it, hair, beard and hat stay */
      const tv = spec.hair && st.view === 'side', th = tv ? turnedHair(spec.hair, shape, st.view, st.dir || 1) : null;
      S.hairBack = c => [...(spec.headBack ? spec.headBack(V(c)) : []), ...(spec.hair && !tv ? M.memes2.hairFor(spec.hair, c.cx, c.hy, shape).back : [])];
      S.faceExtras = c => [...(tv ? th(c) : spec.hair ? unslide(M.memes2.hairFor(spec.hair, c.cx, c.hy, shape).front, c.cx, st.view, st.dir || 1) : []), ...(spec.faceTop ? spec.faceTop(V(c)) : [])]; } }
  else if (st.face && st.face !== 'standard') { fn = (ownSet && SETS()[ownSet] && SETS()[ownSet][st.face]) || faceFn(null, st.face); if (!fn) { warn('unknown face "' + st.face + '" for ' + name + ', using its own face'); fn = ownFn; } }
  else fn = ownFn;
  if (st.view === 'back') fn = null;                           // from behind there is no face: keep the sheet's own back-of-head layers (hair, mane, hat)
  if (fn) {                                                     // same layering as castkit.buildChar: headBack, face, hair, faceTop (the hat is its own layer)
    delete S.face; delete S.hairBack; delete S.faceExtras; const shape = S.head;
    const tv = spec.hair && st.view === 'side'; if (tv) S.faceExtras = turnedHair(spec.hair, shape, st.view, st.dir || 1);
    S.meme = (cx, hy, v = {}) => { const m = fn(cx, hy), h = spec.hair && !tv ? M.memes2.hairFor(spec.hair, cx, hy, shape) : { back: [], front: [] }, H = { cx, hy, R: 100, ...v }; return { ...m, under: [...(spec.headBack ? spec.headBack(H) : []), ...(m.under || []), ...h.back], over: [...unslide(h.front, cx, st.view, st.dir || 1), ...(m.over || []), ...(spec.faceTop ? spec.faceTop(H) : [])] }; };
  }
  if (st.view === 'back' && !spec.views) {                     // a sheet that is not view-aware: hair covers the head, face parts sit under it
    const shape = S.head, hb = S.hairBack, V = c => ({ cx: c.cx, hy: c.hy, R: 100, view: 'back', dir: c.dir, turn: 0 });
    delete S.meme; S.face = { expr: 'standard' };
    S.hairBack = c => [...(spec.faceTop ? spec.faceTop(V(c)) : []), ...(spec.headBack ? spec.headBack(V(c)) : []), ...(spec.hair ? M.memes2.hairFor(spec.hair, c.cx, c.hy, shape).back : [])];
    S.faceExtras = spec.hair ? backHair(spec.hair, shape) : () => [];
    S.details = S.behind || (() => []);                       // chest details are hidden; what hangs on the back (cape, pack) is also drawn across the body
  }
  if (!spec.views && S.hat && st.view === 'side') { const h0 = S.hat, dx = -(st.dir || 1) * 16; S.hat = c => [`<g transform="translate(${dx},0)">${h0(c).join('')}</g>`]; }   // a hat that is not view-aware sits a little back on a turned head
  if (st._hatLag) S.hatLag = st._hatLag; if (st._hairLag) S.hairLag = st._hairLag; if (st._tieLag) S.tieLag = st._tieLag;
  if (st.build && st.build !== S.build) { delete S._buildApplied; S.build = st.build; if (M.char2d && M.char2d.applyBuild) S = M.char2d.applyBuild(S); }
  if (st.shoes) S.shoes = st.shoes; if (st.handShape) S.handShape = st.handShape;
  if (st._mv) return moveDraw(S, { ...st._mv, _st: st, _headTilt: st.headTilt || 0 });
  const K = S.headK ?? 1.5, hy = (S.bodyTop ?? 333) - 100 * K * .78, ownArms = S.arms, ownProps = S.props, pose0 = !st.pose || st.pose === 'stand' || st.pose === 'own';
  const pose = applyPose(S, st, { INK: M.char2d.INK, headK: K, hy, dropProps: false, grip: M.grips && M.grips.grip, drawHand: M.char2d.drawHand });
  if (st.headTilt != null) S.headTilt = st.headTilt;
  if (pose0 && !st.prop) { S.arms = ownArms; S.props = ownProps; }
  const r = M.char2d.drawCharacter(S), body = r.body.replace(/<ellipse [^>]*opacity="\.18"\/>/, '');
  const over = pose.over.length && !(pose0 && !st.prop) ? `<g transform="translate(0,${S.dy})">${pose.over.join('')}</g>` : '';
  const tf = pose.rot || pose.dy ? ` transform="translate(0,${pose.dy}) rotate(${pose.rot},${CARD.CX},${CARD.GY})"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD.W}" height="${CARD.H}" viewBox="0 0 ${CARD.W} ${CARD.H}"><defs>${r.defs}</defs><g${tf}>${pose.under && pose.under.length ? `<g transform="translate(0,${S.dy || 0})">${pose.under.join('')}</g>` : ''}${body}${over}</g></svg>`;
}

export function svgFor(entry, st) {
  { const cc = customCard(entry); if (cc) return cc.card.svg(st, CARD); }
  { const mv = moveOf(entry, st); if (mv) st = { ...st, view: mv.P.view || 'side', dir: mv.P.dir || 1, tw: undefined, _mv: mv }; }
  const view = st.view || 'front', dir = st.dir || 1, { S, form, name, spec } = baseS(entry, view, dir), B = M.memes2.BLINKS, set = form && FORM_SET[form];
  if (spec) return castSvg(entry, st, S, spec, name);
  const woman = set && set[0] === 'FEMALE';
  let fn = null;
  if (st.mouth && !kitFace(st) && M.memes2.VISEMES[st.mouth]) fn = M.memes2.VISEMES[st.mouth];                     // talking: only replace whole meme if not using kitFace (V4.0 preserves expression!)
  else if (st.blink && (!st.face || st.face === 'standard')) fn = B[woman ? (st.blink === 'half' ? 'womanHalf' : 'womanClosed') : st.blink];
  else if (kitFace(st)) { fn = null; S.face = kitFace(st); if (st.blink) S.face = { ...S.face, eyes: st.blink === 'half' ? 'lidHalf' : 'closed' }; }
  else if (st.face && st.face !== 'standard') { fn = faceFn(set && set[0], st.face); if (!fn) warn('unknown face "' + st.face + '" for ' + name + ', using standard'); }
  // (a blink on a meme face keeps the meme face: 4 frames, and the rig has no lids for those faces yet)
  if (!fn && !S.face && set) fn = B[woman ? 'womanOpen' : 'open'];                                  // standard face on a form that needs its hair re-attached
  const turnedV = view === 'side';   // CB 2026-11-10 03:29: 3/4 = head, hair and body exactly as the front view for everyone (women too); only eyes, brows and mouth shift. Hair turns in the side view only.
  if (fn && set) { const f0 = fn, shape = set[2] === 'BABY_HEAD' ? M.memes2.BABY_HEAD : set[2]; fn = (cx, hy) => { const m = f0(cx, hy), h = M.memes2.hairFor(set[1], cx, hy, shape); return turnedV ? { ...m, under: [...(m.under || [])], over: [...m.over] } : { ...m, under: [...(m.under || []), ...h.back], over: [...unslide(h.front, cx, view, dir), ...m.over] }; };
    if (turnedV) S.faceExtras = turnedHair(set[1], shape, view, dir); }
  if (fn) S.meme = fn; else { delete S.meme; if (!S.face) S.face = { expr: 'standard' }; }
  if (view === 'back' && set) { const shape = set[2] === 'BABY_HEAD' ? M.memes2.BABY_HEAD : set[2]; delete S.meme; S.face = { expr: 'standard' }; S.hairBack = q => M.memes2.hairFor(set[1], q.cx, q.hy, shape).back; S.faceExtras = backHair(set[1], shape); }
  S.extraDefs = M.memes2.memes2Defs();
  if (st._hatLag) S.hatLag = st._hatLag; if (st._hairLag) S.hairLag = st._hairLag; if (st._tieLag) S.tieLag = st._tieLag;
  if (st.build && st.build !== S.build) { delete S._buildApplied; S.build = st.build; if (M.char2d && M.char2d.applyBuild) S = M.char2d.applyBuild(S); }
  if (st.shoes) S.shoes = st.shoes; if (st.handShape) S.handShape = st.handShape;
  if (st._mv) return moveDraw(S, { ...st._mv, _st: st, _headTilt: st.headTilt || 0 });
  const K = S.headK ?? 1.5, hy = (S.bodyTop ?? 333) - 100 * K * .78;
  const pose = applyPose(S, st, { INK: M.char2d.INK, headK: K, hy, dropProps: !!DROP_PROPS[name], grip: M.grips && M.grips.grip, drawHand: M.char2d.drawHand });
  if (st.headTilt != null) S.headTilt = st.headTilt;
  const r = M.char2d.drawCharacter(S);
  const body = r.body.replace(/<ellipse [^>]*opacity="\.18"\/>/, '');                             // the rig's flat floor shadow: the 3D scene casts a real one
  const over = pose.over.length ? `<g transform="translate(0,${S.dy})">${pose.over.join('')}</g>` : '';
  const tf = pose.rot || pose.dy ? ` transform="translate(0,${pose.dy}) rotate(${pose.rot},${CARD.CX},${CARD.GY})"` : '';   // lean and bob about the feet
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD.W}" height="${CARD.H}" viewBox="0 0 ${CARD.W} ${CARD.H}"><defs>${r.defs}</defs><g${tf}>${pose.under && pose.under.length ? `<g transform="translate(0,${S.dy || 0})">${pose.under.join('')}</g>` : ''}${body}${over}</g></svg>`;
}
