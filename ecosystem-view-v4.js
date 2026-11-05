/* ============================================================================
   footprintjs.github.io — everything on the page that is not the film.

   One data file (ecosystem-views.json) drives the words: the hero, the film's
   captions and labels (film.js reads those), the library tiles, the working loop
   and the limits line. The view switch is the page's own thesis in miniature:
   one record, read through the view that answers your question. Only WORDS change
   between views. Statuses, links, npm names and order are the same in all three.
   ============================================================================ */
(function () {
  'use strict';

  /* every library gets its own glyph, drawn on one 24px grid */
  var LENS = '<circle cx="10.5" cy="10.5" r="7"/><path d="m20.5 20.5-5-5" stroke-linecap="round"/>';
  var ICONS = {
    flowchart: '<circle cx="6" cy="6" r="2.3"/><circle cx="6" cy="18" r="2.3"/><circle cx="18" cy="12" r="2.3"/><path d="M8 7l8 4M8 17l8-4" stroke-linecap="round"/>',
    trace: '<circle cx="5" cy="18" r="2"/><circle cx="19" cy="6" r="2"/><path d="M7 18h4a3 3 0 0 0 3-3V9a3 3 0 0 1 3-3" stroke-linecap="round"/><path d="M9.6 15.4 7 18l2.6 2.6" stroke-linecap="round" stroke-linejoin="round"/>',
    agent: '<path d="M20 12a8 8 0 1 1-2.3-5.6" stroke-linecap="round"/><path d="M20 4v4h-4" stroke-linecap="round" stroke-linejoin="round"/>',
    pipe: '<path d="M4 6h16l-6 7v5l-4 2v-7z" stroke-linejoin="round"/>',
    neuron: '<circle cx="5" cy="7" r="2"/><circle cx="5" cy="17" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19.5" cy="12" r="2"/><path d="M6.8 8.2 10.4 11M6.8 15.8l3.6-2.8M14 12h3.5" stroke-linecap="round"/>',
    blueprint: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h16M10 10v10"/>',
    shop: '<path d="M4 10 5.5 4h13L20 10" stroke-linejoin="round"/><path d="M5 10v10h14V10"/><path d="M4 10a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0"/><path d="M10 20v-5h4v5"/>',
    reel: '<rect x="3.5" y="5" width="17" height="14" rx="2"/><path d="M8 5v14M16 5v14M3.5 9.7H8M3.5 14.3H8M16 9.7h4.5M16 14.3h4.5"/>',
    pointer: '<path d="M6 4l12 7-5 1.6L10.8 18z" stroke-linejoin="round"/><path d="m13.4 13.4 4.4 5" stroke-linecap="round"/>',
    branchchart: '<path d="M4 4v16h16" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 16c3 0 3-6 6-6s3-3 6-3" stroke-linecap="round"/><path d="M13 10c2 .6 3 3 6 3" stroke-linecap="round"/>',
    stitch: '<path d="M4 7h7M4 12h4M4 17h7" stroke-linecap="round"/><path d="M14.5 7c4.4 0 4.4 5 0 5" stroke-linecap="round"/><path d="M15 17h5" stroke-linecap="round" stroke-dasharray="1.5 3"/>',
    lensflow: LENS + '<path d="M8 8h5M8 8v5M8 13h2.6" stroke-linecap="round"/>',
    lenswhy: LENS + '<path d="M8.5 8.8a2 2 0 1 1 3 1.8c-.7.4-1 .8-1 1.4" stroke-linecap="round"/><path d="M10.5 13.9h.01" stroke-linecap="round" stroke-width="2.2"/>',
    lensstory: LENS + '<path d="M9 7.8l4.2 2.7L9 13.2z" fill="currentColor" stroke="none"/>',
    slides: '<rect x="3.5" y="5" width="13.5" height="10.5" rx="1.6"/><path d="M7 19h12a1.5 1.5 0 0 0 1.5-1.5V9" stroke-linecap="round"/>',
    assertions: '<path d="M4 5h10v7.5H8.4L4 16z" stroke-linejoin="round"/><path d="M17 9.5h3.5V19l-3.4-2.6H10.5v-1" stroke-linejoin="round" stroke-linecap="round"/>'
  };

  var state = { data: null, view: null };

  function element(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  var AGENT_BRIEF = [
    'footprintjs is a family of open-source TypeScript libraries for execution provenance.',
    'They record the steps, state and decisions behind a result as connected notes, so people and coding agents can walk back from it, replay it and audit it.',
    'A record supports an investigation. It does not by itself prove correctness or the cause of an outside event.',
    '',
    'Library list, written for coding agents: https://footprintjs.github.io/llms.txt',
    'A worked example: https://github.com/footprintjs/footPrint#one-workflow-one-recorded-investigation',
    'Source: https://github.com/footprintjs'
  ].join('\n');

  function setText(id, text) {
    var node = document.getElementById(id);
    if (node && text) node.textContent = text;
  }
  /* a headline arrives word by word */
  function setWords(host, text) {
    if (!host) return;
    host.textContent = '';
    String(text).split(' ').forEach(function (word, i) {
      var outer = element('span', 'w');
      var inner = element('span', '', word);
      inner.style.setProperty('--i', i);
      outer.appendChild(inner);
      host.appendChild(outer);
      host.appendChild(document.createTextNode(' '));
    });
  }
  function initialView(data) {
    var asked = new URLSearchParams(window.location.search).get('view');
    return asked && data.views[asked] ? asked : data.defaultView;
  }

  /* ── library tiles: a name, a promise and links. The detail opens on demand. ── */
  function createTile(node) {
    var tile = element('article', 'lib');
    tile.id = 'card-' + node.id;
    tile.dataset.nodeId = node.id;
    tile.dataset.group = node.group;

    var details = element('details', 'lib-details');
    var summary = element('summary', 'lib-summary');

    var icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('class', 'lib-icon');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('fill', 'none');
    icon.setAttribute('stroke', 'currentColor');
    icon.setAttribute('stroke-width', '1.9');
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = ICONS[node.icon] || ICONS.flowchart;

    var head = element('div', 'lib-head');
    var nameRow = element('div', 'lib-name-row');
    nameRow.appendChild(element('h5', 'lib-name', node.name));
    if (node.status) nameRow.appendChild(element('span', 'lib-status', node.status));
    head.appendChild(nameRow);
    head.appendChild(element('p', 'lib-title'));

    summary.appendChild(icon);
    summary.appendChild(head);
    summary.appendChild(element('span', 'lib-more'));
    details.appendChild(summary);

    var body = element('div', 'lib-body');
    if (node.packageName) body.appendChild(element('code', 'lib-package', node.packageName));
    body.appendChild(element('p', 'lib-desc'));
    details.appendChild(body);
    tile.appendChild(details);

    if (node.links && node.links.length) {
      var links = element('nav', 'lib-links');
      links.setAttribute('aria-label', node.name + ' links');
      node.links.forEach(function (link, index) {
        var anchor = element('a', link.npm ? 'lk-npm' : '');
        anchor.href = link.href;
        anchor.target = '_blank';
        anchor.rel = 'noreferrer';
        anchor.dataset.linkIndex = String(index);
        links.appendChild(anchor);
      });
      tile.appendChild(links);
    }
    return tile;
  }

  function renderTiles(data) {
    var host = document.getElementById('ecosystem-cards');
    host.innerHTML = '';
    var lastCategory = null;
    data.groupOrder.forEach(function (key) {
      var category = (data.groupCategory || {})[key] || null;
      if (category && category !== lastCategory) {
        var band = element('div', 'libs-cat');
        band.dataset.category = category;
        band.appendChild(element('h3', 'libs-cat-title'));
        band.appendChild(element('p', 'libs-cat-note'));
        host.appendChild(band);
      }
      lastCategory = category;
      var section = element('section', 'libs-group');
      section.dataset.group = key;
      section.setAttribute('aria-labelledby', 'group-' + key);
      var head = element('header', 'libs-group-head');
      var title = element('h4', 'libs-group-title');
      title.id = 'group-' + key;
      title.dataset.groupTitle = key;
      head.appendChild(title);
      var note = element('p', 'libs-group-note');
      note.dataset.groupNote = key;
      head.appendChild(note);
      section.appendChild(head);
      var grid = element('div', 'libs-grid');
      data.nodes.forEach(function (node) {
        if (node.group === key) grid.appendChild(createTile(node));
      });
      section.appendChild(grid);
      host.appendChild(section);
    });
  }

  function setLinkLabel(anchor, label) {
    anchor.textContent = label;
    if (anchor.dataset.npmVersion) {
      anchor.appendChild(document.createTextNode(' '));
      anchor.appendChild(element('span', 'lk-ver', 'v' + anchor.dataset.npmVersion));
    }
  }
  function linkLabel(link, view) {
    return link[view + 'Label'] || link.productLabel || link.technicalLabel || 'Open';
  }
  function updateTile(node, view) {
    var tile = document.getElementById('card-' + node.id);
    var copy = node.views[view];
    if (!tile || !copy) return;
    tile.querySelector('.lib-title').textContent = copy.title;
    tile.querySelector('.lib-desc').textContent = copy.description;
    (node.links || []).forEach(function (link, index) {
      var anchor = tile.querySelector('[data-link-index="' + index + '"]');
      if (anchor) setLinkLabel(anchor, linkLabel(link, view));
    });
  }

  function renderDevelopment(copy) {
    if (!copy) return;
    setText('development-heading', copy.heading);
    setText('development-intro', copy.intro);
    setText('development-note', copy.note);
    var host = document.getElementById('development-steps');
    host.innerHTML = '';
    document.querySelectorAll('.loop-word').forEach(function (word, i) {
      if (copy.steps[i]) word.textContent = copy.steps[i].title;
    });
    copy.steps.forEach(function (step, i) {
      var item = element('li');
      item.style.setProperty('--i', i);
      item.appendChild(element('h3', '', step.title));
      item.appendChild(element('p', '', step.description));
      host.appendChild(item);
    });
  }

  function applyView(view, updateUrl) {
    var data = state.data;
    if (!data.views[view]) return;
    var copy = data.views[view];
    var changed = state.view !== view;
    state.view = view;
    document.documentElement.dataset.ecosystemView = view;

    setWords(document.getElementById('hero-title'), copy.hero.title);
    setText('hero-tagline', copy.hero.tagline);
    setText('limits-text', copy.limits);
    renderDevelopment(copy.development);
    data.nodes.forEach(function (node) { updateTile(node, view); });
    document.querySelectorAll('.libs-cat').forEach(function (band) {
      var cat = (copy.categories || {})[band.dataset.category];
      if (!cat) return;
      band.querySelector('.libs-cat-title').textContent = cat.title;
      band.querySelector('.libs-cat-note').textContent = cat.note;
    });
    document.querySelectorAll('[data-group-title]').forEach(function (el) {
      var group = copy.groups[el.dataset.groupTitle];
      if (group) el.textContent = group.title;
    });
    document.querySelectorAll('[data-group-note]').forEach(function (el) {
      var group = copy.groups[el.dataset.groupNote];
      if (group) el.textContent = group.note;
    });
    document.querySelectorAll('[data-view]').forEach(function (button) {
      var on = button.dataset.view === view;
      button.classList.toggle('active', on);
      button.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (changed && window.FootprintFilm) window.FootprintFilm.setView(view);
    if (changed) {
      document.body.classList.remove('view-swap');
      void document.body.offsetWidth;
      document.body.classList.add('view-swap');
    }
    if (updateUrl) {
      /* a shareable address is a nicety: some embedded previews refuse it */
      try {
        var url = new URL(window.location.href);
        url.searchParams.set('view', view);
        window.history.replaceState({ ecosystemView: view }, '', url);
      } catch (e) {}
    }
  }

  function populateNpmVersions() {
    document.querySelectorAll('.lk-npm').forEach(function (anchor) {
      var match = anchor.href.match(/\/package\/([^/?#]+)/);
      if (!match) return;
      fetch('https://registry.npmjs.org/' + match[1] + '/latest')
        .then(function (response) { return response.ok ? response.json() : null; })
        .then(function (pkg) {
          if (!pkg || !pkg.version) return;
          anchor.dataset.npmVersion = pkg.version;
          var tile = anchor.closest('.lib');
          var node = state.data.nodes.filter(function (n) { return n.id === tile.dataset.nodeId; })[0];
          if (node) setLinkLabel(anchor, linkLabel(node.links[Number(anchor.dataset.linkIndex)], state.view));
        })
        .catch(function () {});
    });
  }

  function bindControls() {
    document.querySelectorAll('[data-view]').forEach(function (button) {
      button.addEventListener('click', function () { applyView(button.dataset.view, true); });
    });
    /* Tab still steps through each button. Arrow keys, Home and End walk the group
       the way a segmented control does, moving focus and the view together. */
    var group = document.querySelector('.lens-toggle');
    group.addEventListener('keydown', function (event) {
      var step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
      var edge = event.key === 'Home' || event.key === 'End';
      if (!step && !edge) return;
      var buttons = Array.prototype.slice.call(group.querySelectorAll('[data-view]'));
      var current = buttons.indexOf(document.activeElement);
      if (current < 0) return;
      event.preventDefault();
      var next = edge ? (event.key === 'Home' ? 0 : buttons.length - 1) : (current + step + buttons.length) % buttons.length;
      buttons[next].focus();
      applyView(buttons[next].dataset.view, true);
    });
    window.addEventListener('popstate', function () { applyView(initialView(state.data), false); });

    /* "Share with your agent" copies a description for a reader's coding agent. It gives no orders,
       because orders aimed at an agent read as prompt injection. Without a clipboard it stays a link to llms.txt. */
    var share = document.getElementById('share-agent');
    if (share && navigator.clipboard) {
      var shareButton = element('button', share.className, 'Share with your agent');
      shareButton.type = 'button';
      shareButton.addEventListener('click', function () {
        navigator.clipboard.writeText(AGENT_BRIEF).then(function () {
          shareButton.textContent = 'Copied. Paste it to your agent';
          window.setTimeout(function () { shareButton.textContent = 'Share with your agent'; }, 2400);
        }, function () {
          shareButton.replaceWith(share);
        });
      });
      share.replaceWith(shareButton);
    }

    /* a planet in the film's last shot opens its tile */
    document.addEventListener('film:body', function (event) {
      var tile = document.getElementById('card-' + event.detail.id);
      if (!tile) return;
      tile.scrollIntoView({ behavior: 'smooth', block: 'center' });
      var details = tile.querySelector('details');
      if (details) details.open = true;
      tile.classList.remove('flash');
      void tile.offsetWidth;
      tile.classList.add('flash');
    });

    /* the header gains an edge once the film has scrolled away */
    var film = document.getElementById('film');
    var header = document.querySelector('.hd');
    function edge() {
      header.classList.toggle('is-past', film.getBoundingClientRect().bottom < 80);
    }
    window.addEventListener('scroll', edge, { passive: true });
    edge();
  }

  fetch('./ecosystem-views.json', { cache: 'no-cache' })
    .then(function (response) {
      if (!response.ok) throw new Error('Unable to load ecosystem-views.json');
      return response.json();
    })
    .then(function (data) {
      state.data = data;
      var view = initialView(data);
      renderTiles(data);
      state.view = view;
      applyView(view, false);
      state.view = view;
      if (window.FootprintFilm) window.FootprintFilm.boot(data, view);
      document.documentElement.classList.add('ready');
      bindControls();
      populateNpmVersions();
      /* the film changes the page's height, so an anchor has to be honoured again */
      if (window.location.hash.length > 1) {
        var target = document.getElementById(window.location.hash.slice(1));
        if (target) target.scrollIntoView({ behavior: 'instant' });
      }
    })
    .catch(function (error) {
      /* the libraries are already in the HTML, so a failed load leaves them readable */
      document.documentElement.classList.add('ready');
      console.error(error);
    });
})();
