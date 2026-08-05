/* ============================================================================
   footprintjs.github.io — the hero solar system.

   The design's hero art ("the causal trace is the sun; footprintjs is the inner
   planet with its moon agentfootprint; The Footprint Trail is the outer planet
   with moons hcifootprint and vizfootprint; every body leaves a glowing
   long-exposure trail") rendered for real in three.js.

   The long-exposure trail is the signature move — "every run leaves a trace"
   made literal. In the design it is a gradient arc INSIDE each rotating group;
   here it is the same thing in 3D: a ribbon mesh in the orbit pivot's local
   space, vertex alpha ramping from transparent at the tail to saturated at the
   body. It rides the pivot, so it costs nothing per frame.

   Three renderers, one data source (ecosystem-views.json -> solarSystem):
     - 3D     wide viewports with WebGL
     - 2D     narrow viewports, or no WebGL — the design's own SVG, relabelled
     - static reduced-motion gets the 3D scene rendered exactly once

   three.js is imported DYNAMICALLY, so narrow/no-WebGL visitors never download
   the 671 KB module at all.
   ============================================================================ */
(function () {
  'use strict';

  var WIDE_ENOUGH = 760;
  var TAU = Math.PI * 2;

  var host = document.getElementById('hero-orrery');
  if (!host) return;

  function prefersReducedMotion() {
    return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function hasWebGL() {
    try {
      var canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  function svgEl(tag, attrs) {
    var node = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.keys(attrs || {}).forEach(function (key) {
      node.setAttribute(key, String(attrs[key]));
    });
    return node;
  }

  /* ── the 2D fallback: the design's hero SVG, with real labels ───────────── */
  /* geometry lifted straight from the design (viewBox 760x510, sun at 390,252,
     orbits 118 / 186, moon suborbits 30, 26, 42) */
  var D = {
    cx: 390, cy: 252, sun: 15,
    planets: [
      { orbit: 118, body: 11, angle: 202, moons: [{ orbit: 30, body: 5.5, angle: 95 }] },
      { orbit: 186, body: 9.5, angle: -18,
        moons: [{ orbit: 26, body: 4.8, angle: 205 }, { orbit: 42, body: 4.4, angle: 42 }] }
    ]
  };

  function polar(cx, cy, r, deg) {
    var rad = (deg * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  }

  function trailArc(cx, cy, r, endDeg, sweep) {
    var a = polar(cx, cy, r, endDeg - sweep);
    var b = polar(cx, cy, r, endDeg);
    var large = sweep > 180 ? 1 : 0;
    return 'M' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) +
      ' A' + r + ' ' + r + ' 0 ' + large + ' 1 ' + b[0].toFixed(1) + ' ' + b[1].toFixed(1);
  }

  function render2D(system) {
    var svg = svgEl('svg', {
      viewBox: '0 0 760 510', class: 'orrery-2d', role: 'img',
      'aria-label': 'The footprintjs ecosystem as one solar system: ' +
        system.sun.label + ' at the centre, ' +
        system.planets.map(function (p) { return p.label; }).join(' and ') +
        ', each with its projects in orbit, every body leaving a trail.'
    });
    var defs = svgEl('defs');
    svg.appendChild(defs);

    function gradient(id, accent, x1, y1, x2, y2) {
      var grad = svgEl('linearGradient', {
        id: id, gradientUnits: 'userSpaceOnUse', x1: x1, y1: y1, x2: x2, y2: y2
      });
      grad.appendChild(svgEl('stop', { offset: '0%', 'stop-color': accent, 'stop-opacity': 0 }));
      grad.appendChild(svgEl('stop', { offset: '100%', 'stop-color': accent, 'stop-opacity': 0.85 }));
      defs.appendChild(grad);
      return 'url(#' + id + ')';
    }

    /* the tilted, foreshortened plane — the design's own transform */
    var plane = svgEl('g', {
      transform: 'rotate(-8 390 252) translate(0 70.56) scale(1 0.72)'
    });

    var sunGlow = svgEl('radialGradient', { id: 'heroSunGlow' });
    sunGlow.appendChild(svgEl('stop', { offset: '0%', 'stop-color': system.sun.accent, 'stop-opacity': 0.42 }));
    sunGlow.appendChild(svgEl('stop', { offset: '55%', 'stop-color': system.sun.accent, 'stop-opacity': 0.13 }));
    sunGlow.appendChild(svgEl('stop', { offset: '100%', 'stop-color': system.sun.accent, 'stop-opacity': 0 }));
    defs.appendChild(sunGlow);
    plane.appendChild(svgEl('circle', { cx: D.cx, cy: D.cy, r: 66, fill: 'url(#heroSunGlow)' }));

    var bodies = [];

    system.planets.forEach(function (planet, index) {
      var geo = D.planets[index];
      if (!geo) return;
      plane.appendChild(svgEl('circle', {
        cx: D.cx, cy: D.cy, r: geo.orbit, fill: 'none',
        stroke: planet.accent, 'stroke-width': 1, opacity: 0.32
      }));
      var at = polar(D.cx, D.cy, geo.orbit, geo.angle);
      var end = polar(D.cx, D.cy, geo.orbit, geo.angle - 95);
      plane.appendChild(svgEl('path', {
        d: trailArc(D.cx, D.cy, geo.orbit, geo.angle, 95), fill: 'none',
        stroke: gradient('tg' + index, planet.accent, end[0], end[1], at[0], at[1]),
        'stroke-width': 2.6, 'stroke-linecap': 'round'
      }));
      plane.appendChild(svgEl('circle', {
        cx: at[0], cy: at[1], r: geo.body, fill: planet.accent
      }));
      bodies.push({
        x: at[0], y: at[1], r: geo.body, label: planet.label, rank: 1,
        sub: planet.reference ? planet.reference.name : null,
        card: planet.reference ? planet.reference.card : null
      });

      (planet.satellites || []).forEach(function (sat, satIndex) {
        var moon = geo.moons[satIndex];
        if (!moon) return;
        plane.appendChild(svgEl('circle', {
          cx: at[0], cy: at[1], r: moon.orbit, fill: 'none',
          stroke: planet.accent, 'stroke-width': 0.8, opacity: 0.28
        }));
        var mAt = polar(at[0], at[1], moon.orbit, moon.angle);
        var mEnd = polar(at[0], at[1], moon.orbit, moon.angle - 110);
        plane.appendChild(svgEl('path', {
          d: trailArc(at[0], at[1], moon.orbit, moon.angle, 110), fill: 'none',
          stroke: gradient('mg' + index + satIndex, sat.accent, mEnd[0], mEnd[1], mAt[0], mAt[1]),
          'stroke-width': 1.9, 'stroke-linecap': 'round'
        }));
        plane.appendChild(svgEl('circle', {
          cx: mAt[0], cy: mAt[1], r: moon.body, fill: sat.accent
        }));
        bodies.push({
          x: mAt[0], y: mAt[1], r: moon.body, label: sat.name, card: sat.card, rank: 2
        });
      });
    });

    /* the sun sits above its own glow */
    plane.appendChild(svgEl('circle', {
      cx: D.cx, cy: D.cy, r: D.sun, fill: system.sun.accent,
      stroke: 'rgba(0,0,0,.18)', 'stroke-width': 1
    }));
    svg.appendChild(plane);

    /* labels last, so they sit on top */
    var placed = [];
    bodies.forEach(function (body) {
      var group = svgEl('g', { class: 'orrery-2d-label' });
      var text = svgEl('text', {
        x: body.x, y: body.y - body.r - 9, 'text-anchor': 'middle'
      });
      text.textContent = body.label;
      group.appendChild(text);
      var sub = null;
      if (body.sub) {
        sub = svgEl('text', {
          x: body.x, y: body.y - body.r - 9 + 13, 'text-anchor': 'middle',
          class: 'orrery-2d-sub'
        });
        sub.textContent = body.sub;
        group.appendChild(sub);
      }
      var outer = group;
      if (body.card) {
        outer = svgEl('a', { href: '#card-' + body.card });
        outer.appendChild(group);
      }
      svg.appendChild(outer);
      placed.push({ outer: outer, group: group, text: text, sub: sub, body: body });
    });

    var sunLabel = svgEl('text', {
      x: D.cx, y: D.cy + 108, 'text-anchor': 'middle', class: 'orrery-2d-sunlabel'
    });
    sunLabel.textContent = system.sun.label;
    svg.appendChild(sunLabel);
    placed.push({ outer: sunLabel, group: sunLabel, text: sunLabel, sub: null,
      body: { rank: 0 } });

    host.innerHTML = '';
    host.appendChild(svg);
    host.dataset.mode = '2d';
    /* measure-then-fit, once, in the frame after the art is in the document:
       the type sizes are CSS (they change with the breakpoint), so the label
       spacing has to be read off what actually rendered, not assumed. */
    requestAnimationFrame(function () {
      spaceSubLabels(placed);
      separateLabels(placed);
      cropToContent(svg, host);
      if (host.scrollWidth > host.clientWidth) {
        host.scrollLeft = (host.scrollWidth - host.clientWidth) / 2;
      }
    });
  }

  /* A label's second line sat a hard-coded 13 units under its first — which is
     a line of 11px type, the one size the art used to be drawn at. The phone
     draws it bigger, so the gap has to be read from the type instead. */
  function spaceSubLabels(placed) {
    placed.forEach(function (item) {
      if (!item.sub) return;
      var size = parseFloat(getComputedStyle(item.text).fontSize) || 11;
      var top = parseFloat(item.text.getAttribute('y'));
      item.sub.setAttribute('y', (top + size * 1.08).toFixed(1));
    });
  }

  /* At phone type sizes two names in the composition's tighter corners can
     touch. One static pass settles it: the less important name steps out of the
     more important one's way (sun > planet > moon). This is a still image — it
     is laid out once and never moves again — so nudging is honest here, where
     in the animated 3D scene (which would have to re-nudge every frame) the
     covered label fades instead. */
  function separateLabels(placed) {
    var order = placed.slice().sort(function (a, b) {
      return (a.body.rank || 0) - (b.body.rank || 0);
    });
    var kept = [];
    order.forEach(function (item) {
      var box;
      try {
        box = item.group.getBBox();
      } catch (e) {
        return;
      }
      var shift = 0;
      var guard = 0;
      /* step up out of the way, re-checking against everything already settled
         (a nudge can walk into a third name) */
      while (guard < 8) {
        var moved = false;
        for (var i = 0; i < kept.length; i += 1) {
          var other = kept[i];
          var top = box.y + shift;
          var overlapY = Math.min(top + box.height, other.y + other.height) -
            Math.max(top, other.y);
          var overlapX = Math.min(box.x + box.width, other.x + other.width) -
            Math.max(box.x, other.x);
          if (overlapX > 0 && overlapY > 0) {
            shift -= overlapY + 3;
            moved = true;
          }
        }
        if (!moved) break;
        guard += 1;
      }
      if (shift) item.outer.setAttribute('transform', 'translate(0 ' + shift.toFixed(1) + ')');
      kept.push({ x: box.x, y: box.y + shift, width: box.width, height: box.height });
    });
  }

  /* The design's 760x510 canvas frames the system with a generous empty margin.
     The SVG is scaled to whatever box it lands in, so that margin buys nothing
     and costs a lot: it is why the art used to be 485px tall on a phone and
     still had to scroll sideways, and why its labels rendered at 8px. Cropping
     the viewBox to what is actually drawn removes NOTHING from the picture —
     the same system, framed tight — and every unit of the scale it gives back
     goes into the labels. */
  function cropToContent(svg, host) {
    var box;
    try {
      box = svg.getBBox();
    } catch (e) {
      return;
    }
    if (!box || box.width <= 0 || box.height <= 0) return;
    var pad = 8;
    svg.setAttribute('viewBox', [
      (box.x - pad).toFixed(1),
      (box.y - pad).toFixed(1),
      (box.width + pad * 2).toFixed(1),
      (box.height + pad * 2).toFixed(1)
    ].join(' '));
  }

  /* ── the 3D scene ───────────────────────────────────────────────────────── */
  function render3D(THREE, system) {
    var reduced = prefersReducedMotion();

    var canvasWrap = document.createElement('div');
    canvasWrap.className = 'orrery-3d';
    canvasWrap.setAttribute('aria-hidden', 'true');
    var labelLayer = document.createElement('div');
    labelLayer.className = 'orrery-labels';

    host.innerHTML = '';
    host.appendChild(canvasWrap);
    host.appendChild(labelLayer);
    host.dataset.mode = '3d';

    var width = host.clientWidth || 560;
    var height = Math.round(width * 0.67);

    var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    canvasWrap.appendChild(renderer.domElement);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 200);

    /* elevation ~46 degrees reproduces the design's 0.72 vertical squash,
       and the -8 degree roll is the design's tilt */
    var DIST = 25, ELEV = (46 * Math.PI) / 180;
    camera.position.set(0, DIST * Math.sin(ELEV), DIST * Math.cos(ELEV));
    camera.lookAt(0, 0, 0);
    camera.rotateZ((-8 * Math.PI) / 180);

    var ambient = new THREE.AmbientLight(0xffffff, 0.62);
    scene.add(ambient);
    var sunLight = new THREE.PointLight(new THREE.Color(system.sun.accent), 2.1, 90, 1.4);
    scene.add(sunLight);

    /* the sun: flat emissive disc plus a soft radial sprite (no postprocessing) */
    var sunSize = system.sun.size || 0.78;
    var sun = new THREE.Mesh(
      new THREE.SphereGeometry(sunSize, 32, 24),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(system.sun.accent) })
    );
    scene.add(sun);

    var glowCanvas = document.createElement('canvas');
    glowCanvas.width = glowCanvas.height = 128;
    var gctx = glowCanvas.getContext('2d');
    var grad = gctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255,199,0,0.45)');
    grad.addColorStop(0.45, 'rgba(255,199,0,0.13)');
    grad.addColorStop(1, 'rgba(255,199,0,0)');
    gctx.fillStyle = grad;
    gctx.fillRect(0, 0, 128, 128);
    var glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(glowCanvas),
      transparent: true, depthWrite: false
    }));
    glow.scale.setScalar(sunSize * 9);
    scene.add(glow);

    var orbitMaterials = [];
    var labels = [];
    var spinners = [];
    /* starting angles, so the bodies open out instead of stacking on one side
       (and their labels never begin life on top of each other) */
    var PLANET_PHASE = [3.6, 0.5];
    var MOON_PHASE = [1.5, 3.5, 0.6, 2.9];

    function orbitRing(radius, color) {
      var points = [];
      for (var i = 0; i <= 96; i += 1) {
        var a = (i / 96) * TAU;
        points.push(new THREE.Vector3(radius * Math.cos(a), 0, -radius * Math.sin(a)));
      }
      var material = new THREE.LineBasicMaterial({
        color: new THREE.Color(color), transparent: true, opacity: 0.3
      });
      orbitMaterials.push(material);
      return new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points), material);
    }

    /* the long-exposure trail: a ribbon in pivot space, alpha ramping to the body */
    function trailRibbon(radius, halfWidth, color, arcDeg) {
      var segments = 64;
      var arc = (arcDeg * Math.PI) / 180;
      var positions = [];
      var colors = [];
      var indices = [];
      var base = new THREE.Color(color);
      for (var i = 0; i <= segments; i += 1) {
        var t = i / segments;
        var phi = -arc * (1 - t);
        var cos = Math.cos(phi), sin = Math.sin(phi);
        var inner = radius - halfWidth, outer = radius + halfWidth;
        positions.push(inner * cos, 0, -inner * sin);
        positions.push(outer * cos, 0, -outer * sin);
        var alpha = Math.pow(t, 1.7) * 0.9;
        colors.push(base.r, base.g, base.b, alpha);
        colors.push(base.r, base.g, base.b, alpha);
        if (i < segments) {
          var a = i * 2;
          indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
        }
      }
      var geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4));
      geometry.setIndex(indices);
      return new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
        vertexColors: true, transparent: true, side: THREE.DoubleSide, depthWrite: false
      }));
    }

    function addLabel(text, sub, card) {
      var node = document.createElement(card ? 'a' : 'div');
      node.className = 'orrery-label' + (sub ? ' has-sub' : '');
      if (card) node.href = '#card-' + card;
      var name = document.createElement('span');
      name.className = 'orrery-label-name';
      name.textContent = text;
      node.appendChild(name);
      if (sub) {
        var subNode = document.createElement('span');
        subNode.className = 'orrery-label-sub';
        subNode.textContent = sub;
        node.appendChild(subNode);
      }
      labelLayer.appendChild(node);
      return node;
    }

    /* rank = who wins a conjunction: the sun's name outranks a planet's,
       a planet's outranks its moons' (see place()) */
    labels.push({ node: addLabel(system.sun.label, null, null), object: sun, offset: 30, rank: 0 });

    system.planets.forEach(function (planet, planetIndex) {
      var pivot = new THREE.Object3D();
      pivot.rotation.y = PLANET_PHASE[planetIndex % PLANET_PHASE.length];
      scene.add(pivot);
      scene.add(orbitRing(planet.orbitRadius, planet.accent));
      pivot.add(trailRibbon(planet.orbitRadius, planet.size * 0.42, planet.accent, 95));

      var planetMesh = new THREE.Mesh(
        new THREE.SphereGeometry(planet.size, 32, 24),
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(planet.accent), roughness: 0.55, metalness: 0.05
        })
      );
      planetMesh.position.set(planet.orbitRadius, 0, 0);
      pivot.add(planetMesh);
      spinners.push({ object: pivot, seconds: planet.orbitSeconds });
      /* the planet's label hangs BELOW its body while its moons label above,
         so a planet and its moons never stack their names on each other */
      labels.push({
        node: addLabel(planet.label, planet.reference ? planet.reference.name : null,
          planet.reference ? planet.reference.card : null),
        object: planetMesh, offset: -34, rank: 1
      });

      (planet.satellites || []).forEach(function (sat, satIndex) {
        var moonPivot = new THREE.Object3D();
        moonPivot.position.set(planet.orbitRadius, 0, 0);
        moonPivot.rotation.y =
          MOON_PHASE[(planetIndex * 2 + satIndex) % MOON_PHASE.length];
        pivot.add(moonPivot);
        moonPivot.add(orbitRing(sat.orbitRadius, sat.accent));
        moonPivot.add(trailRibbon(sat.orbitRadius, sat.size * 0.5, sat.accent, 120));
        var moon = new THREE.Mesh(
          new THREE.SphereGeometry(sat.size, 24, 18),
          new THREE.MeshStandardMaterial({
            color: new THREE.Color(sat.accent), roughness: 0.5, metalness: 0.05
          })
        );
        moon.position.set(sat.orbitRadius, 0, 0);
        moonPivot.add(moon);
        spinners.push({ object: moonPivot, seconds: sat.orbitSeconds });
        labels.push({ node: addLabel(sat.name, null, sat.card), object: moon, offset: 20, rank: 2 });
      });
    });

    /* theme: the page background shows through, so only the lines and the
       ambient level need retinting when the toggle flips */
    function applyTheme() {
      var dark = document.documentElement.classList.contains('dark');
      ambient.intensity = dark ? 0.5 : 0.68;
      orbitMaterials.forEach(function (material) {
        material.opacity = dark ? 0.34 : 0.26;
      });
    }
    applyTheme();
    /* a theme flip can retint AND resize the names (different font stack per
       theme is legal here), so the cached label boxes are stale afterwards —
       remeasure, re-render the frame, and settle the conjunctions again. That
       last part is what keeps the reduced-motion still frame correct: it is
       resolved once here exactly as it is every frame in the loop. */
    new MutationObserver(function () {
      applyTheme();
      measureLabels();
      renderer.render(scene, camera);
      place();
    }).observe(document.documentElement, {
      attributes: true, attributeFilter: ['class']
    });

    var projected = new THREE.Vector3();

    /* ── conjunctions ──────────────────────────────────────────────────────
       Bodies pass in front of one another, so two names can land on the same
       pixels — the sun's "the causal trace" under a planet's, moon under moon.
       Nudging a name away from its body would lie about which body it names,
       so the covered name FADES instead and comes back when the pass is over.
       Two rules keep it honest and calm:
         - rank decides who yields (sun > planet > moon), never the frame order
         - two thresholds, not one: a clear name only starts fading once it is
           genuinely touching, and only clears once it is comfortably apart.
           That gap is the hysteresis — a grazing pass cannot flicker.
       Label sizes are measured on resize / theme / font changes ONLY; the
       frame loop reads the cached numbers and writes transforms, so it never
       forces layout. */
    var COVER_ENTER = 2;   /* px of slack before a clear name yields */
    var COVER_EXIT = 10;   /* px of clearance before a faded one returns */
    var COVERED_OPACITY = '0.25';

    function measureLabels() {
      labels.forEach(function (label) {
        label.w = label.node.offsetWidth;
        label.h = label.node.offsetHeight;
      });
    }

    /* highest rank first; the sort is stable, so ties keep their build order
       and the winner of a moon-on-moon pass never swaps mid-conjunction */
    var byRank = labels.slice().sort(function (a, b) { return a.rank - b.rank; });

    /* both rects are centred on (x, y) — the labels carry translate(-50%,-50%) */
    function covers(a, b, pad) {
      return Math.abs(a.x - b.x) * 2 < a.w + b.w + pad * 2 &&
        Math.abs(a.y - b.y) * 2 < a.h + b.h + pad * 2;
    }

    function place() {
      var w = renderer.domElement.clientWidth || width;
      var h = renderer.domElement.clientHeight || height;
      labels.forEach(function (label) {
        projected.setFromMatrixPosition(label.object.matrixWorld);
        projected.project(camera);
        label.x = (projected.x * 0.5 + 0.5) * w;
        label.y = (-projected.y * 0.5 + 0.5) * h - label.offset;
        label.onScreen = projected.z <= 1;
        var transform = 'translate(-50%,-50%) translate(' +
          label.x.toFixed(1) + 'px,' + label.y.toFixed(1) + 'px)';
        if (transform !== label.transform) {
          label.transform = transform;
          label.node.style.transform = transform;
        }
      });

      /* walk by rank, keeping the names that won their pixels; anything that
         lands on one of those yields. A faded name never covers anyone else,
         so one pass settles it — no cascades, no second round. */
      var kept = [];
      byRank.forEach(function (label) {
        var covered = false;
        if (label.onScreen) {
          var pad = label.covered ? COVER_EXIT : COVER_ENTER;
          for (var i = 0; i < kept.length; i += 1) {
            if (covers(label, kept[i], pad)) { covered = true; break; }
          }
        }
        label.covered = covered;
        if (label.onScreen && !covered) kept.push(label);

        var opacity = !label.onScreen ? '0' : (covered ? COVERED_OPACITY : '1');
        if (opacity !== label.opacity) {
          label.opacity = opacity;
          label.node.style.opacity = opacity;
          /* a ghosted link must not swallow the click meant for the name on top */
          label.node.style.pointerEvents = opacity === '1' ? '' : 'none';
        }
      });
    }

    function resize() {
      width = host.clientWidth || width;
      height = Math.round(width * 0.67);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      labelLayer.style.height = height + 'px';
      renderer.render(scene, camera);
      measureLabels();
      place();
    }

    var running = false, visible = true, raf = 0, last = 0;

    function frame(now) {
      raf = 0;
      var deltaMs = last ? now - last : 16;
      last = now;
      spinners.forEach(function (spin) {
        spin.object.rotation.y += (deltaMs / 1000) * (TAU / spin.seconds);
      });
      renderer.render(scene, camera);
      place();
      if (running) raf = requestAnimationFrame(frame);
    }

    function start() {
      if (running || reduced) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    /* pause when scrolled away or the tab is hidden */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible && !document.hidden) start();
        else stop();
      }, { threshold: 0.01 }).observe(host);
    } else {
      start();
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden || !visible) stop();
      else start();
    });

    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(host);
    else window.addEventListener('resize', resize);

    resize();
    /* the first measure ran in the fallback font; when the real one arrives the
       boxes change width, so measure once more (harmless if it never fires) */
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        measureLabels();
        place();
      }).catch(function () { /* font loading is best-effort */ });
    }
    if (!reduced) start();
  }

  /* ── pick a renderer ────────────────────────────────────────────────────── */
  fetch('./ecosystem-views.json', { cache: 'no-cache' })
    .then(function (response) {
      if (!response.ok) throw new Error('Unable to load ecosystem-views.json');
      return response.json();
    })
    .then(function (data) {
      var system = data.solarSystem;
      if (!system || !Array.isArray(system.planets)) return;

      var wantsGL = window.innerWidth >= WIDE_ENOUGH && hasWebGL();
      if (!wantsGL) {
        render2D(system);
        return;
      }
      /* only wide + WebGL visitors pay for three.js */
      import('./vendor/three/three.module.min.js')
        .then(function (THREE) {
          render3D(THREE, system);
        })
        .catch(function (error) {
          console.warn('three.js unavailable, falling back to the 2D system', error);
          render2D(system);
        });
    })
    .catch(function (error) {
      console.warn('hero solar system unavailable', error);
    });
})();
