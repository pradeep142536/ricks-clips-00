// Procedural Emu War character rigs. No raster character art or skill-kit faces are used.
// Every visible item is an SVG layer with a named pivot/attachment point.
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const n = v => Number(v).toFixed(1);

const PALETTE = {
  ink:'#231218', skin:'#fffaf0', skinShade:'#e7ddd2', white:'#fffdf7', black:'#241b24',
  khaki:'#68734d', olive:'#394735', leather:'#5a3424', brass:'#d5a438', steel:'#4d6170',
  rust:'#9b4d2f', soil:'#9b6a3d', emu:'#594a43', emuDark:'#2b2526', emuLight:'#88776a'
};

export const CHARACTERS = {
  australian_soldier:{id:'australian_soldier', label:'Australian Soldier', role:'ordinary soldier',
    hair:'#342a25', hat:'#9c8b5a', coat:'#6b754d', accent:'#d6ba6a', build:'standard', prop:'lewisGun'},
  major_meredith:{id:'major_meredith', label:'Major Meredith', role:'commander',
    hair:'#49362b', hat:'#756844', coat:'#354d3d', accent:'#d9b45b', build:'tall', prop:'fieldMap'},
  gunner:{id:'gunner', label:'Machine Gunner', role:'gunner',
    hair:'#242225', hat:'#806f4b', coat:'#4d6043', accent:'#b86735', build:'stocky', prop:'lewisGun'},
  farmer:{id:'farmer', label:'Wheat Farmer', role:'farmer',
    hair:'#6b4029', hat:'#b4884d', coat:'#8a5633', accent:'#d7b66a', build:'broad', prop:'pitchfork'},
  journalist:{id:'journalist', label:'Journalist', role:'reporter',
    hair:'#3d2d29', hat:'#3f4a52', coat:'#a45d3d', accent:'#efe1bf', build:'slim', prop:'newspaper'},
  emu:{id:'emu', label:'Emu', role:'flightless bird', hair:PALETTE.emuDark, hat:null,
    coat:PALETTE.emu, accent:PALETTE.emuLight, build:'emu', prop:null}
};

const EXPRESSIONS = ['happy','worried','shocked','angry','confused','determined','scared','laughing','smug','exhausted','sweat','anger'];
const POSES = ['idle','walk','run','aim','fire','point','flinch','fall','jump','cheer','carry','crouch'];
const VIEWS = ['front','three-quarter-left','three-quarter-right','side','back'];
export { EXPRESSIONS, POSES, VIEWS };

function faceParts(x,y,w,expr,view,spec){
  if(spec.build==='emu') return '';
  if(view==='back') return `<path d="M${x-w*.25} ${y-38} Q${x} ${y-78} ${x+w*.25} ${y-38}" fill="${spec.hair}" stroke="${PALETTE.ink}" stroke-width="7"/><path d="M${x-18} ${y+12} q18 12 36 0" fill="none" stroke="${PALETTE.skinShade}" stroke-width="5" opacity=".9"/>`;
  const p = {happy:['smile',0,0], worried:['worry',0,2], shocked:['open',0,0], angry:['frown',-1,0], confused:['wavy',2,0], determined:['line',-1,0], scared:['open',1,1], laughing:['laugh',0,0], smug:['smug',-2,0], exhausted:['tired',3,1], sweat:['wavy',1,1], anger:['frown',-2,0]}[expr] || ['line',0,0];
  const turn = view==='three-quarter-left' ? -7 : view==='three-quarter-right' ? 7 : view==='side' ? 14 : 0;
  const eyeGap = view==='side' ? 0 : view.startsWith('three') ? 19 : 30;
  const visible = view==='side' ? 1 : 2;
  const eye = (sx, sy) => `<g id="eye-${sx<0?'left':'right'}" transform="translate(${n(sx)} ${n(sy)})"><ellipse cx="${n(x+sx*eyeGap)}" cy="${n(y)}" rx="${view==='side'?10:12}" ry="${p[0]==='open'?16:12}" fill="${PALETTE.white}" stroke="${PALETTE.ink}" stroke-width="5"/><circle cx="${n(x+sx*eyeGap+turn*.25)}" cy="${n(y+p[2])}" r="5" fill="${PALETTE.ink}"/></g>`;
  const brow = (sx) => `<path id="brow-${sx<0?'left':'right'}" d="M${n(x+sx*eyeGap-12)} ${n(y-22+p[1]*3)} Q${n(x+sx*eyeGap)} ${n(y-27+p[1]*5)} ${n(x+sx*eyeGap+12)} ${n(y-22-p[1]*3)}" fill="none" stroke="${PALETTE.ink}" stroke-width="6" stroke-linecap="round"/>`;
  let eyes = eye(-1,0)+brow(-1); if(visible===2) eyes += eye(1,0)+brow(1);
  let mouth = {smile:`M${x-20} ${y+45} Q${x} ${y+65} ${x+20} ${y+45}`, worry:`M${x-18} ${y+57} Q${x} ${y+42} ${x+18} ${y+57}`, open:`M${x-18} ${y+40} Q${x} ${y+78} ${x+18} ${y+40} Q${x} ${y+52} ${x-18} ${y+40}`, frown:`M${x-20} ${y+60} Q${x} ${y+43} ${x+20} ${y+60}`, wavy:`M${x-20} ${y+52} q8 -10 16 0 t16 0`, line:`M${x-18} ${y+52} L${x+18} ${y+52}`, laugh:`M${x-21} ${y+42} Q${x} ${y+80} ${x+21} ${y+42}`, smug:`M${x-14} ${y+55} Q${x+8} ${y+62} ${x+22} ${y+48}`, tired:`M${x-15} ${y+54} L${x+15} ${y+54}`}[p[0]];
  const extra = expr==='sweat' ? `<path d="M${x+48} ${y-28} q18 18 0 35 q-18 -17 0 -35" fill="#76b9e8" stroke="${PALETTE.ink}" stroke-width="4"/>` : expr==='anger' ? `<path d="M${x-54} ${y-38} l14 -14 l14 14 l-14 14z M${x+40} ${y-38} l14 -14 l14 14 l-14 14z" fill="#d64c3f" stroke="${PALETTE.ink}" stroke-width="4"/>` : '';
  return `${eyes}<path id="mouth" d="${mouth}" fill="${p[0]==='open'||p[0]==='laugh'?'#a64750':'none'}" stroke="${PALETTE.ink}" stroke-width="6" stroke-linecap="round"/>${extra}`;
}

function prop(spec, x,y, pose){
  if(!spec.prop) return '';
  if(spec.prop==='lewisGun') return `<g id="prop-lewis-gun" transform="translate(${x} ${y}) rotate(${pose==='aim'?-8:pose==='fire'?-12:0})"><rect x="-8" y="-15" width="120" height="20" rx="8" fill="${PALETTE.steel}" stroke="${PALETTE.ink}" stroke-width="6"/><circle cx="72" cy="-5" r="17" fill="${PALETTE.steel}" stroke="${PALETTE.ink}" stroke-width="6"/><path d="M12 4 l-18 40 h22 l18 -40 M62 5 l18 38 h22 l-20 -38" fill="${PALETTE.leather}" stroke="${PALETTE.ink}" stroke-width="5"/><path d="M104 -15 l28 0" stroke="${PALETTE.brass}" stroke-width="5"/></g>`;
  if(spec.prop==='fieldMap') return `<g id="prop-map" transform="translate(${x} ${y}) rotate(-12)"><path d="M0 0 l44 -12 l42 12 l44 -12 l0 70 l-44 12 l-42 -12 l-44 12z" fill="#e8d39d" stroke="${PALETTE.ink}" stroke-width="5"/><path d="M13 27 q22 -20 40 0 t42 -5" fill="none" stroke="#6f8d72" stroke-width="4"/></g>`;
  if(spec.prop==='pitchfork') return `<g id="prop-pitchfork" transform="translate(${x} ${y}) rotate(8)"><path d="M0 0 L4 150" stroke="${PALETTE.leather}" stroke-width="8"/><path d="M-13 0 L-13 -45 M0 0 L0 -50 M13 0 L13 -45" stroke="${PALETTE.ink}" stroke-width="6" stroke-linecap="round"/></g>`;
  return `<g id="prop-newspaper" transform="translate(${x} ${y}) rotate(-10)"><rect x="-2" y="-42" width="90" height="58" fill="#f3ead5" stroke="${PALETTE.ink}" stroke-width="5"/><path d="M10 -25h65 M10 -10h48 M10 5h64" stroke="#65708a" stroke-width="4"/></g>`;
}

function human(spec, view, expr, pose){
  const cx=210, ground=680, bodyTop=275, bodyBot=510;
  const side=view==='side', three=view.startsWith('three');
  const bw=spec.build==='stocky'?116:spec.build==='broad'?150:spec.build==='slim'?92:spec.build==='tall'?100:112;
  const headW=side?92:three?132:150, headH=145, hx=cx+(view==='three-quarter-left'?-14:view==='three-quarter-right'?14:0), hy=205;
  const armA=pose==='aim'||pose==='fire'?-52:pose==='point'?-30:pose==='cheer'?-70:pose==='flinch'?25:0;
  const armB=pose==='aim'||pose==='fire'?-38:pose==='point'?-12:pose==='cheer'?-78:pose==='flinch'?40:0;
  const stride=pose==='walk'?32:pose==='run'?55:pose==='jump'?45:0;
  const fall=pose==='fall'?24:0;
  const hat = `<g id="hat"><path d="M${hx-headW*.55} ${hy-65} Q${hx} ${hy-118} ${hx+headW*.55} ${hy-65} L${hx+headW*.62} ${hy-48} Q${hx} ${hy-62} ${hx-headW*.62} ${hy-48}Z" fill="${spec.hat}" stroke="${PALETTE.ink}" stroke-width="7"/><path d="M${hx-headW*.58} ${hy-48} Q${hx} ${hy-33} ${hx+headW*.58} ${hy-48}" fill="none" stroke="${spec.accent}" stroke-width="9"/></g>`;
  const head = `<g id="head" transform="rotate(${fall} ${hx} ${hy})"><ellipse cx="${hx}" cy="${hy}" rx="${headW/2}" ry="${headH/2}" fill="${PALETTE.skin}" stroke="${PALETTE.ink}" stroke-width="8"/><path d="M${hx-headW*.38} ${hy-58} Q${hx} ${hy-90} ${hx+headW*.38} ${hy-58}" fill="${spec.hair}" stroke="${PALETTE.ink}" stroke-width="7"/>${faceParts(hx,hy,headW,expr,view,spec)}</g>`;
  const body = `<g id="torso" transform="rotate(${fall} ${cx} ${bodyTop})"><path d="M${cx-bw/2} ${bodyTop+18} Q${cx} ${bodyTop-8} ${cx+bw/2} ${bodyTop+18} L${cx+bw*.42} ${bodyBot} Q${cx} ${bodyBot+25} ${cx-bw*.42} ${bodyBot}Z" fill="${spec.coat}" stroke="${PALETTE.ink}" stroke-width="8"/><path d="M${cx-bw*.38} ${bodyTop+25} L${cx+bw*.38} ${bodyBot-25} M${cx+bw*.38} ${bodyTop+25} L${cx-bw*.38} ${bodyBot-25}" stroke="${spec.accent}" stroke-width="12"/><circle cx="${cx}" cy="${bodyTop+50}" r="10" fill="${PALETTE.brass}" stroke="${PALETTE.ink}" stroke-width="4"/><path d="M${cx-26} ${bodyTop+12} h52" stroke="${PALETTE.white}" stroke-width="10"/></g>`;
  const limb = (id,x1,y1,x2,y2,w=14) => `<path id="${id}" d="M${x1} ${y1} L${x2} ${y2}" stroke="${PALETTE.ink}" stroke-width="${w}" stroke-linecap="round" fill="none"/>`;
  const leftHandY=pose==='point'?bodyTop+18:bodyBot-5, rightHandY=pose==='aim'||pose==='fire'?bodyTop+55:bodyBot-5;
  const arms = `<g id="upper-arm-left">${limb('forearm-left',cx-bw*.38,bodyTop+35,cx-bw*.72, leftHandY+armA)}<circle cx="${cx-bw*.72}" cy="${leftHandY+armA}" r="15" fill="${PALETTE.ink}"/></g><g id="upper-arm-right">${limb('forearm-right',cx+bw*.38,bodyTop+35,cx+bw*.78, rightHandY+armB)}<circle cx="${cx+bw*.78}" cy="${rightHandY+armB}" r="15" fill="${PALETTE.ink}"/></g>`;
  const legs = `<g id="legs">${limb('thigh-left',cx-28,bodyBot,cx-30-stride,ground-88)}${limb('shin-left',cx-30-stride,ground-88,cx-40-stride,ground)}${limb('thigh-right',cx+28,bodyBot,cx+30+stride,ground-88)}${limb('shin-right',cx+30+stride,ground-88,cx+40+stride,ground)}<path id="foot-left" d="M${cx-52-stride} ${ground} h38" stroke="${PALETTE.ink}" stroke-width="14" stroke-linecap="round"/><path id="foot-right" d="M${cx+20+stride} ${ground} h38" stroke="${PALETTE.ink}" stroke-width="14" stroke-linecap="round"/></g>`;
  const shadow = `<ellipse id="ground-shadow" cx="${cx}" cy="${ground+7}" rx="95" ry="16" fill="#15202b" opacity=".35"/>`;
  const held = prop(spec, cx+bw*.78, rightHandY+armB, pose);
  return `${shadow}${legs}${body}${arms}${head}${hat}${held}`;
}

function emu(view, expr, pose){
  const cx=210, ground=680, side=view==='side', turn=view==='three-quarter-left'?-14:view==='three-quarter-right'?14:0;
  const neckX=cx+(side?-18:0), bounce=pose==='sprint'? -18:pose==='fall'?36:0;
  const headY=190+bounce, bodyY=400+bounce;
  const eye=expr==='startled'?18:expr==='angry'?6:10;
  const beak=expr==='angry'?'M250 205 l55 12 l-54 14': 'M250 205 l55 12 l-55 8';
  const body=`<ellipse id="body" cx="${cx}" cy="${bodyY}" rx="${side?102:112}" ry="${side?176:165}" fill="${PALETTE.emu}" stroke="${PALETTE.ink}" stroke-width="9"/><path d="M${cx-70} ${bodyY-80} q70 -55 140 0" fill="none" stroke="${PALETTE.emuLight}" stroke-width="18" opacity=".8"/>`;
  const neck=`<path id="neck" d="M${neckX-35} ${bodyY-90} Q${neckX-60} 280 ${neckX-22} ${headY+40} Q${neckX+12} ${headY+20} ${neckX+30} ${bodyY-90}" fill="${PALETTE.emu}" stroke="${PALETTE.ink}" stroke-width="9"/>`;
  const head=`<g id="head"><ellipse cx="${neckX}" cy="${headY}" rx="${side?45:58}" ry="52" fill="${PALETTE.emuDark}" stroke="${PALETTE.ink}" stroke-width="8"/>${view==='back'?'':`<circle cx="${neckX+turn+18}" cy="${headY-5}" r="${eye}" fill="#fff" stroke="${PALETTE.ink}" stroke-width="5"/><circle cx="${neckX+turn+18}" cy="${headY-5}" r="5" fill="${PALETTE.ink}"/><path d="${beak}" fill="${PALETTE.emuLight}" stroke="${PALETTE.ink}" stroke-width="6"/>`}</g>`;
  const m=/walk(\d+)/.exec(pose); const frame=m?Number(m[1]):0; const phase=frame%2===0?1:-1;
  const stride=pose==='sprint'?50:pose==='walk'?28:m?28*phase:pose==='dodge'?-32:0;
  const legs=`<g id="legs"><path d="M${cx-34} ${bodyY+120} L${cx-40-stride} ${ground-80} L${cx-55-stride} ${ground}" stroke="${PALETTE.ink}" stroke-width="12" fill="none"/><path d="M${cx+34} ${bodyY+120} L${cx+42+stride} ${ground-80} L${cx+58+stride} ${ground}" stroke="${PALETTE.ink}" stroke-width="12" fill="none"/><path d="M${cx-70-stride} ${ground} l20 -12 m-20 12 l-8 -14 M${cx+43+stride} ${ground} l20 -12 m-20 12 l-8 -14" stroke="${PALETTE.ink}" stroke-width="8" stroke-linecap="round"/></g>`;
  return `<ellipse id="ground-shadow" cx="${cx}" cy="687" rx="115" ry="18" fill="#15202b" opacity=".35"/>${legs}${body}${neck}${head}`;
}

export function renderCharacter(spec, view='front', expr='determined', pose='idle', width=420, height=720){
  const content=spec.build==='emu'?emu(view,expr,pose):human(spec,view,expr,pose);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 420 720"><defs><linearGradient id="bg" x2="0" y2="1"><stop stop-color="#8ec8ee"/><stop offset="1" stop-color="#d9c48c"/></linearGradient></defs><rect width="420" height="720" fill="url(#bg)"/><path d="M0 575 Q120 545 220 575 T420 570 V720 H0Z" fill="#a47543"/><path d="M0 580 H420" stroke="#6b472f" stroke-width="5" opacity=".45"/><text x="20" y="36" font-family="Arial" font-size="18" font-weight="700" fill="#173047">${esc(spec.label)} · ${esc(view)} · ${esc(expr)} · ${esc(pose)}</text>${content}</svg>`;
}

export function renderSheet(spec, items, title, cols=5, cellW=420, cellH=720){
  const rows=Math.ceil(items.length/cols), w=cols*cellW, h=rows*cellH+60;
  const cells=items.map((it,i)=>`<g transform="translate(${(i%cols)*cellW} ${60+Math.floor(i/cols)*cellH})">${it}</g>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="#101722"/><text x="24" y="40" font-family="Arial" font-size="26" font-weight="700" fill="#fff">${esc(title)}</text>${cells}</svg>`;
}
