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
    chart:
      '<path d="M5 20V13M12 20V6M19 20v-9" stroke-linecap="round"/>',
    lens:
      '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-5-5" stroke-linecap="round"/>',
    replay:
      '<circle cx="12" cy="12" r="8.5"/><path d="M10.5 8.5l5 3.5-5 3.5z" fill="currentColor" stroke="none"/>'
  };

  var state = {
    data: null,
    view: 'product',
    edgeLayer: null,
    edgeLabels: [],
    resizeObserver: null,
    transitionTimer: null
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

  function getInitialView(data) {
    var requested = new URLSearchParams(window.location.search).get('view');
    return requested === 'technical' || requested === 'product'
      ? requested
      : data.defaultView || 'product';
  }

  function validateData(data) {
    if (!data || !data.views || !Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
      throw new Error('The ecosystem data is incomplete.');
    }
    ['product', 'technical'].forEach(function (view) {
      if (!data.views[view]) throw new Error('Missing ecosystem view: ' + view);
    });
  }

  function createIcon(iconName) {
    var icon = svgElement('svg');
    icon.setAttribute('class', 'card-ic');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('fill', 'none');
    icon.setAttribute('stroke', 'currentColor');
    icon.setAttribute('stroke-width', '1.9');
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = ICONS[iconName] || ICONS.flowchart;
    return icon;
  }

  function createCard(node) {
    var card = element('article', 'card ecosystem-card');
    card.dataset.nodeId = node.id;
    card.style.setProperty('--accent', node.accent || '#ffc700');

    var header = element('header', 'card-hd');
    var nameWrap = element('div', 'card-name-wrap');
    nameWrap.appendChild(element('h3', '', node.name));

    if (node.packageName || node.status) {
      var meta = element('div', 'card-meta');
      if (node.packageName) meta.appendChild(element('span', 'card-package', node.packageName));
      if (node.status) meta.appendChild(element('span', 'card-status', node.status));
      nameWrap.appendChild(meta);
    }

    header.appendChild(createIcon(node.icon));
    header.appendChild(nameWrap);
    header.appendChild(element('span', 'card-tag view-copy'));

    var copy = element('div', 'card-copy view-copy');
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

  function createEdgeSvg() {
    var svg = svgElement('svg');
    svg.setAttribute('class', 'gb-edges');
    svg.setAttribute('aria-hidden', 'true');

    var defs = svgElement('defs');
    ['dependency', 'consumer', 'principle'].forEach(function (type) {
      var marker = svgElement('marker');
      marker.setAttribute('id', 'gb-arrow-' + type);
      marker.setAttribute('markerWidth', '9');
      marker.setAttribute('markerHeight', '9');
      marker.setAttribute('refX', '5.5');
      marker.setAttribute('refY', '3');
      marker.setAttribute('orient', 'auto');
      marker.setAttribute('markerUnits', 'userSpaceOnUse');
      var arrow = svgElement('path');
      arrow.setAttribute('d', 'M0 0 L7 3 L0 6 Z');
      arrow.setAttribute('class', 'edge-' + type);
      marker.appendChild(arrow);
      defs.appendChild(marker);
    });

    state.edgeLayer = svgElement('g');
    state.edgeLayer.setAttribute('class', 'gb-edge-paths');
    svg.appendChild(defs);
    svg.appendChild(state.edgeLayer);
    return svg;
  }

  function renderGraph(data) {
    var graph = document.getElementById('ecosystem-graph');
    graph.innerHTML = '';
    graph.appendChild(createEdgeSvg());

    [1, 2, 3].forEach(function (tierNumber) {
      var tier = element('div', 'gb-tier gb-tier-' + tierNumber);
      tier.dataset.tier = String(tierNumber);
      data.nodes
        .filter(function (node) { return node.tier === tierNumber; })
        .forEach(function (node) { tier.appendChild(createCard(node)); });
      graph.appendChild(tier);
    });

    state.edgeLabels = data.edges.map(function (edge, index) {
      var label = element('span', 'gb-elbl edge-' + edge.type + ' view-copy');
      label.dataset.edgeIndex = String(index);
      graph.appendChild(label);
      return label;
    });

    if ('ResizeObserver' in window) {
      state.resizeObserver = new ResizeObserver(drawEdges);
      state.resizeObserver.observe(graph);
    }
    window.addEventListener('resize', drawEdges);
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
      setLinkLabel(anchor, link[view + 'Label'] || link.productLabel || link.technicalLabel || 'Open');
    });
  }

  function updateIdea(viewData) {
    document.querySelector('.idea-eyebrow').textContent = viewData.idea.eyebrow;
    document.querySelector('.idea-lead').textContent = viewData.idea.lead;
    document.querySelector('.idea-quote').textContent = viewData.idea.quote;
    document.querySelectorAll('.idea-step').forEach(function (step, index) {
      var stepData = viewData.idea.steps[index];
      if (!stepData) return;
      step.querySelector('b').textContent = stepData.title;
      step.querySelector('small').textContent = stepData.description;
    });
  }

  function updateLegend(viewData) {
    var legend = document.getElementById('ecosystem-legend');
    Object.keys(viewData.graph.legend).forEach(function (type) {
      var label = legend.querySelector('[data-edge-type="' + type + '"] .edge-legend-label');
      if (label) label.textContent = viewData.graph.legend[type];
    });
  }

  function applyView(view, updateUrl) {
    if (!state.data || !state.data.views[view]) return;
    var viewData = state.data.views[view];
    state.view = view;
    document.documentElement.dataset.ecosystemView = view;

    document.querySelector('.hero h1').textContent = viewData.hero.title;
    document.querySelector('.hero-sub').textContent = viewData.hero.subtitle;
    updateIdea(viewData);
    document.querySelector('.graph-tag').textContent = viewData.graph.label;
    updateLegend(viewData);

    state.data.nodes.forEach(function (node) { updateNode(node, view); });
    state.data.edges.forEach(function (edge, index) {
      state.edgeLabels[index].textContent = edge.views[view];
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

  function roundedPath(points, radius) {
    if (points.length < 2) return '';
    var path = 'M' + points[0][0] + ' ' + points[0][1];
    for (var index = 1; index < points.length - 1; index += 1) {
      var previous = points[index - 1];
      var current = points[index];
      var next = points[index + 1];
      var incoming = Math.hypot(current[0] - previous[0], current[1] - previous[1]);
      var outgoing = Math.hypot(next[0] - current[0], next[1] - current[1]);
      var corner = Math.min(radius, incoming / 2, outgoing / 2);
      var beforeX = current[0] + ((previous[0] - current[0]) / incoming) * corner;
      var beforeY = current[1] + ((previous[1] - current[1]) / incoming) * corner;
      var afterX = current[0] + ((next[0] - current[0]) / outgoing) * corner;
      var afterY = current[1] + ((next[1] - current[1]) / outgoing) * corner;
      path += ' L' + beforeX + ' ' + beforeY;
      path += ' Q' + current[0] + ' ' + current[1] + ' ' + afterX + ' ' + afterY;
    }
    var last = points[points.length - 1];
    return path + ' L' + last[0] + ' ' + last[1];
  }

  function drawEdges() {
    var graph = document.getElementById('ecosystem-graph');
    if (!state.data || !graph || !state.edgeLayer || window.innerWidth <= 760) return;
    var graphRect = graph.getBoundingClientRect();
    if (!graphRect.width || !graphRect.height) return;
    var tierTwo = graph.querySelector('.gb-tier-2');
    var tierTwoRect = tierTwo.getBoundingClientRect();
    state.edgeLayer.textContent = '';
    graph.querySelector('.gb-edges').setAttribute(
      'viewBox',
      '0 0 ' + graphRect.width + ' ' + graphRect.height
    );

    state.data.edges.forEach(function (edge, index) {
      var parent = graph.querySelector('[data-node-id="' + edge.from + '"]');
      var child = graph.querySelector('[data-node-id="' + edge.to + '"]');
      if (!parent || !child) return;
      var parentRect = parent.getBoundingClientRect();
      var childRect = child.getBoundingClientRect();
      var siblings = state.data.edges.filter(function (candidate) { return candidate.from === edge.from; });
      var siblingIndex = siblings.indexOf(edge);
      var spread = (siblingIndex - (siblings.length - 1) / 2) * 22;
      var startX = parentRect.left - graphRect.left + parentRect.width / 2 + spread;
      var startY = parentRect.bottom - graphRect.top + 2;
      var endX = childRect.left - graphRect.left + childRect.width / 2;
      var endY = childRect.top - graphRect.top - 7;
      var points;
      var labelX;
      var labelY;

      if (edge.route === 'outer-left') {
        var upperTurn = (parentRect.bottom + tierTwoRect.top) / 2 - graphRect.top;
        var lowerTurn = (tierTwoRect.bottom + childRect.top) / 2 - graphRect.top;
        var outerX = 8;
        points = [
          [startX, startY],
          [startX, upperTurn],
          [outerX, upperTurn],
          [outerX, lowerTurn],
          [endX, lowerTurn],
          [endX, endY]
        ];
        labelX = outerX;
        labelY = (upperTurn + lowerTurn) / 2;
      } else {
        var turnY = (startY + endY) / 2;
        points = Math.abs(startX - endX) < 8
          ? [[startX, startY], [endX, endY]]
          : [[startX, startY], [startX, turnY], [endX, turnY], [endX, endY]];
        labelX = Math.abs(startX - endX) < 8 ? startX : (startX + endX) / 2;
        labelY = turnY;
      }

      var path = svgElement('path');
      path.setAttribute('d', roundedPath(points, 16));
      path.setAttribute('class', 'edge-' + edge.type);
      path.setAttribute('marker-end', 'url(#gb-arrow-' + edge.type + ')');
      state.edgeLayer.appendChild(path);

      var label = state.edgeLabels[index];
      label.style.left = labelX + 'px';
      label.style.top = labelY + 'px';
    });
  }

  function populateNpmVersions() {
    document.querySelectorAll('.lk-npm').forEach(function (anchor) {
      var match = anchor.href.match(/\/package\/([^/?#]+)/);
      if (!match) return;
      fetch('https://registry.npmjs.org/' + match[1] + '/latest')
        .then(function (response) { return response.ok ? response.json() : null; })
        .then(function (packageData) {
          if (!packageData || !packageData.version) return;
          anchor.dataset.npmVersion = packageData.version;
          var node = state.data.nodes.find(function (candidate) {
            return candidate.id === anchor.closest('.ecosystem-card').dataset.nodeId;
          });
          var link = node.links[Number(anchor.dataset.linkIndex)];
          setLinkLabel(anchor, link[state.view + 'Label'] || 'npm');
        })
        .catch(function () {});
    });
  }

  function bindControls() {
    document.querySelectorAll('[data-view]').forEach(function (button) {
      button.addEventListener('click', function () {
        switchView(button.dataset.view, true);
      });
    });
    window.addEventListener('popstate', function () {
      switchView(getInitialView(state.data), false);
    });
  }

  function showError(error) {
    var graph = document.getElementById('ecosystem-graph');
    graph.classList.add('gb-error');
    graph.textContent = 'The ecosystem view could not load. Please refresh the page.';
    console.error(error);
  }

  fetch('./ecosystem-views.json')
    .then(function (response) {
      if (!response.ok) throw new Error('Unable to load ecosystem-views.json');
      return response.json();
    })
    .then(function (data) {
      validateData(data);
      state.data = data;
      state.view = getInitialView(data);
      renderGraph(data);
      applyView(state.view, false);
      bindControls();
      populateNpmVersions();
      drawEdges();
      window.addEventListener('load', drawEdges);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawEdges);
      window.setTimeout(drawEdges, 150);
      window.setTimeout(drawEdges, 700);
    })
    .catch(showError);
})();
