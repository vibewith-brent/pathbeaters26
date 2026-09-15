/* Big Boulder Lakes trip page. Data comes from trip.js (TRIP) built from the research pass; the GPX in ../options/gpx/bigboulder.gpx is drawn on the map. */
(function () {
  const T = (typeof TRIP !== "undefined") ? TRIP : window.TRIP;
  const esc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  const num = v => (v == null || v === "") ? "—" : Number(v).toLocaleString();
  const q = p => p < 15 ? "q0" : p < 30 ? "q1" : p < 45 ? "q2" : p < 65 ? "q3" : p < 80 ? "q4" : "q5";
  const DAYCLS = { Thu: "thu", Fri: "fri", Sat: "sat", Sun: "sun", Mon: "mon" };
  const COL = { Thu: "#857f73", Fri: "#5f88ad", Sat: "#a0522d", Sun: "#2f7a4f", Mon: "#857f73" };
  const gmap = (lat, lon) => `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;

  /* ----- hero credit + stats ----- */
  if (T.photo) document.getElementById("hero-credit").textContent = T.photo.credit;
  if (T.photo && T.photo.src) document.getElementById("hero-img").src = T.photo.src;
  const legs = T.legs.filter(l => l.miles != null && !/out/i.test(l.day));
  const tot = legs.reduce((a, l) => [a[0] + l.miles, a[1] + (l.up_ft || 0), a[2] + (l.down_ft || 0)], [0, 0, 0]);
  const hp = Math.max(...T.camps.map(c => c.elev_ft || 0), ...(T.dayhikes || []).map(h => h.high_ft || 0), T.high_ft || 0);
  document.getElementById("stats").innerHTML = [
    [num(Math.round(tot[0] * 2) / 2), "miles"], ["+" + num(Math.round(tot[1] / 100) * 100), "ft up"], ["−" + num(Math.round(tot[2] / 100) * 100), "ft down"],
    [num(hp), "ft high point"], [T.nights || "3", "nights"], [T.trailhead.drive_poc_hr + " h", "from Pocatello"]
  ].map(([b, s]) => `<div><b>${b}</b><small>${s}</small></div>`).join("");

  /* ----- day cards ----- */
  const plan = T.alt_schedule && T.alt_schedule.length ? T.alt_schedule : T.legs;
  const sunOut = plan.find(l => /out/i.test(l.day) && /sun/i.test(l.day));
  const daysBox = document.getElementById("days");
  daysBox.innerHTML = plan.filter(l => !/out/i.test(l.day)).map(l => {
    const key = l.day.slice(0, 3);
    return `<div class="day ${DAYCLS[key] || ""}">
      <div class="head"><span class="d">${esc(l.day)}</span><h3>${esc(l.from && l.to ? l.from + " → " + l.to : l.title || "")}</h3>
        <span class="n">${l.miles != null ? `<b>${num(l.miles)}</b> mi · <b>+${num(l.up_ft)}</b> · <b>−${num(l.down_ft)}</b>${l.time_hr ? " · " + l.time_hr + " h" : ""}` : ""}</span></div>
      ${l.notes ? `<p>${esc(l.notes)}</p>` : ""}
      ${key === "Sun" && sunOut ? `<div class="alt"><b>Sun → out</b> · ${esc(sunOut.note || "")}${sunOut.miles != null ? ` · <b>${num(sunOut.miles)} mi · +${num(sunOut.up_ft)} · −${num(sunOut.down_ft)}</b>` : ""}</div>` : ""}
    </div>`;
  }).join("");
  if (T.thursday && T.thursday.fallback) {
    const thu = daysBox.querySelector(".day.thu");
    if (thu) thu.insertAdjacentHTML("beforeend", `<div class="alt" style="border-color:var(--rule);color:var(--ink-2)"><b>If the weather is bad</b> · ${esc(T.thursday.fallback)}</div>`);
  }
  const rows = plan.filter(l => l.miles != null && !/out/i.test(l.day)).map(l => ({ label: l.day.slice(0, 3), mi: l.miles, up: l.up_ft || 0, down: l.down_ft || 0 }));
  if (sunOut && sunOut.miles != null) rows.push({ label: "Sun→out", mi: sunOut.miles, up: sunOut.up_ft || 0, down: sunOut.down_ft || 0, alt: true });
  const chartEl = document.getElementById("chart");
  const drawChart = () => { if (typeof dayChart === "function") chartEl.innerHTML = dayChart(rows, { width: Math.max(300, chartEl.clientWidth || 600) }); };
  drawChart(); let rz; window.addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(drawChart, 200); });

  /* ----- camps ----- */
  const camps = [];
  if (T.thursday && T.thursday.camp) camps.push({ night: "Thu", ...T.thursday.camp, why: T.thursday.camp.why, alternatives: [{ name: "Trailhead", note: T.thursday.fallback }] });
  camps.push(...T.camps);
  document.getElementById("camp-cards").innerHTML = camps.map(c => `<div class="card" id="camp-${c.night}">
    <div class="top"><span class="tag">${esc(c.night)} night</span><h3>${esc(c.name)}</h3><span class="n">${c.elev_ft ? num(c.elev_ft) + " ft" : ""}</span></div>
    <p>${esc(c.why)}</p>
    <dl class="kv">
      ${c.water ? `<dt>Water</dt><dd>${esc(c.water)}</dd>` : ""}
      ${c.tents ? `<dt>Tents</dt><dd>${esc(c.tents)}</dd>` : ""}
      ${c.shelter_wind ? `<dt>Shelter</dt><dd>${esc(c.shelter_wind)}</dd>` : ""}
      ${c.miles_from_th != null ? `<dt>From TH</dt><dd>${num(c.miles_from_th)} mi · +${num(c.up_ft)} ft${c.time_hr ? " · " + c.time_hr + " h" : ""}</dd>` : ""}
      ${c.alternatives && c.alternatives.length ? `<dt>If taken</dt><dd>${c.alternatives.map(a => `<b>${esc(a.name)}</b>${a.note ? ": " + esc(a.note) : ""}`).join("<br>")}</dd>` : ""}
    </dl>
    <div class="links"><a class="pill" data-fly="${c.lat},${c.lon}" href="#map-sec">Show on map</a><a class="pill" href="${gmap(c.lat, c.lon)}" target="_blank" rel="noopener">Google Maps</a><span class="pill" style="cursor:default">${c.lat.toFixed(5)}, ${c.lon.toFixed(5)}</span></div>
  </div>`).join("");

  /* ----- day hikes ----- */
  document.getElementById("hike-cards").innerHTML = (T.dayhikes || []).map((h, i) => `<div class="card">
    <div class="top"><span class="rank">${i + 1}</span><h3>${esc(h.name)}</h3><span class="n">${num(h.miles_rt)} mi · +${num(h.gain_ft)}${h.time_hr ? " · " + h.time_hr + " h" : ""}</span></div>
    <p>${esc(h.why)}</p>
    <dl class="kv"><dt>Terrain</dt><dd>${esc(h.difficulty)}</dd>${h.from ? `<dt>From</dt><dd>${esc(h.from)}</dd>` : ""}${h.high_ft ? `<dt>High</dt><dd>${num(h.high_ft)} ft</dd>` : ""}</dl>
    ${h.points && h.points.length ? `<div class="links"><a class="pill" data-fly="${h.points[h.points.length - 1][0]},${h.points[h.points.length - 1][1]}" href="#map-sec">Show on map</a></div>` : ""}
  </div>`).join("");

  /* ----- weather ----- */
  const PERIODS = ["Thursday", "Thursday Night", "Friday", "Friday Night", "Saturday", "Saturday Night", "Sunday", "Sunday Night"];
  const PLABEL = ["Thu", "Thu·n", "Fri", "Fri·n", "Sat", "Sat·n", "Sun", "Sun·n"];
  const cond = s => /thunder|t-storm/i.test(s) ? "Storms" : /snow/i.test(s) ? "Snow" : /rain|shower/i.test(s) ? "Showers" : /partly|mostly/i.test(s) ? "Partly cloudy" : /cloud/i.test(s) ? "Cloudy" : "Clear";
  function renderWx(id, pt) {
    document.getElementById(id).innerHTML = PERIODS.map((n, i) => { const p = pt.periods.find(x => x.n === n); return p ? `<div class="c ${q(p.p)}" title="${esc(p.s)} · ${esc(p.w)}"><i>${PLABEL[i]}</i><b>${p.t}°</b><i>${p.p}%</i><i>${cond(p.s)}</i></div>` : `<div class="c">—</div>`; }).join("");
  }
  const stamp = (iso, live) => { const s = new Date(iso).toLocaleString("en-US", { timeZone: "America/Denver", weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); document.getElementById("wx-status").textContent = (live ? "Live from NWS, updated " : "Snapshot from ") + s + " MT. Cells: high or low temperature, chance of precipitation, Thursday through Sunday night."; };
  const W = T.wx;
  document.getElementById("wx-hi-meta").textContent = "NWS grid " + num(W.hp.elev_ft) + " ft";
  document.getElementById("wx-th-meta").textContent = "NWS grid " + num(W.th.elev_ft) + " ft";
  renderWx("wx-hi", W.hp); renderWx("wx-th", W.th); stamp(W.hp.updated, false);
  const nws = pt => `https://forecast.weather.gov/MapClick.php?lat=${pt.lat}&lon=${pt.lon}`;
  document.getElementById("wx-links").innerHTML = `<a class="pill primary" href="${nws(W.hp)}" target="_blank" rel="noopener">NWS forecast, basin</a><a class="pill" href="${nws(W.hp)}&FcstType=graphical" target="_blank" rel="noopener">NWS hourly graph</a><a class="pill" href="${nws(W.th)}" target="_blank" rel="noopener">NWS forecast, trailhead</a><a class="pill" href="https://www.wunderground.com/forecast/us/id/${T.wu_town || "mackay"}" target="_blank" rel="noopener">10-day, ${esc(T.wu_label || "Mackay")} (town)</a>`;
  Promise.all(["th", "hp"].map(k => fetch(W[k].url, { headers: { Accept: "application/geo+json" } }).then(r => r.json()).then(j => {
    const periods = j.properties.periods.filter(p => { const d = p.startTime.slice(0, 10); return d >= "2026-09-17" && d <= "2026-09-21"; })
      .map(p => ({ n: p.name, t: p.temperature, d: p.isDaytime, p: (p.probabilityOfPrecipitation && p.probabilityOfPrecipitation.value) || 0, w: p.windSpeed + " " + p.windDirection, s: p.shortForecast }));
    if (periods.length) { W[k].periods = periods; W[k].updated = j.properties.updateTime; return true; } return false;
  }).catch(() => false))).then(ok => { if (ok.some(Boolean)) { renderWx("wx-hi", W.hp); renderWx("wx-th", W.th); stamp(W.hp.updated, true); } });

  /* ----- logistics ----- */
  const th = T.trailhead;
  let DEPART = 12 * 60;
  const fmt = m => { m = Math.round(m / 5) * 5; const h = Math.floor(m / 60) % 24, mm = m % 60; return `${h % 12 || 12}:${String(mm).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`; };
  const cls = m => m <= 18 * 60 ? "arr-ok" : m <= 19 * 60 + 30 ? "arr-tight" : "arr-dark";
  function arrive() {
    const a = DEPART + th.drive_poc_hr * 60, b = DEPART + th.drive_slc_hr * 60;
    const walk = T.thursday && T.thursday.camp ? T.thursday.camp.time_hr : 0;
    document.getElementById("arrive").innerHTML = `<div><small>From Pocatello</small><b class="${cls(a)}">${fmt(a)}</b>${walk ? `in camp ~${fmt(a + walk * 60 + 20)}` : ""}</div><div><small>From SLC</small><b class="${cls(b)}">${fmt(b)}</b>${walk ? `in camp ~${fmt(b + walk * 60 + 20)}` : ""}</div>`;
  }
  const dir = (o) => `https://www.google.com/maps/dir/?api=1&origin=${o}&destination=${th.lat},${th.lon}`;
  document.getElementById("logi").innerHTML = `
    <div class="card"><h3>Thursday timing</h3><p>Leaving at <input class="tm" type="time" id="depart" value="12:00" step="900">, no stops. Sunset is about 7:30; add 20 minutes at the trailhead to sort packs.</p><div class="arrive" id="arrive"></div>
      <div class="links" style="margin-top:10px"><a class="pill" href="${dir("Pocatello,+ID")}" target="_blank" rel="noopener">Directions from Pocatello</a><a class="pill" href="${dir("Salt+Lake+City+International+Airport")}" target="_blank" rel="noopener">From SLC</a><a class="pill" href="${gmap(th.lat, th.lon)}" target="_blank" rel="noopener">Trailhead in Google Maps</a></div></div>
    <div class="card"><h3>Trailhead and road</h3><p>${esc(th.road)}</p><dl class="kv"><dt>Where</dt><dd><b>${esc(th.name)}</b> · ${num(th.elev_ft)} ft · ${th.lat.toFixed(5)}, ${th.lon.toFixed(5)}</dd>${th.camping_thursday ? `<dt>Thu night</dt><dd>${esc(th.camping_thursday)}</dd>` : ""}</dl></div>
    <div class="card"><h3>Permits, bears, water</h3><ul class="plain"><li>${esc(T.permits_regs)}</li><li>${esc(T.bears_food)}</li><li>${esc(T.water)}</li></ul></div>
    <div class="card"><h3>Hazards, fishing, contact</h3><ul class="plain"><li>${esc(T.hazards)}</li><li>${esc(T.fishing)}</li><li>${esc(T.cell_sat)}</li></ul></div>
    <div class="card" style="grid-column:1/-1"><h3>Files and links</h3><div class="links"><a class="pill primary" href="../options/gpx/bigboulder.gpx" download>GPX: route, camps, day hikes</a><a class="pill" href="https://www.alltrails.com/trail/us/idaho/big-boulder-lakes-via-walker-lake" target="_blank" rel="noopener">AllTrails</a>${(T.sources || []).slice(0, 6).map(u => `<a class="pill" href="${esc(u)}" target="_blank" rel="noopener">${esc(u.replace(/^https?:\/\/(www\.)?/, "").split("/")[0])}</a>`).join("")}</div>
      ${T.best_photo_spots && T.best_photo_spots.length ? `<p style="margin-top:10px;color:var(--ink-2);font-size:14px"><span class="lab">Photo spots</span><br>${T.best_photo_spots.map(esc).join(" · ")}</p>` : ""}</div>`;
  arrive();
  document.getElementById("depart").addEventListener("change", e => { const [h, m] = e.target.value.split(":").map(Number); if (!isNaN(h)) { DEPART = h * 60 + (m || 0); arrive(); } });
  document.getElementById("foot").innerHTML = `Path Beaters '26 · built Sept 15, 2026 · forecasts <a href="https://www.weather.gov/">NWS</a> · route on OpenStreetMap trails via BRouter · basemap Esri · <a href="../options/">options board</a> · <a href="../">Spanish Peaks site</a>`;

  /* ----- map ----- */
  if (typeof L === "undefined") return;
  const map = L.map("map", { scrollWheelZoom: false, zoomSnap: 0.25 }).setView([44.108, -114.575], 12);
  const topo = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}", { maxZoom: 17, attribution: "Esri, USGS, OpenStreetMap contributors" }).addTo(map);
  const sat = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 17, attribution: "Esri, Maxar, Earthstar Geographics" });
  document.querySelectorAll("#baseseg button").forEach(b => b.addEventListener("click", () => { document.querySelectorAll("#baseseg button").forEach(x => x.classList.remove("on")); b.classList.add("on"); if (b.dataset.b === "sat") { map.removeLayer(topo); sat.addTo(map); } else { map.removeLayer(sat); topo.addTo(map); } }));
  const hikeLayer = L.layerGroup().addTo(map);
  document.querySelectorAll("#layerseg button").forEach(b => b.addEventListener("click", () => { document.querySelectorAll("#layerseg button").forEach(x => x.classList.remove("on")); b.classList.add("on"); if (b.dataset.l === "hikes") hikeLayer.addTo(map); else map.removeLayer(hikeLayer); }));
  const bounds = [];
  const pt = (lat, lon, o) => { bounds.push([lat, lon]); return L.circleMarker([lat, lon], o).addTo(map); };
  pt(th.lat, th.lon, { radius: 7, color: "#1c1b18", weight: 2, fillColor: "#fff", fillOpacity: 1 }).bindTooltip("Trailhead", { permanent: true, direction: "right", offset: [8, 0], className: "plain" }).bindPopup(`<b>${esc(th.name)}</b><small>${num(th.elev_ft)} ft</small>${esc(th.road)}<div class="pl"><a href="${gmap(th.lat, th.lon)}" target="_blank" rel="noopener">Google Maps</a></div>`);
  const groups = [];
  camps.forEach(c => { const g = groups.find(x => Math.abs(x.lat - c.lat) < 1e-4 && Math.abs(x.lon - c.lon) < 1e-4); if (g) g.nights.push(c.night); else groups.push({ ...c, nights: [c.night] }); });
  groups.forEach(c => { const lab = c.nights.length > 1 ? c.nights[0] + "–" + c.nights[c.nights.length - 1] : c.nights[0];
    pt(c.lat, c.lon, { radius: 8, color: "#7c3f22", weight: 1.5, fillColor: "#a0522d", fillOpacity: 0.95 })
    .bindTooltip(lab + " camp", { permanent: true, direction: "right", offset: [9, 0], className: "plain" })
    .bindPopup(`<b>${esc(lab)} camp · ${esc(c.name)}</b><small>${num(c.elev_ft)} ft · ${c.lat.toFixed(5)}, ${c.lon.toFixed(5)}</small>${esc(c.why)}<div class="pl"><a href="#camp-${c.nights[0]}">Details</a><a href="${gmap(c.lat, c.lon)}" target="_blank" rel="noopener">Google Maps</a></div>`); });
  camps.forEach(c => (c.alternatives || []).forEach(a => { if (a.lat && a.lon) pt(a.lat, a.lon, { radius: 5, color: "#a0522d", weight: 1.5, fillColor: "#fff", fillOpacity: 1, dashArray: "2 2" }).bindTooltip("alt · " + a.name).bindPopup(`<b>Alternative camp · ${esc(a.name)}</b>${esc(a.note || "")}`); }));
  (T.dayhikes || []).forEach((h, i) => {
    const pts = (h.points || []).map(p => [p[0], p[1]]);
    if (pts.length > 1) L.polyline(pts, { color: "#c98a3a", weight: 3, dashArray: "6 6", opacity: 0.9 }).bindTooltip("Day hike " + (i + 1) + " · " + h.name).addTo(hikeLayer);
    (h.points || []).forEach(p => { if (p[2]) L.circleMarker([p[0], p[1]], { radius: 4.5, color: "#1c1b18", weight: 1.5, fillColor: "#fff", fillOpacity: 1 }).bindTooltip(p[2]).addTo(hikeLayer); bounds.push([p[0], p[1]]); });
  });
  document.querySelectorAll("[data-fly]").forEach(a => a.addEventListener("click", e => { e.preventDefault(); const [la, lo] = a.dataset.fly.split(",").map(Number); document.getElementById("map-sec").scrollIntoView({ behavior: "smooth" }); setTimeout(() => map.flyTo([la, lo], 14, { duration: 0.8 }), 300); }));
  fetch("../options/gpx/bigboulder.gpx").then(r => r.text()).then(txt => {
    const x = new DOMParser().parseFromString(txt, "application/xml");
    const trks = [...x.getElementsByTagName("trk")];
    trks.forEach(trk => {
      const name = (trk.getElementsByTagName("name")[0] || {}).textContent || "";
      const isHike = /day hike/i.test(name);
      [...trk.getElementsByTagName("trkseg")].forEach((seg, i) => {
        const ll = [...seg.getElementsByTagName("trkpt")].map(p => [+p.getAttribute("lat"), +p.getAttribute("lon")]);
        if (ll.length < 2) return;
        const segInfo = (T.gpx_segments || [])[i] || {};
        const label = isHike ? name : (segInfo.label || ["Fri", "Sat", "Sun", "Mon"][Math.min(i, 3)]);
        const dayKey = segInfo.day || Object.keys(COL).find(k => label.startsWith(k)) || "Mon";
        const line = L.polyline(ll, isHike ? { color: "#c98a3a", weight: 3, dashArray: "6 6", opacity: 0.9 } : { color: COL[dayKey], weight: 4, opacity: 0.9 }).bindTooltip(isHike ? name.replace(/^Day hike · /, "Day hike · ") : label + " leg");
        if (isHike) line.addTo(hikeLayer); else line.addTo(map);
        ll.forEach(p => bounds.push(p));
      });
    });
    if (bounds.length) map.fitBounds(bounds, { padding: [24, 24] });
  }).catch(() => { if (bounds.length) map.fitBounds(bounds, { padding: [24, 24] }); });
})();
