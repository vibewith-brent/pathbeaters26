#!/usr/bin/env python3
"""Refresh the NWS forecast snapshot in bigboulder/wx.js.

Run: python3 bigboulder/fetch_wx.py
Pulls the daily and hourly NWS forecasts for the trailhead and both proposed camps and writes
them as the WX_SNAPSHOT constant. The page also fetches live from NWS in the browser; this
snapshot is what shows when the live fetch fails (no network, API down)."""
import json, sys, urllib.request, datetime, os

POINTS = [
    ("th", "Trailhead", "Big Boulder Creek TH, Livingston Mill", 44.13114, -114.51328, 7137),
    ("cc", "Creek camp", "Big Boulder Creek bench, Thu night", 44.11114, -114.57539, 8600),
    ("cv", "Cove Lake", "Cove Lake camp, Fri to Sun nights", 44.10125, -114.60833, 9848),
]
TRIP_DAYS = ("2026-09-17", "2026-09-21")
UA = {"User-Agent": "pathbeaters26 trip page", "Accept": "application/geo+json"}

def get(url):
    return json.load(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60))

out = {"updated": None, "points": {}}
for key, short, name, lat, lon, elev in POINTS:
    meta = get(f"https://api.weather.gov/points/{lat:.4f},{lon:.4f}")["properties"]
    daily = get(meta["forecast"])["properties"]
    hourly = get(meta["forecastHourly"])["properties"]
    out["updated"] = daily["updateTime"]
    d = [
        {"n": p["name"], "start": p["startTime"], "t": p["temperature"], "d": p["isDaytime"],
         "p": (p["probabilityOfPrecipitation"] or {}).get("value") or 0,
         "w": p["windSpeed"], "wd": p["windDirection"], "s": p["shortForecast"]}
        for p in daily["periods"] if "2026-09-16" <= p["startTime"][:10] <= TRIP_DAYS[1]
    ]
    hp = [p for p in hourly["periods"] if TRIP_DAYS[0] <= p["startTime"][:10] <= TRIP_DAYS[1]]
    h = {"start": hp[0]["startTime"] if hp else None,
         "t": [p["temperature"] for p in hp],
         "p": [(p["probabilityOfPrecipitation"] or {}).get("value") or 0 for p in hp],
         "w": [int(str(p["windSpeed"]).split()[0]) for p in hp],
         "wd": [p["windDirection"] for p in hp],
         "s": [p["shortForecast"] for p in hp]}
    out["points"][key] = {
        "short": short, "name": name, "lat": lat, "lon": lon, "elev_ft": elev,
        "grid_elev_ft": round(daily["elevation"]["value"] * 3.28084),
        "grid": f'{meta["gridId"]} {meta["gridX"]},{meta["gridY"]}',
        "url": meta["forecast"], "hourly_url": meta["forecastHourly"],
        "nws_page": f"https://forecast.weather.gov/MapClick.php?lat={lat}&lon={lon}",
        "daily": d, "hourly": h,
    }
    print(key, short, "daily", len(d), "hourly", len(hp), file=sys.stderr)

path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "wx.js")
with open(path, "w") as f:
    f.write("/* NWS forecast snapshot for the trailhead and both camps. Regenerate with: python3 bigboulder/fetch_wx.py */\n")
    f.write("const WX_SNAPSHOT = " + json.dumps(out, separators=(",", ":")) + ";\n")
print("wrote", path, "updated", out["updated"], file=sys.stderr)
