/* ============================================================================
   footprintjs.github.io — the film.

   Motion graphics written as code: no video, no animation library, no build
   step. One canvas, one worked example (a refund that was denied), and one
   rule that the whole page borrows from the libraries it explains:

       a frame is a pure function of a cursor.

   draw(t, clock) takes `t`, the position on the film's timeline in beats, and
   `clock`, seconds since load for ambient drift. Nothing is stored between
   frames, so scrolling is scrubbing: forward, backward, or jump to any frame.
   Replay and time travel are not a metaphor here.

   The film has two tracks, because there are two ways to get a record. On the
   left, software built in the pattern: a flowchart runs and writes its own notes,
   each one connected as it is written. There is never a pile. On the right,
   everything else: a pile of notes that stays a pile, stitched in code where the
   notes lie, with a reason kept for every join that cannot be made. The two tracks
   take turns on screen, then join for the walk back, and the scrubber draws the
   same shape.

   The objects persist. The notes that join in the middle are the nodes that light
   up on the walk, the ticks on the Story Lens timeline, and what falls into the sun
   in the last shot. Those are match cuts, and they are what makes this read as one
   film rather than a set of slides.

   View as (Product, Technical, Business) changes the WORDS on the objects while
   the film runs. Positions, order and timing never change between views.

   Editing: copy lives in ecosystem-views.json (views.<view>.film). Timing lives
   in T below. Layout lives in Film.layout(). See README.md.
   ============================================================================ */
(function () {
  'use strict';

  /* ── small math ─────────────────────────────────────────────────────────── */
  const TAU = Math.PI * 2;
  const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
  const lerp = (a, b, t) => a + (b - a) * t;
  /* progress of x through the window [a, b], clamped to 0..1 */
  const win = (a, b, x) => clamp((x - a) / (b - a));
  const bump = (x) => { x = Math.abs(x); return x >= 1 ? 0 : 0.5 + 0.5 * Math.cos(x * Math.PI); };
  const E = {
    out: (t) => 1 - Math.pow(1 - t, 3),
    inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    expo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    back: (t) => { const c = 1.70158, u = t - 1; return 1 + (c + 1) * u * u * u + c * u * u; },
    settle: (t) => { const c = 0.9 * 1.525; return t < 0.5 ? (Math.pow(2 * t, 2) * ((c + 1) * 2 * t - c)) / 2 : (Math.pow(2 * t - 2, 2) * ((c + 1) * (t * 2 - 2) + c) + 2) / 2; },
    bounce: (t) => {
      const n = 7.5625, d = 2.75;
      if (t < 1 / d) return n * t * t;
      if (t < 2 / d) { t -= 1.5 / d; return n * t * t + 0.75; }
      if (t < 2.5 / d) { t -= 2.25 / d; return n * t * t + 0.9375; }
      t -= 2.625 / d; return n * t * t + 0.984375;
    }
  };
  function rng(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function rr(c, x, y, w, h, r) {
    c.beginPath();
    if (c.roundRect) { c.roundRect(x, y, w, h, r); return; }
    c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }

  function fadeOf(color) {
    const m = /^#([0-9a-f]{6})$/i.exec(color);
    if (!m) return 'rgba(0,0,0,0)';
    const n = parseInt(m[1], 16);
    return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',0)';
  }

  /* ── the timeline, in beats ─────────────────────────────────────────────── */
  const T = {
    /* two tracks, taking turns */
    runA: 1.25, runB: 3.95, leftEnd: 4.45,
    rainA: 4.5, dropA: 5, dropB: 5.55,
    scanA: 5.7, scanB: 6.95,
    bindA: 7.25, bindB: 8.8,
    hybA: 8.9, hybB: 10.45,
    colA: 10.55, colB: 12.2,
    stitchA: 12.35, stitchB: 13.85,
    /* they join */
    joinA: 14.1, joinB: 15.15,
    /* one track from here on */
    walkA: 15.3,
    gapA: 18.25, gapHit: 18.95,
    guessA: 19.5, guessB: 19.95, strike: 20.4,
    honestA: 20.7, honestB: 21.2,
    gapEnd: 22.4,
    lensA: 22.4, lensB: 23.2,
    whyA: 23.8, whyB: 24.5,
    storyA: 25.2, storyB: 25.9,
    scrubA: 25.9, scrubB: 27.15,
    orbitA: 27.4, sunB: 27.95, orbitB: 29.1,
    feedA: 29.35, feedB: 30.2,
    backA: 30.8, backB: 31.6,
    replayA: 31.75, replayB: 32.55,
    auditA: 32.65, auditB: 33.45,
    end: 34.6
  };
  /* which caption is on screen when */
  const CHAPTERS = [
    ['hero', 0, 0.85], ['own', 1.05, 4.4], ['pile', 4.5, 7.2], ['bind', 7.25, 8.85], ['hybrid', 8.9, 10.5], ['collect', 10.55, 12.3],
    ['stitch', 12.35, 14.05], ['join', 14.1, 15.25], ['walk', 15.3, 18.2], ['gap', 18.25, 22.35],
    ['lenses', 22.5, 27.35], ['orbit', 27.5, 30.75], ['payoff', 30.85, 1e9]
  ];
  /* which track of the scrubber each chapter belongs to; everything else is the joined line */
  const TRACK_OF = { hero: 'both', own: 'top', pile: 'bottom', bind: 'bottom', hybrid: 'both', collect: 'bottom', stitch: 'bottom', join: 'both' };
  /* the scrubber's stops */
  const RAIL = [
    ['By default', T.runA + 0.1, 'top'],
    ['Pile', T.rainA + 0.1, 'bottom'],
    ['React', T.bindA + 0.1, 'bottom'],
    ['Hybrid', T.hybA + 0.1, 'between'],
    ['Collect', T.colA + 0.1, 'bottom'],
    ['Stitch', T.stitchA + 0.1, 'bottom'],
    ['Walk back', T.walkA + 0.05, 'mid'],
    ['Gaps', T.gapA + 0.1, 'mid'],
    ['Lenses', T.lensA + 0.2, 'mid'],
    ['Ecosystem', T.sunB + 0.9, 'mid'],
    ['Audit', T.backA + 0.1, 'mid']
  ];
  /* the frame each chapter holds on when motion is reduced */
  const STILLS = { hero: 0.05, own: T.runB + 0.3, pile: T.scanB + 0.15, bind: T.bindB - 0.14, hybrid: T.hybB - 0.14, collect: T.colB - 0.14, stitch: T.stitchB + 0.1, join: T.joinB, walk: 17.9, gap: 21.9, lenses: T.whyB + 0.5, orbit: T.feedB + 0.35, payoff: T.end - 0.5 };

  /* ── the cast ───────────────────────────────────────────────────────────── */
  const KEYS = ['request', 'order', 'age', 'policy', 'warranty', 'decide', 'denied', 'approved', 'email'];
  /* the same facts as they exist on the right track: loose notes in the pile */
  const SHADOWS = ['request', 'order', 'age', 'policy', 'decide', 'denied', 'email'];
  const FILLERS = 36;
  const PILE_N = 44;             /* the loose notes, the warranty note and the shadows */
  const HERO_N = 27;             /* how much of the pile is there when the page opens */
  const LOOP = 9;                /* seconds: the opening shot's two tracks take turns on this cycle */

  /* the run, going forward. `u` is when each edge is drawn, as a fraction of the run. */
  const RUN = [
    { a: 'request', b: 'order', ax: 0, bx: 0, u: [0.03, 0.22] },
    { a: 'order', b: 'age', ax: -0.18, bx: 0.08, u: [0.22, 0.42] },
    { a: 'order', b: 'email', side: true, u: [0.26, 0.46] },
    { a: 'age', b: 'decide', ax: 0.12, bx: -0.26, u: [0.42, 0.64] },
    { a: 'policy', b: 'decide', ax: -0.1, bx: 0.06, u: [0.42, 0.64] },
    { a: 'decide', b: 'denied', ax: -0.16, bx: 0.1, u: [0.64, 0.86] },
    { a: 'decide', b: 'approved', ax: 0.24, bx: -0.12, ghost: true, u: [0.68, 0.92] }
  ];
  /* when the run reaches each stage and its note is written */
  const BORN = { request: 0.02, order: 0.22, age: 0.42, policy: 0.42, email: 0.46, decide: 0.64, denied: 0.86, approved: 0.92 };
  /* on a phone the left pane is short, so the same stages read along two rows */
  const COMPACT = { 'request>order': 'across', 'order>age': 'across', 'policy>decide': 'across', 'decide>denied': 'across', 'age>decide': 'down' };
  /* stitching in code: the same facts, joined where they lie. `at` is a fraction of the stitch. */
  const STITCH = [
    { a: 'request', b: 'order', at: [0, 0.17] },
    { a: 'order', b: 'age', at: [0.17, 0.34] },
    { a: 'age', b: 'decide', at: [0.34, 0.52] },
    { a: 'policy', b: 'decide', at: [0.34, 0.52] },
    { a: 'decide', b: 'denied', at: [0.52, 0.7] }
  ];
  const STITCHED_AT = { request: 0, order: 0.17, age: 0.34, policy: 0.34, decide: 0.52, denied: 0.7 };
  const STITCH_GAP = [0.72, 0.9];  /* the one join that cannot be made */
  const GAP_SHOWN = T.stitchA + STITCH_GAP[1] * (T.stitchB - T.stitchA);
  /* where the stitched notes lie in the pile, so the thread reads as a path */
  const PILE_RANK = { request: 30, order: 20, age: 9, policy: 33, decide: 3, email: 14 };
  const WARRANTY_RANK = 24;

  /* the walk back along the joined record: when the comet leaves and arrives */
  const WALK = [
    { a: 'decide', b: 'denied', ax: -0.16, bx: 0.1, w: [15.65, 16.05] },
    { a: 'age', b: 'decide', ax: 0.12, bx: -0.26, w: [16.05, 16.45] },
    { a: 'policy', b: 'decide', ax: -0.1, bx: 0.06, w: [16.05, 16.55] },
    { a: 'order', b: 'age', ax: -0.18, bx: 0.08, w: [16.45, 16.85] },
    { a: 'request', b: 'order', ax: 0, bx: 0, w: [16.85, 17.25] }
  ];
  const LIT_AT = { denied: 15.45, decide: 16.05, age: 16.45, policy: 16.55, order: 16.85, request: 17.25 };
  const BREAK = 0.56;            /* how far along the attempted edge the comet gets */
  const CHAIN = ['request', 'order', 'age', 'policy', 'warranty', 'decide', 'denied'];
  const WHY_TREE = { denied: [0, 0, null], decide: [1, 1, 'denied'], age: [2, 2, 'decide'], order: [3, 3, 'age'], request: [4, 4, 'order'], policy: [5, 2, 'decide'], warranty: [6, 2, 'decide'] };

  /* the last shot's rings, inside out. Every body on them is a library. */
  const RINGS = ['read', 'default', 'hybrid', 'code'];

  const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
  const font = (size, weight = 500, mono = false) => weight + ' ' + size.toFixed(1) + 'px ' + (mono ? MONO : SANS);

  function makeNotes() {
    const r = rng(1909);
    const notes = [];
    const add = (fields) => notes.push(Object.assign({
      i: notes.length, jitter: r(), rot: r() - 0.5, depth: r(), delay: r(), phase: r() * TAU, wob: 0.5 + r(),
      lines: [0.6 + 0.4 * r(), 0.45 + 0.5 * r(), 0.3 + 0.45 * r()]
    }, fields));
    KEYS.forEach((key) => add({ key }));
    for (let i = 0; i < FILLERS; i++) add({ filler: true });
    SHADOWS.forEach((shadow) => add({ shadow }));
    /* rank decides where in the heap a note lands (0 is the centre) and whether
       it is already there when the page opens */
    const pile = notes.filter((n) => n.filler || n.shadow || n.key === 'warranty');
    const taken = {};
    pile.forEach((n) => {
      if (n.shadow === 'denied') n.rank = -1;
      else if (n.shadow) { n.rank = PILE_RANK[n.shadow]; taken[n.rank] = true; }
      else if (n.key === 'warranty') { n.rank = WARRANTY_RANK; taken[n.rank] = true; }
    });
    const open = [];
    for (let k = 0; k < PILE_N - 1; k++) if (!taken[k]) open.push(k);
    for (let i = open.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [open[i], open[j]] = [open[j], open[i]];
    }
    pile.filter((n) => n.filler).forEach((n, k) => { n.rank = open[k]; });
    /* the order the frantic reread passes over them */
    const scan = pile.slice();
    for (let i = scan.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [scan[i], scan[j]] = [scan[j], scan[i]];
    }
    scan.forEach((n, k) => { n.scan = k; });
    return notes;
  }

  /* ── Film: draws one frame ──────────────────────────────────────────────── */
  class Film {
    constructor(canvas) {
      this.canvas = canvas;
      this.c = canvas.getContext('2d');
      this.notes = makeNotes();
      this.byKey = {};
      this.byShadow = {};
      this.notes.forEach((n) => {
        if (n.key) this.byKey[n.key] = n;
        if (n.shadow) this.byShadow[n.shadow] = n;
      });
      this.pile = this.notes.filter((n) => n.filler || n.shadow || n.key === 'warranty');
      this.copy = null;
      this.prevCopy = null;
      this.flipAt = -99;
      this.pointer = { x: 0.5, y: 0.5, px: -1e4, py: -1e4, on: false };
      this.hook = null;
      this.hookIndex = 0;
      this.orbitClock = 0;
      this.lastClock = 0;
      this.bodies = [];
      this.hoverBody = null;
      this.sprites = new Map();
      this.labels = new Map();
      this.ans = null;
      this.still = false;
      this.W = 0; this.H = 0; this.dpr = 1;
    }

    /* ── data ── */
    setData(data) {
      this.data = data;
      const r = rng(77);
      const speed = { read: 0.15, default: 0.075, hybrid: 0.06, code: 0.05 };
      const nodes = data.nodes.filter((n) => n.ring);
      this.bodies = nodes.map((n) => ({ id: n.id, name: n.name, short: n.short || n.name, ring: n.ring, speed: speed[n.ring], angle: 0, jitter: r() }));
      RINGS.forEach((ring, k) => {
        const list = this.bodies.filter((b) => b.ring === ring);
        const start = k * 1.3 + 0.4;
        list.forEach((b, i) => { b.angle = start + (i / list.length) * TAU + (b.jitter - 0.5) * 0.14; b.rk = k; });
      });
      const named = (ids, n) => {
        const list = ids.map((id) => (nodes.filter((x) => x.id === id)[0] || {}).name).filter(Boolean);
        const shown = list.slice(0, n).join(' · ');
        return list.length > n ? shown + ' +' + (list.length - n) : shown;
      };
      this.laneNames = {
        bind: named(['hcifootprint', 'vizfootprint'], 2),
        hybrid: named(['footprintjs-ml'], 1),
        collect: named(['datapipeline'], 1)
      };
    }
    setView(view, animate, clock) {
      const next = this.data.views[view].film;
      this.prevCopy = animate ? this.copy : null;
      this.copy = next;
      this.flipAt = animate ? clock : -99;
    }
    readPalette() {
      const root = document.documentElement;
      const s = getComputedStyle(root);
      const g = (n) => s.getPropertyValue(n).trim();
      this.pal = {
        dark: root.classList.contains('dark'), bg: g('--bg'), ink: g('--fg'), muted: g('--fg-muted'), faint: g('--fg-faint'),
        note: g('--f-note'), noteLine: g('--f-note-line'), faux: g('--f-faux'), shadow: g('--f-shadow'), edge: g('--f-edge'),
        run: g('--f-run'), walk: g('--f-walk'), walkBg: g('--f-walk-bg'), bindBg: g('--f-bind-bg'), gap: g('--f-gap'), gapBg: g('--f-gap-bg'),
        own: g('--f-own'), bind: g('--f-bind'), hybrid: g('--f-hybrid'), lens: g('--f-lens'), sun: g('--yellow'), onSun: g('--yellow-on')
      };
      this.sprites.clear();
    }

    /* ── layout ── */
    resize(W, H, dpr, opts) {
      this.W = W; this.H = H; this.dpr = dpr;
      this.canvas.width = Math.round(W * dpr);
      this.canvas.height = Math.round(H * dpr);
      this.labels.clear();
      this.layout(opts || {});
    }
    layout(o) {
      const W = this.W, H = this.H;
      this.still = !!o.still;
      const portrait = o.still ? W / H < 1 : W < 860 || W / H < 1.1;
      this.portrait = portrait;
      let A;
      if (o.still) {
        A = { x: W * 0.03, y: H * 0.04, w: W * 0.94, h: H * 0.92 };
      } else if (portrait) {
        A = { x: 10, y: o.head + 6, w: W - 20, h: Math.max(190, H - o.head - 6 - o.capZone) };
      } else {
        let x = o.gutter + o.capW + 26;
        let w = W - x - o.gutter;
        const y = o.head + 10;
        const h = H - y - o.rail - 6;
        const maxW = Math.min(1180, h * 1.7);
        if (w > maxW) { x += (w - maxW) / 2; w = maxW; }
        A = { x, y, w, h };
      }
      this.A = A;

      /* the split: one pane per track until they join */
      const gapP = portrait ? 12 : 26;
      const PL = this.PL = portrait ? { x: A.x, y: A.y, w: A.w, h: (A.h - gapP) / 2 } : { x: A.x, y: A.y, w: (A.w - gapP) / 2, h: A.h };
      const PR = this.PR = portrait ? { x: A.x, y: A.y + PL.h + gapP, w: A.w, h: PL.h } : { x: A.x + PL.w + gapP, y: A.y, w: PL.w, h: A.h };
      const labelH = portrait ? 24 : 40;
      const inner = (P) => ({ x: P.x + (portrait ? 2 : 6), y: P.y + labelH, w: P.w - (portrait ? 4 : 12), h: P.h - labelH - (portrait ? 2 : 6) });
      const IL = this.IL = inner(PL), IR = this.IR = inner(PR);

      const kw = this.kw = portrait ? (A.w - 12) / 3.06 : clamp(A.w * 0.225, 132, 272);
      const kh = this.kh = portrait ? clamp(A.h * 0.112, 32, 44) : clamp(A.h * 0.088, 40, 74);
      const pw = this.pw = portrait ? clamp(IR.w * 0.165, 44, 74) : clamp(IR.w * 0.225, 58, 128);
      const ph = pw * 0.62;
      const fw = clamp(A.w * 0.036, 15, 34);
      const fh = fw * 0.62;
      this.nr = portrait ? 7 : 9;

      /* the heap: a golden-angle spiral with jitter, so it reads as a mess but
         never clumps into something unreadable */
      const cx = IR.x + IR.w * 0.5, cy = IR.y + IR.h * 0.5;
      const rx = IR.w * 0.5 - pw * 0.54, ry = IR.h * 0.5 - ph * 0.62;
      this.pile.forEach((n) => {
        if (n.shadow === 'denied') {
          n.P = { x: cx, y: cy - IR.h * 0.02, w: Math.max(pw * 1.5, portrait ? 100 : 142), h: Math.max(ph * 1.24, 34), rot: -0.05 };
          return;
        }
        const rad = Math.sqrt((n.rank + 0.5) / PILE_N);
        const ang = n.rank * 2.39996 + n.jitter * 0.6;
        const s = 0.9 + 0.22 * n.depth;
        n.P = { x: cx + Math.cos(ang) * rad * rx, y: cy + Math.sin(ang) * rad * ry, w: pw * s, h: ph * s, rot: n.rot * 0.62 };
      });
      /* the notes the stitch will reach lie apart, so its thread reads as a path */
      const LIE = portrait
        ? { request: [0.13, 0.24], order: [0.38, 0.18], age: [0.63, 0.26], policy: [0.14, 0.76], decide: [0.42, 0.7], denied: [0.68, 0.84], warranty: [0.89, 0.34] }
        : { request: [0.24, 0.13], order: [0.7, 0.2], age: [0.26, 0.38], policy: [0.76, 0.44], decide: [0.5, 0.6], denied: [0.27, 0.79], warranty: [0.77, 0.8] };
      Object.keys(LIE).forEach((k) => {
        const n = k === 'warranty' ? this.byKey.warranty : this.byShadow[k];
        n.P.x = IR.x + LIE[k][0] * IR.w;
        n.P.y = IR.y + LIE[k][1] * IR.h;
      });

      /* the flow: forward runs downward, so walking back moves upward, the same
         two directions the logo draws */
      const POS = portrait
        ? { request: [0.33, 0.065], order: [0.33, 0.255], email: [0.82, 0.255], age: [0.17, 0.48], policy: [0.5, 0.48], warranty: [0.83, 0.48], decide: [0.33, 0.705], denied: [0.2, 0.925], approved: [0.64, 0.925] }
        : { request: [0.3, 0.06], order: [0.3, 0.265], email: [0.76, 0.265], age: [0.15, 0.49], policy: [0.47, 0.49], warranty: [0.84, 0.49], decide: [0.31, 0.71], denied: [0.19, 0.93], approved: [0.58, 0.93] };
      KEYS.forEach((k) => {
        const n = this.byKey[k];
        n.F = { x: A.x + POS[k][0] * A.w, y: A.y + POS[k][1] * A.h, w: kw, h: kh, rot: 0 };
      });

      /* the same flow before the join, in the left pane */
      const kwD = portrait ? (IL.w - 12) / 3.06 : clamp(IL.w * 0.44, 104, 236);
      const khD = portrait ? clamp(IL.h * 0.27, 28, 42) : clamp(IL.h * 0.092, 36, 64);
      const DPOS = portrait
        ? { request: [0.17, 0.24], order: [0.5, 0.24], age: [0.83, 0.24], policy: [0.17, 0.78], decide: [0.5, 0.78], denied: [0.83, 0.78], email: [0.5, 0.24], approved: [0.5, 0.78] }
        : { request: [0.27, 0.06], order: [0.27, 0.27], email: [0.76, 0.27], age: [0.24, 0.5], policy: [0.76, 0.5], decide: [0.5, 0.71], denied: [0.27, 0.94], approved: [0.75, 0.94] };
      Object.keys(DPOS).forEach((k) => {
        this.byKey[k].D = { x: IL.x + DPOS[k][0] * IL.w, y: IL.y + DPOS[k][1] * IL.h, w: kwD, h: khD, hide: portrait && (k === 'email' || k === 'approved') };
      });

      /* the rest of the work: small notes scattered round the flow, wired to each
         other and never upstream of the result */
      const r = rng(4242);
      const fillers = this.notes.filter((n) => n.filler);
      const placed = [];
      const clear = (x, y, m) => KEYS.every((k) => {
        const f = this.byKey[k].F;
        return Math.abs(x - f.x) > f.w / 2 + m + fw / 2 || Math.abs(y - f.y) > f.h / 2 + m + fh / 2;
      });
      const minD = Math.sqrt((A.w * A.h) / fillers.length) * 0.72;
      fillers.forEach((n) => {
        let best = null, bestD = -1;
        for (let tries = 0; tries < 60; tries++) {
          const x = A.x + fw + r() * (A.w - fw * 2), y = A.y + fh + r() * (A.h - fh * 2);
          if (!clear(x, y, portrait ? 4 : 10)) continue;
          let d = 1e9;
          placed.forEach((p) => { d = Math.min(d, Math.hypot(x - p.x, y - p.y)); });
          if (d > bestD) { bestD = d; best = { x, y }; }
          if (d > minD) break;
        }
        best = best || { x: A.x + r() * A.w, y: A.y + r() * A.h };
        placed.push(best);
        n.F = { x: best.x, y: best.y, w: fw, h: fh, rot: 0 };
      });
      const sorted = fillers.slice().sort((a, b) => a.F.y - b.F.y);
      this.fe = [];
      sorted.forEach((n, i) => {
        let par = null, pd = 1e9;
        for (let j = 0; j < i; j++) {
          const m = sorted[j];
          if (m.F.y > n.F.y - fh * 0.8) continue;
          const d = Math.hypot(m.F.x - n.F.x, (m.F.y - n.F.y) * 0.8);
          if (d < pd) { pd = d; par = m; }
        }
        if (!par && r() < 0.5) par = this.byKey.email;
        if (par && pd < minD * 2.6) this.fe.push({ a: par, b: n, t0: T.joinB - 0.35 + ((n.F.y - A.y) / A.h) * 0.75 });
      });

      const dot = portrait ? 10 : 13;

      /* Flow Lens: the flow again, shifted down to clear the lens tabs */
      const tabH = this.tabH = portrait ? 24 : 34;
      KEYS.forEach((k) => {
        const f = this.byKey[k].F;
        const ny = (f.y - A.y) / A.h;
        this.byKey[k].LF = { x: f.x, y: A.y + tabH + ny * (A.h - tabH), w: kw, h: portrait ? kh * 0.92 : kh * 0.94, rot: 0 };
      });

      /* Why Lens: the same notes as an indented tree */
      const pitch = (A.h - tabH - 6) / 7;
      const indent = portrait ? A.w * 0.062 : Math.min(A.w * 0.085, 76);
      const treeW = portrait ? Math.min(kw * 1.35, A.w * 0.5) : kw * 1.12;
      const treeH = Math.min(pitch * 0.8, kh);
      const treeLeft = portrait ? A.x + 4 : A.x + Math.max(4, (A.w - (treeW + indent * 4)) / 2);
      Object.keys(WHY_TREE).forEach((k) => {
        const row = WHY_TREE[k];
        this.byKey[k].WHY = { x: treeLeft + row[1] * indent + treeW / 2, y: A.y + tabH + 4 + (row[0] + 0.5) * pitch, w: treeW, h: treeH, rot: 0 };
      });

      /* Story Lens: the same notes as ticks on a timeline */
      this.storyY = A.y + A.h * (portrait ? 0.84 : 0.82);
      CHAIN.forEach((k, i) => {
        this.byKey[k].ST = { x: lerp(A.x + A.w * 0.07, A.x + A.w * 0.93, i / (CHAIN.length - 1)), y: this.storyY, w: dot, h: dot, rot: 0 };
      });

      /* the system: rx comes from the width, the tilt from the height. The rings
         in the inner band are stitched by default, the outer band is stitched in
         code, and the hybrid rides the line between them. One sun for all of it. */
      this.oc = { x: A.x + A.w * 0.5, y: A.y + A.h * 0.5 - (portrait ? 8 : 12) };
      const tilt = portrait ? 0.78 : 0.68;
      const orx = Math.min(A.w * 0.5 - (portrait ? 6 : 28), (A.h * 0.5 - 28) / tilt);
      this.orb = {
        tilt, rx: orx, radii: [portrait ? 0.235 : 0.2, 0.455, 0.63, 0.84].map((f) => f * orx),
        aIn: orx * (portrait ? 0.335 : 0.315), aOut: orx * 0.612, bIn: orx * 0.648, bOut: orx, sun: portrait ? 15 : 24
      };

      /* a few walks for the opening shot */
      this.hooks = [];
      const visible = this.pile.filter((n) => n.rank >= 0 && n.rank < HERO_N);
      const r2 = rng(311);
      const chainFrom = (start) => {
        const chain = [start];
        const span = Math.min(IR.w, IR.h * 1.4);
        /* head through the pile, away from where the walk began */
        let ux = cx - start.P.x, uy = cy - start.P.y;
        const len0 = Math.hypot(ux, uy) || 1;
        ux /= len0; uy /= len0;
        for (let hop = 0; hop < 4; hop++) {
          const cur = chain[chain.length - 1];
          let best = null, bestScore = -1e9;
          visible.forEach((n) => {
            if (chain.indexOf(n) >= 0) return;
            const dx = n.P.x - cur.P.x, dy = n.P.y - cur.P.y, d = Math.hypot(dx, dy);
            if (d < span * 0.15 || d > span * 0.4) return;
            const score = (dx * ux + dy * uy) / d + r2() * 0.5;
            if (score > bestScore) { bestScore = score; best = n; }
          });
          /* a walk needs at least one step, even from a note in a corner of the pile */
          if (!best || (bestScore < 0.1 && chain.length > 1)) break;
          const dx = best.P.x - cur.P.x, dy = best.P.y - cur.P.y, d = Math.hypot(dx, dy);
          ux = lerp(ux, dx / d, 0.5); uy = lerp(uy, dy / d, 0.5);
          chain.push(best);
        }
        return chain;
      };
      this.chainFrom = chainFrom;
      for (let i = 0; i < 12 && this.hooks.length < 7; i++) {
        const walk = chainFrom(visible[Math.floor(r2() * visible.length)]);
        if (walk.length > 2) this.hooks.push(walk);
      }
    }

    /* ── helpers ── */
    sprite(color) {
      let s = this.sprites.get(color);
      if (s) return s;
      s = document.createElement('canvas');
      s.width = s.height = 64;
      const x = s.getContext('2d');
      const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
      const clear = fadeOf(color);
      g.addColorStop(0, color); g.addColorStop(0.22, color); g.addColorStop(1, clear);
      x.fillStyle = g; x.fillRect(0, 0, 64, 64);
      this.sprites.set(color, s);
      return s;
    }
    glow(x, y, radius, color, alpha) {
      const c = this.c;
      c.save();
      c.globalAlpha = alpha * (this.pal.dark ? 0.9 : 0.34);
      if (this.pal.dark) c.globalCompositeOperation = 'lighter';
      c.drawImage(this.sprite(color), x - radius, y - radius, radius * 2, radius * 2);
      c.restore();
    }
    /* a bezier sampled once per frame: partial draws, comets and ends all read it */
    curve(p0, p1, p2, p3, n = 26) {
      const pts = [];
      for (let i = 0; i <= n; i++) {
        const t = i / n, u = 1 - t;
        pts.push([
          u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
          u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]
        ]);
      }
      return pts;
    }
    down(a, b, ax = 0, bx = 0) {
      const p0 = [a.x + ax * a.w, a.y + a.h / 2], p3 = [b.x + bx * b.w, b.y - b.h / 2];
      const d = Math.max(14, (p3[1] - p0[1]) * 0.55);
      return this.curve(p0, [p0[0], p0[1] + d], [p3[0], p3[1] - d], p3);
    }
    across(a, b) {
      const p0 = [a.x + a.w / 2, a.y], p3 = [b.x - b.w / 2, b.y];
      const d = (p3[0] - p0[0]) * 0.5;
      return this.curve(p0, [p0[0] + d, p0[1]], [p3[0] - d, p3[1]], p3);
    }
    stroke(pts, f0, f1) {
      const c = this.c, n = pts.length - 1;
      const a = clamp(f0) * n, b = clamp(f1) * n;
      if (b - a < 1e-3) return;
      const at = (s) => {
        const i = Math.min(n - 1, Math.floor(s)), k = s - i;
        return [lerp(pts[i][0], pts[i + 1][0], k), lerp(pts[i][1], pts[i + 1][1], k)];
      };
      const start = at(a);
      c.beginPath();
      c.moveTo(start[0], start[1]);
      for (let i = Math.floor(a) + 1; i < b; i++) c.lineTo(pts[i][0], pts[i][1]);
      const end = at(b);
      c.lineTo(end[0], end[1]);
      c.stroke();
    }
    pointOn(pts, f) {
      const n = pts.length - 1, s = clamp(f) * n, i = Math.min(n - 1, Math.floor(s)), k = s - i;
      return [lerp(pts[i][0], pts[i + 1][0], k), lerp(pts[i][1], pts[i + 1][1], k)];
    }
    arrow(pts, color, size, alpha) {
      const c = this.c, n = pts.length - 1;
      const a = pts[n], b = pts[n - 2];
      const ang = Math.atan2(a[1] - b[1], a[0] - b[0]);
      c.save();
      c.translate(a[0], a[1]); c.rotate(ang);
      c.globalAlpha = alpha; c.fillStyle = color;
      c.beginPath(); c.moveTo(0, 0); c.lineTo(-size, -size * 0.55); c.lineTo(-size, size * 0.55); c.closePath(); c.fill();
      c.restore();
    }
    comet(pts, f, color, width, alpha) {
      const c = this.c, tail = 0.34, steps = 7;
      c.save();
      c.lineCap = 'round';
      c.strokeStyle = color;
      for (let i = 0; i < steps; i++) {
        const k = i / steps;
        c.globalAlpha = alpha * k * k;
        c.lineWidth = width * (0.6 + k * 1.4);
        this.stroke(pts, f - tail * (1 - k), f - tail * (1 - (i + 1) / steps));
      }
      c.restore();
      const head = this.pointOn(pts, f);
      this.glow(head[0], head[1], width * 7, color, alpha);
      c.save();
      c.globalAlpha = alpha; c.fillStyle = color;
      c.beginPath(); c.arc(head[0], head[1], width * 1.15, 0, TAU); c.fill();
      c.restore();
    }
    ripple(x, y, f, radius, color, alpha = 1) {
      if (f <= 0 || f >= 1) return;
      const c = this.c;
      c.save();
      c.globalAlpha = (1 - f) * 0.8 * alpha;
      c.strokeStyle = color; c.lineWidth = 1 + (1 - f) * 1.6;
      c.beginPath(); c.arc(x, y, E.out(f) * radius, 0, TAU); c.stroke();
      c.restore();
    }
    sparks(x, y, f, color, seed, radius) {
      if (f <= 0 || f >= 1) return;
      const c = this.c, r = rng(seed);
      c.save();
      c.fillStyle = color;
      for (let i = 0; i < 12; i++) {
        const a = r() * TAU, d = (0.45 + r() * 0.55) * radius * E.out(f), s = 1 + r() * 1.8;
        c.globalAlpha = (1 - f) * (1 - f);
        c.beginPath(); c.arc(x + Math.cos(a) * d, y + Math.sin(a) * d + f * f * 8, s, 0, TAU); c.fill();
      }
      c.restore();
    }
    pill(x, y, text, opt) {
      const c = this.c;
      const size = opt.size || 12, mono = !!opt.mono;
      c.save();
      c.font = font(size, opt.weight || 600, mono);
      const tw = c.measureText(text).width, pad = size * 0.72, w = tw + pad * 2, h = size * 2.05;
      const px = clamp(x, this.A.x + w / 2 + 2, this.A.x + this.A.w - w / 2 - 2);
      c.translate(px, y);
      const s = opt.scale === undefined ? 1 : opt.scale;
      c.scale(s, s);
      c.globalAlpha = opt.alpha === undefined ? 1 : opt.alpha;
      c.fillStyle = opt.bg;
      rr(c, -w / 2, -h / 2, w, h, h / 2); c.fill();
      if (opt.line) { c.strokeStyle = opt.line; c.lineWidth = 1; c.stroke(); }
      c.fillStyle = opt.ink;
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(text, 0, size * 0.06);
      c.restore();
      return { x: px, y, w, h };
    }

    /* fit a label to a box: one line if it can, otherwise the best two-line break */
    fit(text, maxW, base, mono, weight) {
      const id = text + '|' + maxW.toFixed(0) + '|' + base.toFixed(1) + '|' + mono + '|' + weight;
      const hit = this.labels.get(id);
      if (hit) return hit;
      const c = this.c;
      let result = null;
      for (let size = base; size >= base * 0.78; size -= 0.5) {
        c.font = font(size, weight, mono);
        if (c.measureText(text).width <= maxW) { result = { lines: [text], size }; break; }
        const words = text.split(' ');
        let best = null, bestW = 1e9;
        for (let i = 1; i < words.length; i++) {
          const a = words.slice(0, i).join(' '), b = words.slice(i).join(' ');
          const w = Math.max(c.measureText(a).width, c.measureText(b).width);
          if (w < bestW) { bestW = w; best = [a, b]; }
        }
        if (best && bestW <= maxW) { result = { lines: best, size }; break; }
      }
      if (!result) result = { lines: [text], size: base * 0.76 };
      this.labels.set(id, result);
      return result;
    }
    flipAmount(i, clock) {
      return clamp((clock - this.flipAt - i * 0.016) / 0.36);
    }
    drawText(text, w, h, alpha, dy, mono, weight, color) {
      const c = this.c;
      const big = weight > 600;
      const sized = this.portrait ? clamp(w / 10, 8.8, 12) : clamp(w / 13.6, 9.8, 17.5);
      const L = this.fit(text, w - (this.portrait ? 10 : 14), sized * (mono ? 0.86 : 1) * (big ? 1.04 : 1), mono, weight);
      c.font = font(L.size, weight, mono);
      c.fillStyle = color;
      c.globalAlpha = alpha;
      c.textAlign = 'center'; c.textBaseline = 'middle';
      const lh = L.size * 1.22;
      L.lines.forEach((line, i) => c.fillText(line, 0, dy + (i - (L.lines.length - 1) / 2) * lh + 0.5));
    }
    /* during a view switch the old word leaves upward and the new one arrives from below */
    drawLabel(key, i, w, h, alpha, clock, color, weight) {
      if (alpha <= 0.01 || !this.copy) return;
      const p = this.prevCopy ? this.flipAmount(i, clock) : 1;
      const mono = !!this.copy.mono;
      if (p < 0.5 && this.prevCopy) {
        this.drawText(this.prevCopy.labels[key], w, h, alpha * (1 - p * 2), -p * 2 * 8, !!this.prevCopy.mono, weight, color);
      } else {
        this.drawText(this.copy.labels[key], w, h, alpha * (this.prevCopy ? p * 2 - 1 : 1), (1 - (this.prevCopy ? p * 2 - 1 : 1)) * 8, mono, weight, color);
      }
    }

    /* ── the two tracks take turns ── */
    /* how much of the run has happened. On the opening shot it loops by itself. */
    runU(t, clock) {
      if (this.still) return t < T.runA ? 1 : win(T.runA, T.runB, t);
      if (t >= T.runA - 0.2) return win(T.runA, T.runB, t);
      return win(1, 4.2, clock % LOOP);
    }
    heroFade(t, clock) {
      if (this.still || t >= T.runA - 0.2) return 1;
      return (1 - win(8.4, 8.95, clock % LOOP)) * (1 - win(0.5, 0.9, t));
    }
    leftDim(t) {
      const rest = win(T.leftEnd - 0.1, T.leftEnd + 0.25, t) * (1 - win(T.joinA - 0.2, T.joinA + 0.15, t));
      const deep = win(T.hybA - 0.25, T.hybA, t) * (1 - win(T.hybB - 0.1, T.hybB + 0.1, t));
      return lerp(1, 0.4, rest) * lerp(1, 0.32, deep);
    }
    rightDim(t) {
      const waits = win(0.35, 1.05, t) * (1 - win(T.leftEnd - 0.1, T.rainA + 0.1, t));
      const stops = win(T.bindA - 0.25, T.bindA + 0.05, t) * (1 - win(T.stitchA - 0.25, T.stitchA + 0.05, t));
      return lerp(1, 0.42, waits) * lerp(1, 0.06, stops);
    }
    stitched(n, t) {
      const at = STITCHED_AT[n.shadow];
      if (at === undefined) return 0;
      const d = T.stitchB - T.stitchA;
      return win(T.stitchA + at * d, T.stitchA + (at + 0.09) * d, t);
    }

    /* ── where a note is at time t ── */
    pose(n, t, clock) {
      return n.D ? this.poseLeft(n, t, clock) : this.posePile(n, t, clock);
    }
    /* after the join, everything on the record goes through the lenses into the sun */
    lensStages(n, t, p) {
      const stages = [
        ['LF', T.lensA + n.delay * 0.18, T.lensB],
        ['WHY', T.whyA + n.delay * 0.1, T.whyB],
        ['ST', T.storyA + n.delay * 0.1, T.storyB]
      ];
      for (const [name, a0, b0] of stages) {
        const m = E.inOut(win(a0, b0, t));
        if (m <= 0) break;
        const q = n[name];
        p.x = lerp(p.x, q.x, m); p.y = lerp(p.y, q.y, m); p.w = lerp(p.w, q.w, m); p.h = lerp(p.h, q.h, m); p.rot = lerp(p.rot, 0, m);
      }
      const m = E.inOut(win(T.orbitA + n.delay * 0.14, T.sunB - 0.06, t));
      if (m > 0) {
        p.x = lerp(p.x, this.oc.x, m); p.y = lerp(p.y, this.oc.y, m);
        p.a *= 1 - win(T.sunB - 0.2, T.sunB, t);
      }
    }
    /* the left track: no note exists until the run reaches its stage */
    poseLeft(n, t, clock) {
      const key = n.key, D = n.D, F = n.F;
      const q = win(BORN[key], BORN[key] + 0.05, this.runU(t, clock));
      const s = q > 0 ? E.back(q) : 0;
      const p = { x: D.x, y: D.y, w: D.w * s, h: D.h * s, rot: 0, a: q > 0 ? 1 : 0 };
      const d0 = T.joinA + n.delay * 0.22;
      const m = E.inOut(win(d0, d0 + 0.72, t));
      if (m > 0) {
        const ms = E.settle(win(d0, d0 + 0.72, t));
        p.x = lerp(D.x, F.x, ms); p.y = lerp(D.y, F.y, ms);
        p.w = lerp(D.w, F.w, m); p.h = lerp(D.h, F.h, m);
      }
      if (D.hide) p.a *= m;
      p.a *= this.leftDim(t) * this.heroFade(t, clock);
      if (key === 'email' || key === 'approved') {
        const out = key === 'approved' ? win(T.gapA, T.gapA + 0.45, t) : win(T.lensA, T.lensA + 0.34, t);
        p.a *= 1 - out;
        if (key === 'email') { p.w *= 1 - out * 0.7; p.h *= 1 - out * 0.7; }
        p.a *= lerp(1, 0.3, win(T.walkA + 0.25, T.walkA + 1.3, t));
      } else {
        this.lensStages(n, t, p);
      }
      return p;
    }
    /* the right track: a pile, and it stays a pile until the join */
    posePile(n, t, clock) {
      const P = n.P, sk = n.shadow;
      const p = { x: P.x, y: P.y, w: P.w, h: P.h, rot: P.rot, a: 1 };
      if (sk === 'denied') {
        const q = win(T.dropA, T.dropB, t);
        if (q <= 0) p.a = 0;
        p.y -= (1 - E.bounce(q)) * this.H * 0.8;
        p.rot += (1 - q) * 0.5;
      } else if (n.rank >= HERO_N) {
        const d = T.rainA + n.delay * 0.42, q = win(d, d + 0.36, t);
        if (q <= 0) p.a = 0;
        p.y -= (1 - E.out(q)) * this.H * 0.9;
        p.rot += (1 - q) * n.rot * 1.6;
      } else if (!this.still) {
        const q = win(0, 0.95, clock - n.delay * 0.8);
        if (q <= 0) p.a = 0;
        p.y -= (1 - E.bounce(q)) * this.H * 0.95;
        p.rot += (1 - q) * n.rot * 2;
      }
      /* a stitched note steps forward, but stays where it lies */
      const st = this.stitched(n, t);
      if (st > 0) { p.w *= 1 + 0.18 * st; p.h *= 1 + 0.18 * st; p.rot *= 1 - 0.75 * st; }
      /* the join: everything leaves the pile */
      const d0 = T.joinA + n.delay * 0.3;
      const mf = E.inOut(win(d0, d0 + 0.66, t));
      if (mf > 0) {
        const F = sk ? this.byKey[sk].F : n.F;
        const ms = E.settle(win(d0, d0 + 0.66, t));
        p.x = lerp(p.x, F.x, ms); p.y = lerp(p.y, F.y, ms);
        p.w = lerp(p.w, F.w, mf); p.h = lerp(p.h, F.h, mf); p.rot = lerp(p.rot, 0, mf);
      }
      /* ambient life, and a little depth under the pointer while on the opening shot */
      if (!this.still) {
        const amp = (1 - mf) * (this.portrait ? 1.2 : 2.2);
        if (amp > 0.01) {
          p.x += Math.sin(clock * 0.62 * n.wob + n.phase) * amp;
          p.y += Math.cos(clock * 0.5 * n.wob + n.phase) * amp;
          p.rot += Math.sin(clock * 0.4 * n.wob + n.phase) * 0.012 * (1 - mf);
        }
        const heroW = 1 - win(0.2, 1, t);
        if (heroW > 0) {
          p.x += (this.pointer.x - 0.5) * (n.depth - 0.4) * 22 * heroW;
          p.y += (this.pointer.y - 0.5) * (n.depth - 0.4) * 14 * heroW;
        }
      }
      p.a *= this.rightDim(t);
      if (sk) {
        /* a shadow lands on its own note on the left track, and the two are one */
        p.a *= 1 - win(T.joinB - 0.3, T.joinB - 0.02, t);
      } else if (n.filler) {
        const out = win(T.lensA + n.delay * 0.28, T.lensA + n.delay * 0.28 + 0.34, t);
        p.a *= (1 - out) * lerp(1, 0.17, win(T.walkA + 0.25, T.walkA + 1.3, t));
        p.w *= 1 - out * 0.7; p.h *= 1 - out * 0.7;
      } else {
        const dim = win(T.walkA + 0.25, T.walkA + 1.3, t) * (1 - win(T.gapA + 0.2, T.gapHit, t));
        p.a *= lerp(1, 0.42, dim);
        this.lensStages(n, t, p);
      }
      return p;
    }

    litAmount(key, t) {
      const at = LIT_AT[key];
      if (at === undefined) return 0;
      return win(at, at + 0.14, t);
    }

    /* ── one note ── */
    drawNote(n, po, t, clock, extra) {
      if (po.a <= 0.01 || po.w < 1) return;
      const c = this.c, pal = this.pal, key = n.key, sk = n.shadow;
      const w = po.w, h = po.h, r = Math.min(this.nr, w / 2, h / 2);
      const isDot = w < 22;
      const st = sk ? this.stitched(n, t) : 0;
      let label = 0;
      if (sk === 'denied') label = w > 50 ? 1 : 0;
      else if (sk) label = this.portrait ? 0 : st;
      else if (key === 'warranty') label = E.inOut(clamp((w - this.pw * 1.3) / Math.max(1, this.kw - this.pw * 1.3)));
      else if (key) label = clamp((w - 24) / 30);
      c.save();
      c.translate(po.x, po.y);
      if (po.rot) c.rotate(po.rot);
      const at = key ? LIT_AT[key] : undefined;
      let pop = 1;
      if (at !== undefined) pop += 0.1 * bump((t - at - 0.1) / 0.16);
      if (extra && extra.lit && extra.popAt !== undefined) pop += 0.1 * bump((clock - extra.popAt - 0.12) / 0.2);
      if (pop !== 1) c.scale(pop, pop);

      c.globalAlpha = po.a;
      if (!isDot && pal.shadow) {
        c.fillStyle = pal.shadow;
        rr(c, -w / 2, -h / 2 + Math.min(3, h * 0.08), w, h, r); c.fill();
      }
      const gapOn = key === 'warranty' ? win(GAP_SHOWN, GAP_SHOWN + 0.2, t) : 0;
      c.fillStyle = gapOn > 0.5 && !isDot ? pal.gapBg : pal.note;
      rr(c, -w / 2, -h / 2, w, h, r); c.fill();

      /* a tint says what touched this note: purple for stitching, green for the walk back */
      const walked = key ? this.litAmount(key, t) : 0;
      const tied = Math.max(st, extra && extra.lit ? extra.lit : 0);
      if (tied > 0) {
        c.globalAlpha = po.a * tied;
        c.fillStyle = isDot ? pal.bind : pal.bindBg;
        rr(c, -w / 2, -h / 2, w, h, r); c.fill();
      }
      if (walked > 0) {
        c.globalAlpha = po.a * walked;
        c.fillStyle = isDot ? pal.walk : pal.walkBg;
        rr(c, -w / 2, -h / 2, w, h, r); c.fill();
      }

      /* faux handwriting while it is still just a note */
      const loose = n.filler ? clamp((w - 30) / 30) : (sk || key === 'warranty') ? 1 - label : 0;
      if (loose > 0.02 && !isDot && h > 16) {
        c.globalAlpha = po.a * loose;
        c.fillStyle = pal.faux;
        const bh = Math.max(2, h * 0.085), bx = -w * 0.36;
        for (let i = 0; i < 3; i++) {
          rr(c, bx, -h * 0.24 + i * h * 0.22 - bh / 2, w * 0.72 * n.lines[i], bh, bh / 2); c.fill();
        }
      }

      /* outline */
      const flash = extra && extra.flash ? extra.flash : 0;
      c.globalAlpha = po.a;
      rr(c, -w / 2, -h / 2, w, h, r);
      if (gapOn > 0) {
        c.strokeStyle = pal.gap; c.lineWidth = 1.6; c.setLineDash([5, 4]); c.stroke(); c.setLineDash([]);
      } else if (key === 'approved' && label > 0.5) {
        c.strokeStyle = pal.edge; c.lineWidth = 1.2; c.setLineDash([4, 4]); c.stroke(); c.setLineDash([]);
      } else if (flash > 0.02) {
        c.strokeStyle = pal.run; c.lineWidth = 1 + flash * 1.4; c.stroke();
      } else if (walked > 0.02) {
        c.strokeStyle = pal.walk; c.lineWidth = 1 + walked * 0.9; c.stroke();
      } else if (tied > 0.02) {
        c.strokeStyle = pal.bind; c.lineWidth = 1 + tied * 0.9; c.stroke();
      } else if ((key === 'denied' || sk === 'denied') && !isDot) {
        c.strokeStyle = pal.ink; c.lineWidth = 1.7; c.stroke();
      } else {
        c.strokeStyle = pal.noteLine; c.lineWidth = 1; c.stroke();
      }

      if (label > 0.02 && !isDot) {
        const color = key === 'approved' ? pal.faint : gapOn > 0.5 ? pal.gap : pal.ink;
        const weight = key === 'denied' || sk === 'denied' ? 650 : 560;
        this.drawLabel(key || sk, n.i, w, h, po.a * label, clock, color, weight);
        if (key === 'decide') {
          /* an explicit decision wears a small diamond on its top edge */
          c.globalAlpha = po.a * label;
          c.fillStyle = pal.bind;
          c.save(); c.translate(0, -h / 2); c.rotate(Math.PI / 4); c.fillRect(-4, -4, 8, 8); c.restore();
        }
      }
      c.restore();
    }

    /* ── the opening shot: the flowchart runs, then a thread finds its way through the pile ── */
    updateHook(t, clock) {
      if (t > 0.95 || !this.hooks || !this.hooks.length) { this.hook = null; return; }
      const hop = 0.42;
      if (this.pointer.on && !this.portrait) {
        /* hover the pile: a thread is stitched through it from that note */
        let found = null;
        const px = this.pointer.px, py = this.pointer.py;
        for (const n of this.pile) {
          if (n.rank < 0 || n.rank >= HERO_N) continue;
          if (Math.abs(px - n.P.x) < n.P.w / 2 && Math.abs(py - n.P.y) < n.P.h / 2) found = n;
        }
        if (found && (!this.hook || this.hook.chain[0] !== found) && (!this.hook || clock - this.hook.start > 0.25)) {
          this.hook = { chain: this.chainFrom(found), start: clock, gap: this.hookIndex % 2 === 0 };
          this.hookIndex++;
          return;
        }
      }
      const running = this.hook;
      const life = running ? (running.chain.length - 1) * hop + 2.3 : 0;
      if (!running || clock - running.start > life) {
        const c = clock % LOOP;
        if (c < 4.6 || c > 5.1) { this.hook = null; return; }
        this.hook = { chain: this.hooks[this.hookIndex % this.hooks.length], start: clock, gap: this.hookIndex % 2 === 0 };
        this.hookIndex++;
      }
    }
    hop(a, b, side = 1) {
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, nx = -(b.y - a.y) * 0.14 * side, ny = (b.x - a.x) * 0.14 * side;
      return this.curve([a.x, a.y], [mx + nx, my + ny], [mx + nx, my + ny], [b.x, b.y], 20);
    }
    hookState(clock) {
      const h = this.hook;
      if (!h) return null;
      const hop = 0.42;
      const age = this.still ? 99 : clock - h.start;
      const hops = h.chain.length - 1;
      const fade = this.still ? 1 : 1 - win(hops * hop + 1.8, hops * hop + 2.3, age);
      return { h, hop, age, hops, fade };
    }
    drawHook(t, clock, poses) {
      const s = this.hookState(clock);
      if (!s) return;
      const c = this.c, pal = this.pal, weight = (1 - win(0.25, 0.9, t)) * s.fade;
      if (weight <= 0) return;
      c.save();
      c.lineCap = 'round';
      for (let k = 0; k < s.hops; k++) {
        const f = win(k * s.hop, (k + 1) * s.hop, s.age);
        if (f <= 0) break;
        const a = poses[s.h.chain[k].i], b = poses[s.h.chain[k + 1].i];
        const pts = this.hop(a, b, k % 2 ? -1 : 1);
        c.strokeStyle = pal.bind; c.globalAlpha = 0.22 * weight; c.lineWidth = 7;
        this.stroke(pts, 0, f);
        c.globalAlpha = weight; c.lineWidth = 2.4;
        this.stroke(pts, 0, f);
        if (f < 1) this.comet(pts, f, pal.bind, 2.4, weight);
        else this.ripple(b.x, b.y, win((k + 1) * s.hop, (k + 1) * s.hop + 0.5, s.age), b.w * 0.7, pal.bind, weight);
      }
      /* every other walk ends where the record ends, and says so */
      if (s.h.gap && s.hops > 0) {
        const f = win(s.hops * s.hop, s.hops * s.hop + 0.35, s.age);
        if (f > 0) {
          const last = poses[s.h.chain[s.hops].i], prev = poses[s.h.chain[s.hops - 1].i];
          const len = Math.hypot(last.x - prev.x, last.y - prev.y) || 1;
          const ux = (last.x - prev.x) / len, uy = (last.y - prev.y) / len;
          const reach = Math.min(this.IR.w, this.IR.h) * 0.17;
          const ex = last.x + ux * reach * f, ey = last.y + uy * reach * f;
          c.strokeStyle = pal.gap; c.lineWidth = 2; c.setLineDash([4, 5]); c.globalAlpha = weight;
          c.beginPath(); c.moveTo(last.x, last.y); c.lineTo(ex, ey); c.stroke(); c.setLineDash([]);
          if (f > 0.7 && this.copy) {
            this.pill(ex, ey, this.copy.gapShort, { size: this.portrait ? 10 : 11.5, bg: pal.gap, ink: pal.dark ? '#0a0a0b' : '#fff', alpha: weight, scale: E.back(win(0.7, 1, f)), mono: !!this.copy.mono });
          }
        }
      }
      c.restore();
    }

    /* ── the left track's edges, then the walk back along them ── */
    geom(e, a, b, compact) {
      const style = compact ? COMPACT[e.a + '>' + e.b] : null;
      if (style === 'across') return this.across(a, b);
      if (style === 'down') return this.down(a, b, 0, 0.2);
      return e.side ? this.across(a, b) : this.down(a, b, e.ax, e.bx);
    }
    edgePoints(e, poses, t) {
      const a = poses[this.byKey[e.a].i], b = poses[this.byKey[e.b].i];
      const wide = this.geom(e, a, b, false);
      if (!this.portrait || t >= T.joinB) return wide;
      const compact = this.geom(e, a, b, true);
      if (t <= T.joinA) return compact;
      const m = E.inOut(win(T.joinA, T.joinB - 0.3, t));
      return compact.map((p, i) => [lerp(p[0], wide[i][0], m), lerp(p[1], wide[i][1], m)]);
    }
    /* the flowchart before it runs: the program itself, in dashes, waiting */
    drawChart(t) {
      const chart = (1 - win(T.joinA, T.joinA + 0.35, t)) * this.leftDim(t);
      if (chart <= 0) return;
      const c = this.c, pal = this.pal;
      c.save();
      c.strokeStyle = pal.edge; c.lineWidth = 1.1; c.lineCap = 'round'; c.globalAlpha = chart * 0.75;
      c.setLineDash([3, 5]);
      Object.keys(BORN).forEach((k) => {
        const D = this.byKey[k].D;
        if (D.hide) return;
        rr(c, D.x - D.w / 2, D.y - D.h / 2, D.w, D.h, this.nr); c.stroke();
      });
      RUN.forEach((e) => {
        const A = this.byKey[e.a].D, B = this.byKey[e.b].D;
        if (A.hide || B.hide) return;
        this.stroke(this.geom(e, A, B, this.portrait), 0, 1);
      });
      c.restore();
    }
    drawEdges(t, clock, poses) {
      const c = this.c, pal = this.pal;
      if (t > T.lensA + 0.75) return;
      const u = this.runU(t, clock);
      const fade = this.heroFade(t, clock) * this.leftDim(t);
      const dimmed = win(T.walkA + 0.25, T.walkA + 1.3, t);
      const leave = 1 - win(T.lensA, T.lensA + 0.35, t);
      c.save();
      c.lineCap = 'round';
      /* once the tracks have joined, the rest of the work wires up in a wave */
      c.strokeStyle = pal.edge; c.lineWidth = 1;
      this.fe.forEach((e) => {
        const f = win(e.t0, e.t0 + 0.42, t);
        if (f <= 0) return;
        const pts = this.down(poses[e.a.i], poses[e.b.i]);
        c.globalAlpha = lerp(0.75, 0.1, dimmed) * leave;
        this.stroke(pts, 0, E.inOut(f));
      });
      /* the run itself: each edge exists because the run crossed it */
      const leads = [];
      RUN.forEach((e) => {
        const f = win(e.u[0], e.u[1], u);
        if (f <= 0) return;
        const hidden = this.byKey[e.b].D.hide;
        if (hidden && t < T.joinA + 0.2) return;
        const reveal = hidden ? win(T.joinA + 0.2, T.joinB, t) : 1;
        const pts = this.edgePoints(e, poses, t);
        const side = e.side || e.ghost;
        const baseA = (side ? lerp(0.9, 0.22, dimmed) : lerp(1, 0.32, dimmed)) * leave * fade * reveal * (e.ghost ? 1 - win(T.gapA, T.gapA + 0.4, t) : 1);
        c.strokeStyle = e.ghost ? pal.edge : pal.run;
        c.lineWidth = e.ghost ? 1.2 : 1.8;
        c.globalAlpha = baseA;
        if (e.ghost) c.setLineDash([4, 5]);
        this.stroke(pts, 0, f);
        c.setLineDash([]);
        if (f >= 1) this.arrow(pts, e.ghost ? pal.edge : pal.run, 7, baseA);
        else if (!e.ghost) leads.push([pts, f]);
      });
      c.restore();
      leads.forEach(([pts, f]) => this.comet(pts, f, pal.run, 2.2, fade));
    }
    threadAlpha(t) {
      return 1 - win(T.whyA, T.whyA + 0.25, t);
    }
    drawThread(t, poses) {
      const c = this.c, pal = this.pal, alpha = this.threadAlpha(t);
      if (t < WALK[0].w[0] || alpha <= 0) return;
      const leadCurve = [];
      c.save();
      c.lineCap = 'round';
      WALK.forEach((e) => {
        const f = win(e.w[0], e.w[1], t);
        if (f <= 0) return;
        const pts = this.edgePoints(e, poses, t);
        const rev = pts.slice().reverse();
        c.strokeStyle = pal.walk;
        c.globalAlpha = 0.2 * alpha; c.lineWidth = 8;
        this.stroke(rev, 0, f);
        c.globalAlpha = alpha; c.lineWidth = 2.8;
        this.stroke(rev, 0, f);
        if (f < 1) leadCurve.push([rev, f]);
      });
      c.restore();
      leadCurve.forEach(([rev, f]) => this.comet(rev, f, pal.walk, 2.8, 1));
    }

    /* ── the edge that cannot be made ── */
    gapPath(poses) {
      const w = poses[this.byKey.warranty.i], d = poses[this.byKey.decide.i];
      return this.down(w, d, -0.04, 0.32).reverse();
    }
    drawGap(t, clock, poses) {
      if (t < T.gapA) return;
      const alpha = this.threadAlpha(t);
      if (alpha <= 0) return;
      const c = this.c, pal = this.pal;
      const pts = this.gapPath(poses);
      const f = win(T.gapA, T.gapHit, t);
      const reach = E.out(f) * BREAK;
      c.save();
      c.lineCap = 'round';
      c.strokeStyle = pal.walk;
      c.globalAlpha = 0.2 * alpha; c.lineWidth = 8; this.stroke(pts, 0, reach);
      c.globalAlpha = alpha; c.lineWidth = 2.8; this.stroke(pts, 0, reach);
      const after = win(T.gapHit, T.gapHit + 0.35, t);
      if (after > 0) {
        c.strokeStyle = pal.gap; c.lineWidth = 2; c.setLineDash([3, 6]);
        c.globalAlpha = after * alpha;
        this.stroke(pts, BREAK + 0.05, BREAK + 0.05 + (1 - BREAK - 0.05) * after);
        c.setLineDash([]);
      }
      c.restore();
      if (f > 0 && f < 1) this.comet(pts, reach, pal.walk, 2.8, 1);
      const hit = this.pointOn(pts, BREAK);
      this.sparks(hit[0], hit[1], win(T.gapHit, T.gapHit + 0.5, t), pal.gap, 88, this.portrait ? 26 : 42);
      this.ripple(hit[0], hit[1], win(T.gapHit, T.gapHit + 0.55, t), this.portrait ? 28 : 48, pal.gap);
      if (after > 0) {
        /* the break itself: a small open ring where the edge stops */
        c.save();
        c.globalAlpha = after * alpha;
        c.fillStyle = pal.bg; c.strokeStyle = pal.gap; c.lineWidth = 2.2;
        c.beginPath(); c.arc(hit[0], hit[1], 5, 0, TAU); c.fill(); c.stroke();
        c.restore();
      }
    }
    /* the words on the gap ride above every note, so nothing can sit on top of them */
    drawGapTop(t, poses) {
      if (t < T.gapHit || t > T.lensA + 0.3) return;
      const pal = this.pal, live = 1 - win(T.lensA, T.lensA + 0.3, t);
      const hit = this.pointOn(this.gapPath(poses), BREAK);
      const tagIn = win(T.gapHit + 0.05, T.gapHit + 0.4, t);
      if (tagIn > 0 && this.copy) {
        const yOff = this.portrait ? 18 : 24;
        const box = this.pill(hit[0] + (this.portrait ? 6 : 26), hit[1] + yOff, this.copy.gapTag, {
          size: this.portrait ? 10 : 12, bg: pal.gap, ink: pal.dark ? '#0a0a0b' : '#fff', alpha: tagIn * live, scale: E.back(tagIn), mono: !!this.copy.mono
        });
        this.gapTagBox = box;
      }
      /* the honest answer cites what it stands on: the numbers in its text are
         pinned to the notes they came from */
      const cite = win(T.honestA + 0.1, T.honestB + 0.15, t) * live;
      if (cite > 0) {
        const age = poses[this.byKey.age.i], pol = poses[this.byKey.policy.i], box = this.gapTagBox;
        this.badge(age.x + age.w / 2 - 3, age.y - age.h / 2 + 2, '1', pal.walk, cite, T.honestA + 0.1, t);
        this.badge(pol.x + pol.w / 2 - 3, pol.y - pol.h / 2 + 2, '2', pal.walk, win(0.25, 1, cite), T.honestA + 0.22, t);
        if (box) this.badge(box.x + box.w / 2, box.y - box.h / 2 + 1, '3', pal.gap, win(0.5, 1, cite), T.honestA + 0.34, t);
      }
    }
    badge(x, y, text, color, f, at, t) {
      if (f <= 0) return;
      const c = this.c, r = this.portrait ? 7.5 : 9.5;
      this.ripple(x, y, win(at, at + 0.5, t), r * 3.4, color);
      c.save();
      c.translate(x, y);
      const s = E.back(clamp(f));
      c.scale(s, s);
      c.fillStyle = color;
      c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
      c.strokeStyle = this.pal.bg; c.lineWidth = 1.5; c.stroke();
      c.fillStyle = this.pal.dark ? '#0a0a0b' : '#fff';
      c.font = font(r * 1.22, 700);
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(text, 0, 0.5);
      c.restore();
    }

    /* ── the split itself ── */
    drawPanes(t) {
      const gone = E.inOut(win(T.joinA, T.joinA + 0.45, t));
      if (gone >= 1) return;
      const c = this.c, pal = this.pal, A = this.A;
      c.save();
      c.strokeStyle = pal.edge; c.lineWidth = 1.2; c.setLineDash([2, 6]); c.lineCap = 'round';
      c.beginPath();
      if (this.portrait) {
        const y = this.PR.y - 6, half = (A.w / 2) * (1 - gone);
        c.moveTo(A.x + A.w / 2 - half, y); c.lineTo(A.x + A.w / 2 + half, y);
      } else {
        const x = this.PR.x - 13, half = (A.h / 2) * (1 - gone);
        c.moveTo(x, A.y + A.h / 2 - half); c.lineTo(x, A.y + A.h / 2 + half);
      }
      c.stroke();
      c.restore();
    }
    drawPaneLabels(t) {
      /* on a phone the hybrid's name sits on the divider, right where these labels are */
      const hybrid = this.portrait ? win(T.hybA - 0.25, T.hybA, t) * (1 - win(T.hybB - 0.1, T.hybB + 0.1, t)) : 0;
      const show = (1 - win(T.joinA, T.joinA + 0.3, t)) * (1 - hybrid);
      if (show <= 0 || !this.viewKey) return;
      const cats = this.data.views[this.viewKey].categories, pal = this.pal;
      const size = this.portrait ? 10 : clamp(this.PL.w * 0.032, 11.5, 14);
      const ink = pal.dark ? '#0a0a0b' : '#fff';
      const y = (P) => P.y + (this.portrait ? 10 : 15);
      this.pill(this.PL.x + this.PL.w / 2, y(this.PL), cats.default.title, { size, bg: pal.own, ink, weight: 650, alpha: show * lerp(0.5, 1, clamp((this.leftDim(t) - 0.2) / 0.8)) });
      this.pill(this.PR.x + this.PR.w / 2, y(this.PR), cats.code.title, { size, bg: pal.bind, ink, weight: 650, alpha: show * lerp(0.5, 1, clamp((this.rightDim(t) - 0.1) / 0.5)) });
    }

    /* ── the stitch: a thread through the pile, where the notes lie ── */
    drawStitch(t, poses) {
      const p = win(T.stitchA, T.stitchB, t);
      const a = 1 - win(T.joinA + 0.2, T.joinB - 0.3, t);
      if (p <= 0 || a <= 0) return;
      const c = this.c, pal = this.pal;
      const at = (k) => poses[this.byShadow[k].i];
      const leads = [];
      c.save();
      c.lineCap = 'round';
      STITCH.forEach((e, i) => {
        const f = E.inOut(win(e.at[0], e.at[1], p));
        if (f <= 0) return;
        const pts = this.hop(at(e.a), at(e.b), i % 2 ? -1 : 1);
        c.strokeStyle = pal.bind;
        c.globalAlpha = 0.2 * a; c.lineWidth = 8; this.stroke(pts, 0, f);
        c.globalAlpha = a; c.lineWidth = 2.6; this.stroke(pts, 0, f);
        if (f < 1) leads.push([pts, f]);
      });
      /* and the one join that cannot be made */
      const g = win(STITCH_GAP[0], STITCH_GAP[1], p);
      let hit = null;
      if (g > 0) {
        const pts = this.hop(at('decide'), poses[this.byKey.warranty.i], 1);
        const reach = E.out(win(0, 0.6, g)) * 0.58;
        c.strokeStyle = pal.bind;
        c.globalAlpha = a; c.lineWidth = 2.6; this.stroke(pts, 0, reach);
        const after = win(0.6, 1, g);
        if (after > 0) {
          c.strokeStyle = pal.gap; c.lineWidth = 2; c.setLineDash([3, 6]);
          this.stroke(pts, 0.62, 0.62 + 0.38 * after);
          c.setLineDash([]);
          hit = this.pointOn(pts, 0.58);
          c.fillStyle = pal.bg; c.strokeStyle = pal.gap; c.lineWidth = 2.2; c.globalAlpha = a * after;
          c.beginPath(); c.arc(hit[0], hit[1], 5, 0, TAU); c.fill(); c.stroke();
        }
      }
      c.restore();
      leads.forEach(([pts, f]) => this.comet(pts, f, pal.bind, 2.6, a));
      if (hit && this.copy) {
        const q = win(STITCH_GAP[1] - 0.04, STITCH_GAP[1] + 0.06, p);
        this.sparks(hit[0], hit[1], q, pal.gap, 41, this.portrait ? 20 : 34);
        this.gapStitchTag = { x: hit[0], y: hit[1] + (this.portrait ? 14 : 22), f: q, a };
      }
    }
    drawStitchTag() {
      const n = this.gapStitchTag;
      this.gapStitchTag = null;
      if (!n || !this.copy) return;
      const pal = this.pal;
      this.pill(n.x, n.y, this.copy.gapTag, { size: this.portrait ? 9.5 : 11.5, bg: pal.gap, ink: pal.dark ? '#0a0a0b' : '#fff', scale: E.back(n.f), alpha: n.a * clamp(n.f * 1.5), mono: !!this.copy.mono });
    }

    /* ── the stops on the right track ── */
    laneRect() {
      const I = this.IR, h = this.portrait ? I.h : Math.min(I.h, Math.max(300, I.h * 0.5));
      return { x: I.x + (this.portrait ? 4 : 10), y: I.y + (I.h - h) / 2, w: I.w - (this.portrait ? 8 : 20), h };
    }
    laneHeader(L, lane, color, alpha, names) {
      const c = this.c, pal = this.pal;
      const size = this.portrait ? 14 : clamp(L.w * 0.046, 15, 20);
      c.save();
      c.globalAlpha = alpha;
      c.textBaseline = 'alphabetic'; c.textAlign = 'left';
      const y = L.y + size * 1.05;
      c.fillStyle = color;
      c.beginPath(); c.arc(L.x + size * 0.34, y - size * 0.34, size * 0.3, 0, TAU); c.fill();
      c.font = font(size, 680);
      c.fillStyle = pal.ink;
      c.fillText(lane.title, L.x + size * 0.92, y);
      if (names) {
        c.font = font(Math.max(9.5, size * 0.6), 500, true);
        c.fillStyle = pal.muted;
        c.fillText(names, L.x + size * 0.92, y + size * 1.2);
      }
      c.restore();
      return size * (names ? 2.8 : 1.6);
    }
    drawStops(t) {
      if (!this.copy || t < T.bindA - 0.15 || t > T.colB + 0.1) return;
      const L = this.laneRect();
      const show = (a, b) => win(a - 0.1, a + 0.18, t) * (1 - win(b - 0.12, b + 0.05, t));
      const b = show(T.bindA, T.bindB), h = show(T.hybA, T.hybB), k = show(T.colA, T.colB);
      if (b > 0) this.drawLaneBind(L, t, b);
      if (h > 0) this.drawHybrid(t, h);
      if (k > 0) this.drawLaneCollect(L, t, k);
    }
    drawLaneBind(L, t, show) {
      const c = this.c, pal = this.pal, copy = this.copy.lanes.bind, alpha = show;
      const hdr = this.laneHeader(L, copy, pal.bind, alpha, this.laneNames.bind);
      const p = win(T.bindA, T.bindB - 0.3, t);
      const M = { x: L.x, y: L.y + hdr, w: L.w, h: L.h - hdr };
      const ww = Math.min(M.h * 1.18, this.portrait ? 54 : 84), wh = Math.min(M.h * 0.82, this.portrait ? 40 : 62);
      const wy = M.y + M.h * 0.46;
      const lineY = wy, x0 = M.x + ww + 12, x1 = M.x + M.w * 0.97;
      c.save();
      c.lineCap = 'round';
      /* the app */
      c.globalAlpha = alpha;
      c.fillStyle = pal.note; c.strokeStyle = pal.noteLine; c.lineWidth = 1.2;
      rr(c, M.x, wy - wh / 2, ww, wh, 6); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(M.x, wy - wh / 2 + wh * 0.22); c.lineTo(M.x + ww, wy - wh / 2 + wh * 0.22); c.stroke();
      const press = bump((p - 0.06) / 0.05);
      c.save();
      c.translate(M.x + ww / 2, wy + wh * 0.13);
      c.scale(1 - press * 0.12, 1 - press * 0.12);
      c.fillStyle = pal.bind;
      rr(c, -ww * 0.3, -wh * 0.15, ww * 0.6, wh * 0.3, 4); c.fill();
      c.restore();
      this.ripple(M.x + ww / 2, wy + wh * 0.13, win(0.06, 0.2, p), ww * 0.6, pal.bind, alpha);
      /* the framework's events: real, separate, and mixed in with everything else */
      c.strokeStyle = pal.edge; c.lineWidth = 1; c.globalAlpha = alpha * 0.55 * win(0.02, 0.2, p);
      c.beginPath(); c.moveTo(x0, lineY); c.lineTo(x1, lineY); c.stroke();
      const r = rng(5);
      for (let i = 0; i < 11; i++) {
        const fx = r(), fy = (r() - 0.5) * 0.26 * M.h;
        c.fillStyle = pal.faint; c.globalAlpha = alpha * 0.5 * win(0.05 + fx * 0.2, 0.15 + fx * 0.2, p) * (1 - 0.45 * win(0.55, 0.85, p));
        c.beginPath(); c.arc(lerp(x0, x1, fx), lineY + fy, 2.1, 0, TAU); c.fill();
      }
      const fracs = [0.04, 0.26, 0.47, 0.74, 0.96];
      const ex = fracs.map((f) => lerp(x0, x1, f));
      /* the binding: one thread through just those events */
      const thread = win(0.5, 0.92, p);
      if (thread > 0) {
        for (let i = 0; i < 4; i++) {
          const f = win(i / 4, (i + 1) / 4, thread);
          if (f <= 0) break;
          const h = (this.portrait ? 18 : clamp(M.h * 0.16, 30, 48)) + i * 2;
          const pts = this.curve([ex[i], lineY], [ex[i] + (ex[i + 1] - ex[i]) * 0.3, lineY - h], [ex[i] + (ex[i + 1] - ex[i]) * 0.7, lineY - h], [ex[i + 1], lineY], 16);
          c.strokeStyle = pal.bind; c.globalAlpha = alpha; c.lineWidth = 2.2;
          this.stroke(pts, 0, f);
          if (f < 1) this.comet(pts, f, pal.bind, 2.2, alpha);
        }
      }
      ex.forEach((x, i) => {
        const q = E.back(win(0.08 + i * 0.07, 0.2 + i * 0.07, p));
        if (q <= 0) return;
        c.globalAlpha = alpha;
        c.fillStyle = pal.bind;
        c.beginPath(); c.arc(x, lineY, (this.portrait ? 4.6 : 5.6) * q, 0, TAU); c.fill();
        c.font = font(this.portrait ? 9.5 : clamp(L.w * 0.032, 10.5, 12.5), 500, !!this.copy.mono);
        c.fillStyle = pal.muted; c.textAlign = i === 0 ? 'left' : i === 4 ? 'right' : 'center'; c.textBaseline = 'top';
        c.globalAlpha = alpha * win(0.12 + i * 0.07, 0.24 + i * 0.07, p);
        c.fillText(copy.events[i], x + (i === 0 ? -4 : i === 4 ? 4 : 0), lineY + (this.portrait ? 9 : 13));
      });
      c.restore();
    }
    /* orchestration is a hybrid, so it is the one stop drawn across the divider: the
       stages sit on the pattern's side, the trainer on the other, and what comes
       back over the line is a receipt */
    drawHybrid(t, show) {
      const c = this.c, pal = this.pal, copy = this.copy.lanes.hybrid, IL = this.IL, IR = this.IR, port = this.portrait;
      const p = win(T.hybA, T.hybB - 0.25, t);
      const bw = port ? Math.min(IL.w * 0.3, 110) : Math.min(IL.w * 0.46, 196), bh = port ? Math.min(IL.h * 0.34, 42) : Math.min(IL.h * 0.095, 62);
      const tw = port ? Math.min(IR.w * 0.46, 170) : Math.min(IR.w * 0.62, 250), th = port ? Math.min(IR.h * 0.4, 56) : Math.min(IR.h * 0.15, 104);
      const s1 = port ? [IL.x + IL.w * 0.24, IL.y + IL.h * 0.5] : [IL.x + IL.w * 0.5, IL.y + IL.h * 0.3];
      const s2 = port ? [IL.x + IL.w * 0.76, IL.y + IL.h * 0.5] : [IL.x + IL.w * 0.5, IL.y + IL.h * 0.72];
      const tc = port ? [IR.x + IR.w * 0.5, IR.y + IR.h * 0.52] : [IR.x + IR.w * 0.5, IR.y + IR.h * 0.51];
      const out = port
        ? this.curve([s1[0], s1[1] + bh / 2], [s1[0], tc[1] - 10], [tc[0] - tw * 0.3, s1[1] + bh], [tc[0] - tw * 0.3, tc[1] - th / 2], 24)
        : this.curve([s1[0] + bw / 2, s1[1]], [s1[0] + bw * 1.2, s1[1]], [tc[0] - tw, tc[1] - th * 0.2], [tc[0] - tw / 2, tc[1] - th * 0.2], 24);
      const back = port
        ? this.curve([tc[0] + tw * 0.3, tc[1] - th / 2], [tc[0] + tw * 0.3, s2[1] + bh], [s2[0], tc[1] - 10], [s2[0], s2[1] + bh / 2], 24)
        : this.curve([tc[0] - tw / 2, tc[1] + th * 0.2], [tc[0] - tw, tc[1] + th * 0.2], [s2[0] + bw * 1.2, s2[1]], [s2[0] + bw / 2, s2[1]], 24);
      const inA = win(0.14, 0.38, p), inner = win(0.38, 0.6, p), outA = win(0.6, 0.88, p);
      c.save();
      c.lineCap = 'round';
      c.strokeStyle = pal.edge; c.lineWidth = 1.2; c.globalAlpha = show * 0.6;
      this.stroke(out, 0, 1); this.stroke(back, 0, 1);
      c.strokeStyle = pal.hybrid; c.lineWidth = 2.2; c.globalAlpha = show;
      if (inA > 0) this.stroke(out, 0, inA);
      if (outA > 0) this.stroke(back, 0, outA);
      /* the two ends are ordinary stages, on the pattern's side */
      [[s1, inA > 0, 0], [s2, outA >= 1, 1]].forEach(([s, on, i]) => {
        const q = E.back(win(i * 0.08, i * 0.08 + 0.18, p));
        if (q <= 0) return;
        c.save();
        c.translate(s[0], s[1]); c.scale(q, q);
        c.fillStyle = pal.note; rr(c, -bw / 2, -bh / 2, bw, bh, 7); c.fill();
        c.strokeStyle = on ? pal.hybrid : pal.noteLine; c.lineWidth = on ? 1.8 : 1.2; c.stroke();
        c.fillStyle = pal.faux;
        rr(c, -bw * 0.3, -2, bw * (0.34 + i * 0.2), 4, 2); c.fill();
        c.restore();
      });
      /* the trainer is outside the pattern: a dashed box the record cannot see into */
      const tq = E.back(win(0.04, 0.22, p));
      if (tq > 0) {
        c.save();
        c.translate(tc[0], tc[1]); c.scale(tq, tq);
        c.fillStyle = pal.bg; rr(c, -tw / 2, -th / 2, tw, th, 8); c.fill();
        c.strokeStyle = pal.hybrid; c.lineWidth = 1.5; c.setLineDash([4, 4]); c.stroke(); c.setLineDash([]);
        const fs = port ? 9.5 : clamp(th * 0.16, 11, 14);
        c.font = font(fs, 560, !!this.copy.mono);
        c.fillStyle = pal.muted; c.textAlign = 'center'; c.textBaseline = 'middle';
        const turning = inner > 0 && inner < 1;
        c.fillText(copy.trainer, 0, turning ? th * 0.2 : 0.5);
        if (turning) {
          const r = Math.min(th * 0.14, 9), ang = inner * TAU * 3;
          c.strokeStyle = pal.hybrid; c.lineWidth = 2;
          c.beginPath(); c.arc(0, -th * 0.14, r, ang, ang + 4.2); c.stroke();
        }
        c.restore();
      }
      c.restore();
      if (inA > 0 && inA < 1) this.comet(out, inA, pal.hybrid, 2.2, show);
      if (inner >= 1) {
        const head = this.pointOn(back, outA);
        const size = port ? 8.8 : clamp(th * 0.13, 10, 12);
        this.pill(head[0], head[1] - (port ? 0 : 15), copy.receipt, { size, bg: pal.hybrid, ink: pal.dark ? '#0a0a0b' : '#fff', scale: E.back(win(0, 0.25, outA + 0.02)), alpha: show, weight: 650, mono: !!this.copy.mono });
      }
      /* its name sits on the divider, because it belongs to both */
      const chip = copy.mode + ': ' + this.laneNames.hybrid;
      const cy = port ? this.PR.y - 6 : this.A.y + this.A.h * 0.12;
      const cx = port ? this.A.x + this.A.w / 2 : this.PR.x - 13;
      this.pill(cx, cy, chip, { size: port ? 9.5 : 12, bg: pal.hybrid, ink: pal.dark ? '#0a0a0b' : '#fff', alpha: show, weight: 650, mono: !!this.copy.mono });
    }
    /* collectors: the same stitching as a framework app, one level down, on
       devices. A join only exists where an ID says so. */
    drawLaneCollect(L, t, show) {
      const c = this.c, pal = this.pal, copy = this.copy.lanes.collect, ink = pal.bind, alpha = show;
      const hdr = this.laneHeader(L, copy, ink, alpha, this.laneNames.collect);
      const p = win(T.colA, T.colB - 0.3, t);
      const M = { x: L.x, y: L.y + hdr, w: L.w, h: L.h - hdr };
      const ROWS = [['host-a', 'job=7f2', 'smart check ok'], ['host-a', 'job=7f2', 'firmware 2.1'], ['switch3', 'tx=a91', 'link up'], ['host-b', 'job=7f2', 'raid rebuild'], ['ups-1', '-------', 'on battery']];
      const rowH = Math.min(M.h / 5, this.portrait ? 15 : 27);
      const fs = clamp(rowH * 0.62, 8.6, 13);
      c.save();
      c.font = font(fs, 500, true);
      const cw = c.measureText('0').width;
      c.textBaseline = 'middle'; c.textAlign = 'left';
      const top = M.y + (M.h - rowH * 5) / 2 + rowH / 2;
      const cols = [0, 9, 18];
      const jx = M.x + 33 * cw + 6;
      const join = win(0.48, 0.74, p);
      ROWS.forEach((row, i) => {
        const y = top + i * rowH;
        const q = win(i * 0.07, i * 0.07 + 0.22, p);
        if (q <= 0) return;
        const whole = row[0].padEnd(cols[1]) + row[1].padEnd(cols[2] - cols[1]) + row[2];
        const shown = Math.round(whole.length * q);
        const isJoin = i === 0 || i === 1 || i === 3;
        c.globalAlpha = alpha * (i === 2 ? lerp(0.85, 0.32, join) : 0.92);
        c.fillStyle = pal.muted;
        c.fillText(whole.slice(0, shown), M.x, y);
        if (isJoin && join > 0 && shown > cols[1]) {
          c.globalAlpha = alpha * join;
          c.fillStyle = ink;
          c.font = font(fs, 700, true);
          c.fillText(row[1], M.x + cols[1] * cw, y);
          c.font = font(fs, 500, true);
        }
      });
      const ys = [0, 1, 3].map((i) => top + i * rowH);
      if (join > 0) {
        c.strokeStyle = ink; c.lineWidth = 2; c.lineCap = 'round'; c.globalAlpha = alpha;
        for (let i = 0; i < 2; i++) {
          const f = win(i / 2, (i + 1) / 2, join);
          if (f <= 0) break;
          const pts = this.curve([jx, ys[i]], [jx + 16, ys[i]], [jx + 16, ys[i + 1]], [jx, ys[i + 1]], 12);
          this.stroke(pts, 0, f);
        }
        ys.forEach((y, i) => {
          if (join < i / 2) return;
          c.fillStyle = ink; c.beginPath(); c.arc(jx, y, 3, 0, TAU); c.fill();
        });
      }
      /* and where nothing says so, the gap keeps its reason */
      const stub = win(0.74, 0.9, p);
      const gy = top + 4 * rowH;
      if (stub > 0) {
        c.strokeStyle = pal.gap; c.lineWidth = 2; c.setLineDash([3, 5]); c.globalAlpha = alpha;
        c.beginPath(); c.moveTo(jx, gy); c.lineTo(jx + 22 * stub, gy); c.stroke(); c.setLineDash([]);
        c.fillStyle = pal.bg; c.lineWidth = 2;
        c.beginPath(); c.arc(jx, gy, 3.6, 0, TAU); c.fill(); c.stroke();
      }
      c.restore();
      if (stub > 0.6) {
        const size = this.portrait ? 9 : clamp(rowH * 0.46, 10.5, 12);
        c.save();
        c.font = font(size, 600, !!this.copy.mono);
        const tw = c.measureText(copy.gap).width + size * 1.44;
        const px = Math.min(jx + 30 + tw / 2, L.x + L.w - tw / 2 - 2);
        c.restore();
        this.pill(px, gy, copy.gap, { size, bg: pal.gap, ink: pal.dark ? '#0a0a0b' : '#fff', alpha: alpha * win(0.6, 1, stub), scale: E.back(win(0.6, 1, stub)), mono: !!this.copy.mono });
      }
    }

    /* ── chapter six: one record, three lenses ── */
    drawLens(t, clock, poses) {
      const show = win(T.lensA, T.lensB - 0.2, t) * (1 - win(T.orbitA - 0.05, T.orbitA + 0.3, t));
      if (show <= 0 || !this.copy) return;
      const c = this.c, pal = this.pal, A = this.A;
      /* the tabs */
      const names = ['Flow Lens', 'Why Lens', 'Story Lens'];
      const size = this.portrait ? 11.5 : 14;
      c.save();
      c.font = font(size, 650);
      const widths = names.map((x) => c.measureText(x).width);
      const gapX = this.portrait ? 16 : 26;
      const total = widths.reduce((s, w) => s + w, 0) + gapX * 2;
      let x = this.portrait ? A.x + (A.w - total) / 2 : A.x + 4;
      const xs = names.map((_, i) => { const r = x; x += widths[i] + gapX; return r; });
      const m1 = E.inOut(win(T.whyA, T.whyA + 0.5, t)), m2 = E.inOut(win(T.storyA, T.storyA + 0.5, t));
      const on = [1 - m1, m1 * (1 - m2), m2];
      const ty = A.y + (this.portrait ? 11 : 14);
      c.textAlign = 'left'; c.textBaseline = 'middle';
      names.forEach((name, i) => {
        c.globalAlpha = show * lerp(0.38, 1, on[i]);
        c.fillStyle = pal.ink;
        c.fillText(name, xs[i], ty);
      });
      const ux = lerp(lerp(xs[0], xs[1], m1), xs[2], m2), uw = lerp(lerp(widths[0], widths[1], m1), widths[2], m2);
      c.globalAlpha = show; c.fillStyle = pal.walk;
      rr(c, ux, ty + size * 0.8, uw, 2.4, 1.2); c.fill();
      c.restore();

      /* Why Lens wiring */
      const whyA = win(T.whyB - 0.3, T.whyB, t) * (1 - win(T.storyA, T.storyA + 0.25, t));
      if (whyA > 0) {
        c.save();
        c.lineWidth = 1.6; c.lineCap = 'round';
        Object.keys(WHY_TREE).forEach((k) => {
          const par = WHY_TREE[k][2];
          if (!par) return;
          const a = poses[this.byKey[par].i], b = poses[this.byKey[k].i];
          const px = a.x - a.w / 2 + 12, gap = k === 'warranty';
          c.strokeStyle = gap ? pal.gap : pal.walk;
          c.globalAlpha = whyA;
          if (gap) c.setLineDash([3, 5]);
          c.beginPath(); c.moveTo(px, a.y + a.h / 2); c.lineTo(px, b.y - 5); c.quadraticCurveTo(px, b.y, px + 5, b.y); c.lineTo(b.x - b.w / 2, b.y); c.stroke();
          c.setLineDash([]);
        });
        c.restore();
      }

      /* Story Lens */
      const st = win(T.storyB - 0.35, T.storyB, t) * (1 - win(T.orbitA - 0.05, T.orbitA + 0.2, t));
      if (st > 0) {
        const pos = E.inOut(win(T.scrubA, T.scrubB, t)) * (CHAIN.length - 1);
        const a = poses[this.byKey.request.i], b = poses[this.byKey.denied.i];
        c.save();
        c.globalAlpha = st;
        c.strokeStyle = pal.edge; c.lineWidth = 2;
        c.beginPath(); c.moveTo(a.x, this.storyY); c.lineTo(b.x, this.storyY); c.stroke();
        const hx = lerp(a.x, b.x, pos / (CHAIN.length - 1));
        c.strokeStyle = pal.walk; c.lineWidth = 3;
        c.beginPath(); c.moveTo(a.x, this.storyY); c.lineTo(hx, this.storyY); c.stroke();
        c.fillStyle = pal.walk;
        c.beginPath(); c.moveTo(hx, this.storyY - 11); c.lineTo(hx - 7, this.storyY - 22); c.lineTo(hx + 7, this.storyY - 22); c.closePath(); c.fill();
        c.restore();
        /* the frame above the timeline shows the step under the playhead */
        const idx = Math.round(pos);
        const crisp = clamp(1 - Math.max(0, Math.abs(pos - idx) - 0.26) * 6);
        const key = CHAIN[idx];
        const fw = Math.min(A.w * (this.portrait ? 0.86 : 0.72), 540), fh = Math.min(A.h * 0.42, this.portrait ? 110 : 190);
        const fx = A.x + A.w / 2, fy = A.y + this.tabH + (this.storyY - 26 - A.y - this.tabH) / 2;
        const isGap = key === 'warranty';
        c.save();
        c.globalAlpha = st;
        c.fillStyle = isGap ? pal.gapBg : pal.note;
        rr(c, fx - fw / 2, fy - fh / 2, fw, fh, 14); c.fill();
        c.strokeStyle = isGap ? pal.gap : pal.noteLine; c.lineWidth = isGap ? 1.8 : 1.2;
        if (isGap) c.setLineDash([6, 5]);
        c.stroke(); c.setLineDash([]);
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.font = font(this.portrait ? 10 : 12, 500, true);
        c.fillStyle = pal.faint; c.globalAlpha = st * 0.9;
        c.fillText((idx + 1) + ' / ' + CHAIN.length, fx, fy - fh * 0.29);
        const mono = !!this.copy.mono;
        const base = mono ? (this.portrait ? 14 : 19) : this.portrait ? 18 : 26;
        const L = this.fit(this.copy.labels[key], fw - 36, base, mono, 620);
        c.font = font(L.size, 620, mono);
        c.fillStyle = isGap ? pal.gap : pal.ink;
        c.globalAlpha = st * crisp;
        const yy = isGap ? fy - L.size * 0.2 : fy + L.size * 0.2;
        L.lines.forEach((line, i) => c.fillText(line, fx, yy + (1 - crisp) * 8 + (i - (L.lines.length - 1) / 2) * L.size * 1.2));
        if (isGap) {
          c.font = font(this.portrait ? 10.5 : 13, 550, mono);
          c.globalAlpha = st * crisp;
          c.fillText(this.copy.gapTag, fx, yy + L.size * 1.5);
        }
        c.restore();
      }
    }

    /* ── the last shot: the solar system comes back, and now it means something ──
       Every planet is a library. The sun is the stitched record. The inner band is
       everything stitched by default. The outer band, with its belt of loose events
       being stitched and open gaps, is everything stitched in code because the thing
       underneath cannot be rebuilt. The hybrid rides the line between them. All of it
       feeds one sun, which is why walking back and replay work for both. Bodies keep
       the old hero's long-exposure trails. */
    drawOrbit(t, clock) {
      if (t < T.orbitA) { this.hoverBody = null; return; }
      const c = this.c, pal = this.pal, O = this.oc, orb = this.orb, copy = this.copy;
      const dt = clamp(clock - this.lastClock, 0, 0.1);
      /* time slows to a stop under the pointer, so a moving target can be clicked */
      this.orbitRate = this.orbitRate === undefined ? 1 : lerp(this.orbitRate, this.hoverBody ? 0 : 1, 0.12);
      if (!this.still) this.orbitClock += dt * this.orbitRate;
      const ringColor = { read: pal.lens, default: pal.own, hybrid: pal.hybrid, code: pal.bind };
      const tilt = orb.tilt;
      this.bodies.forEach((b) => {
        const rk = b.rk;
        const open = E.expo(win(T.sunB - 0.1 + rk * 0.11, T.sunB + 0.75 + rk * 0.11, t));
        const R = orb.radii[rk] * open;
        const ang = b.angle + this.orbitClock * b.speed + (1 - open) * 2.2;
        b.px = O.x + Math.cos(ang) * R; b.py = O.y + Math.sin(ang) * R * tilt;
        b.depth = (Math.sin(ang) + 1) / 2; b.ang = ang; b.open = open; b.R = R;
      });

      /* the two zones, with the readers' clear space inside and the hybrid's line between */
      const zoneIn = E.inOut(win(T.sunB + 0.05, T.sunB + 0.8, t));
      if (zoneIn > 0) {
        const aI = orb.aIn * zoneIn, aO = orb.aOut * zoneIn, bI = orb.bIn * zoneIn, bO = orb.bOut * zoneIn;
        const band = (inner, outer, color) => {
          c.fillStyle = color;
          c.beginPath();
          c.ellipse(O.x, O.y, outer, outer * tilt, 0, 0, TAU);
          c.ellipse(O.x, O.y, inner, inner * tilt, 0, 0, TAU);
          c.fill('evenodd');
        };
        c.save();
        c.globalAlpha = pal.dark ? 0.12 : 0.075;
        band(aI, aO, pal.own);
        band(bI, bO, pal.bind);
        c.globalAlpha = 0.5; c.lineWidth = 1.1;
        c.strokeStyle = pal.own;
        c.beginPath(); c.ellipse(O.x, O.y, aO, aO * tilt, 0, 0, TAU); c.stroke();
        c.strokeStyle = pal.bind;
        c.beginPath(); c.ellipse(O.x, O.y, bI, bI * tilt, 0, 0, TAU); c.stroke();
        c.beginPath(); c.ellipse(O.x, O.y, bO, bO * tilt, 0, 0, TAU); c.stroke();
        c.restore();
      }

      /* rings: drawn on, one after another */
      RINGS.forEach((ring, k) => {
        if (ring === 'code') return;
        const f = E.inOut(win(T.sunB - 0.05 + k * 0.1, T.sunB + 0.65 + k * 0.1, t));
        if (f <= 0) return;
        const R = orb.radii[k];
        c.save();
        c.strokeStyle = ring === 'hybrid' ? pal.hybrid : pal.edge; c.lineWidth = ring === 'hybrid' ? 1.4 : 1; c.globalAlpha = 0.7;
        if (ring === 'hybrid') c.setLineDash([5, 5]);
        c.beginPath();
        c.ellipse(O.x, O.y, R, R * tilt, 0, -Math.PI / 2, -Math.PI / 2 + f * TAU);
        c.stroke();
        c.restore();
      });

      /* the belt: loose events. Some are stitched together, some stay apart. */
      const beltIn = win(T.sunB + 0.25, T.sunB + 1, t);
      if (beltIn > 0) {
        const r = rng(2026), Rm = orb.radii[3], spread = (orb.bOut - orb.bIn) * 0.42;
        const count = this.portrait ? 26 : 44;
        const at = (a, rr2) => [O.x + Math.cos(a) * rr2, O.y + Math.sin(a) * rr2 * tilt];
        c.save();
        c.lineCap = 'round';
        for (let i = 0; i < count; i++) {
          const a0 = r() * TAU + this.orbitClock * (0.035 + r() * 0.015);
          const rr2 = Rm + (r() - 0.5) * spread * 2;
          const len = (0.012 + r() * 0.028) * (this.portrait ? 1.6 : 1);
          const kind = r();
          const p0 = at(a0, rr2 * lerp(1.12, 1, beltIn)), p1 = at(a0 + len, rr2 * lerp(1.12, 1, beltIn));
          c.globalAlpha = beltIn * (kind < 0.3 ? 0.9 : 0.5);
          c.strokeStyle = kind < 0.3 ? pal.bind : pal.faint;
          c.lineWidth = kind < 0.3 ? 2.2 : 1.6;
          c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); c.stroke();
          if (kind < 0.3) {
            /* a stitch to its neighbour */
            const p2 = at(a0 + len + 0.03, rr2 + 7), p3 = at(a0 + len + 0.03 + len, rr2 + 7);
            c.lineWidth = 2.2;
            c.beginPath(); c.moveTo(p2[0], p2[1]); c.lineTo(p3[0], p3[1]); c.stroke();
            c.lineWidth = 1.1;
            c.beginPath(); c.moveTo(p1[0], p1[1]); c.quadraticCurveTo((p1[0] + p2[0]) / 2 + 3, (p1[1] + p2[1]) / 2 - 3, p2[0], p2[1]); c.stroke();
          } else if (kind > 0.86) {
            /* and a gap that says so */
            const p2 = at(a0 + len + 0.026, rr2);
            c.strokeStyle = pal.gap; c.fillStyle = pal.bg; c.lineWidth = 1.4; c.globalAlpha = beltIn;
            c.beginPath(); c.arc(p2[0], p2[1], 2.8, 0, TAU); c.fill(); c.stroke();
          }
        }
        c.restore();
      }

      const body = (b) => {
        if (b.open <= 0.01) return;
        const color = b.id === 'footprintjs' ? pal.sun : ringColor[b.ring];
        const scale = lerp(0.74, 1.14, b.depth);
        const r = (this.portrait ? 4.4 : 6.6) * scale * (b.id === 'footprintjs' ? 1.3 : 1);
        const hover = this.hoverBody === b;
        c.save();
        const sweep = 0.95, steps = 12;
        c.strokeStyle = color; c.lineCap = 'round';
        for (let i = 0; i < steps; i++) {
          const a0 = b.ang - sweep * (1 - i / steps), a1 = b.ang - sweep * (1 - (i + 1) / steps);
          c.globalAlpha = 0.6 * (i / steps) * (i / steps) * b.open;
          c.lineWidth = r * 0.5 * (0.4 + (i / steps) * 0.9);
          c.beginPath();
          c.ellipse(O.x, O.y, b.R, b.R * tilt, 0, a0, a1);
          c.stroke();
        }
        c.restore();
        this.glow(b.px, b.py, r * (hover ? 6 : 3.6), color, 0.85);
        c.save();
        c.globalAlpha = lerp(0.62, 1, b.depth);
        c.fillStyle = color;
        c.beginPath(); c.arc(b.px, b.py, r, 0, TAU); c.fill();
        if (hover) {
          c.strokeStyle = pal.ink; c.lineWidth = 1.4; c.globalAlpha = 1;
          c.beginPath(); c.arc(b.px, b.py, r + 5, 0, TAU); c.stroke();
        }
        {
          const fs = this.portrait ? 9.5 : hover ? 13 : clamp(this.A.w * 0.0135, 11, 13.5);
          const text = this.portrait ? b.short : b.name;
          c.font = font(fs, hover ? 650 : 560);
          const tw = c.measureText(text).width;
          const lx = clamp(b.px, this.A.x + tw / 2 + 4, this.A.x + this.A.w - tw / 2 - 4), ly = b.py + r + fs * 1.05;
          const la = win(0.6, 1, b.open) * lerp(0.62, 1, b.depth);
          c.globalAlpha = la * 0.8;
          c.fillStyle = pal.bg;
          rr(c, lx - tw / 2 - 4, ly - fs * 0.72, tw + 8, fs * 1.44, 4); c.fill();
          c.globalAlpha = la;
          c.fillStyle = pal.ink;
          c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText(text, lx, ly + 0.5);
        }
        c.restore();
      };
      const sorted = this.bodies.slice().sort((a, b) => a.depth - b.depth);
      sorted.filter((b) => b.depth < 0.5).forEach(body);

      /* both ways in feed the same sun */
      this.drawFeeds(t, clock);

      /* the sun */
      const s = E.back(win(T.sunB - 0.22, T.sunB + 0.2, t));
      if (s > 0) {
        const pulse = 1 + Math.sin(clock * 1.3) * 0.03;
        const fed = bump((t - T.feedB) / 0.28) * 0.25;
        this.glow(O.x, O.y, orb.sun * 4.2 * s * (pulse + fed), pal.sun, 0.9);
        c.save();
        c.fillStyle = pal.sun;
        c.beginPath(); c.arc(O.x, O.y, orb.sun * s * (1 + fed * 0.4), 0, TAU); c.fill();
        c.restore();
        this.ripple(O.x, O.y, win(T.sunB, T.sunB + 0.7, t), orb.rx * 0.9, pal.sun);
        this.ripple(O.x, O.y, win(T.sunB + 0.12, T.sunB + 0.82, t), orb.rx * 0.6, pal.sun);
        this.ripple(O.x, O.y, win(T.feedB, T.feedB + 0.6, t), orb.rx * 0.5, pal.sun);
        if (copy) {
          c.save();
          c.globalAlpha = win(T.sunB, T.sunB + 0.3, t);
          c.textAlign = 'center'; c.textBaseline = 'middle';
          /* on a phone the sun has no room for words, and the planets' names matter more */
          if (!this.portrait) {
            c.font = font(clamp(orb.sun * 0.44, 10, 12), 720);
            c.fillStyle = pal.onSun;
            const words = copy.sunLabel.split(' ');
            words.forEach((w, i) => c.fillText(w, O.x, O.y + (i - (words.length - 1) / 2) * 12.5 + 0.5));
          }
          c.restore();
        }
      }
      sorted.filter((b) => b.depth >= 0.5).forEach(body);

      this.drawPayoff(t, clock);

      /* only two rings need naming: the readers, and the one that is both */
      [['read', 0], ['hybrid', 2]].forEach(([ring, k]) => {
        const f = win(T.sunB + 0.55 + k * 0.08, T.sunB + 0.85 + k * 0.08, t);
        if (f <= 0) return;
        const R = orb.radii[k], ang = this.portrait ? -0.62 : -0.5;
        const x = O.x + Math.cos(ang) * R, y = O.y + Math.sin(ang) * R * tilt;
        const text = ring.toUpperCase();
        c.save();
        c.font = font(this.portrait ? 8 : 9.5, 700, true);
        const tw = c.measureText(text).width;
        c.globalAlpha = f * 0.92;
        c.fillStyle = pal.bg;
        rr(c, x - tw / 2 - 4, y - 7, tw + 8, 14, 3); c.fill();
        c.fillStyle = ring === 'hybrid' ? pal.hybrid : pal.muted;
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(text, x, y + 0.5);
        c.restore();
      });

      /* the two categories, in words, on the edge of each zone */
      const zf = win(T.sunB + 0.7, T.sunB + 1.05, t);
      if (zf > 0 && copy) {
        const size = this.portrait ? 9.5 : clamp(this.A.w * 0.0145, 11.5, 14);
        const onLight = '#fff';
        const ink = pal.dark ? '#0a0a0b' : onLight;
        const za = this.portrait ? copy.zones.defaultShort : copy.zones.default;
        const zb = this.portrait ? copy.zones.manualShort : copy.zones.manual;
        this.pill(O.x, O.y - orb.aOut * tilt, za, { size, bg: pal.own, ink, scale: E.back(zf), alpha: clamp(zf * 1.5), weight: 650 });
        this.pill(O.x, O.y - orb.bOut * tilt, zb, { size, bg: pal.bind, ink, scale: E.back(win(0.25, 1, zf)), alpha: clamp(win(0.25, 1, zf) * 1.5), weight: 650 });
      }

      if (this.gapNote && t >= T.backA && copy) {
        const n = this.gapNote;
        this.pill(n.x, n.y, copy.gapShort, { size: this.portrait ? 9.5 : 11.5, bg: pal.gap, ink: pal.dark ? '#0a0a0b' : '#fff', scale: E.back(n.f), alpha: n.f, mono: !!copy.mono });
      }
      this.gapNote = null;

      /* hit test for the next frame */
      this.hoverBody = this.pointer.on ? this.bodyAt(this.pointer.px, this.pointer.py, t) : null;
    }

    /* which planet is at this point, if the system is on screen */
    bodyAt(px, py, t) {
      if (t < T.sunB + 0.8) return null;
      let best = null, bestD = this.portrait ? 30 : 22;
      this.bodies.forEach((b) => {
        const d = Math.hypot(b.px - px, b.py - py);
        if (d < bestD) { best = b; bestD = d; }
      });
      return best;
    }

    /* a body's route into the sun, spiralling with the rotation of its ring */
    feedPath(b) {
      const O = this.oc, sun = this.orb.sun * 0.9;
      const dx = b.px - O.x, dy = b.py - O.y, len = Math.hypot(dx, dy) || 1;
      const end = [O.x + (dx / len) * sun, O.y + (dy / len) * sun];
      const swing = 0.32;
      return this.curve(
        [b.px, b.py],
        [b.px - dx * 0.34 - dy * swing, b.py - dy * 0.34 + dx * swing],
        [O.x + dx * 0.28 - dy * swing * 0.6, O.y + dy * 0.28 + dx * swing * 0.6],
        end, 30);
    }
    drawFeeds(t, clock) {
      if (t < T.feedA) return;
      const c = this.c, pal = this.pal;
      const a = this.bodies.find((b) => b.id === 'agentfootprint');
      const b = this.bodies.find((x) => x.id === 'hcifootprint');
      if (!a || !b) return;
      const GAP_AT = 0.46;
      const pa = this.feedPath(a), pb = this.feedPath(b);
      const f = E.inOut(win(T.feedA, T.feedB, t));
      const settled = lerp(1, 0.55, win(T.feedB + 0.25, T.feedB + 0.7, t));
      c.save();
      c.lineCap = 'round';
      /* by default: one unbroken line */
      c.strokeStyle = pal.own; c.lineWidth = 2.4; c.globalAlpha = settled;
      this.stroke(pa, 0, f);
      /* in code: solid where it could be joined, open where it could not */
      c.strokeStyle = pal.bind; c.lineWidth = 2.4;
      this.stroke(pb, 0, Math.min(f, GAP_AT - 0.04));
      if (f > GAP_AT + 0.04) this.stroke(pb, GAP_AT + 0.04, f);
      c.restore();
      if (f > 0 && f < 1) {
        this.comet(pa, f, pal.own, 2.4, 1);
        this.comet(pb, f, pal.bind, 2.4, 1);
      }
      const gp = this.pointOn(pb, GAP_AT);
      const gapIn = win(GAP_AT, GAP_AT + 0.08, f);
      if (gapIn > 0) {
        c.save();
        c.globalAlpha = gapIn;
        c.fillStyle = pal.bg; c.strokeStyle = pal.gap; c.lineWidth = 2;
        c.beginPath(); c.arc(gp[0], gp[1], 4.6, 0, TAU); c.fill(); c.stroke();
        c.restore();
      }
      /* the walk back runs out along the same two lines */
      const w = win(T.backA, T.backB, t);
      if (w > 0) {
        const ra = pa.slice().reverse(), rb = pb.slice().reverse();
        const stop = 1 - GAP_AT;
        const fa = E.inOut(w), fb = Math.min(fa, stop);
        c.save();
        c.lineCap = 'round'; c.strokeStyle = pal.walk;
        c.globalAlpha = 0.2; c.lineWidth = 9;
        this.stroke(ra, 0, fa); this.stroke(rb, 0, fb);
        c.globalAlpha = 1; c.lineWidth = 3;
        this.stroke(ra, 0, fa); this.stroke(rb, 0, fb);
        c.restore();
        if (fa < 1) this.comet(ra, fa, pal.walk, 3, 1);
        if (fa < stop) this.comet(rb, fb, pal.walk, 3, 1);
        /* it reaches the gap, and the gap says why */
        const reached = win(stop, stop + 0.08, fa);
        if (reached > 0 && this.copy) {
          this.sparks(gp[0], gp[1], win(0, 0.6, (fa - stop) / (1 - stop)), pal.gap, 12, this.portrait ? 18 : 30);
          /* drawn last of all (see drawOrbit), so no label can sit on top of it */
          this.gapNote = { x: gp[0], y: gp[1] - (this.portrait ? 15 : 19), f: reached };
        }
      }
    }
    drawPayoff(t, clock) {
      if (t < T.replayA - 1.2 || !this.copy) return;
      const c = this.c, pal = this.pal, O = this.oc, orb = this.orb, tilt = orb.tilt;
      /* replay: a playhead takes one lap of the readers' ring */
      const rp = win(T.replayA, T.replayB, t);
      if (rp > 0) {
        const R = orb.radii[0], a0 = -Math.PI / 2, f = E.inOut(rp), head = a0 + f * TAU;
        c.save();
        c.strokeStyle = pal.lens; c.lineCap = 'round'; c.lineWidth = 3;
        c.globalAlpha = lerp(1, 0.45, win(T.replayB, T.replayB + 0.4, t));
        c.beginPath(); c.ellipse(O.x, O.y, R, R * tilt, 0, a0, head); c.stroke();
        c.restore();
        if (rp < 1) {
          const hx = O.x + Math.cos(head) * R, hy = O.y + Math.sin(head) * R * tilt;
          this.glow(hx, hy, 18, pal.lens, 1);
          c.save();
          c.translate(hx, hy); c.rotate(head + Math.PI / 2);
          c.fillStyle = pal.lens;
          c.beginPath(); c.moveTo(7, 0); c.lineTo(-5, -5.5); c.lineTo(-5, 5.5); c.closePath(); c.fill();
          c.restore();
        }
      }
      /* the side effect: the same trail, watched. One slow sweep round the whole system. */
      const au = win(T.auditA, T.auditB, t);
      if (au > 0) {
        const R = orb.bOut + (this.portrait ? 0 : 7);
        const draw = E.inOut(win(0, 0.7, au));
        c.save();
        c.strokeStyle = pal.ink; c.lineWidth = 1.3; c.globalAlpha = 0.5;
        c.setLineDash([1.5, 5]); c.lineDashOffset = -clock * 9; c.lineCap = 'round';
        c.beginPath(); c.ellipse(O.x, O.y, R, R * tilt, 0, -Math.PI / 2, -Math.PI / 2 + draw * TAU); c.stroke();
        c.setLineDash([]); c.lineDashOffset = 0;
        const sweepAt = clock * 0.9 + (this.still ? 0.7 : 0);
        const steps = 16;
        for (let i = 0; i < steps; i++) {
          const k = i / steps;
          c.globalAlpha = win(0.55, 1, au) * k * k;
          c.strokeStyle = pal.sun; c.lineWidth = 3.4;
          c.beginPath();
          c.ellipse(O.x, O.y, R, R * tilt, 0, sweepAt - 1.1 * (1 - k), sweepAt - 1.1 * (1 - (i + 1) / steps));
          c.stroke();
        }
        c.restore();
      }
      /* the words for all three, lit as each one happens */
      const P = this.copy.payoff;
      const items = [[P.walk, pal.walk, win(T.backA + 0.05, T.backA + 0.35, t)], [P.replay, pal.lens, win(T.replayA, T.replayA + 0.3, t)], [P.audit, pal.ink, win(T.auditA, T.auditA + 0.3, t)]];
      const size = this.portrait ? 10.5 : clamp(this.A.w * 0.015, 12, 14.5);
      c.save();
      c.font = font(size, 650);
      const widths = items.map((it) => c.measureText(it[0]).width + size * 1.44);
      c.restore();
      const gapX = this.portrait ? 6 : 10;
      const total = widths.reduce((a, b) => a + b, 0) + gapX * 2;
      let x = O.x - total / 2;
      const y = this.A.y + this.A.h - size * 1.05;
      items.forEach((it, i) => {
        if (it[2] > 0) {
          this.pill(x + widths[i] / 2, y, it[0], { size, bg: it[1], ink: i === 2 ? pal.bg : pal.dark ? '#0a0a0b' : '#fff', scale: E.back(it[2]), alpha: clamp(it[2] * 1.6), weight: 650 });
        }
        x += widths[i] + gapX;
      });
    }

    /* the view switch itself: one quick sweep, so the change is seen as a re-read */
    drawSweep(clock) {
      const age = clock - this.flipAt;
      if (age < 0 || age > 0.6) return;
      const c = this.c, W = this.W, H = this.H;
      const x = lerp(-W * 0.2, W * 1.2, E.inOut(age / 0.6));
      const g = c.createLinearGradient(x - 90, 0, x + 90, 0);
      g.addColorStop(0, 'rgba(255,199,0,0)');
      g.addColorStop(0.5, this.pal.dark ? 'rgba(255,199,0,.16)' : 'rgba(255,199,0,.26)');
      g.addColorStop(1, 'rgba(255,199,0,0)');
      c.save();
      c.fillStyle = g;
      c.fillRect(x - 90, 0, 180, H);
      c.restore();
    }

    /* ── the frame ── */
    draw(t, clock) {
      const c = this.c;
      if (!this.pal || !this.A) return;
      c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      c.clearRect(0, 0, this.W, this.H);
      c.globalAlpha = 1;
      c.textAlign = 'left';

      this.updateHook(t, clock);

      /* a slight lean in as the walk goes back, released as it reaches the gap */
      const lean = E.inOut(win(T.walkA, LIT_AT.request, t)) * (1 - E.inOut(win(LIT_AT.request + 0.65, T.gapA + 0.1, t)));
      const zoom = 1 + (this.portrait ? 0 : 0.03 * lean);
      const cx = this.A.x + this.A.w / 2, cy = this.A.y + this.A.h / 2;
      c.save();
      if (zoom !== 1) { c.translate(cx, cy); c.scale(zoom, zoom); c.translate(-cx, -cy); }

      /* every note's pose this frame, in one place, so edges can follow them */
      const poses = this.notes.map((n) => this.pose(n, t, clock));

      this.drawPanes(t);
      this.drawChart(t);
      this.drawEdges(t, clock, poses);
      this.drawThread(t, poses);
      this.drawGap(t, clock, poses);

      /* who is riding on top of the pile right now */
      const hs = t < 0.95 ? this.hookState(clock) : null;
      const litInHook = new Map();
      if (hs) {
        const weight = (1 - win(0.25, 0.9, t)) * hs.fade;
        hs.h.chain.forEach((n, k) => {
          const at = k * hs.hop;
          const a = win(at - 0.06, at + 0.06, hs.age) * weight;
          if (a > 0) litInHook.set(n.i, { lit: a, popAt: hs.h.start + at });
        });
      }
      const scanP = win(T.scanA, T.scanB, t) * PILE_N;
      const scanning = t > T.scanA && t < T.scanB + 0.2;
      const onTop = (n) => litInHook.has(n.i) || (n.shadow && this.stitched(n, t) > 0) || (n.key === 'warranty' && t > GAP_SHOWN);
      const paint = (n) => {
        const extra = litInHook.get(n.i) || {};
        if (scanning && n.scan !== undefined) extra.flash = bump((scanP - n.scan) / 2.4);
        this.drawNote(n, poses[n.i], t, clock, extra);
      };
      const dn = this.byShadow.denied;
      /* the loose notes first, then the thread through them, then the notes it reached */
      this.notes.forEach((n) => { if (!n.D && n !== dn && !onTop(n)) paint(n); });
      this.drawStitch(t, poses);
      this.notes.forEach((n) => { if (n.D) paint(n); });
      this.notes.forEach((n) => { if (!n.D && n !== dn && onTop(n)) paint(n); });
      this.drawNote(dn, poses[dn.i], t, clock, null);

      this.drawHook(t, clock, poses);
      this.drawGapTop(t, poses);
      this.drawStitchTag();
      this.drawPaneLabels(t);

      /* the question, on the result in the pile, until the walk answers it */
      const crowded = this.portrait ? win(T.stitchA, T.stitchA + 0.3, t) * (1 - win(T.joinB - 0.2, T.joinB, t)) : 0;
      const qIn = win(T.dropB - 0.1, T.dropB + 0.2, t) * (1 - win(T.walkA, T.walkA + 0.25, t)) * clamp((this.rightDim(t) - 0.2) / 0.8) * (1 - crowded);
      if (qIn > 0 && this.copy) {
        const po = poses[dn.i];
        const size = this.portrait ? 11.5 : 14;
        this.pill(po.x + po.w * 0.42, po.y - po.h * 0.74, this.copy.question, { size, bg: this.pal.sun, ink: this.pal.onSun, scale: E.back(win(T.dropB - 0.1, T.dropB + 0.2, t)), alpha: clamp(qIn * 1.4), weight: 700 });
      }
      /* the drop lands */
      const landed = win(T.dropB - 0.28, T.dropB + 0.25, t);
      if (landed > 0 && landed < 1) this.ripple(poses[dn.i].x, poses[dn.i].y, landed, this.portrait ? 50 : 110, this.pal.edge);
      /* each note the run writes rings once */
      const u = this.runU(t, clock), fade = this.heroFade(t, clock) * this.leftDim(t);
      Object.keys(BORN).forEach((k) => {
        const n = this.byKey[k];
        if (n.D.hide || k === 'approved') return;
        const f = win(BORN[k], BORN[k] + 0.16, u);
        if (f > 0 && f < 1) this.ripple(n.D.x, n.D.y, f, n.D.w * 0.4, this.pal.run, fade * 0.6);
      });
      /* the two tracks land on each other */
      const land = win(T.joinB - 0.42, T.joinB + 0.12, t);
      if (land > 0 && land < 1) {
        SHADOWS.forEach((k) => {
          const F = this.byKey[k].F;
          this.ripple(F.x, F.y, land, this.kw * 0.36, this.pal.bind, 0.45);
        });
      }
      /* each note the walk reaches rings once */
      Object.keys(LIT_AT).forEach((k) => {
        const f = win(LIT_AT[k], LIT_AT[k] + 0.5, t);
        if (f > 0 && f < 1) this.ripple(poses[this.byKey[k].i].x, poses[this.byKey[k].i].y, f, this.kw * 0.56, this.pal.walk);
      });

      this.drawStops(t);
      this.drawLens(t, clock, poses);
      this.drawOrbit(t, clock);
      c.restore();

      this.drawSweep(clock);
      this.lastClock = clock;
    }
    litCount(t) {
      let count = 0;
      Object.keys(LIT_AT).forEach((k) => { if (t >= LIT_AT[k]) count++; });
      return count;
    }
  }

  /* ── captions: real text, so the film is readable without the canvas ─────── */
  function setWords(el, text) {
    el.textContent = '';
    String(text).split(' ').forEach((word, i) => {
      const outer = document.createElement('span');
      outer.className = 'w';
      const inner = document.createElement('span');
      inner.textContent = word;
      inner.style.setProperty('--i', i);
      outer.appendChild(inner);
      el.appendChild(outer);
      el.appendChild(document.createTextNode(' '));
    });
  }
  function writeCopy(root, film, animateWords) {
    const set = animateWords ? setWords : (el, text) => { el.textContent = text; };
    root.querySelectorAll('.cap').forEach((cap) => {
      const copy = film.caps[cap.dataset.chapter];
      if (!copy) return;
      set(cap.querySelector('h2'), copy.h);
      cap.querySelector('p').textContent = copy.s;
    });
    const a = film.answers;
    const q = (s) => root.querySelector(s);
    q('.answer-guess .answer-label').textContent = a.guessLabel;
    q('.answer-guess .answer-text').textContent = a.guess;
    q('.answer-honest .answer-label').textContent = a.honestLabel;
    q('.answer-honest .answer-text').textContent = a.honest;
    root.classList.toggle('is-mono', !!film.mono);
  }

  /* ── the live film: scroll is the cursor ────────────────────────────────── */
  class LiveFilm {
    constructor(root, data, view) {
      this.root = root;
      this.data = data;
      this.view = view;
      root.classList.add('is-live');
      root.style.setProperty('--film-beats', T.end);
      this.stage = root.querySelector('.film-stage');
      this.canvas = root.querySelector('#film-canvas');
      this.caps = Array.from(root.querySelectorAll('.cap'));
      this.hero = root.querySelector('.film-hero');
      this.readout = root.querySelector('.film-readout');
      this.readN = this.readout.querySelector('b');
      this.readL = this.readout.querySelector('span');
      this.answers = root.querySelector('.answers');
      this.stage.appendChild(this.answers);
      this.guess = this.answers.querySelector('.answer-guess');
      this.honest = this.answers.querySelector('.answer-honest');
      this.tag = root.querySelector('.film-tag');
      this.grid = root.querySelector('.film-grid');
      this.tip = root.querySelector('.orbit-tip');
      this.dock = document.querySelector('.lens-toggle');
      this.film = new Film(this.canvas);
      this.film.setData(data);
      this.film.readPalette();
      this.film.viewKey = view;
      this.film.setView(view, false, 0);
      this.buildRail();
      this.setCopy(false);
      this.measure();
      this.t = this.target = this.readScroll();
      this.startAt = performance.now();
      this.last = this.startAt;
      this.lastChapter = null;
      this.bind();
      this.running = false;
      new IntersectionObserver((entries) => {
        const on = entries[0].isIntersecting;
        if (on && !this.running) { this.running = true; this.last = performance.now(); requestAnimationFrame((n) => this.frame(n)); }
        if (!on) this.running = false;
      }).observe(this.stage);
    }
    setCopy() {
      writeCopy(this.root, this.data.views[this.view].film, true);
      this.readL.textContent = this.data.views[this.view].film.readout;
      this.measureAnswers();
    }
    setView(view) {
      this.view = view;
      this.film.viewKey = view;
      this.film.setView(view, true, this.clock || 0);
      this.setCopy();
      /* replay the headline's reveal so the change of voice is seen */
      this.caps.forEach((cap) => { if (cap.classList.contains('on')) { cap.classList.remove('on'); void cap.offsetWidth; cap.classList.add('on'); } });
      this.tipFor = null;
    }
    buildRail() {
      const rail = this.root.querySelector('.rail-track');
      rail.innerHTML = '';
      this.railSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      this.railSvg.setAttribute('class', 'rail-svg');
      this.railSvg.setAttribute('aria-hidden', 'true');
      rail.appendChild(this.railSvg);
      this.ticks = RAIL.map(([label, at, track]) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'tick';
        b.dataset.track = track;
        b.innerHTML = '<span></span>';
        b.firstChild.textContent = label;
        b.setAttribute('aria-label', 'Jump to ' + label);
        b.addEventListener('click', (e) => { e.stopPropagation(); this.pause(); this.seek(at); });
        rail.appendChild(b);
        return { el: b, at, track };
      });
      this.track = rail;
      const toT = (e) => {
        const r = rail.getBoundingClientRect();
        return clamp((e.clientX - r.left) / r.width) * T.end;
      };
      let dragging = false;
      rail.addEventListener('pointerdown', (e) => {
        if (e.target.closest('.tick')) return;
        dragging = true;
        rail.setPointerCapture(e.pointerId);
        this.pause();
        this.seek(toT(e));
      });
      rail.addEventListener('pointermove', (e) => { if (dragging) this.seek(toT(e)); });
      rail.addEventListener('pointerup', () => { dragging = false; });
      rail.addEventListener('pointercancel', () => { dragging = false; });
    }
    /* two lines from the start, one line from the walk back on. One cursor runs both. */
    layoutRail() {
      const rail = this.track, w = rail.clientWidth || 1, h = rail.clientHeight || 40;
      const yT = Math.round(h * 0.3), yB = Math.round(h * 0.62), yM = (yT + yB) / 2;
      const xOf = (at) => (at / T.end) * w;
      const xa = xOf(T.joinA), xb = xOf(T.walkA);
      const yAt = (x, y0) => {
        if (x <= xa) return y0;
        if (x >= xb) return yM;
        const k = (x - xa) / (xb - xa);
        return lerp(y0, yM, k * k * (3 - 2 * k));
      };
      this.railGeom = { w, xOf, xb, yAt, yT, yB };
      const line = (y0) => {
        let d = 'M0 ' + y0 + ' L' + xa.toFixed(1) + ' ' + y0;
        for (let i = 1; i <= 18; i++) { const x = lerp(xa, xb, i / 18); d += ' L' + x.toFixed(1) + ' ' + yAt(x, y0).toFixed(1); }
        return d;
      };
      const joined = 'M' + xb.toFixed(1) + ' ' + yM + ' L' + w + ' ' + yM;
      const svg = this.railSvg;
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      svg.innerHTML =
        '<defs><clipPath id="rail-clip"><rect class="rail-clip" x="0" y="-6" width="0" height="' + (h + 12) + '"/></clipPath></defs>' +
        '<path class="rail-base" d="' + line(yT) + '"/><path class="rail-base" d="' + line(yB) + '"/><path class="rail-base" d="' + joined + '"/>' +
        '<g clip-path="url(#rail-clip)"><path class="rail-top" d="' + line(yT) + '"/><path class="rail-bot" d="' + line(yB) + '"/><path class="rail-mid" d="' + joined + '"/></g>' +
        '<line class="rail-head"/><circle class="rail-dot rail-dot-top" r="4.5"/><circle class="rail-dot rail-dot-bot" r="4.5"/>';
      this.railClip = svg.querySelector('.rail-clip');
      this.railHead = svg.querySelector('.rail-head');
      this.railDotT = svg.querySelector('.rail-dot-top');
      this.railDotB = svg.querySelector('.rail-dot-bot');
      this.ticks.forEach((tick) => {
        const y = tick.track === 'top' ? yT : tick.track === 'bottom' ? yB : yM;
        tick.el.style.left = xOf(tick.at).toFixed(1) + 'px';
        tick.el.style.top = (y - 13) + 'px';
        tick.el.style.setProperty('--label-top', (yB + 5 - (y - 13)) + 'px');
      });
    }
    syncRail(t) {
      const g = this.railGeom;
      if (!g) return;
      const x = g.xOf(t), yA = g.yAt(x, g.yT), yC = g.yAt(x, g.yB);
      this.railClip.setAttribute('width', x.toFixed(1));
      this.railDotT.setAttribute('cx', x.toFixed(1)); this.railDotT.setAttribute('cy', yA.toFixed(1));
      this.railDotB.setAttribute('cx', x.toFixed(1)); this.railDotB.setAttribute('cy', yC.toFixed(1));
      this.railHead.setAttribute('x1', x.toFixed(1)); this.railHead.setAttribute('x2', x.toFixed(1));
      this.railHead.setAttribute('y1', yA.toFixed(1)); this.railHead.setAttribute('y2', yC.toFixed(1));
    }
    measure() {
      const W = this.stage.clientWidth, H = this.stage.clientHeight;
      const head = document.querySelector('.hd').offsetHeight;
      const portrait = W < 860 || W / H < 1.1;
      const capZone = portrait ? clamp(H * 0.34, 214, 300) : 0;
      const gutter = clamp(W * 0.035, 18, 56);
      const capW = portrait ? 0 : clamp(W * 0.3, 280, 450);
      this.stage.style.setProperty('--cap-w', capW + 'px');
      this.stage.style.setProperty('--cap-zone', capZone + 'px');
      this.stage.style.setProperty('--gutter', gutter + 'px');
      this.stage.style.setProperty('--head', head + 'px');
      this.stage.classList.toggle('is-portrait', portrait);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.film.resize(W, H, dpr, { head, capZone, gutter, capW, rail: 60 });
      this.layoutRail();
      this.scrollable = Math.max(1, this.root.offsetHeight - H);
      this.rootTop = this.root.getBoundingClientRect().top + window.scrollY;
      const A = this.film.A;
      if (portrait) {
        this.answers.style.cssText = 'left:12px;right:12px;bottom:58px;width:auto;top:auto;';
      } else {
        this.answers.style.cssText = 'left:' + (A.x + A.w * 0.47) + 'px;top:' + (A.y + A.h * 0.668) + 'px;width:' + A.w * 0.53 + 'px;';
      }
      this.measureAnswers();
    }
    measureAnswers() {
      this.film.ans = { x: this.honest.offsetLeft + this.answers.offsetLeft, y: this.honest.offsetTop + this.answers.offsetTop, w: this.honest.offsetWidth, h: this.honest.offsetHeight };
    }
    readScroll() {
      return clamp((window.scrollY - this.rootTop) / this.scrollable) * T.end;
    }
    seek(t) {
      window.scrollTo({ top: this.rootTop + (clamp(t, 0, T.end) / T.end) * this.scrollable, behavior: 'instant' });
    }
    play() {
      if (this.readScroll() > T.end - 0.05) this.seek(0);
      this.playing = true;
      this.root.classList.add('is-playing');
      this.syncPlayLabel();
    }
    pause() {
      this.playing = false;
      this.root.classList.remove('is-playing');
      this.syncPlayLabel();
    }
    syncPlayLabel() {
      this.root.querySelectorAll('[data-film-play]').forEach((b) => {
        b.setAttribute('aria-pressed', this.playing ? 'true' : 'false');
        const label = b.querySelector('[data-play-label]');
        if (label) label.textContent = this.playing ? 'Pause' : b.dataset.playIdle || 'Play';
      });
    }
    bind() {
      window.addEventListener('resize', () => {
        clearTimeout(this.rz);
        this.rz = setTimeout(() => { this.measure(); }, 120);
      }, { passive: true });
      if ('ResizeObserver' in window) {
        let lastW = this.stage.clientWidth, lastH = this.stage.clientHeight;
        new ResizeObserver(() => {
          const w = this.stage.clientWidth, h = this.stage.clientHeight;
          if (w !== lastW || h !== lastH) { lastW = w; lastH = h; this.measure(); }
        }).observe(this.stage);
      }
      this.root.querySelectorAll('[data-film-play]').forEach((b) => {
        b.addEventListener('click', () => { if (this.playing) this.pause(); else this.play(); });
      });
      ['wheel', 'touchstart'].forEach((ev) => window.addEventListener(ev, () => { if (this.playing) this.pause(); }, { passive: true }));
      window.addEventListener('keydown', (e) => {
        if (this.playing && [' ', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].indexOf(e.key) >= 0) this.pause();
      });
      const toLocal = (e) => {
        const r = this.stage.getBoundingClientRect();
        const p = this.film.pointer;
        p.px = e.clientX - r.left; p.py = e.clientY - r.top;
        p.x = p.px / r.width; p.y = p.py / r.height;
        p.on = true;
      };
      this.stage.addEventListener('pointermove', toLocal, { passive: true });
      this.stage.addEventListener('pointerleave', () => { this.film.pointer.on = false; this.film.pointer.px = -1e4; }, { passive: true });
      this.stage.addEventListener('click', (e) => {
        if (e.target.closest('a,button')) return;
        toLocal(e);
        const body = this.film.bodyAt(this.film.pointer.px, this.film.pointer.py, this.t);
        if (body) document.dispatchEvent(new CustomEvent('film:body', { detail: { id: body.id } }));
      });
      new MutationObserver(() => { this.film.readPalette(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    }
    frame(now) {
      if (!this.running) return;
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      const clock = this.clock = (now - this.startAt) / 1000;
      if (this.playing) {
        const speed = this.scrollable / (T.end * 1.6);
        const next = window.scrollY + speed * dt;
        window.scrollTo({ top: next, behavior: 'instant' });
        if (next >= this.rootTop + this.scrollable - 1) this.pause();
      }
      this.target = this.readScroll();
      this.t += (this.target - this.t) * (1 - Math.exp(-dt / 0.085));
      if (Math.abs(this.target - this.t) < 0.0008) this.t = this.target;
      this.film.draw(this.t, clock);
      this.syncDom(this.t);
      const drift = ((this.t * 34) % 24).toFixed(1);
      if (drift !== this.lastDrift) { this.lastDrift = drift; this.grid.style.transform = 'translate3d(0,' + -drift + 'px,0)'; }
      requestAnimationFrame((n) => this.frame(n));
    }
    syncDom(t) {
      /* caption */
      let chapter = null;
      for (const [id, a, b] of CHAPTERS) if (t >= a && t < b) chapter = id;
      if (chapter !== this.lastChapter) {
        this.lastChapter = chapter;
        this.caps.forEach((cap) => cap.classList.toggle('on', cap.dataset.chapter === chapter));
        this.hero.classList.toggle('on', chapter === 'hero');
        this.root.dataset.chapter = chapter || '';
        document.body.classList.toggle('lens-nudge', chapter === 'lenses');
        this.railSvg.dataset.active = TRACK_OF[chapter] || 'mid';
      }
      /* the big number */
      const scanShow = t > T.scanA - 0.1 && t < T.bindA;
      const walkShow = t > T.walkA && t < T.gapA + 0.15;
      this.readout.classList.toggle('on', scanShow || walkShow);
      /* once it is fading out, the number stays what it last said */
      if (scanShow || walkShow) {
        const value = walkShow ? this.film.litCount(t) : Math.round(win(T.scanA, T.scanB, t) * PILE_N);
        if (value !== this.readValue) {
          this.readValue = value;
          this.readN.textContent = String(value);
          this.readout.classList.toggle('is-walk', walkShow);
          if (this.film.portrait) this.readout.style.top = (walkShow ? this.film.A.y : this.film.PR.y + 2) + 'px';
        }
      }
      /* the two answers */
      const fadeOut = 1 - win(T.gapEnd - 0.3, T.gapEnd - 0.02, t);
      const gq = win(T.guessA, T.guessB, t), hq = win(T.honestA, T.honestB, t);
      this.answers.classList.toggle('on', gq > 0 && fadeOut > 0);
      if (gq > 0 && fadeOut > 0) {
        this.guess.style.opacity = (gq * fadeOut * lerp(1, 0.6, win(T.strike, T.strike + 0.35, t))).toFixed(3);
        this.guess.style.transform = 'translateY(' + ((1 - E.back(gq)) * 14).toFixed(1) + 'px)';
        this.guess.style.setProperty('--strike', win(T.strike, T.strike + 0.35, t).toFixed(3));
        this.honest.style.opacity = (hq * fadeOut).toFixed(3);
        this.honest.style.transform = 'translateY(' + ((1 - E.back(hq)) * 14).toFixed(1) + 'px)';
      }
      /* the scrubber */
      this.syncRail(t);
      let current = -1;
      this.ticks.forEach((tick, i) => { if (t >= tick.at - 0.2) current = i; });
      if (current !== this.tickOn) {
        this.tickOn = current;
        this.ticks.forEach((tick, i) => { tick.el.classList.toggle('on', i === current); tick.el.classList.toggle('past', i <= current); });
      }
      this.tag.classList.toggle('on', t > 1 && t < T.orbitA);
      /* the orbit's tooltip */
      const body = this.film.hoverBody;
      if (body !== this.tipFor) {
        this.tipFor = body;
        this.tip.classList.toggle('on', !!body);
        this.stage.classList.toggle('is-pointing', !!body);
        if (body) {
          const node = this.data.nodes.filter((n) => n.id === body.id)[0];
          this.tip.querySelector('b').textContent = body.name;
          this.tip.querySelector('span').textContent = node.views[this.view].title;
        }
      }
      if (body) {
        const left = clamp(body.px, 120, this.film.W - 120);
        this.tip.style.transform = 'translate(' + (left - 110).toFixed(0) + 'px,' + (body.py - 74).toFixed(0) + 'px)';
      }
    }
  }

  /* ── reduced motion: the same frames, held still, one per chapter ───────── */
  class StillFilm {
    constructor(root, data, view) {
      this.root = root; this.data = data; this.view = view;
      root.classList.add('is-still');
      this.buffer = document.createElement('canvas');
      this.film = new Film(this.buffer);
      this.film.still = true;
      this.film.setData(data);
      this.film.viewKey = view;
      this.film.setView(view, false, 0);
      this.film.readPalette();
      this.film.orbitClock = 2;
      this.frames = [];
      root.querySelectorAll('.cap').forEach((cap) => {
        const canvas = document.createElement('canvas');
        canvas.className = 'cap-still';
        canvas.setAttribute('aria-hidden', 'true');
        cap.appendChild(canvas);
        this.frames.push({ canvas, chapter: cap.dataset.chapter });
      });
      this.setCopy();
      this.render();
      let timer = 0;
      window.addEventListener('resize', () => { clearTimeout(timer); timer = setTimeout(() => this.render(), 160); }, { passive: true });
      new MutationObserver(() => { this.film.readPalette(); this.render(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    }
    setCopy() { writeCopy(this.root, this.data.views[this.view].film, false); }
    setView(view) {
      this.view = view;
      this.film.viewKey = view;
      this.film.setView(view, false, 0);
      this.setCopy();
      this.render();
    }
    render() {
      const f = this.film;
      const width = Math.min(this.root.clientWidth || 800, 980);
      const W = Math.max(320, width);
      const H = W < 560 ? W * 1.05 : W * 0.6;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      f.resize(W, H, dpr, { still: true });
      f.hook = { chain: f.hooks[0], start: 0, gap: true };
      f.pointer.on = false;
      this.frames.forEach(({ canvas, chapter }) => {
        canvas.width = this.buffer.width; canvas.height = this.buffer.height;
        canvas.style.aspectRatio = W + ' / ' + H;
        f.lastClock = 50;
        f.draw(STILLS[chapter], 50);
        canvas.getContext('2d').drawImage(this.buffer, 0, 0);
      });
    }
  }

  /* ── public surface ─────────────────────────────────────────────────────── */
  const api = {
    T, Film, STILLS,
    boot(data, view) {
      const root = document.getElementById('film');
      if (!root || !data.views[view].film) return;
      const reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      const hasCanvas = !!document.createElement('canvas').getContext;
      if (!hasCanvas) return;
      api.instance = reduced ? new StillFilm(root, data, view) : new LiveFilm(root, data, view);
    },
    setView(view) { if (api.instance) api.instance.setView(view); },
    seek(t) { if (api.instance && api.instance.seek) { api.instance.seek(t); api.instance.t = t; } }
  };
  window.FootprintFilm = api;
})();
