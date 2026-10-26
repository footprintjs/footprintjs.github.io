/* ============================================================================
   footprintjs.github.io — v3 ecosystem view.

   One data file (ecosystem-views.json) drives the page: the four-beat story
   strip, the two-zone ecosystem map, the project cards, all three copy lenses
   (Product, Technical, Business), and the live npm versions. (The hero's 3D
   solar system reads the same file — see hero-orrery.js.)

   The lens toggle is the page's own thesis in miniature: one record, read
   through the view that answers your question. Nothing but COPY changes between
   lenses — statuses, links, npm names, the map's shape and the cards' order are
   the same evidence in all three.

   The MAP is the design's "two ecosystems, one law" composition with the real
   ecosystem poured in: a law banner on top, two bounded zones, an evidence bar
   underneath, and the edges between them. Two honesty rules shape the copy:

     - the zones are ENGINE and INTERFACE, never "backend/frontend" — the
       engine pair runs in browsers too.
     - "same idea, zero shared code" is stated ONLY on the footprintjs <-> The
       Footprint Trail edge, where it is true. It is never claimed
       ecosystem-wide, because agentfootprint really does build on footprintjs.

   The Footprint Trail is an IDEA node, not a package: dashed border, no npm
   chip, no repo link, and no emission line into the evidence bar.
   ============================================================================ */
(function () {
  'use strict';

  var ICONS = {
    flowchart:
      '<circle cx="6" cy="6" r="2.3"/><circle cx="6" cy="18" r="2.3"/><circle cx="18" cy="12" r="2.3"/><path d="M8 7l8 4M8 17l8-4" stroke-linecap="round"/>',
    agent:
      '<path d="M20 12a8 8 0 1 1-2.3-5.6" stroke-linecap="round"/><path d="M20 4v4h-4" stroke-linecap="round" stroke-linejoin="round"/>',
    capabilities:
      '<circle cx="12" cy="5" r="2.3"/><circle cx="6" cy="19" r="2.3"/><circle cx="18" cy="19" r="2.3"/><path d="M12 7.3v3M12 10.3L6 16.7M12 10.3l6 6.4" stroke-linecap="round"/>',
    trail:
      '<path d="M5 5h5a3 3 0 0 1 3 3v8a3 3 0 0 0 3 3h3" stroke-linecap="round"/><circle cx="5" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><path d="M13 11h4a2 2 0 0 0 2-2V6" stroke-linecap="round"/>',
    chart: '<path d="M5 20V13M12 20V6M19 20v-9" stroke-linecap="round"/>',
    lens: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-5-5" stroke-linecap="round"/>',
    replay:
      '<circle cx="12" cy="12" r="8.5"/><path d="M10.5 8.5l5 3.5-5 3.5z" fill="currentColor" stroke="none"/>'
  };

  var LAYER_GLYPHS = {
    engine:
      '<rect x="6" y="6" width="12" height="12" rx="2.5"/>' +
      '<rect x="10" y="10" width="4" height="4" rx="1"/>' +
      '<path d="M9.5 2.5v3.5M14.5 2.5v3.5M9.5 18v3.5M14.5 18v3.5M2.5 9.5h3.5M2.5 14.5h3.5M18 9.5h3.5M18 14.5h3.5" stroke-linecap="round"/>',
    interface:
      '<rect x="2.5" y="4.5" width="19" height="15" rx="2.5"/>' +
      '<path d="M2.5 9h19"/>' +
      '<path d="M5.6 6.8h.01M8.2 6.8h.01" stroke-linecap="round" stroke-width="1.8"/>'
  };
  var LAYER_WORD = { engine: 'engine', interface: 'interface' };

  /* ── the map, transcribed from the design's composition ─────────────────── */
  var ZONES = [
    {
      id: 'engine', x: 40, y: 96, w: 440, h: 336, tint: 'teal',
      labelX: 60, labelY: 122, capX: 260, capY: 414,
      caption: 'stands alone — no UI required'
    },
    {
      id: 'interface', x: 640, y: 96, w: 440, h: 336, tint: 'purple',
      labelX: 660, labelY: 122, capX: 860, capY: 414,
      caption: 'stands alone — no agent required'
    }
  ];

  var NODES = [
    {
      id: 'footprintjs', card: 'footprintjs', zone: 'engine', tint: 'teal',
      x: 80, y: 130, w: 360, h: 68, fill: 'tint', layer: 'engine',
      name: 'footprintjs', nameSize: 17,
      subs: [{ text: 'flowchart pattern · engine', tone: 'teal', size: 11.5 }]
    },
    {
      id: 'trail', zone: 'interface', tint: 'purple', idea: true,
      x: 680, y: 130, w: 360, h: 68, fill: 'tint',
      name: 'The Footprint Trail', nameSize: 17,
      subs: [{ text: 'trail pattern', tone: 'purple', size: 11.5 }]
    },
    {
      id: 'agentfootprint', card: 'agentfootprint', zone: 'engine', tint: 'teal',
      x: 80, y: 258, w: 360, h: 72, fill: 'card', layer: 'engine',
      name: 'agentfootprint', nameSize: 15.5,
      subs: [{ key: 'agentTag', tone: 'muted', size: 10.5 }]
    },
    {
      id: 'hcifootprint', card: 'hcifootprint', zone: 'interface', tint: 'purple',
      x: 680, y: 258, w: 170, h: 72, fill: 'card', layer: 'interface',
      name: 'hcifootprint', nameSize: 14.5,
      subs: [{ text: 'apps → agent-operable', tone: 'muted', size: 10 }]
    },
    {
      id: 'vizfootprint', card: 'vizfootprint', zone: 'interface', tint: 'purple',
      x: 870, y: 258, w: 170, h: 72, fill: 'card', layer: 'interface',
      name: 'vizfootprint', nameSize: 14.5,
      subs: [
        { text: 'provenance for dashboards', tone: 'muted', size: 10 },
        { text: 'and visual analysis', tone: 'faint', size: 9.5 }
      ]
    }
  ];

  var EDGES = [
    { id: 'fp-af', kind: 'builds', from: 'footprintjs', to: 'agentfootprint',
      d: 'M260 198 L260 254' },
    { id: 'trail-hci', kind: 'builds', from: 'trail', to: 'hcifootprint',
      d: 'M860 198 C860 226 765 224 765 254' },
    { id: 'trail-viz', kind: 'builds', from: 'trail', to: 'vizfootprint',
      d: 'M860 198 C860 226 955 224 955 254' },
    { id: 'shared', kind: 'idea', from: 'footprintjs', to: 'trail',
      d: 'M440 164 L680 164',
      labels: [{ text: 'same idea, zero shared code', x: 560, y: 152, size: 11 }] },
    { id: 'em-fp', kind: 'emit', from: 'footprintjs', to: 'evidence',
      d: 'M80 180 L54 180 L54 470', beam: 4.6 },
    { id: 'em-af', kind: 'emit', from: 'agentfootprint', to: 'evidence',
      d: 'M240 330 L240 470', beam: 3.8 },
    { id: 'em-hci', kind: 'emit', from: 'hcifootprint', to: 'evidence',
      d: 'M765 330 L765 470', beam: 4.2 },
    { id: 'em-viz', kind: 'emit', from: 'vizfootprint', to: 'evidence',
      d: 'M955 330 L955 470', beam: 4.4 },
    { id: 'recall', kind: 'recall', from: 'evidence', to: 'agentfootprint',
      d: 'M70 524 C 2 512 6 330 74 294', beam: 5.2 }
  ];

  /* only the kinds actually drawn get a legend row */
  var EDGE_LEGEND = [
    { kind: 'builds', label: 'builds on' },
    { kind: 'idea', label: 'shared idea' },
    { kind: 'emit', label: 'evidence emission' },
    { kind: 'recall', label: 'recall' }
  ];

  /* the default wording, by kind — a lens may override it (views.<lens>.edgeLegend),
     and anything it leaves out falls back to this */
  var EDGE_LEGEND_DEFAULT = {};
  EDGE_LEGEND.forEach(function (entry) {
    EDGE_LEGEND_DEFAULT[entry.kind] = entry.label;
  });

  var state = {
    data: null,
    view: 'product',
    transitionTimer: null,
    scrollRaf: 0
  };

  function element(tagName, className, text) {
    var node = document.createElement(tagName);
    if (className) node.className = className;
    if (typeof text === 'string') node.textContent = text;
    return node;
  }

  function svgElement(tagName) {
    return document.createElementNS('http://www.w3.org/2000/svg', tagName);
  }

  function setAttrs(node, attrs) {
    Object.keys(attrs).forEach(function (key) {
      node.setAttribute(key, String(attrs[key]));
    });
    return node;
  }

  function svgText(x, y, cls, size, anchor) {
    var text = svgElement('text');
    setAttrs(text, {
      x: x, y: y, class: cls, 'font-size': size, 'text-anchor': anchor || 'middle'
    });
    return text;
  }

  /* ?view= names a lens by its key. Any lens the data file actually carries is
     legal — that is what let "business" join Product and Technical without a
     second list here to keep in sync. An unknown or missing name falls back to
     the file's own default. */
  function getInitialView(data) {
    var requested = new URLSearchParams(window.location.search).get('view');
    if (requested && data.views && data.views[requested]) return requested;
    return data.views && data.views[data.defaultView] ? data.defaultView : 'product';
  }

  /* Product and Technical are load-bearing: the page ships with buttons for them
     and `defaultView` points at one. Every other lens (Business today) is
     OPTIONAL — a browser holding a stale ecosystem-views.json simply loses that
     button instead of erroring, which is why the toggle is synced from the data
     rather than trusted from the markup. */
  function validateData(data) {
    if (!data || !data.views || !Array.isArray(data.nodes)) {
      throw new Error('The ecosystem data is incomplete.');
    }
    ['product', 'technical'].forEach(function (view) {
      if (!data.views[view]) throw new Error('Missing ecosystem view: ' + view);
    });
  }

  function syncToggleOptions(data) {
    document.querySelectorAll('[data-view]').forEach(function (button) {
      var view = data.views[button.dataset.view];
      button.hidden = !view;
      if (view && view.label) button.textContent = view.label;
    });
  }

  function lensButtons() {
    return Array.prototype.filter.call(
      document.querySelectorAll('.lens-toggle [data-view]'),
      function (button) {
        return !button.hidden;
      }
    );
  }

  function nodeById(id) {
    return state.data.nodes.filter(function (node) {
      return node.id === id;
    })[0];
  }

  function layerGlyph(layer, extraClass) {
    var glyph = svgElement('svg');
    setAttrs(glyph, {
      class: 'layer-glyph' + (extraClass ? ' ' + extraClass : ''),
      viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
      'stroke-width': '1.6', role: 'img'
    });
    var title = svgElement('title');
    title.textContent = LAYER_WORD[layer] + ' layer';
    glyph.appendChild(title);
    var shape = svgElement('g');
    shape.innerHTML = LAYER_GLYPHS[layer] || LAYER_GLYPHS.interface;
    glyph.appendChild(shape);
    return glyph;
  }

  /* ── the story strip ────────────────────────────────────────────────────── */
  function renderStory(viewData) {
    var host = document.getElementById('story-beats');
    var closing = document.getElementById('story-closing');
    if (!host || !closing) return;
    var section = host.closest('.story');
    if (!viewData.story || !Array.isArray(viewData.story.beats)) {
      section.hidden = true;
      return;
    }
    section.hidden = false;
    host.innerHTML = '';
    viewData.story.beats.forEach(function (beat, index) {
      var item = element('li', 'beat' + (beat.emphasis ? ' beat-emph' : ''));
      item.appendChild(element('span', 'beat-num', String(index + 1).padStart(2, '0')));
      item.appendChild(element('span', 'beat-label', beat.label));
      item.appendChild(element('p', 'beat-text', beat.text));
      host.appendChild(item);
    });
    closing.textContent = viewData.story.closing;
  }

  /* ── the ecosystem map ──────────────────────────────────────────────────── */
  function marker(id, cls, both) {
    var node = svgElement('marker');
    setAttrs(node, {
      id: id, markerWidth: 9, markerHeight: 9, refX: 7, refY: 4.5,
      orient: both ? 'auto-start-reverse' : 'auto'
    });
    var head = svgElement('path');
    setAttrs(head, { d: 'M0.5 0.5 L8 4.5 L0.5 8.5 Z', class: cls });
    node.appendChild(head);
    return node;
  }

  /* a second copy of a path that sweeps a short lit dash along it */
  function beamOverlay(d, seconds, delay, cls) {
    var beam = svgElement('path');
    setAttrs(beam, {
      d: d, class: cls, fill: 'none', pathLength: 100,
      'stroke-linecap': 'round', 'stroke-dasharray': '6 94'
    });
    beam.style.animation = 'fpBeam ' + seconds + 's linear infinite';
    beam.style.animationDelay = '-' + delay + 's';
    return beam;
  }

  function renderMap() {
    var host = document.getElementById('ecosystem-map');
    if (!host) return;

    var svg = svgElement('svg');
    setAttrs(svg, {
      viewBox: '-40 -6 1160 664', class: 'map-svg', role: 'img',
      'aria-label':
        'Selected core relationships between execution and interaction patterns, with recorded evidence below. The cards list the wider library ecosystem.'
    });

    var defs = svgElement('defs');
    defs.appendChild(marker('mk-solid', 'mk-solid'));
    defs.appendChild(marker('mk-faint', 'mk-faint'));
    defs.appendChild(marker('mk-yellow', 'mk-yellow', true));
    svg.appendChild(defs);

    /* zones ------------------------------------------------------------- */
    ZONES.forEach(function (zone) {
      var group = svgElement('g');
      group.setAttribute('class', 'map-zone tint-' + zone.tint);
      group.dataset.zone = zone.id;
      var box = svgElement('rect');
      setAttrs(box, {
        x: zone.x, y: zone.y, width: zone.w, height: zone.h, rx: 14,
        class: 'map-zone-box'
      });
      group.appendChild(box);
      var label = svgText(zone.labelX, zone.labelY, 'map-zone-label', 13, 'start');
      label.dataset.zoneLabel = zone.id;
      group.appendChild(label);
      var cap = svgText(zone.capX, zone.capY, 'map-zone-cap', 10.5);
      cap.textContent = zone.caption;
      group.appendChild(cap);
      svg.appendChild(group);
    });

    /* the law banner's connectors down into each zone -------------------- */
    [260, 860].forEach(function (x) {
      var link = svgElement('path');
      setAttrs(link, {
        d: 'M' + x + ' 54 L' + x + ' 92', class: 'map-lawlink',
        fill: 'none', 'marker-end': 'url(#mk-faint)'
      });
      svg.appendChild(link);
    });

    /* edges -------------------------------------------------------------- */
    EDGES.forEach(function (edge) {
      var group = svgElement('g');
      group.setAttribute('class', 'map-edge kind-' + edge.kind);
      group.dataset.edge = edge.id;
      group.dataset.from = edge.from;
      group.dataset.to = edge.to;

      var path = svgElement('path');
      var attrs = { d: edge.d, class: 'map-edge-path', fill: 'none' };
      if (edge.kind === 'builds') attrs['marker-end'] = 'url(#mk-solid)';
      if (edge.kind === 'recall') attrs['marker-end'] = 'url(#mk-yellow)';
      setAttrs(path, attrs);
      group.appendChild(path);

      if (edge.beam) {
        group.appendChild(
          beamOverlay(edge.d, edge.beam, edge.beam / 2, 'map-beam kind-' + edge.kind)
        );
      }

      (edge.labels || []).forEach(function (label) {
        var text = svgText(label.x, label.y, 'map-edge-label' +
          (label.strong ? ' strong' : ''), label.size);
        text.textContent = label.text;
        group.appendChild(text);
      });

      if (edge.kind === 'recall') {
        var recallLabel = svgText(-14, 488, 'map-edge-label', 11, 'start');
        recallLabel.setAttribute('transform', 'rotate(-90 -14 488)');
        recallLabel.textContent = 'recall — trace mounted as internal tool';
        group.appendChild(recallLabel);
      }

      svg.appendChild(group);
    });

    /* the law banner — the sun of the solar-system idea ------------------- */
    var law = svgElement('g');
    law.setAttribute('class', 'map-band');
    var lawBox = svgElement('rect');
    setAttrs(lawBox, { x: 40, y: 6, width: 1040, height: 48, rx: 10, class: 'map-band-box' });
    law.appendChild(lawBox);
    var lawBeam = svgElement('path');
    setAttrs(lawBeam, {
      d: 'M50 6 L1070 6', class: 'map-beam kind-band', fill: 'none',
      pathLength: 100, 'stroke-linecap': 'round', 'stroke-dasharray': '5 95'
    });
    lawBeam.style.animation = 'fpBeam 6.5s linear infinite';
    law.appendChild(lawBeam);
    var lawTitle = svgText(560, 30, 'map-band-title', 15);
    lawTitle.textContent = 'One law: every run leaves a trace';
    law.appendChild(lawTitle);
    var lawSub = svgText(560, 46, 'map-band-sub', 10.5);
    lawSub.id = 'map-law-sub';
    law.appendChild(lawSub);
    svg.appendChild(law);

    /* the evidence bar --------------------------------------------------- */
    var bar = svgElement('g');
    bar.setAttribute('class', 'map-band');
    var barBox = svgElement('rect');
    setAttrs(barBox, { x: 40, y: 470, width: 1040, height: 54, rx: 10, class: 'map-band-box' });
    bar.appendChild(barBox);
    var barBeam = svgElement('path');
    setAttrs(barBeam, {
      d: 'M50 516 L1070 516', class: 'map-beam kind-band', fill: 'none',
      pathLength: 100, 'stroke-linecap': 'round', 'stroke-dasharray': '5 95'
    });
    barBeam.style.animation = 'fpBeam 6s linear infinite';
    barBeam.style.animationDelay = '-0.6s';
    bar.appendChild(barBeam);
    var barTitle = svgText(64, 502, 'map-band-title', 15, 'start');
    barTitle.textContent = 'Evidence';
    var barSub = svgElement('tspan');
    barSub.setAttribute('class', 'map-band-sub');
    barSub.setAttribute('dx', '12');
    barSub.setAttribute('font-size', '11.5');
    barSub.id = 'map-evidence-sub';
    barTitle.appendChild(barSub);
    bar.appendChild(barTitle);
    /* where each package's emission lands */
    [54, 240, 765, 955].forEach(function (x) {
      var dot = svgElement('circle');
      setAttrs(dot, { cx: x, cy: 470, r: 3, class: 'map-emit-dot' });
      bar.appendChild(dot);
    });
    svg.appendChild(bar);

    /* nodes on top ------------------------------------------------------- */
    NODES.forEach(function (node) {
      var group = svgElement('g');
      group.setAttribute('class',
        'map-node tint-' + node.tint + (node.idea ? ' is-idea' : ''));
      group.dataset.node = node.id;
      if (node.card) group.dataset.card = node.card;
      setAttrs(group, {
        tabindex: 0,
        role: node.card ? 'link' : 'img',
        'aria-label': node.name + (node.idea ? ' — an idea, not a package' : '')
      });

      var box = svgElement('rect');
      setAttrs(box, {
        x: node.x, y: node.y, width: node.w, height: node.h, rx: 10,
        class: 'map-node-box fill-' + node.fill
      });
      group.appendChild(box);

      var centreX = node.x + node.w / 2;
      var name = svgText(centreX, node.y + 28, 'map-node-name', node.nameSize);
      name.textContent = node.name;
      group.appendChild(name);

      node.subs.forEach(function (sub, index) {
        var text = svgText(centreX, node.y + 50 + index * 15,
          'map-node-sub tone-' + sub.tone, sub.size);
        if (sub.key) text.dataset.subKey = sub.key;
        else text.textContent = sub.text;
        group.appendChild(text);
      });

      /* the layer glyph rides the node's top-right corner */
      if (node.layer) {
        var glyph = svgElement('g');
        setAttrs(glyph, {
          transform: 'translate(' + (node.x + node.w - 26) + ' ' + (node.y + 9) +
            ') scale(0.62)',
          class: 'map-node-glyph', fill: 'none', stroke: 'currentColor',
          'stroke-width': '1.7'
        });
        glyph.innerHTML = LAYER_GLYPHS[node.layer];
        var glyphTitle = svgElement('title');
        glyphTitle.textContent = LAYER_WORD[node.layer] + ' layer';
        glyph.appendChild(glyphTitle);
        group.appendChild(glyph);
      }

      svg.appendChild(group);
    });

    host.innerHTML = '';
    host.appendChild(svg);
    bindMapInteraction(host, svg);
  }

  /* hover / focus: a node lights its own edges, everything else recedes */
  function litFor(nodeId) {
    var lit = { nodes: {}, edges: {} };
    lit.nodes[nodeId] = true;
    EDGES.forEach(function (edge) {
      if (edge.from === nodeId || edge.to === nodeId) {
        lit.edges[edge.id] = true;
        lit.nodes[edge.from] = true;
        lit.nodes[edge.to] = true;
      }
    });
    return lit;
  }

  function applyMapFocus(svg, nodeId) {
    if (!nodeId) {
      svg.classList.remove('dimmed');
      svg.querySelectorAll('.lit, .focus').forEach(function (el) {
        el.classList.remove('lit', 'focus');
      });
      return;
    }
    var lit = litFor(nodeId);
    svg.classList.add('dimmed');
    svg.querySelectorAll('.map-node').forEach(function (el) {
      el.classList.toggle('lit', !!lit.nodes[el.dataset.node]);
      el.classList.toggle('focus', el.dataset.node === nodeId);
    });
    svg.querySelectorAll('.map-edge').forEach(function (el) {
      el.classList.toggle('lit', !!lit.edges[el.dataset.edge]);
    });
  }

  function jumpToCard(cardId) {
    var card = document.querySelector('[data-node-id="' + cardId + '"]');
    if (!card) return;
    window.scrollTo({
      top: card.getBoundingClientRect().top + window.scrollY - 84,
      behavior: 'smooth'
    });
    card.classList.add('flash');
    window.setTimeout(function () {
      card.classList.remove('flash');
    }, 1200);
  }

  function bindMapInteraction(host, svg) {
    function nodeFrom(event) {
      return event.target.closest ? event.target.closest('.map-node') : null;
    }
    host.addEventListener('mouseover', function (event) {
      var node = nodeFrom(event);
      if (node) applyMapFocus(svg, node.dataset.node);
    });
    host.addEventListener('mouseleave', function () {
      applyMapFocus(svg, null);
    });
    host.addEventListener('focusin', function (event) {
      var node = nodeFrom(event);
      if (node) applyMapFocus(svg, node.dataset.node);
    });
    host.addEventListener('focusout', function () {
      applyMapFocus(svg, null);
    });
    host.addEventListener('click', function (event) {
      var node = nodeFrom(event);
      if (node && node.dataset.card) jumpToCard(node.dataset.card);
    });
    host.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      var node = nodeFrom(event);
      if (!node || !node.dataset.card) return;
      event.preventDefault();
      jumpToCard(node.dataset.card);
    });
  }

  function renderEdgeLegend() {
    var legend = document.getElementById('edge-legend');
    if (!legend) return;
    legend.innerHTML = '';
    EDGE_LEGEND.forEach(function (entry) {
      var item = element('span', 'edge-legend-item kind-' + entry.kind);
      item.dataset.edgeKind = entry.kind;
      var swatch = svgElement('svg');
      setAttrs(swatch, { viewBox: '0 0 30 12', class: 'edge-swatch', 'aria-hidden': 'true' });
      var line = svgElement('path');
      setAttrs(line, {
        d: entry.kind === 'recall' ? 'M2 11 C2 3 18 1 27 5' : 'M1 6 L27 6',
        fill: 'none', class: 'edge-swatch-line'
      });
      swatch.appendChild(line);
      item.appendChild(swatch);
      item.appendChild(element('span', 'edge-legend-label', entry.label));
      legend.appendChild(item);
    });
  }

  function renderLayerLegend() {
    var legend = document.getElementById('layer-legend');
    if (!legend) return;
    legend.innerHTML = '';
    ['engine', 'interface'].forEach(function (layer) {
      var item = element('span', 'layer-legend-item');
      item.dataset.layer = layer;
      item.appendChild(layerGlyph(layer));
      item.appendChild(element('span', 'layer-legend-label'));
      legend.appendChild(item);
    });
  }

  /* ── the project cards: the full inventory ──────────────────────────────── */
  function createIcon(iconName) {
    var icon = svgElement('svg');
    setAttrs(icon, {
      class: 'card-ic', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
      'stroke-width': '1.9', 'aria-hidden': 'true'
    });
    icon.innerHTML = ICONS[iconName] || ICONS.flowchart;
    return icon;
  }

  function createCard(node) {
    var card = element('article', 'card ecosystem-card');
    card.dataset.nodeId = node.id;
    card.id = 'card-' + node.id;
    card.style.setProperty('--accent', node.accent || '#ffc700');

    var header = element('header', 'card-hd');
    var nameWrap = element('div', 'card-name-wrap');
    var nameRow = element('div', 'card-name-row');
    nameRow.appendChild(element('h3', '', node.name));
    if (node.layer) nameRow.appendChild(layerGlyph(node.layer, 'card-layer'));
    nameWrap.appendChild(nameRow);

    if (node.packageName || node.status) {
      var meta = element('div', 'card-meta');
      if (node.packageName) meta.appendChild(element('span', 'card-package', node.packageName));
      if (node.status) meta.appendChild(element('span', 'card-status', node.status));
      nameWrap.appendChild(meta);
    }

    header.appendChild(createIcon(node.icon));
    header.appendChild(nameWrap);

    var copy = element('div', 'card-copy view-copy');
    copy.appendChild(element('span', 'card-tag view-copy'));
    copy.appendChild(element('h4', 'card-title'));
    copy.appendChild(element('p', 'card-desc'));

    var links = element('nav', 'card-links');
    links.setAttribute('aria-label', node.name + ' links');
    (node.links || []).forEach(function (link, index) {
      var anchor = element('a', link.npm ? 'lk-npm' : '');
      anchor.href = link.href;
      anchor.target = '_blank';
      anchor.rel = 'noreferrer';
      anchor.dataset.linkIndex = String(index);
      links.appendChild(anchor);
    });

    card.appendChild(header);
    card.appendChild(copy);
    card.appendChild(links);
    return card;
  }

  /* The inventory groups foundations, application libraries, interaction and viewers: what
     runs behind the scenes, what your users touch, and the instruments you
     watch a run through. The grouping is DATA — each node carries `group`, and
     the order of the groups is simply the order they first appear in the node
     list, so the JSON stays the single source of truth and nothing here has to
     be kept in sync by hand. `layer` is left alone: it says which glyph a
     project wears (engine or interface), which is a different question from
     which cluster it sits in — the viewers are interface-layer
     packages that belong in the monitoring cluster. */
  function groupOrder(nodes) {
    var seen = {};
    var order = [];
    nodes.forEach(function (node) {
      var key = node.group || '';
      if (seen[key]) return;
      seen[key] = true;
      order.push(key);
    });
    return order;
  }

  function renderCards(data) {
    var host = document.getElementById('ecosystem-cards');
    host.innerHTML = '';
    groupOrder(data.nodes).forEach(function (key) {
      var section = element('section', 'card-group');
      /* a node with no group (a stale data file) still renders — it just gets
         no header, rather than an empty one */
      if (key) {
        section.dataset.group = key;
        var head = element('div', 'card-group-hd');
        var title = element('h3', 'card-group-title view-copy');
        title.id = 'card-group-' + key;
        title.dataset.groupLabel = key;
        head.appendChild(title);
        head.appendChild(element('span', 'card-group-rule'));
        section.setAttribute('aria-labelledby', title.id);
        section.appendChild(head);
      }
      var grid = element('div', 'cards-grid');
      data.nodes.forEach(function (node) {
        if ((node.group || '') === key) grid.appendChild(createCard(node));
      });
      section.appendChild(grid);
      host.appendChild(section);
    });
  }

  function setLinkLabel(anchor, label) {
    anchor.textContent = label;
    if (anchor.dataset.npmVersion) {
      var version = element('span', 'lk-ver', 'v' + anchor.dataset.npmVersion);
      anchor.appendChild(document.createTextNode(' '));
      anchor.appendChild(version);
    }
  }

  function updateNode(node, view) {
    var card = document.querySelector('[data-node-id="' + node.id + '"]');
    var copy = node.views[view];
    if (!card || !copy) return;
    card.querySelector('.card-tag').textContent = copy.tag;
    card.querySelector('.card-title').textContent = copy.title;
    card.querySelector('.card-desc').textContent = copy.description;
    (node.links || []).forEach(function (link, index) {
      var anchor = card.querySelector('[data-link-index="' + index + '"]');
      if (!anchor) return;
      setLinkLabel(anchor,
        link[view + 'Label'] || link.productLabel || link.technicalLabel || 'Open');
    });
  }

  /* every lens-aware write goes through this: a missing string leaves the copy
     that is already on the page rather than blanking it */
  function setCopy(selector, text) {
    var target = document.querySelector(selector);
    if (target && text) target.textContent = text;
  }

  function renderDevelopment(copy) {
    if (!copy) return;
    setCopy('#development-heading', copy.heading);
    setCopy('#development-intro', copy.intro);
    setCopy('#development-note', copy.note);
    var list = document.getElementById('development-steps');
    if (!list || !Array.isArray(copy.steps) || !copy.steps.length) return;
    list.textContent = '';
    copy.steps.forEach(function (step) {
      var item = element('li');
      item.appendChild(element('h3', '', step.title));
      item.appendChild(element('p', '', step.description));
      list.appendChild(item);
    });
  }

  function applyView(view, updateUrl) {
    if (!state.data || !state.data.views[view]) return;
    var viewData = state.data.views[view];
    state.view = view;
    document.documentElement.dataset.ecosystemView = view;

    /* optional blocks are read defensively: a browser holding a stale copy of
       ecosystem-views.json should degrade quietly, never blank the page */
    var hero = viewData.hero || {};
    var idea = viewData.idea || {};
    setCopy('.hero h1', hero.title);
    setCopy('.hero-sub', hero.subtitle);
    setCopy('.hero-quote', idea.quote);
    setCopy('.graph-lead', idea.lead);

    renderStory(viewData);
    renderDevelopment(viewData.development);
    setCopy('.map-scope', viewData.mapNote);

    /* the caption under the map: a lens may speak it its own way, otherwise the
       one shared line from solarSystem stands */
    setCopy('.solar-caption',
      viewData.solarCaption || (state.data.solarSystem || {}).caption);

    var map = viewData.map || {};
    setCopy('.graph-tag', map.heading || (viewData.graph || {}).label);
    var lawSub = document.getElementById('map-law-sub');
    if (lawSub) lawSub.textContent = map.lawSubline || '';
    var evidenceSub = document.getElementById('map-evidence-sub');
    if (evidenceSub) evidenceSub.textContent = map.evidenceSubline || '';
    document.querySelectorAll('[data-zone-label]').forEach(function (label) {
      label.textContent = (map.zones || {})[label.dataset.zoneLabel] || '';
    });
    document.querySelectorAll('[data-sub-key]').forEach(function (text) {
      text.textContent = map[text.dataset.subKey] || '';
    });

    /* the card-group headers speak the lens: "Engine" in the technical view,
       "works behind the scenes" in the product one. A file without the block
       hides the headers instead of showing blank ones. */
    var groups = viewData.groups || {};
    document.querySelectorAll('[data-group-label]').forEach(function (label) {
      var text = groups[label.dataset.groupLabel] || '';
      label.textContent = text;
      var head = label.parentNode;
      if (head) head.hidden = !text;
    });

    var layers = viewData.layers || {};
    document.querySelectorAll('.layer-legend-item').forEach(function (item) {
      var label = item.querySelector('.layer-legend-label');
      if (label) label.textContent = layers[item.dataset.layer] || LAYER_WORD[item.dataset.layer];
    });

    var edgeLegend = viewData.edgeLegend || {};
    document.querySelectorAll('[data-edge-kind]').forEach(function (item) {
      var label = item.querySelector('.edge-legend-label');
      if (label) {
        label.textContent =
          edgeLegend[item.dataset.edgeKind] || EDGE_LEGEND_DEFAULT[item.dataset.edgeKind];
      }
    });

    state.data.nodes.forEach(function (node) {
      updateNode(node, view);
    });

    document.querySelectorAll('[data-view]').forEach(function (button) {
      var active = button.dataset.view === view;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    if (updateUrl) {
      var url = new URL(window.location.href);
      url.searchParams.set('view', view);
      window.history.replaceState({ ecosystemView: view }, '', url);
    }
  }

  function switchView(view, updateUrl) {
    if (view === state.view || !state.data.views[view]) return;
    window.clearTimeout(state.transitionTimer);
    document.body.classList.add('ecosystem-changing');
    state.transitionTimer = window.setTimeout(function () {
      applyView(view, updateUrl);
      window.requestAnimationFrame(function () {
        document.body.classList.remove('ecosystem-changing');
      });
    }, 90);
  }

  /* ── live npm versions ──────────────────────────────────────────────────── */
  function populateNpmVersions() {
    document.querySelectorAll('.lk-npm').forEach(function (anchor) {
      var match = anchor.href.match(/\/package\/([^/?#]+)/);
      if (!match) return;
      fetch('https://registry.npmjs.org/' + match[1] + '/latest')
        .then(function (response) {
          return response.ok ? response.json() : null;
        })
        .then(function (packageData) {
          if (!packageData || !packageData.version) return;
          anchor.dataset.npmVersion = packageData.version;
          var node = nodeById(anchor.closest('.ecosystem-card').dataset.nodeId);
          if (!node) return;
          var link = node.links[Number(anchor.dataset.linkIndex)];
          /* the same fallback chain updateNode uses: a lens that does not
             relabel its links (Business does not — link wording is identical
             across lenses by design) still gets the product wording, not a
             generic one */
          setLinkLabel(anchor,
            link[state.view + 'Label'] || link.productLabel || link.technicalLabel || 'npm');
        })
        .catch(function () {});
    });
  }

  /* ── the scroll trace: a line that draws itself as you read ─────────────── */
  var ZONE_IDS = ['hero', 'story', 'build', 'map', 'writing'];

  function updateTrace() {
    if (state.scrollRaf) return;
    state.scrollRaf = window.requestAnimationFrame(function () {
      state.scrollRaf = 0;
      var viewportHeight = window.innerHeight;
      var wrap = document.getElementById('traceWrap');
      if (wrap) {
        var rect = wrap.getBoundingClientRect();
        var progress = Math.max(0, Math.min(1,
          (viewportHeight * 0.78 - rect.top) / Math.max(1, rect.height)));
        var line = wrap.querySelector('.trace-line');
        var dot = wrap.querySelector('.trace-dot');
        if (line) line.style.transform = 'scaleY(' + progress + ')';
        if (dot) {
          dot.style.transform =
            'translateY(' + Math.max(0, Math.round(progress * rect.height) - 5) + 'px)';
          dot.style.opacity = progress > 0.002 && progress < 0.998 ? '1' : '0';
        }
      }

      var zone = -1;
      ZONE_IDS.forEach(function (id, index) {
        var section = document.getElementById(id);
        if (section && section.getBoundingClientRect().top < viewportHeight * 0.6) zone = index;
      });
      document.querySelectorAll('.zone').forEach(function (bar, index) {
        bar.classList.toggle('on', index === zone);
      });
      document.querySelectorAll('.eyebrow-dot').forEach(function (dot, index) {
        dot.classList.toggle('on', zone >= index + 2);
      });
    });
  }

  function bindControls() {
    document.querySelectorAll('[data-view]').forEach(function (button) {
      button.addEventListener('click', function () {
        switchView(button.dataset.view, true);
      });
    });

    /* Three options make the arrow keys worth having: Tab still steps through
       each button (they are real buttons, so Enter and Space already work), and
       Left/Right/Home/End now walk the group the way a segmented control does —
       moving focus and the lens together. */
    var group = document.querySelector('.lens-toggle');
    if (group) {
      group.addEventListener('keydown', function (event) {
        var step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
        var isEdge = event.key === 'Home' || event.key === 'End';
        if (!step && !isEdge) return;
        var buttons = lensButtons();
        if (buttons.length < 2) return;
        var current = buttons.indexOf(document.activeElement);
        if (current < 0) return;
        event.preventDefault();
        var next = isEdge
          ? (event.key === 'Home' ? 0 : buttons.length - 1)
          : (current + step + buttons.length) % buttons.length;
        buttons[next].focus();
        switchView(buttons[next].dataset.view, true);
      });
    }
    window.addEventListener('popstate', function () {
      switchView(getInitialView(state.data), false);
    });
    window.addEventListener('scroll', updateTrace, { passive: true });
    window.addEventListener('resize', updateTrace, { passive: true });
  }

  function showError(error) {
    var cards = document.getElementById('ecosystem-cards');
    if (cards) {
      cards.classList.add('gb-error');
      cards.textContent = 'The ecosystem view could not load. Please refresh the page.';
    }
    console.error(error);
  }

  fetch('./ecosystem-views.json', { cache: 'no-cache' })
    .then(function (response) {
      if (!response.ok) throw new Error('Unable to load ecosystem-views.json');
      return response.json();
    })
    .then(function (data) {
      validateData(data);
      state.data = data;
      state.view = getInitialView(data);
      syncToggleOptions(data);
      renderCards(data);
      renderMap();
      renderEdgeLegend();
      renderLayerLegend();
      applyView(state.view, false);
      bindControls();
      populateNpmVersions();
      updateTrace();
    })
    .catch(showError);
})();
