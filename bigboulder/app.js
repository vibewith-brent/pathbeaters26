/* Big Boulder Lakes trip page.
   Data: trip.js (TRIP) for the plan, wx.js (WX_SNAPSHOT) for the forecast fallback, ../options/gpx/bigboulder.gpx for the lines.
   The map is MapLibre GL over Esri imagery with AWS terrain tiles; the profiles are hand-drawn SVG; the forecast refreshes live from api.weather.gov. */
(function () {
  "use strict";
  const T = TRIP, WX = WX_SNAPSHOT;
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  const num = v => (v == null || v === "" || isNaN(v)) ? "—" : Math.round(Number(v)).toLocaleString("en-US");
  const hrs = h => h == null ? "" : (h % 1 === 0 ? h : h.toFixed(1).replace(".0", "")) + " h";
  const DAYS = ["Thu", "Fri", "Sat", "Sun", "Mon"];
  const DAYFULL = { Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday", Mon: "Monday" };
  const DAYDATE = { Thu: "2026-09-17", Fri: "2026-09-18", Sat: "2026-09-19", Sun: "2026-09-20", Mon: "2026-09-21" };
  const COL = { Thu: "#c98500", Fri: "#3987e5", Sat: "#d95926", Sun: "#199e70", Mon: "#9085e9", hike: "#f4f0e6" };
  const gmap = (lat, lon) => `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- icons ---------- */
  const I = {
    tent: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 20L12 4l9 16H3z"/><path d="M12 12l4 8"/></svg>',
    flag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M5 21V4h11l-2 4 2 4H5"/></svg>',
    bed: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 18V9M3 14h18v4M3 12h8V9H3M11 12h10a2 2 0 0 0-2-2h-8"/></svg>',
    warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s7-7 7-12a7 7 0 0 0-14 0c0 5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 20l5-9 4 5 4-8 5 12z"/></svg>',
    stop: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="5" width="14" height="14" rx="2"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 4l14 8-14 8z"/></svg>'
  };
  const sunSvg = '<circle cx="12" cy="12" r="4.2" fill="#ffc94d"/><g stroke="#ffc94d" stroke-width="1.8" stroke-linecap="round"><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/></g>';
  const moonSvg = '<path d="M15.5 3.5a8 8 0 1 0 5 13.5A9 9 0 0 1 15.5 3.5z" fill="#cdd9e8"/>';
  const cloudSvg = (dx, dy, c) => `<path transform="translate(${dx} ${dy})" d="M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 11.5 3.3 3.3 0 0 0 7 18z" fill="${c}"/>`;
  function wxKind(s) { s = String(s || ""); if (/thunder|t-storm/i.test(s)) return "storm"; if (/snow|sleet|wintry/i.test(s)) return "snow"; if (/rain|shower|drizzle/i.test(s)) return "rain"; if (/partly|mostly sunny|mostly clear/i.test(s)) return "partly"; if (/cloud|overcast|fog|haze|smoke/i.test(s)) return "cloud"; return "clear"; }
  function wxIcon(s, day) {
    const k = wxKind(s); let body = "";
    if (k === "clear") body = day ? sunSvg : moonSvg;
    else if (k === "partly") body = (day ? '<g transform="translate(-3 -3) scale(0.75)">' + sunSvg + "</g>" : '<g transform="translate(-2 -3) scale(0.7)">' + moonSvg + "</g>") + cloudSvg(1, 1, "#d8e0ea");
    else if (k === "cloud") body = cloudSvg(0, 0, "#b9c4d1");
    else if (k === "rain") body = cloudSvg(0, -3, "#a9b6c6") + '<g stroke="#7cc4ff" stroke-width="1.8" stroke-linecap="round"><path d="M9 19l-1 3M13 19l-1 3M17 19l-1 3"/></g>';
    else if (k === "storm") body = cloudSvg(0, -3, "#8f9db0") + '<path d="M13 15l-3 5h3l-1 4 4-6h-3l1-3z" fill="#ffd166"/>';
    else if (k === "snow") body = cloudSvg(0, -3, "#b9c4d1") + '<g fill="#e8f3ff"><circle cx="9" cy="20" r="1.3"/><circle cx="13" cy="22" r="1.3"/><circle cx="17" cy="20" r="1.3"/></g>';
    return `<svg viewBox="0 0 24 24" aria-label="${esc(s)}" role="img">${body}</svg>`;
  }
  const kindLabel = { clear: "Clear", partly: "Partly cloudy", cloud: "Cloudy", rain: "Rain", storm: "Storms", snow: "Snow" };

  /* ---------- geometry ---------- */
  const R = 6371000;
  function hav(a, b) { const la1 = a[0] * Math.PI / 180, la2 = b[0] * Math.PI / 180, dl = (b[1] - a[1]) * Math.PI / 180, dp = la2 - la1; const h = Math.sin(dp / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dl / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); }
  function bearing(a, b) { const la1 = a[0] * Math.PI / 180, la2 = b[0] * Math.PI / 180, dl = (b[1] - a[1]) * Math.PI / 180; const y = Math.sin(dl) * Math.cos(la2), x = Math.cos(la1) * Math.sin(la2) - Math.sin(la1) * Math.cos(la2) * Math.cos(dl); return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360; }
  const M2MI = 1 / 1609.344, M2FT = 3.28084;
  function build(raw, startMi) {
    // raw: [[lat, lon, ele_m]] -> [{lat, lon, ft, mi}] with light smoothing on elevation
    const pts = []; let d = startMi || 0;
    for (let i = 0; i < raw.length; i++) { if (i) d += hav(raw[i - 1], raw[i]) * M2MI; pts.push({ lat: raw[i][0], lon: raw[i][1], ft: raw[i][2] * M2FT, mi: d }); }
    for (let i = 1; i < pts.length - 1; i++) pts[i].sft = (pts[i - 1].ft + pts[i].ft * 2 + pts[i + 1].ft) / 4;
    if (pts.length) { pts[0].sft = pts[0].ft; pts[pts.length - 1].sft = pts[pts.length - 1].ft; }
    return pts;
  }
  function stats(pts) { let up = 0, dn = 0; for (let i = 1; i < pts.length; i++) { const d = pts[i].sft - pts[i - 1].sft; if (d > 0) up += d; else dn -= d; } return { mi: pts.length ? pts[pts.length - 1].mi - pts[0].mi : 0, up, dn, hi: Math.max(...pts.map(p => p.sft)), lo: Math.min(...pts.map(p => p.sft)) }; }
  function atMile(pts, mi) { let lo = 0, hi = pts.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (pts[m].mi < mi) lo = m + 1; else hi = m; } return pts[lo]; }
  function interp(pts, mi) { let lo = 0, hi = pts.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (pts[m].mi < mi) lo = m + 1; else hi = m; } const b = pts[lo], a = pts[Math.max(0, lo - 1)]; const f = (b.mi - a.mi) > 1e-9 ? (mi - a.mi) / (b.mi - a.mi) : 0; return { lat: a.lat + (b.lat - a.lat) * f, lon: a.lon + (b.lon - a.lon) * f, sft: a.sft + (b.sft - a.sft) * f, mi }; }
  function nearest(pts, lat, lon) { let best = 0, bd = Infinity; for (let i = 0; i < pts.length; i++) { const d = (pts[i].lat - lat) ** 2 + ((pts[i].lon - lon) * 0.72) ** 2; if (d < bd) { bd = d; best = i; } } return { i: best, m: hav([pts[best].lat, pts[best].lon], [lat, lon]) }; }
  function bbox(list) { let w = 999, s = 999, e = -999, n = -999; list.forEach(p => { const lat = p.lat != null ? p.lat : p[0], lon = p.lon != null ? p.lon : p[1]; if (lon < w) w = lon; if (lon > e) e = lon; if (lat < s) s = lat; if (lat > n) n = lat; }); return [[w, s], [e, n]]; }

  /* ---------- state ---------- */
  const S = { plan: "a", day: "Thu", dayLit: false, profile: "in", scrub: null, hike: null, base: "sat", threeD: true, flying: false };
  const PROFILES = {}; // id -> { id, title, sub, pts, segs:[{from,to,day}], ann:[{mi, ft, label, est}], est:[pts], note, kind }
  const profileViews = []; // rendered instances
  let map = null, scrubMarker = null, legsGeo = null, hikesGeo = null, routeBounds = null, legBounds = {}, hikeBounds = {};
  const camps = [];
  if (T.thursday && T.thursday.camp) camps.push({ night: "Thu", nights: ["Thu"], key: "cc", ...T.thursday.camp });
  camps.push({ ...T.camps[0], nights: ["Fri", "Sat", "Sun"], key: "cv" });
  const th = T.trailhead;

  /* ---------- weather helpers ---------- */
  const PT = WX.points;
  const PKEYS = ["th", "cc", "cv"];
  function period(k, day, night) { const p = PT[k] && PT[k].daily.find(x => x.n === DAYFULL[day] + (night ? " Night" : "")); return p || null; }
  // where we are during the day and where we sleep, by plan
  function where(plan, day) {
    if (plan === "a") return { day: { Thu: "th", Fri: "cv", Sat: "cv", Sun: "cv", Mon: "th" }[day], night: { Thu: "cc", Fri: "cv", Sat: "cv", Sun: "cv", Mon: null }[day], sleep: { Thu: "Creek camp · 8,600 ft", Fri: "Cove Lake · 9,848 ft", Sat: "Cove Lake · 9,848 ft", Sun: "Cove Lake · 9,848 ft", Mon: "Home" }[day] };
    return { day: { Thu: "th", Fri: "cc", Sat: "cv", Sun: "cv", Mon: "th" }[day], night: { Thu: null, Fri: "cv", Sat: "cv", Sun: "cv", Mon: null }[day], sleep: { Thu: "Pocatello", Fri: "Walker Lake · 9,245 ft", Sat: "Cove Lake · 9,848 ft", Sun: "Cove Lake · 9,848 ft", Mon: "Home" }[day] };
  }
  function dayWx(plan, day) {
    const w = where(plan, day); const d = period(w.day, day, false), n = w.night ? period(w.night, day, true) : null;
    return { hi: d ? d.t : null, lo: n ? n.t : null, pop: Math.max(d ? d.p : 0, n ? n.p : 0), s: d ? d.s : "", w: d ? d.w + " " + d.wd : "", sleep: w.sleep, nightKey: w.night, dayKey: w.day, nightS: n ? n.s : "" };
  }
  const mt = iso => new Date(iso).toLocaleString("en-US", { timeZone: "America/Denver", weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) + " MT";

  /* ---------- week strip ---------- */
  function planLegs(plan) {
    if (plan === "a") return DAYS.map(d => { const l = T.legs.find(x => x.day === d) || {}; return { day: d, title: l.from && l.to ? l.from + " → " + l.to : "", mi: l.miles, up: l.up_ft, dn: l.down_ft, hr: l.time_hr, notes: l.notes }; });
    return DAYS.map((d, i) => { const l = T.rain_plan.legs[i]; return { day: d, title: l[1], mi: l[2] || null, up: l[3], dn: l[4], hr: null, notes: l[1] }; });
  }
  function renderWeek() {
    const legs = planLegs(S.plan);
    $("weekcards").innerHTML = legs.map(l => {
      const w = dayWx(S.plan, l.day);
      return `<button class="dcard${S.day === l.day ? " on" : ""}" data-day="${l.day}" style="--c:${COL[l.day]}" aria-pressed="${S.day === l.day}">
        <div class="dow"><b>${l.day}</b><span>${esc(T.dates[l.day])}</span></div>
        <div class="ttl">${esc(l.title)}</div>
        <div class="st">${l.mi ? `<b>${num(l.mi)}</b> mi · <b>+${num(l.up)}</b> ft · <b>−${num(l.dn)}</b> ft${l.hr ? " · " + hrs(l.hr) : ""}` : "Driving day"}</div>
        <div class="wx">${wxIcon(w.s, true)}<div><div class="t">${w.hi != null ? w.hi + "°" : "—"} <small>${w.lo != null ? "/ " + w.lo + "°" : ""}</small></div><div class="p"><b>${w.pop}%</b> precip · ${esc(kindLabel[wxKind(w.s)])}</div></div></div>
        <div class="sleep">${I.bed} ${esc(w.sleep)}</div>
      </button>`;
    }).join("");
    $("weekcards").querySelectorAll(".dcard").forEach(b => b.addEventListener("click", () => selectDay(b.dataset.day, true)));
    const tot = legs.reduce((a, l) => [a[0] + (l.mi || 0), a[1] + (l.up || 0), a[2] + (l.dn || 0)], [0, 0, 0]);
    const hp = Math.max(...T.camps.map(c => c.elev_ft), T.high_ft || 0);
    $("totals").innerHTML = [[num(Math.round(tot[0] * 2) / 2), "miles"], ["+" + num(Math.round(tot[1] / 100) * 100), "ft up"], ["−" + num(Math.round(tot[2] / 100) * 100), "ft down"], [num(hp), "ft high"]].map(([b, s]) => `<div><b>${b}</b><small>${s}</small></div>`).join("");
    renderDayDetail();
    renderLean();
  }
  function renderDayDetail() {
    const l = planLegs(S.plan).find(x => x.day === S.day); const w = dayWx(S.plan, S.day);
    const sunOut = T.legs.find(x => /out/i.test(x.day));
    let extra = "";
    if (S.plan === "a" && S.day === "Thu" && T.thursday.fallback) extra += `<div class="alt"><b>If it is raining:</b> ${esc(T.thursday.fallback)}</div>`;
    if (S.plan === "a" && S.day === "Thu" && T.thursday.notes) extra += `<p>${esc(T.thursday.notes)}</p>`;
    if (S.day === "Sun" && sunOut) extra += `<div class="alt"><b>Sun → out:</b> ${esc(sunOut.note)} · ${num(sunOut.miles)} mi · +${num(sunOut.up_ft)} · −${num(sunOut.down_ft)} ft</div>`;
    const nightLine = w.nightKey ? `Night at ${esc(w.sleep)}: low ${w.lo}°, ${esc(w.nightS)}.` : `Night: ${esc(w.sleep)}.`;
    $("daydetail").style.setProperty("--c", COL[S.day]);
    $("daydetail").innerHTML = `<h3>${DAYFULL[S.day]} <small>${esc(T.dates[S.day])} · ${S.plan === "a" ? "Plan A" : "Plan B"}</small></h3>
      <p><b style="color:var(--ink)">${esc(l.title)}.</b> ${esc(l.notes || "")}</p>
      <p>Forecast at ${esc(PT[w.dayKey].short)}: ${esc(w.s)}, high ${w.hi}°, wind ${esc(w.w)}. ${nightLine}</p>${extra}
      <div class="links"><button class="pill" data-showday="${S.day}">${I.pin} Light up on the map</button><a class="pill" href="#weather">${wxIcon("", true)} Hour by hour</a></div>`;
    $("daydetail").querySelector("[data-showday]").addEventListener("click", () => { selectDay(S.day, true); $("top").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" }); });
  }
  function renderLean() {
    const thuDay = period("th", "Thu", false), thuNight = period("cc", "Thu", true);
    const pop = Math.max(thuDay ? thuDay.p : 0, thuNight ? thuNight.p : 0);
    const lean = pop >= 50 ? "leans Plan B" : pop >= 30 ? "is a toss-up" : "leans Plan A";
    $("lean").innerHTML = `${I.warn}<span>Forecast <b>${lean}</b>: ${pop}% chance of rain Thursday${thuNight && /snow/i.test(thuNight.s) ? ", snow possible up high" : ""}</span>`;
    $("lean").querySelector("svg").style.cssText = "width:15px;height:15px;color:var(--warn)";
  }
  $("planseg").querySelectorAll("button").forEach(b => b.addEventListener("click", () => { S.plan = b.dataset.plan; $("planseg").querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b)); renderWeek(); renderWxGrid(); }));

  /* ---------- weather grid ---------- */
  let hDay = "Thu", hPt = "cv";
  function renderWxGrid() {
    const g = $("wxgrid");
    let html = `<div></div>` + DAYS.map(d => `<button class="h${hDay === d ? " on" : ""}" data-hday="${d}"><b>${d}</b>${esc(T.dates[d])}</button>`).join("");
    PKEYS.forEach(k => {
      const p = PT[k];
      html += `<div class="rl"><b>${esc(p.short)}</b><small>${num(p.grid_elev_ft)} ft grid</small></div>`;
      DAYS.forEach(d => {
        const dp = period(k, d, false), np = period(k, d, true);
        const pop = Math.max(dp ? dp.p : 0, np ? np.p : 0);
        const r = pop >= 65 ? "r4" : pop >= 45 ? "r3" : pop >= 25 ? "r2" : pop >= 10 ? "r1" : "";
        const here = where(S.plan, d).night === k;
        html += `<button class="wcell ${r}${here ? " here" : ""}${hDay === d ? " col-on" : ""}" data-hday="${d}" data-hpt="${k}" title="${esc(dp ? dp.s : "")}">${wxIcon(dp ? dp.s : "", true)}<div class="t">${dp ? dp.t + "°" : "—"} <small>${np ? np.t + "°" : ""}</small></div><div class="p"><b>${pop}%</b> ${esc(kindLabel[wxKind(dp ? dp.s : "")])}</div><div class="w">${dp ? esc(dp.w.replace(" to ", "–").replace(" mph", "") + " mph " + dp.wd) : ""}</div></button>`;
      });
    });
    g.innerHTML = html;
    g.querySelectorAll("[data-hday]").forEach(b => b.addEventListener("click", () => { hDay = b.dataset.hday; if (b.dataset.hpt) hPt = b.dataset.hpt; renderWxGrid(); renderHourly(); }));
    // callout: anything nasty in the trip window at any point
    const bad = [];
    (PT.cv.daily || []).forEach(p => {
      if (p.start.slice(0, 10) < "2026-09-17") return;
      const same = PKEYS.map(k => PT[k].daily.find(q => q.n === p.n)).filter(Boolean);
      const storm = same.some(q => /thunder|t-storm/i.test(q.s)), snow = same.filter(q => /snow/i.test(q.s)).map(q => PT[PKEYS[same.indexOf(q)]].short);
      if (!storm && !snow.length) return;
      const pop = Math.max(...same.map(q => q.p));
      bad.push(`<b>${esc(p.n.replace(" Night", " night"))}:</b> ${[storm ? `thunderstorms, ${pop}%` : "", snow.length ? `snow possible at ${snow.join(" and ")}` : ""].filter(Boolean).join("; ")}`);
    });
    const call = $("wxcall");
    if (bad.length) { call.style.display = "flex"; call.innerHTML = `${I.warn}<div><b>Watch list.</b> ${bad.join(" · ")}. Storms above treeline with nowhere to hide: plan the pass and the peaks for mornings.</div>`; } else call.style.display = "none";
    $("wxlinks").innerHTML = `<a class="pill" href="${PT.cv.nws_page}" target="_blank" rel="noopener">NWS · Cove</a><a class="pill" href="${PT.cv.nws_page}&FcstType=graphical" target="_blank" rel="noopener">Hourly graph</a><a class="pill" href="https://www.wunderground.com/forecast/us/id/${T.wu_town || "mackay"}" target="_blank" rel="noopener">10-day · ${esc(T.wu_label || "Mackay")}</a>`;
    $("wxfoot").textContent = "Each row is the NWS grid cell that contains the point; the grid elevation is the cell's, not the camp's, so the basin runs a few degrees colder than the Cove row shows on clear nights. Highs are the daytime period, lows the night after.";
  }
  function hourlyRange(k, d) {
    const h = PT[k].hourly; if (!h || !h.start) return null;
    const s0 = new Date(h.start), dStart = new Date(DAYDATE[d] + "T00:00:00-06:00");
    const i0 = Math.round((dStart - s0) / 3600e3); const out = [];
    for (let i = Math.max(0, i0); i < Math.min(h.t.length, i0 + 24); i++) out.push({ hr: i - i0, t: h.t[i], p: h.p[i], w: h.w[i], wd: h.wd[i], s: h.s[i] });
    return out.length ? out : null;
  }
  const hlab = h => h === 0 ? "12a" : h < 12 ? h + "a" : h === 12 ? "12p" : (h - 12) + "p";
  function renderHourly() {
    $("h-title").textContent = `${DAYFULL[hDay]} ${T.dates[hDay]}, hour by hour`;
    $("h-pts").innerHTML = PKEYS.map(k => `<button class="${hPt === k ? "on" : ""}" data-k="${k}">${esc(PT[k].short)}</button>`).join("");
    $("h-pts").querySelectorAll("button").forEach(b => b.addEventListener("click", () => { hPt = b.dataset.k; renderHourly(); }));
    const rows = hourlyRange(hPt, hDay);
    if (!rows) { $("hchart").innerHTML = ""; $("hsum").innerHTML = `<span>No hourly data for this day yet.</span>`; return; }
    const W = Math.max(300, $("hchart").clientWidth || 340), H = W < 500 ? 230 : 210, L = 34, Rm = 10, tTop = 18, tH = W < 500 ? 100 : 92, pTop = tTop + tH + 22, pH = W < 500 ? 56 : 46, xb = H - 14;
    const x = i => L + (i + 0.5) * (W - L - Rm) / 24;
    const ts = rows.map(r => r.t), tmin = Math.min(...ts), tmax = Math.max(...ts);
    const ylo = Math.floor((tmin - 4) / 5) * 5, yhi = Math.ceil((tmax + 4) / 5) * 5;
    const y = t => tTop + tH - (t - ylo) / (yhi - ylo) * tH;
    const yp = p => pTop + pH - p / 100 * pH;
    const line = rows.map((r, i) => `${i ? "L" : "M"}${x(r.hr).toFixed(1)},${y(r.t).toFixed(1)}`).join("");
    const area = line + `L${x(rows[rows.length - 1].hr).toFixed(1)},${(tTop + tH).toFixed(1)}L${x(rows[0].hr).toFixed(1)},${(tTop + tH).toFixed(1)}Z`;
    const iMax = ts.indexOf(tmax), iMin = ts.indexOf(tmin);
    const pMax = Math.max(...rows.map(r => r.p)), iPmax = rows.findIndex(r => r.p === pMax);
    const ticks = []; for (let v = ylo; v <= yhi; v += (yhi - ylo) > 30 ? 10 : 5) ticks.push(v);
    const bw = (W - L - Rm) / 24 - 3;
    const svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Hourly temperature and chance of precipitation">
      <defs><linearGradient id="tg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb454" stop-opacity="0.35"/><stop offset="1" stop-color="#ffb454" stop-opacity="0"/></linearGradient></defs>
      ${ticks.map(v => `<line class="gl" x1="${L}" x2="${W - Rm}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/><text x="${L - 5}" y="${(y(v) + 3.5).toFixed(1)}" text-anchor="end">${v}°</text>`).join("")}
      <path d="${area}" fill="url(#tg)"/><path d="${line}" fill="none" stroke="#ffb454" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
      <circle cx="${x(rows[iMax].hr)}" cy="${y(tmax)}" r="4" fill="#ffb454" stroke="#141a21" stroke-width="2"/><text class="lbl" x="${x(rows[iMax].hr)}" y="${y(tmax) - 8}" text-anchor="middle">${tmax}° at ${hlab(rows[iMax].hr)}</text>
      <circle cx="${x(rows[iMin].hr)}" cy="${y(tmin)}" r="4" fill="#ffb454" stroke="#141a21" stroke-width="2"/><text class="lbl" x="${x(rows[iMin].hr)}" y="${y(tmin) + 15}" text-anchor="middle">${tmin}°</text>
      <text x="${L - 5}" y="${pTop - 6}" text-anchor="end">%</text><line class="gl" x1="${L}" x2="${W - Rm}" y1="${pTop + pH}" y2="${pTop + pH}"/><line class="gl" x1="${L}" x2="${W - Rm}" y1="${yp(50)}" y2="${yp(50)}"/><text x="${L - 5}" y="${yp(50) + 3.5}" text-anchor="end">50</text>
      ${rows.map(r => `<rect x="${(x(r.hr) - bw / 2).toFixed(1)}" y="${yp(r.p).toFixed(1)}" width="${bw.toFixed(1)}" height="${(pTop + pH - yp(r.p)).toFixed(1)}" rx="2" fill="#3987e5" opacity="${r.p ? 0.9 : 0}"/>`).join("")}
      ${pMax > 0 ? `<text class="lbl" x="${x(rows[iPmax].hr)}" y="${yp(pMax) - 5}" text-anchor="middle">${pMax}%</text>` : `<text x="${L + 6}" y="${pTop + pH - 6}">dry</text>`}
      ${rows.filter(r => r.hr % (W < 500 ? 4 : 3) === 0).map(r => `<text x="${x(r.hr)}" y="${xb + 4}" text-anchor="middle">${hlab(r.hr)}</text>`).join("")}
      <g id="hcur" style="display:none"><line y1="${tTop}" y2="${pTop + pH}" stroke="#fff" stroke-dasharray="3 3"/><text class="lbl" y="${tTop - 6}" text-anchor="middle"></text></g>
    </svg>`;
    $("hchart").innerHTML = svg;
    const wMax = Math.max(...rows.map(r => r.w)), iW = rows.findIndex(r => r.w === wMax);
    const kinds = [...new Set(rows.map(r => wxKind(r.s)))].map(k => kindLabel[k]);
    const sum = () => `<span>Temp <b>${tmin}–${tmax}°</b></span><span>Precip peaks <b>${pMax}%</b>${pMax ? " at " + hlab(rows[iPmax].hr) : ""}</span><span>Wind to <b>${wMax} mph ${rows[iW].wd}</b> at ${hlab(rows[iW].hr)}</span><span>${esc(kinds.join(", "))}</span>`;
    $("hsum").innerHTML = sum();
    const svgEl = $("hchart").querySelector("svg"), cur = svgEl.querySelector("#hcur");
    const onMove = e => { const r = svgEl.getBoundingClientRect(); const px = (e.clientX - r.left) / r.width * W; const i = Math.max(0, Math.min(23, Math.floor((px - L) / ((W - L - Rm) / 24)))); const row = rows.find(q => q.hr === i); if (!row) return; cur.style.display = ""; cur.querySelector("line").setAttribute("x1", x(i)); cur.querySelector("line").setAttribute("x2", x(i)); const t = cur.querySelector("text"); t.setAttribute("x", Math.min(W - 90, Math.max(L + 90, x(i)))); t.textContent = W < 500 ? `${hlab(i)} · ${row.t}° · ${row.p}% · ${row.w} mph ${row.wd}` : `${hlab(i)} · ${row.t}° · ${row.p}% · ${row.w} mph ${row.wd} · ${row.s}`; };
    svgEl.addEventListener("pointermove", onMove); svgEl.addEventListener("pointerdown", onMove);
    svgEl.addEventListener("pointerleave", () => { cur.style.display = "none"; });
  }
  function wxStatus(live, note) { const el = $("wxstatus"); el.className = "wxstatus" + (live ? " live" : ""); el.textContent = (live ? "Live from NWS, updated " : "NWS snapshot from ") + mt(WX.updated) + (note ? " · " + note : ""); }
  function refreshWx() {
    wxStatus(false, "checking for a newer forecast…");
    const H = { headers: { Accept: "application/geo+json" } };
    Promise.all(PKEYS.map(k => Promise.all([fetch(PT[k].url, H).then(r => r.json()), fetch(PT[k].hourly_url, H).then(r => r.json())]).then(([d, h]) => {
      const daily = d.properties.periods.filter(p => p.startTime.slice(0, 10) >= "2026-09-16" && p.startTime.slice(0, 10) <= "2026-09-21").map(p => ({ n: p.name, start: p.startTime, t: p.temperature, d: p.isDaytime, p: (p.probabilityOfPrecipitation && p.probabilityOfPrecipitation.value) || 0, w: p.windSpeed, wd: p.windDirection, s: p.shortForecast }));
      const hp = h.properties.periods.filter(p => p.startTime.slice(0, 10) >= "2026-09-17" && p.startTime.slice(0, 10) <= "2026-09-21");
      if (!daily.length) return false;
      PT[k].daily = daily;
      if (hp.length) PT[k].hourly = { start: hp[0].startTime, t: hp.map(p => p.temperature), p: hp.map(p => (p.probabilityOfPrecipitation && p.probabilityOfPrecipitation.value) || 0), w: hp.map(p => parseInt(p.windSpeed) || 0), wd: hp.map(p => p.windDirection), s: hp.map(p => p.shortForecast) };
      WX.updated = d.properties.updateTime; return true;
    }).catch(() => false))).then(ok => {
      if (ok.some(Boolean)) { wxStatus(true, ok.every(Boolean) ? "" : "some points still from the snapshot"); renderWeek(); renderWxGrid(); renderHourly(); renderCamps(); }
      else wxStatus(false, "live fetch failed, showing the saved forecast");
    });
  }

  /* ---------- elevation profiles ---------- */
  function fmtGrade(pts, i) { const a = atMile(pts, pts[i].mi - 0.05), b = atMile(pts, pts[i].mi + 0.05); const run = (b.mi - a.mi) * 5280; if (run < 50) return ""; const g = (b.sft - a.sft) / run * 100; return (g > 0 ? "+" : "") + g.toFixed(0) + "%"; }
  function makeProfile(container, opts) {
    // opts: { compact, readout(el) }
    const view = { el: container, compact: !!opts.compact, profile: null, cursor: null, readout: opts.readout };
    function render() {
      const P = view.profile; if (!P) { container.innerHTML = ""; return; }
      const W = Math.max(280, container.clientWidth || 320), H = Math.max(80, container.clientHeight || 120);
      const c = view.compact; const L = c ? 34 : 44, Rm = c ? 8 : 12, top = c ? 26 : 34, bot = c ? 14 : 20;
      const all = P.pts;
      const miMax = all[all.length - 1].mi, mi0 = all[0].mi;
      const ftMin = Math.floor((Math.min(...all.map(p => p.sft)) - 150) / 500) * 500, ftMax = Math.ceil((Math.max(...all.map(p => p.sft)) + 150) / 500) * 500;
      const x = mi => L + (mi - mi0) / (miMax - mi0) * (W - L - Rm), y = ft => top + (ftMax - ft) / (ftMax - ftMin) * (H - top - bot);
      view.x = x; view.y = y; view.W = W; view.H = H; view.miMax = miMax; view.mi0 = mi0; view.L = L; view.Rm = Rm;
      const path = pts => pts.map((p, i) => `${i ? "L" : "M"}${x(p.mi).toFixed(1)},${y(p.sft).toFixed(1)}`).join("");
      const y0 = y(ftMin);
      let g = `<g class="grid">`;
      const step = (ftMax - ftMin) > 3000 ? 1000 : 500;
      for (let f = ftMin; f <= ftMax; f += step) g += `<line x1="${L}" x2="${W - Rm}" y1="${y(f).toFixed(1)}" y2="${y(f).toFixed(1)}"/>` + (c && f === ftMin ? "" : `<text class="ax" x="${L - 4}" y="${(y(f) + 3.5).toFixed(1)}" text-anchor="end" style="fill:var(--mute);font-size:10px">${f >= 1000 ? (f / 1000).toFixed(f % 1000 ? 1 : 0) + "k" : f}</text>`);
      g += `</g>`;
      const mstep = (miMax - mi0) > 9 ? 2 : (miMax - mi0) > 4 || !c ? 1 : 0.5;
      let ax = `<g class="ax">`;
      for (let m = Math.ceil(mi0 / mstep) * mstep; m <= miMax + 1e-6; m += mstep) ax += `<text x="${x(m).toFixed(1)}" y="${H - 3}" text-anchor="middle">${m % 1 ? m.toFixed(1) : m}${m === Math.ceil(mi0 / mstep) * mstep ? " mi" : ""}</text>`;
      ax += `</g>`;
      let fills = "";
      const runs = pts => { const out = []; let cur = null; pts.forEach(p => { const e = !!p.est; if (!cur || cur.est !== e) { const nx = { est: e, pts: cur ? [cur.pts[cur.pts.length - 1], p] : [p] }; out.push(nx); cur = nx; } else cur.pts.push(p); }); return out; };
      P.segs.forEach(sg => {
        const pts = P.pts.filter(p => p.mi >= sg.from - 1e-9 && p.mi <= sg.to + 1e-9); if (pts.length < 2) return;
        const col = COL[sg.day] || COL.hike;
        const dim = S.profile === "in" && S.dayLit && (S.day === "Thu" || S.day === "Fri") && sg.day !== S.day ? 0.45 : 1;
        runs(pts).forEach(r => { fills += `<path d="${path(r.pts)}L${x(r.pts[r.pts.length - 1].mi).toFixed(1)},${y0}L${x(r.pts[0].mi).toFixed(1)},${y0}Z" fill="${col}" opacity="${(r.est ? 0.08 : 0.22) * dim}"/><path d="${path(r.pts)}" fill="none" stroke="${col}" stroke-width="${c ? 2 : 2.5}" stroke-linejoin="round" opacity="${dim * (r.est ? 0.85 : 1)}"${r.est ? ' stroke-dasharray="5 4"' : ""}/>`; });
      });
      let ann = ""; const lanes = [-999, -999, -999];
      (P.ann || []).forEach(a => { const ax_ = x(a.mi), ay = y(a.ft); const w = a.label.length * (c ? 5.6 : 6.2); const anchor = ax_ < L + w / 2 ? "start" : ax_ > W - Rm - w / 2 ? "end" : "middle"; const x0 = anchor === "start" ? ax_ : anchor === "end" ? ax_ - w : ax_ - w / 2; let lane = lanes.findIndex(v => x0 > v + 6); if (lane < 0) return; lanes[lane] = x0 + w; let ty = ay - 9 - lane * 13; if (ty < 9) ty = ay + 15 + lane * 13; ann += `<g class="ann${a.est ? " est" : ""}"><circle cx="${ax_.toFixed(1)}" cy="${ay.toFixed(1)}" r="${c ? 3 : 3.5}"/>${lane ? `<line x1="${ax_.toFixed(1)}" x2="${ax_.toFixed(1)}" y1="${(ty < ay ? ay - 4 : ay + 4).toFixed(1)}" y2="${(ty < ay ? ty + 3 : ty - 10).toFixed(1)}" stroke="rgba(255,255,255,0.35)"/>` : ""}<text x="${ax_.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="${anchor}">${esc(a.label)}</text></g>`; });
      container.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Elevation profile, ${esc(P.title)}">${g}${fills}${ann}${ax}<g class="cur" style="display:none"><line y1="${top}" y2="${y0}"/><circle r="${c ? 5 : 6}"/><text y="${top - 4}"></text></g><rect x="0" y="0" width="${W}" height="${H}" fill="transparent"/></svg>`;
      view.svg = container.querySelector("svg"); view.cur = view.svg.querySelector(".cur");
      const toMi = e => { const r = view.svg.getBoundingClientRect(); const px = (e.clientX - r.left) / r.width * W; return Math.max(mi0, Math.min(miMax, mi0 + (px - L) / (W - L - Rm) * (miMax - mi0))); };
      let down = false;
      view.svg.addEventListener("pointerdown", e => { down = true; view.svg.setPointerCapture(e.pointerId); setScrub(P.id, toMi(e)); });
      view.svg.addEventListener("pointermove", e => { if (down || e.pointerType === "mouse") setScrub(P.id, toMi(e)); });
      view.svg.addEventListener("pointerup", () => { down = false; }); view.svg.addEventListener("pointercancel", () => { down = false; });
      if (S.scrub && S.scrub.id === P.id) view.showCursor(S.scrub.mi);
    }
    view.showCursor = mi => {
      if (!view.cur || !view.profile) return; const P = view.profile; const all = P.pts;
      const p = interp(all, mi); const cx = view.x(p.mi), cy = view.y(p.sft);
      view.cur.style.display = ""; const ln = view.cur.querySelector("line"); ln.setAttribute("x1", cx); ln.setAttribute("x2", cx);
      const ci = view.cur.querySelector("circle"); ci.setAttribute("cx", cx); ci.setAttribute("cy", cy);
      const t = view.cur.querySelector("text"); t.setAttribute("x", Math.max(view.L + 40, Math.min(view.W - 40, cx))); t.setAttribute("text-anchor", "middle"); t.textContent = `${p.mi.toFixed(1)} mi · ${num(p.sft)} ft`;
    };
    view.set = id => { view.profile = PROFILES[id] || null; render(); };
    view.render = render;
    profileViews.push(view);
    return view;
  }
  function setScrub(id, mi) {
    const P = PROFILES[id]; if (!P) return;
    if (S.profile !== id) showProfile(id, false);
    S.scrub = { id, mi };
    const all = P.pts;
    const p = interp(all, mi); const i = all.indexOf(atMile(all, mi));
    profileViews.forEach(v => { if (v.profile && v.profile.id === id) v.showCursor(mi); });
    const seg = P.segs.find(s => mi >= s.from - 1e-9 && mi <= s.to + 1e-9); const est = !!all[i].est;
    const html = `<span><b>${p.mi.toFixed(1)}</b> mi</span><span><b>${num(p.sft)}</b> ft</span><span><b>${fmtGrade(all, i) || "—"}</b> grade</span><span class="hint">${est ? "estimated" : seg && seg.day && seg.day.length === 3 ? DAYFULL[seg.day] : P.short || ""}</span>`;
    $("readout").innerHTML = html; $("p-readout").innerHTML = html;
    if (scrubMarker) { scrubMarker.setLngLat([p.lon, p.lat]); scrubMarker.getElement().classList.add("on"); }
  }
  function showProfile(id, syncBig) {
    S.profile = id; const P = PROFILES[id]; if (!P) return;
    profileViews.forEach(v => v.set(id));
    $("pchips").querySelectorAll(".chip").forEach(c => c.classList.toggle("on", c.dataset.p === id));
    $("ptabs").querySelectorAll(".chip").forEach(c => c.classList.toggle("on", c.dataset.p === id));
    const st = stats(P.pts);
    $("p-title").textContent = P.title; $("p-meta").innerHTML = `<b>${st.mi.toFixed(1)}</b> mi · <b>+${num(Math.round(st.up / 50) * 50)}</b> ft · <b>−${num(Math.round(st.dn / 50) * 50)}</b> ft · high <b>${num(st.hi)}</b>${P.hike ? " · from the drawn line" : ""}`;
    $("p-note").textContent = P.note || "";
    if (!S.scrub || S.scrub.id !== id) { $("readout").innerHTML = `<span class="hint">Drag along the profile: the dot follows on the map.</span>`; $("p-readout").innerHTML = `<span class="hint">Drag across the chart to read mile, elevation, and grade.</span>`; if (scrubMarker) scrubMarker.getElement().classList.remove("on"); }
    if (map) highlightMap();
  }
  function profileChips(el) {
    el.innerHTML = Object.values(PROFILES).map(P => `<button class="chip${S.profile === P.id ? " on" : ""}" data-p="${P.id}"><span class="sw" style="background:${COL[P.day] || COL.hike}"></span>${esc(P.short)}</button>`).join("");
    el.querySelectorAll(".chip").forEach(c => c.addEventListener("click", () => { showProfile(c.dataset.p, true); if (el.id === "pchips") return; }));
  }

  /* ---------- GPX ---------- */
  const SHORT = [[/^Trailhead/, "Trailhead"], [/^Thu camp/, "Thu camp"], [/^Walker Lake/, "Walker Lake"], [/^Pass above Hook/, "Pass"], [/^Hook Lake/, "Hook Lake"], [/Cove Lake/, "Cove Lake camp"], [/^Sapphire/, "Sapphire Lake"], [/^Cirque/, "Cirque Lake"], [/^The Kettles/, "The Kettles"], [/^Ridge bench/, "Ridge bench"], [/^D\.O\. Lee/, "D.O. Lee ridge"]];
  function loadGpx() {
    return fetch("../options/gpx/bigboulder.gpx").then(r => r.text()).then(txt => {
      const x = new DOMParser().parseFromString(txt, "application/xml");
      const wpts = [...x.getElementsByTagName("wpt")].map(w => ({ lat: +w.getAttribute("lat"), lon: +w.getAttribute("lon"), name: (w.getElementsByTagName("name")[0] || {}).textContent || "" })).map(w => ({ ...w, short: (SHORT.find(s => s[0].test(w.name)) || [0, w.name])[1] }));
      const trks = [...x.getElementsByTagName("trk")].map(t => ({ name: (t.getElementsByTagName("name")[0] || {}).textContent || "", segs: [...t.getElementsByTagName("trkseg")].map(s => [...s.getElementsByTagName("trkpt")].map(p => [+p.getAttribute("lat"), +p.getAttribute("lon"), +((p.getElementsByTagName("ele")[0] || {}).textContent || 0)])) }));
      const main = trks[0].segs; // Thu, Fri, Sat, Sun, Mon
      const annotate = (pts, extra) => { const out = []; wpts.forEach(w => { const n = nearest(pts, w.lat, w.lon); if (n.m < 90 && !out.some(o => o.label === w.short || Math.abs(o.mi - pts[n.i].mi) < 0.08)) out.push({ mi: pts[n.i].mi, ft: pts[n.i].sft, label: w.short }); }); return out.concat(extra || []).sort((a, b) => a.mi - b.mi); };
      // the way in
      const thu = build(main[0], 0), fri = build(main[1], thu[thu.length - 1].mi);
      const inPts = thu.concat(fri.slice(1));
      PROFILES.in = { id: "in", short: "Thu + Fri · in", day: "Fri", title: "Trailhead to creek camp to Cove Lake", pts: inPts, segs: [{ from: 0, to: thu[thu.length - 1].mi, day: "Thu" }, { from: thu[thu.length - 1].mi, to: inPts[inPts.length - 1].mi, day: "Fri" }], ann: annotate(inPts), note: "Thursday's 4 miles in amber, Friday's climb past Walker Lake and over the pass in blue. Monday is this line right to left. Trail legs follow OpenStreetMap; the pass is a terrain-fitted line, follow the cairns.", geo: [{ day: "Thu", pts: thu }, { day: "Fri", pts: fri }] };
      const mon = build(main[4], 0);
      PROFILES.out = { id: "out", short: "Mon · out", day: "Mon", title: "Monday: Cove Lake to the trailhead", pts: mon, segs: [{ from: 0, to: mon[mon.length - 1].mi, day: "Mon" }], ann: annotate(mon), note: "Also the Sunday early exit. The use trail fades near the bottom of the pass and wanders toward the cliffs above Walker Lake: stay on the line.", geo: [{ day: "Mon", pts: mon }] };
      (T.dayhikes || []).forEach(h => {
        const trk = trks.find(t => t.name.includes(h.gpx)); if (!trk) return;
        let pts = build(trk.segs[0], 0); let est = null;
        if (!h.loop) {
          if (h.est_extend) { let last = pts[pts.length - 1]; est = []; h.est_extend.forEach(([dmi, ft, lab]) => { const p = { lat: last.lat, lon: last.lon, ft, sft: ft, mi: last.mi + dmi, label: lab, est: true }; est.push(p); last = p; }); }
          const far = est ? est[est.length - 1] : pts[pts.length - 1];
          // the return is the outbound line mirrored, distances continuing from the far end
          const outAll = pts.concat(est || []); const total = outAll[outAll.length - 1].mi;
          const ret = outAll.slice(0, -1).map((p, j) => ({ ...p, est: !!(p.est || outAll[j + 1].est), mi: total + (total - p.mi) })).reverse();
          const annBase = annotate(pts, est ? est.map(e => ({ mi: e.mi, ft: e.ft, label: e.label, est: true })) : []);
          annBase.push({ mi: total, ft: far.sft, label: est ? "" : "turn around", est: !!est });
          const full = outAll.concat(ret);
          PROFILES[h.id] = { id: h.id, short: h.name.split(",")[0].replace(/Cove → Sapphire → Cirque Lakes/, "Three lakes"), day: "hike", title: h.name, pts: full, segs: [{ from: 0, to: full[full.length - 1].mi, day: "hike" }], ann: annBase.filter(a => a.label), note: (est ? "Solid: the terrain-fitted line from the GPX, out and back. Dashed: the estimated push beyond it. " : "Out and back on the terrain-fitted line. ") + (h.est_note || ""), geo: [{ day: "hike", pts }], hike: h };
        } else {
          PROFILES[h.id] = { id: h.id, short: "Three lakes loop", day: "hike", title: h.name, pts, segs: [{ from: 0, to: pts[pts.length - 1].mi, day: "hike" }], ann: annotate(pts), note: "A loop on the terrain-fitted line: Sapphire, Cirque, up the ramp toward the Kettles, and back to camp.", geo: [{ day: "hike", pts }], hike: h };
        }
      });
      // geojson for the map
      legsGeo = { type: "FeatureCollection", features: [PROFILES.in.geo[0], PROFILES.in.geo[1], PROFILES.out.geo[0]].map(g => ({ type: "Feature", properties: { day: g.day, pid: g.day === "Mon" ? "out" : "in" }, geometry: { type: "LineString", coordinates: g.pts.map(p => [p.lon, p.lat]) } })) };
      hikesGeo = { type: "FeatureCollection", features: Object.values(PROFILES).filter(P => P.hike).map(P => ({ type: "Feature", properties: { pid: P.id, name: P.hike.name }, geometry: { type: "LineString", coordinates: P.geo[0].pts.map(p => [p.lon, p.lat]) } })) };
      legsGeo.features.forEach(f => { legBounds[f.properties.day] = bbox(f.geometry.coordinates.map(c => [c[1], c[0]])); });
      hikesGeo.features.forEach(f => { hikeBounds[f.properties.pid] = bbox(f.geometry.coordinates.map(c => [c[1], c[0]])); });
      routeBounds = bbox(PROFILES.in.pts.concat(...Object.values(PROFILES).filter(P => P.hike).map(P => P.pts)));
    });
  }

  /* ---------- map ---------- */
  function webgl() { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; } }
  function sheetPad() { const sh = $("sheet"); if (window.innerWidth >= 900) return { top: 130, bottom: 40, left: sh.offsetWidth + 40, right: 150 }; const h = sh.classList.contains("collapsed") ? 70 : sh.offsetHeight + 16; return { top: 130, bottom: Math.min(h + 10, 320), left: 24, right: 120 }; }
  // fit bounds while pitched: fit flat, then correct zoom and pan from the projected corners, then animate to the result
  function fitView(b, o) {
    o = o || {}; const pad = sheetPad(); const bearing = o.bearing != null ? o.bearing : map.getBearing(), pitch = o.pitch != null ? o.pitch : map.getPitch();
    const prev = { center: map.getCenter(), zoom: map.getZoom(), bearing: map.getBearing(), pitch: map.getPitch() };
    const cam = map.cameraForBounds(b, { padding: pad, bearing }); if (!cam) return;
    map.jumpTo({ center: cam.center, zoom: Math.min(cam.zoom, o.maxZoom || 16), bearing, pitch });
    const W = map.getContainer().clientWidth, H = map.getContainer().clientHeight, aw = W - pad.left - pad.right, ah = H - pad.top - pad.bottom;
    const corners = () => { const c = [[b[0][0], b[0][1]], [b[1][0], b[0][1]], [b[1][0], b[1][1]], [b[0][0], b[1][1]]].map(q => map.project(q)); const xs = c.map(q => q.x), ys = c.map(q => q.y); return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) }; };
    for (let k = 0; k < 4; k++) { const r = corners(); const sc = Math.min(aw / Math.max(1, r.x1 - r.x0), ah / Math.max(1, r.y1 - r.y0)); map.jumpTo({ zoom: Math.min(map.getZoom() + Math.log2(sc), o.maxZoom || 16) }); const r2 = corners(); map.panBy([(r2.x0 + r2.x1) / 2 - (pad.left + aw / 2), (r2.y0 + r2.y1) / 2 - (pad.top + ah / 2)], { duration: 0 }); }
    const tgt = { center: map.getCenter(), zoom: map.getZoom(), bearing, pitch };
    map.jumpTo(prev);
    if (o.duration === 0 || reduceMotion) map.jumpTo(tgt); else map.easeTo({ ...tgt, duration: o.duration || 1200 });
  }
  function initMap() {
    if (!webgl() || typeof maplibregl === "undefined") { $("nowebgl").classList.add("on"); return; }
    map = new maplibregl.Map({
      container: "map", attributionControl: false, maxPitch: 72, maxZoom: 17.5, minZoom: 8,
      center: [-114.575, 44.11], zoom: 11.5, pitch: 0, bearing: 0,
      style: { version: 8, sources: {
        sat: { type: "raster", tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"], tileSize: 256, maxzoom: 18, attribution: "Imagery © Esri, Maxar, Earthstar Geographics" },
        topo: { type: "raster", tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"], tileSize: 256, maxzoom: 17, attribution: "Topo © Esri, USGS" },
        dem: { type: "raster-dem", tiles: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"], encoding: "terrarium", tileSize: 256, maxzoom: 14, attribution: "Terrain: Mapzen, AWS Open Data" }
      }, layers: [{ id: "sat", type: "raster", source: "sat" }, { id: "topo", type: "raster", source: "topo", layout: { visibility: "none" } }] }
    });
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
    const zoomCls = () => { const z = map.getZoom(); $("map").classList.toggle("z-far", z < 13); $("map").classList.toggle("z-mid", z >= 13 && z < 14); }; map.on("zoom", zoomCls); zoomCls();
    map.touchZoomRotate.enable(); map.dragRotate.enable();
    map.once("style.load", () => {
      try { map.setTerrain({ source: "dem", exaggeration: 1.35 }); } catch (e) { S.threeD = false; }
      try { if (map.setSky) map.setSky({ "sky-color": "#0b1b2e", "horizon-color": "#26425c", "fog-color": "#0e1216", "sky-horizon-blend": 0.6, "horizon-fog-blend": 0.7, "fog-ground-blend": 0.45 }); } catch (e) { }
      map.addSource("legs", { type: "geojson", data: legsGeo });
      map.addSource("hikes", { type: "geojson", data: hikesGeo });
      map.addLayer({ id: "legs-casing", type: "line", source: "legs", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#0e1216", "line-width": 7, "line-opacity": 0.55, "line-offset": ["case", ["==", ["get", "day"], "Mon"], 6, 0] } });
      map.addLayer({ id: "legs-line", type: "line", source: "legs", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": ["match", ["get", "day"], "Thu", COL.Thu, "Fri", COL.Fri, "Mon", COL.Mon, COL.hike], "line-width": 4, "line-offset": ["case", ["==", ["get", "day"], "Mon"], 6, 0] } });
      map.addLayer({ id: "hikes-casing", type: "line", source: "hikes", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#0e1216", "line-width": 6, "line-opacity": 0.5 } });
      map.addLayer({ id: "hikes-line", type: "line", source: "hikes", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": COL.hike, "line-width": 3, "line-dasharray": [2, 2] } });
      addMarkers();
      const el = document.createElement("div"); el.className = "scrubmk"; scrubMarker = new maplibregl.Marker({ element: el }).setLngLat([th.lon, th.lat]).addTo(map);
      fitView(routeBounds, { bearing: -28, pitch: 0, duration: 0 });
      setTimeout(() => fitView(routeBounds, { bearing: -28, pitch: 58, duration: 1800 }), 250);
      map.on("click", "legs-line", e => { const f = e.features[0]; const P = PROFILES[f.properties.pid]; const n = nearest(P.pts, e.lngLat.lat, e.lngLat.lng); showProfile(P.id, true); setScrub(P.id, P.pts[n.i].mi); });
      map.on("click", "hikes-line", e => { const f = e.features[0]; const P = PROFILES[f.properties.pid]; const n = nearest(P.pts, e.lngLat.lat, e.lngLat.lng); showProfile(P.id, true); setScrub(P.id, P.pts[n.i].mi); });
      ["legs-line", "hikes-line"].forEach(id => { map.on("mouseenter", id, () => { map.getCanvas().style.cursor = "pointer"; }); map.on("mouseleave", id, () => { map.getCanvas().style.cursor = ""; }); });
      map.on("dragstart", stopFly); map.on("wheel", stopFly);
      highlightMap();
    });
    map.on("error", e => { if (e && e.error && /terrain|dem/i.test(String(e.error.message || ""))) { try { map.setTerrain(null); } catch (x) { } } });
    $("b-base").addEventListener("click", () => { S.base = S.base === "sat" ? "topo" : "sat"; map.setLayoutProperty("sat", "visibility", S.base === "sat" ? "visible" : "none"); map.setLayoutProperty("topo", "visibility", S.base === "topo" ? "visible" : "none"); $("b-base").textContent = S.base === "sat" ? "TOPO" : "SAT"; $("b-base").setAttribute("aria-label", S.base === "sat" ? "Switch to topo map" : "Switch to satellite"); });
    $("b-3d").addEventListener("click", () => { S.threeD = !S.threeD; $("b-3d").classList.toggle("on", S.threeD); try { map.setTerrain(S.threeD ? { source: "dem", exaggeration: 1.35 } : null); } catch (e) { } fitView(S.hike ? hikeBounds[S.hike] : routeBounds, { pitch: S.threeD ? 58 : 0, duration: 900, maxZoom: S.hike ? 14.8 : 16 }); });
    $("b-fit").addEventListener("click", () => { stopFly(); S.hike = null; S.dayLit = false; highlightMap(); fitView(routeBounds, { bearing: -28, pitch: S.threeD ? 58 : 0, duration: 1200 }); });
    let locMarker = null;
    $("b-loc").addEventListener("click", () => {
      if (!navigator.geolocation) return alert("No location on this device.");
      $("b-loc").classList.add("on");
      navigator.geolocation.getCurrentPosition(pos => { const ll = [pos.coords.longitude, pos.coords.latitude]; if (!locMarker) { const e = document.createElement("div"); e.className = "scrubmk on"; e.style.background = "#3ddc84"; locMarker = new maplibregl.Marker({ element: e }).setLngLat(ll).addTo(map); } else locMarker.setLngLat(ll); map.flyTo({ center: ll, zoom: Math.max(map.getZoom(), 13.5), duration: 1500 }); $("b-loc").classList.remove("on"); }, () => { $("b-loc").classList.remove("on"); alert("Could not get a location fix."); }, { enableHighAccuracy: true, timeout: 15000 });
    });
    $("b-fly").addEventListener("click", () => { if (S.flying) stopFly(); else flyRoute(); });
    $("handle").addEventListener("click", () => { $("sheet").classList.toggle("collapsed"); setTimeout(() => profileViews.forEach(v => v.render()), 260); });
  }
  function popup(html, lngLat) { new maplibregl.Popup({ offset: 18, closeButton: true, maxWidth: "280px" }).setLngLat(lngLat).setHTML(html).addTo(map); }
  function marker(lat, lon, cls, icon, label, onClick) {
    const el = document.createElement("div"); el.className = "mk " + cls; el.innerHTML = `<div class="ic">${icon}</div>${label ? `<div class="lb">${esc(label)}</div>` : ""}`;
    if (onClick) el.addEventListener("click", e => { e.stopPropagation(); onClick(); });
    return new maplibregl.Marker({ element: el, anchor: "left" }).setLngLat([lon, lat]).addTo(map);
  }
  function addMarkers() {
    marker(th.lat, th.lon, "th", I.flag, "Trailhead", () => popup(`<b>${esc(th.name)}</b><small>${num(th.elev_ft)} ft · ${th.lat.toFixed(5)}, ${th.lon.toFixed(5)}</small>${esc(th.camping_thursday)}<div class="pl"><a href="#camps">Details</a><a href="${gmap(th.lat, th.lon)}" target="_blank" rel="noopener">Google Maps</a></div>`, [th.lon, th.lat]));
    camps.forEach(c => { const lab = c.nights.length > 1 ? c.nights[0] + "–" + c.nights[c.nights.length - 1] + " camp" : c.nights[0] + " camp"; marker(c.lat, c.lon, "camp", I.tent, lab, () => popup(`<b>${esc(lab)} · ${esc(c.name)}</b><small>${num(c.elev_ft)} ft · ${c.lat.toFixed(5)}, ${c.lon.toFixed(5)}</small>${esc(c.why).slice(0, 220)}…<div class="pl"><a href="#camp-${c.key}">Details</a><a href="${gmap(c.lat, c.lon)}" target="_blank" rel="noopener">Google Maps</a></div>`, [c.lon, c.lat])); });
    (T.camps[0].alternatives || []).forEach(a => marker(a.lat, a.lon, "alt", "", a.name + " (alt)", () => popup(`<b>Alternative camp · ${esc(a.name)}</b>${esc(a.note)}`, [a.lon, a.lat])));
    const seen = new Set(camps.map(c => c.name).concat((T.camps[0].alternatives || []).map(a => a.name)));
    (T.dayhikes || []).forEach(h => (h.points || []).forEach(p => { if (!p[2] || /Cove Lake/.test(p[2]) || /Sapphire/.test(p[2]) || seen.has(p[2])) return; seen.add(p[2]); marker(p[0], p[1], "pt", "", p[2].replace(" (approx.)", ""), () => popup(`<b>${esc(p[2])}</b><small>${esc(h.name)}</small>${esc(h.why).slice(0, 200)}…<div class="pl"><a href="#hikes">Day hikes</a></div>`, [p[1], p[0]])); }));
  }
  function highlightMap() {
    if (!map || !map.getLayer("legs-line")) return;
    const d = S.dayLit ? S.day : null;
    let legOp, hikeOp;
    if (S.hike) { legOp = 0.3; hikeOp = ["case", ["==", ["get", "pid"], S.hike], 1, 0.25]; }
    else if (d === "Thu" || d === "Fri") { legOp = ["case", ["==", ["get", "day"], d], 1, 0.3]; hikeOp = 0.35; }
    else if (d === "Mon") { legOp = ["case", ["==", ["get", "day"], "Mon"], 1, 0.3]; hikeOp = 0.3; }
    else if (d === "Sat") { legOp = 0.3; hikeOp = ["case", ["==", ["get", "pid"], "kettles"], 1, 0.3]; }
    else if (d === "Sun") { legOp = 0.3; hikeOp = 1; }
    else { legOp = 1; hikeOp = 0.9; }
    map.setPaintProperty("legs-line", "line-opacity", legOp); map.setPaintProperty("hikes-line", "line-opacity", hikeOp);
    $("legend").querySelectorAll("span").forEach((s, i) => { s.style.opacity = !d && !S.hike ? 1 : (["Thu", "Fri", "Mon"][i] === d || (i === 3 && (d === "Sat" || d === "Sun" || S.hike))) ? 1 : 0.4; });
  }
  function selectDay(day, moveMap) {
    stopFly(); S.day = day; S.dayLit = true; S.hike = null;
    $("weekcards").querySelectorAll(".dcard").forEach(b => { b.classList.toggle("on", b.dataset.day === day); b.setAttribute("aria-pressed", b.dataset.day === day); });
    renderDayDetail();
    const pid = { Thu: "in", Fri: "in", Sat: "kettles", Sun: "dolee", Mon: "out" }[day];
    if (PROFILES[pid]) { S.scrub = null; showProfile(pid, true); }
    highlightMap();
    if (map && moveMap) { const b = day === "Thu" ? legBounds.Thu : day === "Fri" ? legBounds.Fri : day === "Mon" ? legBounds.Mon : bbox([].concat(...Object.values(hikeBounds))); if (b) fitView(b, { duration: 1200, maxZoom: 14.6 }); }
    // keep the selected card in view on phones
    const card = $("weekcards").querySelector(`.dcard[data-day="${day}"]`); if (card && window.innerWidth < 900) card.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest", inline: "start" });
  }
  function selectHike(id) {
    stopFly(); S.hike = id; S.dayLit = false; S.scrub = null;
    $("weekcards").querySelectorAll(".dcard").forEach(b => b.classList.remove("on"));
    showProfile(id, true); highlightMap();
    if (map && hikeBounds[id]) fitView(hikeBounds[id], { duration: 1200, maxZoom: 14.8 });
  }
  let flyRaf = null;
  function stopFly() { if (!S.flying) return; S.flying = false; cancelAnimationFrame(flyRaf); $("b-fly").classList.remove("on"); $("b-fly").innerHTML = I.play + "Fly it"; }
  function flyRoute() {
    if (!map) return; const P = PROFILES[S.profile] || PROFILES.in; const pts = P.pts; const total = pts[pts.length - 1].mi - pts[0].mi;
    S.flying = true; $("b-fly").classList.add("on"); $("b-fly").innerHTML = I.stop + "Stop";
    const dur = Math.max(18000, Math.min(45000, total * 5000)); const zoom = 14.3, pitch = 64;
    const b0 = bearing([pts[0].lat, pts[0].lon], [interp(pts, pts[0].mi + 0.2).lat, interp(pts, pts[0].mi + 0.2).lon]);
    map.easeTo({ center: [pts[0].lon, pts[0].lat], zoom, pitch, bearing: b0, duration: 1600 });
    let t0 = null, lastB = b0;
    const step = ts => {
      if (!S.flying) return;
      if (t0 === null) { t0 = ts; }
      const f = Math.min(1, (ts - t0 - 1600) / dur);
      if (f >= 0) {
        const mi = pts[0].mi + f * total; const p = interp(pts, mi), q = interp(pts, Math.min(pts[pts.length - 1].mi, mi + 0.15));
        let b = bearing([p.lat, p.lon], [q.lat, q.lon]); let diff = ((b - lastB + 540) % 360) - 180; lastB = (lastB + diff * 0.06 + 360) % 360;
        map.jumpTo({ center: [p.lon, p.lat], zoom, pitch, bearing: lastB });
        S.scrub = { id: P.id, mi }; profileViews.forEach(v => { if (v.profile && v.profile.id === P.id) v.showCursor(mi); });
        if (scrubMarker) { scrubMarker.setLngLat([p.lon, p.lat]); scrubMarker.getElement().classList.add("on"); }
        const i = pts.indexOf(atMile(pts, mi)); $("readout").innerHTML = `<span><b>${mi.toFixed(1)}</b> mi</span><span><b>${num(p.sft)}</b> ft</span><span><b>${fmtGrade(pts, i) || "—"}</b> grade</span><span class="hint">flying</span>`;
      }
      if (f < 1) flyRaf = requestAnimationFrame(step); else { stopFly(); map.easeTo({ zoom: zoom - 1.2, pitch: 58, duration: 1500 }); }
    };
    flyRaf = requestAnimationFrame(step);
  }

  /* ---------- camps, hikes, logistics ---------- */
  function campWx(k) { const rows = DAYS.map(d => { const n = period(k, d, true); return n ? `${d} ${n.t}°` : null; }).filter(Boolean); return rows.length ? `<dt>Lows</dt><dd>${rows.join(" · ")}</dd>` : ""; }
  function renderCamps() {
    const cc = camps[0], cv = camps[1];
    $("campcards").innerHTML = `
      <div class="card" id="camp-th"><div class="top"><span class="tag">Trailhead</span><h3>${esc(th.name)}</h3><span class="n"><b>${num(th.elev_ft)}</b> ft</span></div><p>${esc(th.road)}</p>
        <dl class="kv"><dt>Thu night</dt><dd>${esc(th.camping_thursday)}</dd>${campWx("th")}</dl>
        <div class="links"><button class="pill" data-fly="${th.lat},${th.lon}">${I.pin} On the map</button><a class="pill" href="${gmap(th.lat, th.lon)}" target="_blank" rel="noopener">Google Maps</a></div></div>
      <div class="card" id="camp-cc" style="--c:${COL.Thu}"><div class="top"><span class="tag c">Thu night</span><h3>${esc(cc.name)}</h3><span class="n"><b>${num(cc.elev_ft)}</b> ft</span></div><p>${esc(cc.why)}</p>
        <dl class="kv"><dt>From TH</dt><dd><b>${num(cc.miles_from_th)} mi · +${num(cc.up_ft)} ft · ${hrs(cc.time_hr)}</b></dd><dt>Water</dt><dd>${esc(cc.water)}</dd><dt>Tents</dt><dd>${esc(cc.tents)}</dd>${campWx("cc")}</dl>
        <div class="links"><button class="pill" data-fly="${cc.lat},${cc.lon}">${I.pin} On the map</button><a class="pill" href="${gmap(cc.lat, cc.lon)}" target="_blank" rel="noopener">Google Maps</a><span class="pill" style="cursor:default;color:var(--mute)">${cc.lat.toFixed(5)}, ${cc.lon.toFixed(5)}</span></div></div>
      <div class="card photo" id="camp-cv" style="--c:${COL.Fri};position:relative"><img src="${esc(T.photo.src)}" alt="White Cloud Mountains" loading="lazy"><span class="cr">${esc(T.photo.credit)}</span><div class="inner">
        <div class="top"><span class="tag c">Fri–Sun nights</span><h3>${esc(cv.name)}</h3><span class="n"><b>${num(cv.elev_ft)}</b> ft</span></div><p>${esc(cv.why)}</p>
        <dl class="kv"><dt>Water</dt><dd>${esc(cv.water)}</dd><dt>Tents</dt><dd>${esc(cv.tents)}</dd><dt>Shelter</dt><dd>${esc(cv.shelter_wind)}</dd>${campWx("cv")}</dl>
        <div class="altlist">${(cv.alternatives || []).map(a => `<div><b>${esc(a.name)}:</b> ${esc(a.note)} <button class="pill" style="min-height:26px;padding:3px 9px;font-size:12px;margin-left:4px" data-fly="${a.lat},${a.lon}">On the map</button></div>`).join("")}</div>
        <div class="links"><button class="pill" data-fly="${cv.lat},${cv.lon}">${I.pin} On the map</button><a class="pill" href="${gmap(cv.lat, cv.lon)}" target="_blank" rel="noopener">Google Maps</a><span class="pill" style="cursor:default;color:var(--mute)">${cv.lat.toFixed(5)}, ${cv.lon.toFixed(5)}</span></div></div></div>`;
    bindFly($("campcards"));
  }
  function bindFly(root) {
    root.querySelectorAll("[data-fly]").forEach(b => b.addEventListener("click", () => { const [la, lo] = b.dataset.fly.split(",").map(Number); $("top").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" }); if (map) setTimeout(() => map.flyTo({ center: [lo, la], zoom: 14.6, pitch: S.threeD ? 60 : 0, duration: 1800, padding: sheetPad() }), 350); }));
  }
  function miniProfile(P) {
    const all = P.pts; const W = 300, H = 64, lo = Math.min(...all.map(p => p.sft)) - 80, hi = Math.max(...all.map(p => p.sft)) + 40, mx = all[all.length - 1].mi;
    const x = m => 2 + m / mx * (W - 4), y = f => 4 + (hi - f) / (hi - lo) * (H - 8);
    const d = pts => pts.map((p, i) => `${i ? "L" : "M"}${x(p.mi).toFixed(1)},${y(p.sft).toFixed(1)}`).join("");
    const runs = []; let cur = null; all.forEach(p => { const e = !!p.est; if (!cur || cur.est !== e) { cur = { est: e, pts: cur ? [cur.pts[cur.pts.length - 1], p] : [p] }; runs.push(cur); } else cur.pts.push(p); });
    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">${runs.map(r => `<path d="${d(r.pts)}L${x(r.pts[r.pts.length - 1].mi).toFixed(1)},${H}L${x(r.pts[0].mi).toFixed(1)},${H}Z" fill="${COL.hike}" opacity="${r.est ? 0.06 : 0.14}"/><path d="${d(r.pts)}" fill="none" stroke="${COL.hike}" stroke-width="2"${r.est ? ' stroke-dasharray="4 3" opacity="0.8"' : ""}/>`).join("")}</svg>`;
  }
  function renderHikes() {
    $("hikecards").innerHTML = (T.dayhikes || []).map((h, i) => { const P = PROFILES[h.id]; return `<div class="card">
      <div class="top"><span class="rank">${i + 1}</span><h3>${esc(h.name)}</h3></div>
      <div class="st" style="font-size:13px;color:var(--ink-2);margin-top:4px"><b style="color:var(--ink)">${num(h.miles_rt)}</b> mi round trip · <b style="color:var(--ink)">+${num(h.gain_ft)}</b> ft · high <b style="color:var(--ink)">${num(h.high_ft)}</b> · ${hrs(h.time_hr)}</div>
      ${P ? `<div class="mini">${miniProfile(P)}</div>` : ""}
      <p>${esc(h.why)}</p>
      <dl class="kv"><dt>Terrain</dt><dd>${esc(h.difficulty)}</dd></dl>
      <div class="links"><button class="pill" data-hike="${h.id}">${I.pin} On the map</button><button class="pill" data-prof="${h.id}">${I.chart} Profile</button></div></div>`; }).join("");
    $("hikecards").querySelectorAll("[data-hike]").forEach(b => b.addEventListener("click", () => { selectHike(b.dataset.hike); $("top").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" }); }));
    $("hikecards").querySelectorAll("[data-prof]").forEach(b => b.addEventListener("click", () => { showProfile(b.dataset.prof, true); $("profile").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" }); }));
  }
  function renderLogistics() {
    let DEPART = 12 * 60 + 30;
    const fmt = m => { m = Math.round(m / 5) * 5; const h = Math.floor(m / 60) % 24, mm = m % 60; return `${h % 12 || 12}:${String(mm).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`; };
    const cls = m => m <= 18 * 60 ? "arr-ok" : m <= 19 * 60 + 30 ? "arr-tight" : "arr-dark";
    const dir = o => `https://www.google.com/maps/dir/?api=1&origin=${o}&destination=${th.lat},${th.lon}`;
    $("logi").innerHTML = `
      <div class="card"><h3>Thursday timing</h3><p>Leaving at <input class="tm" type="time" id="depart" value="12:30" step="900">, no stops. Sunset is about 7:30; add 20 minutes at the trailhead to sort packs. Green means in camp with light to spare.</p><div class="arrive" id="arrive"></div>
        <div class="links"><a class="pill" href="${dir("Pocatello,+ID")}" target="_blank" rel="noopener">Directions from Pocatello</a><a class="pill" href="${dir("Salt+Lake+City+International+Airport")}" target="_blank" rel="noopener">From SLC</a></div></div>
      <div class="card"><h3>Permits, bears, water</h3><ul class="plain"><li>${esc(T.permits_regs)}</li><li>${esc(T.bears_food)}</li><li>${esc(T.water)}</li></ul></div>
      <div class="card"><h3>Hazards, fishing, contact</h3><ul class="plain"><li>${esc(T.hazards)}</li><li>${esc(T.fishing)}</li><li>${esc(T.cell_sat)}</li></ul></div>
      <div class="card"><h3>Files, links, photo spots</h3><div class="links" style="margin-top:8px"><a class="pill primary" href="../options/gpx/bigboulder.gpx" download>GPX: route, camps, day hikes</a><a class="pill" href="https://www.alltrails.com/trail/us/idaho/big-boulder-lakes-via-walker-lake" target="_blank" rel="noopener">AllTrails</a>${(T.sources || []).slice(1, 6).map(u => `<a class="pill" href="${esc(u)}" target="_blank" rel="noopener">${esc(u.replace(/^https?:\/\/(www\.)?/, "").split("/")[0])}</a>`).join("")}</div>
        <p style="margin-top:12px">${(T.best_photo_spots || []).map(esc).join(" · ")}</p></div>`;
    const arrive = () => { const a = DEPART + th.drive_poc_hr * 60, b = DEPART + th.drive_slc_hr * 60, walk = camps[0].time_hr || 0; $("arrive").innerHTML = `<div><small>From Pocatello</small><b class="${cls(a)}">${fmt(a)}</b><span>in camp ~${fmt(a + walk * 60 + 20)}</span></div><div><small>From SLC</small><b class="${cls(b)}">${fmt(b)}</b><span>in camp ~${fmt(b + walk * 60 + 20)}</span></div>`; };
    arrive();
    $("depart").addEventListener("change", e => { const [h, m] = e.target.value.split(":").map(Number); if (!isNaN(h)) { DEPART = h * 60 + (m || 0); arrive(); } });
    $("foot").innerHTML = `Path Beaters '26 · Big Boulder Lakes · forecasts <a href="https://www.weather.gov/">NWS</a>, refreshed in the browser · imagery Esri, terrain Mapzen via AWS Open Data · route on OpenStreetMap trails via BRouter, off-trail legs terrain-fitted · <a href="../options/">options board</a> · <a href="../">Spanish Peaks site</a>`;
  }

  /* ---------- boot ---------- */
  renderWeek(); renderWxGrid(); renderHourly(); renderCamps(); renderLogistics(); wxStatus(false, "");
  const sheetView = makeProfile($("prof-sheet"), { compact: true });
  const bigView = makeProfile($("prof-big"), { compact: false });
  loadGpx().then(() => {
    profileChips($("pchips")); profileChips($("ptabs"));
    renderHikes();
    showProfile("in", true);
    initMap();
  }).catch(err => { console.error(err); $("p-title").textContent = "Could not load the GPX"; $("nowebgl").classList.add("on"); $("nowebgl").innerHTML = `<div><b>The route file did not load.</b><br>Open the page from the web server rather than as a local file.</div>`; });
  let rz; window.addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => { profileViews.forEach(v => v.render()); renderHourly(); }, 150); });
  refreshWx();
  // nav highlight
  const links = [...document.querySelectorAll(".topbar a.nl")].filter(a => a.getAttribute("href").startsWith("#"));
  const secs = links.map(a => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  if ("IntersectionObserver" in window) { const io = new IntersectionObserver(es => { es.forEach(e => { if (e.isIntersecting) links.forEach(a => a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id)); }); }, { rootMargin: "-40% 0px -55% 0px" }); secs.forEach(s => io.observe(s)); }
})();
