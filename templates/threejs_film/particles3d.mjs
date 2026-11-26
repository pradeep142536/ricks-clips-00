// PARTICLES3D (Cinema V4.5): Deterministic 3D billboard sprite particle emitters (steam, smoke, sparks, dust).
// All emission & trajectories evaluate purely from frame time `t` so chunked/parallel workers match identically.
// Exposed to set builders as `ctx.particles` and ticked automatically before each frame render.

function rng(seed) {
  let a = (seed >>> 0) || 1;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(x, lo = 0, hi = 1) {
  return x < lo ? lo : x > hi ? hi : x;
}

function buildParticleTextures(THREE) {
  const mk = (N, fn) => {
    const cv = document.createElement('canvas');
    cv.width = cv.height = N;
    const g = cv.getContext('2d');
    const im = g.createImageData(N, N);
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const u = ((x + 0.5) / N) * 2 - 1;
        const v = ((y + 0.5) / N) * 2 - 1;
        const [r, gr, b, a] = fn(u, v);
        const i = (y * N + x) * 4;
        im.data[i] = Math.round(clamp(r) * 255);
        im.data[i + 1] = Math.round(clamp(gr) * 255);
        im.data[i + 2] = Math.round(clamp(b) * 255);
        im.data[i + 3] = Math.round(clamp(a) * 255);
      }
    }
    g.putImageData(im, 0, 0);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  };

  // Multi-lobe noisy billowy cloud puff for realistic steam & smoke
  const puff = mk(128, (u, v) => {
    const d1 = Math.hypot(u, v);
    const d2 = Math.hypot(u - 0.24, v + 0.14) * 1.15;
    const d3 = Math.hypot(u + 0.22, v - 0.12) * 1.18;
    const d4 = Math.hypot(u + 0.05, v + 0.24) * 1.2;
    const lobe = Math.max(clamp(1 - d1), clamp(1 - d2) * 0.85, clamp(1 - d3) * 0.82, clamp(1 - d4) * 0.78);
    const ang = Math.atan2(v, u);
    const ripple = 0.86 + 0.14 * Math.sin(ang * 5.0 + d1 * 6.0);
    const alpha = Math.pow(clamp(lobe * ripple), 1.45);
    const shade = 0.82 + 0.18 * clamp(0.5 - v * 0.6);
    return [shade, shade, shade * 0.99, alpha];
  });

  // Soft earth/gravel dust puff
  const dust = mk(128, (u, v) => {
    const d = Math.hypot(u * 0.95, v * 1.05);
    const wob = 0.88 + 0.12 * Math.cos(Math.atan2(v, u) * 4.0 + d * 4.0);
    const alpha = Math.pow(clamp((1 - d) * wob), 1.85);
    return [0.95, 0.92, 0.88, alpha];
  });

  // Hot glowing yellow/orange spark kernel
  const spark = mk(64, (u, v) => {
    const r = Math.hypot(u, v);
    const core = Math.exp(-r * r * 14.0);
    const halo = 0.45 * Math.exp(-r * r * 3.5);
    const a = clamp(core + halo - 0.03);
    return [1.0, clamp(0.65 + core * 0.35), clamp(core * 0.85), a];
  });

  return { puff, dust, spark };
}

export function createParticleSystem(THREE, scene, L = {}) {
  let texCache = null;
  const emitters = [];
  const root = new THREE.Group();
  root.name = 'cinema_v45_particles3d';
  root.userData.noExport = true;

  const ensureTex = () => (texCache ||= buildParticleTextures(THREE));
  const B2T = p => (p && p.isVector3 ? p.clone() : new THREE.Vector3(p[0], p[2] ?? 0, -(p[1] ?? 0)));

  function evalPos(posSpec, tEval) {
    if (typeof posSpec === 'function') return B2T(posSpec(tEval));
    if (posSpec && posSpec.isObject3D) {
      posSpec.updateWorldMatrix(true, false);
      return posSpec.getWorldPosition(new THREE.Vector3());
    }
    return B2T(posSpec || [0, 0, 0]);
  }

  function addEmitter(opts = {}) {
    if (root.parent !== scene) scene.add(root);
    const tex = ensureTex();
    const kind = opts.kind || 'steam';
    const isSparks = kind === 'sparks';
    const count = opts.count ?? (isSparks ? 28 : kind === 'dust' ? 18 : 34);
    const life = Math.max(0.15, opts.life ?? (isSparks ? 0.65 : kind === 'dust' ? 0.95 : 1.75));
    const seed = opts.seed ?? (emitters.length * 131 + 17);
    const rnd = rng(seed);
    const tintDefault = isSparks ? '#ffd24c' : kind === 'dust' ? '#d8c39e' : (kind === 'smoke' ? '#c8c4be' : '#fff8ee');
    const colBase = new THREE.Color(opts.color || tintDefault);
    if (!isSparks && L.sun) {
      colBase.lerp(new THREE.Color(L.sun), kind === 'steam' ? 0.24 : 0.16);
    }

    const grp = new THREE.Group();
    grp.name = `emitter_${kind}_${emitters.length}`;
    grp.userData.noExport = true;
    root.add(grp);

    const slots = [];
    for (let i = 0; i < count; i++) {
      const mat = new THREE.SpriteMaterial({
        map: isSparks ? tex.spark : kind === 'dust' ? tex.dust : tex.puff,
        color: colBase.clone(),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        fog: !isSparks,
        blending: isSparks ? THREE.AdditiveBlending : THREE.NormalBlending,
        toneMapped: !isSparks,
      });
      const sp = new THREE.Sprite(mat);
      sp.userData.noExport = true;
      sp.visible = false;
      grp.add(sp);
      slots.push({
        sp,
        mat,
        phase: (i / count) * life + (rnd() - 0.5) * (life / count) * 0.4,
        vx: (rnd() - 0.5) * 2.0,
        vy: 0.7 + rnd() * 0.6,
        vz: (rnd() - 0.5) * 2.0,
        swirl: rnd() * Math.PI * 2,
        rot: (rnd() - 0.5) * 1.4,
        spin: (rnd() - 0.5) * 1.8,
        scJitter: 0.8 + rnd() * 0.45,
      });
    }

    const em = { kind, opts, life, slots, colBase, grp };
    emitters.push(em);
    return em;
  }

  function updateEmitter(em, t) {
    const o = em.opts;
    const t0 = o.t0 ?? 0;
    const t1 = o.t1 ?? 1e9;
    const burstAt = o.burstAt ?? null;
    const rise = o.rise ?? (em.kind === 'sparks' ? 2.4 : em.kind === 'dust' ? 0.65 : 2.3);
    const spread = o.spread ?? (em.kind === 'sparks' ? 1.8 : em.kind === 'dust' ? 0.95 : 0.65);
    const gravity = o.gravity ?? (em.kind === 'sparks' ? 5.2 : 0.0);
    const driftPlan = o.drift ?? (em.kind === 'steam' || em.kind === 'smoke' ? [-1.1, 0.15, 0] : [0, 0, 0]);
    const driftT = new THREE.Vector3(driftPlan[0] ?? 0, driftPlan[2] ?? 0, -(driftPlan[1] ?? 0));
    const s0 = o.size0 ?? (em.kind === 'sparks' ? 0.14 : em.kind === 'dust' ? 0.28 : 0.36);
    const s1 = o.size1 ?? (em.kind === 'sparks' ? 0.03 : em.kind === 'dust' ? 0.95 : 1.65);
    const opMax = o.opacity ?? (em.kind === 'sparks' ? 0.95 : em.kind === 'dust' ? 0.52 : 0.74);

    for (const p of em.slots) {
      let age;
      let birthT;
      if (burstAt != null) {
        age = t - burstAt;
        birthT = burstAt;
        if (age < 0 || age > em.life) {
          p.sp.visible = false;
          continue;
        }
      } else {
        if (t < t0) {
          p.sp.visible = false;
          continue;
        }
        const cycle = (t - t0 + p.phase) % em.life;
        age = cycle < 0 ? cycle + em.life : cycle;
        birthT = t - age;
        if (birthT < t0 || birthT > t1) {
          p.sp.visible = false;
          continue;
        }
      }

      const u = clamp(age / em.life);
      const origin = evalPos(o.pos, birthT);
      const easeOut = 1 - Math.pow(1 - u, 1.7);
      const turb = Math.sin(u * Math.PI * 2.5 + p.swirl) * 0.18 * spread;

      p.sp.position.set(
        origin.x + p.vx * spread * 0.45 * easeOut + driftT.x * age + turb,
        origin.y + p.vy * rise * age - 0.5 * gravity * age * age + driftT.y * age,
        origin.z + p.vz * spread * 0.45 * easeOut + driftT.z * age + Math.cos(u * 6.0 + p.swirl) * 0.12 * spread
      );

      const sc = (s0 + (s1 - s0) * easeOut) * p.scJitter;
      p.sp.scale.set(sc, sc, 1);
      p.mat.rotation = p.rot + p.spin * age;

      const fadeIn = clamp(u / 0.12);
      const fadeOut = Math.pow(clamp(1 - u), em.kind === 'sparks' ? 1.15 : 1.55);
      p.mat.opacity = opMax * fadeIn * fadeOut;
      p.sp.visible = p.mat.opacity > 0.01;
    }
  }

  function update(f, t) {
    for (const em of emitters) {
      updateEmitter(em, t);
    }
  }

  function clear() {
    for (const em of emitters) {
      for (const s of em.slots) s.mat.dispose();
      root.remove(em.grp);
    }
    emitters.length = 0;
  }

  return {
    root,
    emitters,
    addEmitter,
    emitSteam: (opts = {}) => addEmitter({ kind: 'steam', ...opts }),
    emitSmoke: (opts = {}) => addEmitter({ kind: 'smoke', ...opts }),
    emitSparks: (opts = {}) => addEmitter({ kind: 'sparks', ...opts }),
    emitDust: (opts = {}) => addEmitter({ kind: 'dust', ...opts }),
    update,
    clear,
  };
}
