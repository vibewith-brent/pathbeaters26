/* chart.js — day-by-day miles / ascent / descent chart.
 *
 *   window.dayChart(rows, opts) -> SVG markup string
 *
 *   rows: [{label: "Thu", mi: 9, up: 2000, down: 800, alt: false}, ...]
 *         alt: true marks the "straight out on Sunday" alternative day
 *         (rendered last, dashed accent outline, lighter fill).
 *   opts: {width: 640, height: 180}
 *         Pass the pixel width the chart will actually be rendered at
 *         (e.g. the card's clientWidth). Layout and type are sized in
 *         viewBox units equal to CSS px at that width; the SVG itself is
 *         width="100%" so it still scales if the container changes.
 *
 * No dependencies, no DOM access, no globals other than window.dayChart.
 */
(function () {
  "use strict";

  var INK = "#1c1b18", INK2 = "#57544c", MUTED = "#857f73";
  var RULE = "#cfcabd", RULE2 = "#e6e2d8", ACCENT = "#a0522d";
  var UP_LO = [179, 200, 221], UP_HI = [95, 136, 173];   /* #b3c8dd -> #5f88ad */
  var DOWN = "#d9d2c5", ALT_UP = "#e9eef4", ALT_DOWN = "#f3f0ea";
  var FONT = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
  var MINUS = "−", DASH = "—";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function num(v) { v = Number(v); return isFinite(v) ? v : 0; }
  function fmt(n) {
    n = Math.round(num(n));
    return (n < 0 ? MINUS : "") + String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  function fmtMi(n) {
    n = num(n);
    if (Math.abs(n - Math.round(n)) < 0.05) return fmt(n);
    return (Math.round(n * 10) / 10).toFixed(1);
  }
  function hex2(v) { var s = Math.round(v).toString(16); return s.length < 2 ? "0" + s : s; }
  function ramp(t) {
    t = Math.max(0, Math.min(1, t));
    var r = UP_LO[0] + (UP_HI[0] - UP_LO[0]) * t, g = UP_LO[1] + (UP_HI[1] - UP_LO[1]) * t, b = UP_LO[2] + (UP_HI[2] - UP_LO[2]) * t;
    return "#" + hex2(r) + hex2(g) + hex2(b);
  }
  /* largest "nice" ft value at or below ~70% of the extent (0 = none) */
  function niceTick(max) {
    var steps = [100, 200, 250, 500, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 8000, 10000];
    var target = max * 0.7, t = 0;
    for (var i = 0; i < steps.length; i++) if (steps[i] <= target) t = steps[i];
    return t;
  }
  function attrs(o) {
    var s = "";
    for (var k in o) if (o[k] != null && o[k] !== "") s += " " + k + '="' + esc(o[k]) + '"';
    return s;
  }
  function text(x, y, str, o) {
    return "<text" + attrs({ x: x, y: y, "text-anchor": o.anchor || "middle", "font-size": o.size, fill: o.fill, "font-weight": o.weight }) + ">" + str + "</text>";
  }

  window.dayChart = function (rows, opts) {
    rows = Array.isArray(rows) ? rows : [];
    opts = opts || {};
    var W = num(opts.width) > 0 ? num(opts.width) : 640;
    var H = num(opts.height) > 0 ? num(opts.height) : 184;
    var narrow = W < 440;
    var fsMi = narrow ? 11.5 : 12.5, fsVal = narrow ? 9 : 9.5, fsAxis = fsVal, fsDay = narrow ? 10 : 11;

    /* normalise and order: main days first, alt days last */
    var days = [], i, r;
    for (i = 0; i < rows.length; i++) {
      r = rows[i] || {};
      days.push({ label: r.alt && !r.label ? "Sun→out" : String(r.label == null ? "" : r.label),
        mi: Math.max(0, num(r.mi)), up: Math.max(0, num(r.up)), down: Math.max(0, num(r.down)), alt: !!r.alt });
    }
    days = days.filter(function (d) { return !d.alt; }).concat(days.filter(function (d) { return d.alt; }));
    var n = days.length, nMain = 0, hasAlt = false, maxUp = 0, maxDown = 0;
    for (i = 0; i < n; i++) {
      if (days[i].alt) hasAlt = true; else nMain++;
      if (days[i].up > maxUp) maxUp = days[i].up;
      if (days[i].down > maxDown) maxDown = days[i].down;
    }

    /* axis */
    var tick = niceTick(Math.max(maxUp, maxDown));
    var axisTexts = ["0 ft"];
    if (tick && tick <= maxUp * 1.05) axisTexts.push("+" + fmt(tick));
    if (tick && tick <= maxDown * 1.05) axisTexts.push(MINUS + fmt(tick));
    var longest = 0;
    for (i = 0; i < axisTexts.length; i++) longest = Math.max(longest, axisTexts[i].length);
    var padL = Math.round(longest * fsAxis * 0.62 + 12), padR = 6;
    var gap = hasAlt ? (narrow ? 10 : 14) : 0;

    /* horizontal layout */
    var plotW = Math.max(1, W - padL - padR - gap), cw = n ? plotW / n : plotW;
    var bw = Math.max(6, Math.min(Math.round(cw * 0.5), 36));
    var colX = function (k) { return padL + cw * (k + 0.5) + (days[k].alt ? gap : 0); };

    /* vertical layout */
    var milesY = Math.round(fsMi + 1);
    var plotTop = Math.round(milesY + fsVal + 11);        /* room for the +ft label above the tallest bar */
    var dayY = H - 5;
    var plotBottom = Math.round(H - (fsDay + fsVal + 16)); /* room for the -ft label below the deepest bar */
    var unitInCol = cw >= 56;                              /* "9 mi" per column, else a single "mi" on the axis */
    var span = Math.max(1, plotBottom - plotTop);
    var total = maxUp + maxDown;
    var scale = total > 0 ? span / total : 0;
    var y0 = total > 0 ? Math.round(plotTop + maxUp * scale) : Math.round((plotTop + plotBottom) / 2);
    var x1 = padL - 2, x2 = W - padR;

    var g = [], summary = [];

    /* gridlines + axis labels (behind everything) */
    var gridStyle = ' stroke="' + RULE2 + '" stroke-width="1" shape-rendering="crispEdges"';
    var lines = [];
    if (tick && tick <= maxUp * 1.05) lines.push({ y: Math.round(y0 - tick * scale), t: "+" + fmt(tick) });
    if (tick && tick <= maxDown * 1.05) lines.push({ y: Math.round(y0 + tick * scale), t: MINUS + fmt(tick) });
    for (i = 0; i < lines.length; i++) {
      g.push('<line x1="' + x1 + '" y1="' + (lines[i].y + 0.5) + '" x2="' + x2 + '" y2="' + (lines[i].y + 0.5) + '"' + gridStyle + "/>");
      g.push(text(padL - 6, lines[i].y + 3.5, esc(lines[i].t), { anchor: "end", size: fsAxis, fill: MUTED }));
    }
    g.push('<line x1="' + x1 + '" y1="' + (y0 + 0.5) + '" x2="' + x2 + '" y2="' + (y0 + 0.5) + '" stroke="' + RULE + '" stroke-width="1" shape-rendering="crispEdges"/>');
    g.push(text(padL - 6, y0 + 3.5, "0 ft", { anchor: "end", size: fsAxis, fill: MUTED }));
    if (!unitInCol && n) g.push(text(padL - 6, milesY, "mi", { anchor: "end", size: fsAxis, fill: MUTED }));

    /* divider before the alt column */
    if (hasAlt && nMain > 0) {
      var dx = Math.round(padL + cw * nMain + gap / 2) + 0.5;
      g.push('<line x1="' + dx + '" y1="4" x2="' + dx + '" y2="' + (H - 3) + '" stroke="' + RULE + '" stroke-width="1" stroke-dasharray="2 3" shape-rendering="crispEdges"/>');
    }

    /* columns */
    for (i = 0; i < n; i++) {
      var d = days[i], cx = Math.round(colX(i)), bx = Math.round(cx - bw / 2);
      var hUp = Math.round(d.up * scale), hDown = Math.round(d.down * scale);
      var altStroke = d.alt ? ' stroke="' + ACCENT + '" stroke-width="1" stroke-dasharray="3 2"' : "";
      var inset = d.alt ? 0.5 : 0;

      if (hUp > 0) {
        g.push('<rect x="' + (bx + inset) + '" y="' + (y0 - hUp + inset) + '" width="' + (bw - 2 * inset) + '" height="' + Math.max(0.5, hUp - 2 * inset) +
          '" fill="' + (d.alt ? ALT_UP : ramp(maxUp ? 0.25 + 0.75 * d.up / maxUp : 0)) + '"' + altStroke + "/>");
        g.push(text(cx, y0 - hUp - 4, "+" + fmt(d.up), { size: fsVal, fill: INK2 }));
      }
      if (hDown > 0) {
        g.push('<rect x="' + (bx + inset) + '" y="' + (y0 + 1 + inset) + '" width="' + (bw - 2 * inset) + '" height="' + Math.max(0.5, hDown - 2 * inset) +
          '" fill="' + (d.alt ? ALT_DOWN : DOWN) + '"' + altStroke + "/>");
        g.push(text(cx, y0 + hDown + fsVal + 3, MINUS + fmt(d.down), { size: fsVal, fill: INK2 }));
      }

      /* miles */
      if (d.mi > 0) {
        g.push('<text x="' + cx + '" y="' + milesY + '" text-anchor="middle" font-size="' + fsMi + '">' +
          '<tspan fill="' + INK + '" font-weight="500">' + esc(fmtMi(d.mi)) + '</tspan>' +
          (unitInCol ? '<tspan fill="' + MUTED + '" font-size="' + (fsMi - 2.5) + '"> mi</tspan>' : "") + '</text>');
      } else {
        g.push(text(cx, milesY, DASH, { size: fsMi, fill: MUTED }));
      }
      /* day label */
      g.push(text(cx, dayY, esc(d.label), { size: fsDay, fill: d.alt ? ACCENT : INK2, weight: d.alt ? "500" : null }));

      summary.push(d.label + " " + (d.mi > 0 ? fmtMi(d.mi) + " mi" : "rest") +
        (d.up > 0 ? ", +" + fmt(d.up) + " ft" : "") + (d.down > 0 ? ", " + MINUS + fmt(d.down) + " ft" : "") + (d.alt ? " (alternative)" : ""));
    }

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + " " + H + '" width="100%" role="img" aria-label="' +
      esc("Daily miles, ascent and descent: " + (summary.join("; ") || "no days")) + '" font-family="' + esc(FONT) + '"' +
      ' style="display:block;max-width:100%;height:auto;overflow:visible">' + g.join("") + "</svg>";
  };
})();
