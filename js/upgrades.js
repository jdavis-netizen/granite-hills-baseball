// Granite Hills Baseball - interactive pieces added in Nov 2026:
// baseball cards, season chart, alumni map, offline support.

// ===== Offline support (network first, so visitors always get fresh pages when online) =====
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function () {});
  });
}

// ===== Baseball cards: tap to flip, tilt and foil follow the pointer =====
(function () {
  var grid = document.getElementById('playerCards');
  if (!grid) return;
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  grid.querySelectorAll('.pc').forEach(function (card) {
    var flip = card.querySelector('.pc-flip');
    flip.addEventListener('click', function () {
      var on = card.classList.toggle('flipped');
      flip.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (still) return;
    var raf = 0;
    card.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      var box = card.getBoundingClientRect();
      var x = (e.clientX - box.left) / box.width;
      var y = (e.clientY - box.top) / box.height;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () {
        card.style.setProperty('--rx', ((0.5 - y) * 14).toFixed(2) + 'deg');
        card.style.setProperty('--ry', ((x - 0.5) * 18).toFixed(2) + 'deg');
        card.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (y * 100).toFixed(1) + '%');
        card.classList.add('tilting');
      });
    });
    card.addEventListener('pointerleave', function () {
      cancelAnimationFrame(raf);
      card.classList.remove('tilting');
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    });
  });

  // Cards / Table switch
  var buttons = document.querySelectorAll('[data-roster-view]');
  var table = document.getElementById('rosterTableWrap');
  buttons.forEach(function (b) {
    b.addEventListener('click', function () {
      var cards = b.getAttribute('data-roster-view') === 'cards';
      grid.hidden = !cards;
      if (table) table.hidden = cards;
      buttons.forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
    });
  });
})();

// ===== Season chart on the records page =====
(function () {
  var box = document.getElementById('seasonChart');
  if (!box || !window.GH_SEASONS) return;
  var seasons = window.GH_SEASONS;
  var readout = document.getElementById('seasonReadout');
  var W = 960, H = 340, L = 34, R = 8, base = 226, unit = 6.4;
  var step = (W - L - R) / seasons.length;
  var bar = Math.max(step - 7, 6);
  var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Wins and losses by season, 1998 to 2026. The table below has the same numbers.">';
  [10, 20, 30].forEach(function (v) {
    var y = base - v * unit;
    svg += '<line class="sc-grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + y + '" y2="' + y + '"/><text class="sc-tick" x="' + (L - 8) + '" y="' + (y + 4) + '">' + v + '</text>';
  });
  svg += '<line class="sc-base" x1="' + L + '" x2="' + (W - R) + '" y1="' + base + '" y2="' + base + '"/>';
  seasons.forEach(function (s, i) {
    var x = L + i * step + (step - bar) / 2;
    var cls = 'sc-season' + (s.title ? ' sc-title' : '');
    svg += '<g class="' + cls + '" data-i="' + i + '" tabindex="0" role="button" aria-label="' + s.y + ': ' + (s.w == null ? s.note : s.w + ' wins, ' + s.l + ' losses') + (s.title ? ', ' + s.title : '') + '">';
    svg += '<rect class="sc-hit" x="' + (L + i * step) + '" y="0" width="' + step + '" height="' + (H - 18) + '"/>';
    if (s.w == null || (s.w === 0 && s.l === 0)) {
      svg += '<rect class="sc-empty" x="' + x + '" y="' + (base - 34) + '" width="' + bar + '" height="30" rx="3"/>';
    } else {
      var wh = s.w * unit, lh = s.l * unit;
      svg += '<rect class="sc-w" x="' + x + '" y="' + (base - wh - 1) + '" width="' + bar + '" height="' + wh + '" rx="4" style="--d:' + (i * 22) + 'ms"/>';
      if (lh) svg += '<rect class="sc-l" x="' + x + '" y="' + (base + 2) + '" width="' + bar + '" height="' + lh + '" rx="4" style="--d:' + (i * 22) + 'ms"/>';
      if (s.title) {
        var cx = x + bar / 2, top = base - wh - 26;
        svg += '<path class="sc-pennant" d="M' + (cx - 7) + ' ' + top + 'h14v15l-7 -5 -7 5z"/>';
      }
    }
    if (s.y % 4 === 2 || i === seasons.length - 1 && s.y % 4 !== 2) {
      svg += '<text class="sc-year" x="' + (x + bar / 2) + '" y="' + (H - 4) + '">' + s.y + '</text>';
    }
    svg += '</g>';
  });
  box.innerHTML = svg + '</svg>';

  var groups = box.querySelectorAll('.sc-season');
  function show(i) {
    var s = seasons[i];
    groups.forEach(function (g) { g.classList.toggle('active', +g.getAttribute('data-i') === i); });
    var rec = s.w == null ? 'No record yet' : (s.w === 0 && s.l === 0) ? 'No season' : s.w + '-' + s.l + (s.t ? '-' + s.t : '');
    readout.innerHTML = '<strong>' + s.y + '</strong><span class="sr-rec">' + rec + '</span><span class="sr-note">' + (s.title || '') + (s.title && s.note ? '. ' : '') + (s.note || '') + '</span>';
  }
  groups.forEach(function (g) {
    var i = +g.getAttribute('data-i');
    g.addEventListener('pointerenter', function () { show(i); });
    g.addEventListener('focus', function () { show(i); });
    g.addEventListener('click', function () { show(i); });
  });
  show(seasons.length - 1);
  // On phones the chart scrolls sideways; start on the most recent seasons
  var scroller = box.parentNode;
  scroller.scrollLeft = scroller.scrollWidth;

  // Bars grow the first time the chart scrolls into view
  if ('IntersectionObserver' in window) {
    box.classList.add('sc-wait');
    var io = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { box.classList.remove('sc-wait'); io.disconnect(); }
    }, { threshold: 0.25 });
    io.observe(box);
  }
})();

// ===== Alumni map: a spot and its list row light up together =====
(function () {
  var map = document.querySelector('.eagle-map');
  if (!map) return;
  function select(id, scroll) {
    map.querySelectorAll('[data-spot]').forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-spot') === id);
    });
    if (scroll) {
      var row = map.querySelector('.em-place.active');
      var list = map.querySelector('.em-list');
      if (row && list) list.scrollTo({ top: row.offsetTop - list.offsetTop, behavior: 'smooth' });
    }
  }
  map.querySelectorAll('.em-spot').forEach(function (g) {
    var id = g.getAttribute('data-spot');
    g.addEventListener('click', function () { select(id, true); });
    g.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(id, true); }
    });
  });
  map.querySelectorAll('.em-place button').forEach(function (b) {
    b.addEventListener('click', function () { select(b.parentNode.getAttribute('data-spot'), false); });
  });
  if ('IntersectionObserver' in window) {
    map.classList.add('em-wait');
    var io = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { map.classList.remove('em-wait'); io.disconnect(); }
    }, { threshold: 0.25 });
    io.observe(map.querySelector('.em-svg'));
  }
  select('sd', false);
})();
