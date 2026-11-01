/* Next Game scoreboard. Plain script. Reads window.GH_GAMES; all times are America/Los_Angeles. */
(function () {
  "use strict";
  var SB = {"x":[1.621,0.41],"y":[-0.936,0.711],"z":[0,-1.683],"thick":1,"edgeOn":2.0837060535894354};

  // ---- time ---------------------------------------------------------------------------------
  function nthSunday(year, month, n) { // month is 0-based
    var first = new Date(Date.UTC(year, month, 1)).getUTCDay();
    return 1 + ((7 - first) % 7) + 7 * (n - 1);
  }
  function isPacificDst(y, m, d, h) { // US rule: 2nd Sunday of March 02:00 to 1st Sunday of November 02:00
    var start = nthSunday(y, 2, 2), end = nthSunday(y, 10, 1);
    var here = m * 100 + d, from = 3 * 100 + start, to = 11 * 100 + end;
    if (here < from || here > to) return false;
    if (here === from) return h >= 2;
    if (here === to) return h < 2;
    return true;
  }
  function pacific(dateText, timeText) {
    var p = dateText.split("-").map(Number), t = (timeText || "00:00").split(":").map(Number);
    var offset = isPacificDst(p[0], p[1], p[2], t[0]) ? 7 : 8;
    return Date.UTC(p[0], p[1] - 1, p[2], t[0] + offset, t[1]);
  }
  var startedAt = Date.now();
  function now() {
    return typeof window.GH_NOW === "number" ? window.GH_NOW + (Date.now() - startedAt) : Date.now();
  }

  // ---- data ---------------------------------------------------------------------------------
  function upcoming(at) {
    var list = Array.isArray(window.GH_GAMES) ? window.GH_GAMES : [];
    return list.filter(function (game) {
      return (game.team === "Winter" || game.team === "Varsity") && game.date;
    }).map(function (game) {
      var target = pacific(game.date, game.time);
      // A game with no set time stays on the board until its last date is over.
      var over = game.time ? target : pacific(game.end || game.date) + 864e5;
      return { game: game, target: target, over: over, key: game.team + game.date + game.opp };
    }).filter(function (entry) { return entry.over > at; }).sort(function (a, b) { return a.target - b.target; });
  }
  function shortOpp(game) { return String(game.opp || "").replace(/\s*opponents TBA\s*$/i, ""); }
  function isOppTba(game) { return /opponents TBA\s*$/i.test(game.opp || ""); }
  function shortSite(game) {
    var site = String(game.site || "").replace(/\s*\([^)]*\)/g, "").trim();
    return site === "TBA" ? "Site TBA" : site;
  }
  function tagOf(game) {
    var site = String(game.site || "");
    if (game.away) return "AWAY";
    if (/^home/i.test(site)) return "HOME";
    if (/tba/i.test(site)) return "TBA";
    var parts = site.split("•");
    return parts.length > 1 ? parts[parts.length - 1].trim() : "";
  }
  function lineOf(game) {
    var date = String(game.label || "").replace(",", "");
    var time = game.time ? game.timeText : "time TBA";
    if (isOppTba(game)) return date + ", " + shortOpp(game) + ", opponents TBA, " + time;
    return date + " vs " + shortOpp(game) + ", " + shortSite(game) + ", " + time;
  }
  function parts(ms) {
    var total = Math.max(0, Math.floor(ms / 6e4));
    return { days: Math.min(999, Math.floor(total / 1440)), hrs: Math.floor(total / 60) % 24, min: total % 60 };
  }
  function pad(value) { return (value < 10 ? "0" : "") + value; }
  function plural(value, word) { return value + " " + word + (value === 1 ? "" : "s"); }

  // ---- motion -------------------------------------------------------------------------------
  var OUT = 340, BACK = 560, SETTLE = 1300;
  function easeInOut(t) { return 0.5 - 0.5 * Math.cos(Math.PI * t); }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  function init() {
    var root = document.querySelector(".scoreboard-section");
    if (!root || root.getAttribute("data-ready")) return;
    root.setAttribute("data-ready", "1");
    var stage = root.querySelector("[data-stage]");
    var readout = root.querySelector("[data-readout]");
    var count = root.querySelector("[data-count]");
    var hint = root.querySelector("[data-hint]");
    var still = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };

    // Plates: swung about the hook line, in true world geometry (an affine map of the plate's plane).
    var plates = [].map.call(root.querySelectorAll("[data-plate]"), function (el, index) {
      var o = el.getAttribute("data-o").split(" ").map(Number);
      var digit = el.querySelector("[data-digit]");
      return {
        o: o, face: el.querySelector("[data-face]"), edge: el.querySelector("[data-edge]"), dim: el.querySelector("[data-dim]"),
        digit: digit, number: !!digit, shown: "", want: "", theta: 0, drawn: 0, phase: "", t0: 0, from: 0, kick: 0,
        seed: index * 1.7, amp: (digit ? 0.9 : 1.5) * Math.PI / 180,
      };
    });
    var numbers = plates.filter(function (p) { return p.number; });
    var blanks = plates.filter(function (p) { return !p.number; });

    function place(p) {
      var s = Math.sin(p.theta), c = Math.cos(p.theta);
      var cx = s * SB.y[0] - c * SB.z[0], cy = s * SB.y[1] - c * SB.z[1];
      var head = SB.x[0].toFixed(3) + " " + SB.x[1].toFixed(3) + " " + cx.toFixed(3) + " " + cy.toFixed(3) + " ";
      p.face.setAttribute("transform", "matrix(" + head + p.o[0] + " " + p.o[1] + ")");
      var bx = p.o[0] - SB.thick * (c * SB.y[0] + s * SB.z[0]), by = p.o[1] - SB.thick * (c * SB.y[1] + s * SB.z[1]);
      p.edge.setAttribute("transform", "matrix(" + head + bx.toFixed(3) + " " + by.toFixed(3) + ")");
      p.dim.setAttribute("opacity", Math.min(0.5, p.theta * 0.32).toFixed(3));
      p.drawn = p.theta;
    }
    function setDigit(p, value) {
      p.shown = value;
      if (p.digit) p.digit.textContent = value;
    }

    // Slats: new text slides up inside the window.
    function Slat(el) {
      var texts = el.querySelectorAll("[data-text]");
      return { el: el, a: texts[0], b: texts[1], width: +el.getAttribute("data-width"), rise: +el.getAttribute("data-rise"), size: +texts[0].getAttribute("font-size"), value: "", next: null, t0: 0, moving: false };
    }
    var slats = [Slat(root.querySelector("[data-slat]")), Slat(root.querySelector("[data-tag]"))];
    function fit(text) { // the widest string must stay inside its window
      var slat = text.slat;
      text.setAttribute("font-size", slat.size);
      var width = 0;
      try { width = text.getComputedTextLength(); } catch (error) { width = 0; }
      if (width > slat.width) text.setAttribute("font-size", (slat.size * slat.width / width).toFixed(2));
    }
    slats.forEach(function (slat) { slat.a.slat = slat; slat.b.slat = slat; });
    function setSlat(slat, value, instant) {
      if (slat.value === value && !slat.moving) return;
      if (instant || still.matches) {
        slat.value = value; slat.moving = false; slat.a.textContent = value; slat.b.textContent = "";
        slat.a.removeAttribute("transform"); fit(slat.a);
        return;
      }
      if (slat.moving) { // finish the slide under way, then start this one
        slat.value = slat.next; slat.a.textContent = slat.next; slat.a.removeAttribute("transform"); fit(slat.a);
      }
      slat.next = value; slat.moving = true; slat.t0 = -1;
      slat.b.textContent = value; fit(slat.b);
      slat.b.setAttribute("transform", "translate(0 " + slat.rise + ")");
      wake();
    }
    function refit() { slats.forEach(function (slat) { fit(slat.a); if (slat.moving) fit(slat.b); }); }

    // ---- state --------------------------------------------------------------------------------
    var games = [], index = 0, currentKey = null, visible = false, primed = false, frame = 0, last = 0, timer = 0;

    function digitsFor(entry) {
      var v = parts(entry ? entry.target - now() : 0);
      var d = String(v.days), h = pad(v.hrs), m = pad(v.min);
      if (d.length < 2) d = "0" + d;
      if (d.length < 3) d = " " + d;
      return (d + h + m).split("").map(function (c) { return c === " " ? "" : c; });
    }
    function refresh(first) {
      var at = now();
      games = upcoming(at);
      if (currentKey) {
        var found = -1;
        games.forEach(function (entry, i) { if (entry.key === currentKey) found = i; });
        index = found >= 0 ? found : Math.min(index, Math.max(0, games.length - 1));
      }
      var entry = games[index] || null;
      currentKey = entry ? entry.key : null;
      var digits = digitsFor(entry);
      numbers.forEach(function (p, i) { p.want = digits[i]; });
      if (entry) {
        var line = lineOf(entry.game);
        if (readout.getAttribute("data-line") !== line) { readout.setAttribute("data-line", line); readout.textContent = line; }
        count.textContent = "Game " + (index + 1) + " of " + games.length;
        hint.hidden = false;
        stage.removeAttribute("data-empty");
        var v = parts(entry.target - at);
        stage.setAttribute("aria-label", "Scoreboard. " + line + ". " + plural(v.days, "day") + ", " + plural(v.hrs, "hour") + ", " + plural(v.min, "minute") + " away. Press Enter or the arrow keys for other games.");
        setSlat(slats[0], shortOpp(entry.game).toUpperCase(), first);
        setSlat(slats[1], tagOf(entry.game).toUpperCase(), first);
      } else {
        if (readout.getAttribute("data-line") !== "none") {
          readout.setAttribute("data-line", "none");
          readout.innerHTML = '<a href="schedule.html">See the schedule</a>';
        }
        count.textContent = "";
        hint.hidden = true;
        stage.setAttribute("data-empty", "");
        stage.setAttribute("aria-label", "Scoreboard. No upcoming games listed. See the schedule.");
        setSlat(slats[0], "SEE THE SCHEDULE", first);
        setSlat(slats[1], "", first);
      }
      if (still.matches || !primed) {
        if (still.matches) numbers.forEach(function (p) { setDigit(p, p.want); });
      } else {
        wake();
      }
    }
    function schedule() {
      clearTimeout(timer);
      if (!visible) return;
      timer = setTimeout(function () { refresh(); schedule(); }, 60000 - (now() % 60000) + 40);
    }
    function step(by) {
      if (!games.length) return;
      index = (index + by + games.length) % games.length;
      currentKey = games[index].key;
      refresh();
      if (!still.matches) {
        var at = performance.now();
        blanks.forEach(function (p, i) { if (!p.phase) { p.phase = "settle"; p.t0 = at + (i % 10) * 26; p.kick = 3.2 * Math.PI / 180; } });
        wake();
      }
    }

    // ---- frame loop ---------------------------------------------------------------------------
    function sway(p, seconds) {
      var gust = 0.5 + 0.5 * Math.sin(seconds * 0.31 + p.seed * 0.13);
      return p.amp * gust * (0.5 + 0.5 * Math.sin(seconds * 1.05 + p.seed));
    }
    function animate(p, at, seconds, calm) {
      var rest = calm ? 0 : sway(p, seconds);
      if (p.number && p.want !== p.shown && p.phase !== "out") { p.phase = "out"; p.t0 = at; p.from = p.theta; }
      if (p.phase === "out") {
        var t = Math.min(1, Math.max(0, (at - p.t0) / OUT));
        p.theta = p.from + (SB.edgeOn - p.from) * easeInOut(t);
        if (t >= 1) { setDigit(p, p.want); p.phase = "back"; p.t0 = at; }
      } else if (p.phase === "back") {
        var b = Math.min(1, (at - p.t0) / BACK);
        p.theta = SB.edgeOn * (1 - easeOut(b)) + rest * b;
        if (b >= 1) { p.phase = "settle"; p.t0 = at; p.kick = 2.4 * Math.PI / 180; }
      } else if (p.phase === "settle") {
        var e = (at - p.t0) / 1000;
        if (e < 0) p.theta = rest;
        else if (e * 1000 >= SETTLE) { p.phase = ""; p.theta = rest; }
        else p.theta = rest + p.kick * Math.exp(-3.2 * e) * Math.abs(Math.sin(5.2 * e));
      } else {
        p.theta = rest;
      }
      if (Math.abs(p.theta - p.drawn) > 0.0004) place(p);
      return !!p.phase;
    }
    function animateSlat(slat, at) {
      if (!slat.moving) return false;
      if (slat.t0 < 0) slat.t0 = at;
      var t = Math.min(1, (at - slat.t0) / 520), y = easeInOut(t) * slat.rise;
      slat.a.setAttribute("transform", "translate(0 " + (-y).toFixed(2) + ")");
      slat.b.setAttribute("transform", "translate(0 " + (slat.rise - y).toFixed(2) + ")");
      if (t >= 1) {
        slat.value = slat.next; slat.moving = false; slat.a.textContent = slat.value; fit(slat.a);
        slat.a.removeAttribute("transform"); slat.b.textContent = ""; slat.b.removeAttribute("transform");
        return false;
      }
      return true;
    }
    function tick(at) {
      frame = 0;
      var calm = still.matches;
      var busy = false, seconds = at / 1000;
      // Idle sway only needs 30 frames a second; a flip gets all of them.
      var active = plates.some(function (p) { return p.phase || (p.number && p.want !== p.shown); }) || slats.some(function (s) { return s.moving; });
      if (active || at - last >= 33) {
        last = at;
        plates.forEach(function (p) { if (animate(p, at, seconds, calm)) busy = true; });
        slats.forEach(function (s) { if (animateSlat(s, at)) busy = true; });
      }
      if (visible && (busy || active || !calm)) frame = requestAnimationFrame(tick);
    }
    function wake() { if (!frame && visible) frame = requestAnimationFrame(tick); }
    function calmDown() {
      plates.forEach(function (p) { p.phase = ""; p.theta = 0; if (p.number) setDigit(p, p.want); place(p); });
      slats.forEach(function (s) { if (s.moving) setSlat(s, s.next, true); });
    }

    // ---- wiring -------------------------------------------------------------------------------
    stage.addEventListener("click", function () { step(1); });
    stage.addEventListener("keydown", function (event) {
      var key = event.key;
      if (key === "ArrowRight" || key === "ArrowDown" || key === "Enter" || key === " ") { event.preventDefault(); step(1); }
      else if (key === "ArrowLeft" || key === "ArrowUp") { event.preventDefault(); step(-1); }
      else if (key === "Home" && games.length) { event.preventDefault(); step(-index); }
      else if (key === "End" && games.length) { event.preventDefault(); step(games.length - 1 - index); }
    });
    if (still.addEventListener) still.addEventListener("change", function () { if (still.matches) calmDown(); else wake(); });
    document.addEventListener("visibilitychange", function () { if (!document.hidden && visible) { refresh(); schedule(); } });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refit);

    refresh(true);
    if (still.matches) numbers.forEach(function (p) { setDigit(p, p.want); });
    function onSight(isVisible) {
      visible = isVisible;
      if (visible) {
        primed = true;
        refresh();
        schedule();
        if (still.matches) { calmDown(); } else { wake(); }
      } else {
        clearTimeout(timer);
        if (frame) { cancelAnimationFrame(frame); frame = 0; }
      }
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) { onSight(entries[entries.length - 1].isIntersecting); }, { rootMargin: "60px 0px" }).observe(stage);
    } else {
      onSight(true);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
