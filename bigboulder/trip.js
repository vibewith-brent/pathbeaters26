/* Big Boulder Lakes trip data. Coordinates from the routed GPX (OpenStreetMap trails via BRouter) and OSM lake positions; camp spots are best-judgment picks from trip reports, marked as estimates where noted. */
const TRIP = {
  nights: "3",
  dates: { Thu: "Sep 17", Fri: "Sep 18", Sat: "Sep 19", Sun: "Sep 20", Mon: "Sep 21" },
  high_ft: 10461,
  wu_town: "mackay", wu_label: "Mackay",
  photo: { src: "../options/img/bigboulder.jpg", credit: "Crater Lake, White Clouds · Roy Luck · CC BY 2.0" },
  trailhead: {
    name: "Big Boulder Creek TH at Livingston Mill", lat: 44.13114, lon: -114.51328, elev_ft: 7137, drive_poc_hr: 3.5, drive_slc_hr: 5.5,
    road: "From Hwy 75 at the East Fork Salmon River (between Clayton and Stanley), take East Fork Rd south about 18 miles; pavement gives way to gravel for the last stretch to Livingston Mill. Passenger-car passable when dry, washboard in places, fine for the Sprinter and the Tacoma. Big parking area at the road end, no toilet, no potable water; Big Boulder Creek is close. Sign the wilderness register. No cell service from Challis on; the last text goes out on Hwy 75.",
    camping_thursday: "Dispersed car camping at the Livingston Mill road end, or a flat pullout on the last mile of road. This is the fallback if the weather stops the Thursday hike-in."
  },
  thursday: {
    camp: { name: "Big Boulder Creek bench, ~4 mi in", lat: 44.11114, lon: -114.57539, elev_ft: 8600, miles_from_th: 4, up_ft: 1700, down_ft: 200, time_hr: 2.25,
      why: "The first miles climb gently along Big Boulder Creek past the old Livingston Mine, open to motorcycles for the first two. At about 2 to 2.5 miles the trail splits: left goes to Frog Lake and the Boulder Chain, right crosses the creek on a log footbridge toward Walker Lake. This camp is about a mile and a half past that junction on the Walker side, roughly 8,600 ft, in forest by the creek, before the trail steepens for the last two miles to Walker Lake. Tent spots are a best-judgment estimate from the track, not a surveyed site: take the first good flat bench, 200 ft off the water. Fires are legal here, below 8,800 ft.",
      water: "Big Boulder Creek, filter.", tents: "Small forest benches; expect two or three clusters rather than one big pad. Plenty of room for eight spread out." },
    fallback: "Rain plan: stay in Pocatello Thursday night, leave about 5 am, at the trailhead by 8:30, and hike the full 6.4 miles to Walker Lake Friday. Saturday move over the pass to Cove Lake with the afternoon in the lakes; Sunday a day hike; Monday out.",
    notes: "Leaving Pocatello at 12:30 puts us at the trailhead about 4:00. Packs on by 4:20 and walking by 4:30, at the 4-mile camp around 6:30 with an hour of light to set up. That is as far as is reasonable without hiking in the dark; if the group is moving slowly, stop at the first good bench after the Frog Lake junction instead. Cold dinner or a quick stove meal.",
  },
  camps: [
    { night: "Fri", name: "Cove Lake, upper Big Boulder Lakes", lat: 44.10125, lon: -114.60833, elev_ft: 9848,
      why: "The basin camp for two nights. From the west end of the north shore of Walker Lake a cairned use trail climbs an open rocky slope to a pass above Hook Lake at about 10,100 ft, then drops past Hook to Cove. Trip reports describe ample sites at Cove with nobody there, the established ones at the southeast corner and back from the water, with a low rock spine just above camp that gives a 360-degree view. Stoves only: no fires above 8,800 ft except within 200 yards of Walker or Island Lake.",
      water: "The lake and its outlet creek, filter.", tents: "Sites are singles and small clusters, not one big pad; spread the group in two or three clusters along the southeast and east shore, 200 ft from the water. Freestanding tents, everything staked: afternoon wind at Cove has been logged at 40 mph.", shelter_wind: "Copses of whitebark and spruce at treeline; camp behind trees or the rock spine, not on the open west shore.",
      alternatives: [
        { name: "Walker Lake", lat: 44.10690, lon: -114.59745, note: "9,245 ft, forested, the most campsites and the only upper lake where fires are legal; busy on weekends. Use it if the group is tired Friday or the basin is windy; Cove is then a 1.5-mile morning move over the pass." },
        { name: "Sapphire Lake", lat: 44.10290, lon: -114.61500, note: "9,894 ft, an established site at the outlet and a peninsula site, used as a base for peak days. Windier than Cove." }
      ] },
    { night: "Sat", name: "Cove Lake (same camp)", lat: 44.10125, lon: -114.60833, elev_ft: 9848, why: "Second night at the same camp. Saturday is the loop through Sapphire and Cirque lakes with light packs.", water: "Same.", tents: "Same.", shelter_wind: "Same.", alternatives: [] },
    { night: "Sun", name: "Cove Lake (same camp)", lat: 44.10125, lon: -114.60833, elev_ft: 9848, why: "Third night for the group. Anyone bailing early follows the Sun → out line back down to the rigs instead.", water: "Same.", tents: "Same.", shelter_wind: "Same.", alternatives: [] }
  ],
  dayhikes: [
    { id: "kettles", gpx: "Kettles", loop: true, name: "Cove → Sapphire → Cirque Lakes, plus the Kettles", from: "Cove Lake camp", miles_rt: 4, gain_ft: 900, high_ft: 10300, difficulty: "class 1 to 2, mostly bare open ground between the lakes; the Kettles moraine above Cirque is loose boulders", time_hr: 4,
      points: [[44.10125, -114.60833, "Cove Lake"], [44.10290, -114.61500, "Sapphire Lake"], [44.10650, -114.62093, "Cirque Lake"], [44.10125, -114.60833, ""]],
      why: "The signature walk: thirty minutes to Sapphire, then open ground to Cirque Lake hard under the east face of D.O. Lee. Add the ramp above Cirque to the Kettles moraine at 10,300 ft for the strange white shattered rock that names the range. Swim at Sapphire, lunch at Cirque, fish on the way back." },
    { id: "dolee", gpx: "D.O. Lee", est_extend: [[0.5, 11342, "Summit (est.)"]], name: "D.O. Lee Peak, 11,342 ft", from: "Cove Lake camp", miles_rt: 5, gain_ft: 1500, high_ft: 11342, difficulty: "class 3, not a walk-up: talus above Cirque Lake to the saddle north of the peak, then a short steep scramble to the summit; the downclimb is the crux. Be off by early afternoon.", time_hr: 6,
      points: [[44.10125, -114.60833, "Cove Lake"], [44.10350, -114.62500, "Ridge under D.O. Lee"], [44.0985, -114.6330, "D.O. Lee Peak (approx.)"]],
      why: "The summit day for the scramblers. About eight parties a year climb it, almost all from this basin. Summit position on the map is approximate; the ridge waypoint is the verified start." },
    { id: "saddle", gpx: "ridge bench", est_extend: [[0.4, 10500, "Saddle above Slide (est.)"]], est_note: "Slide and Sheep lakes beyond the saddle are not on the terrain-fitted line; the plan's 5 miles round trip includes them.", name: "Sheep and Slide lakes over the saddle from Cirque", from: "Cove Lake camp", miles_rt: 5, gain_ft: 1200, high_ft: 10500, difficulty: "class 2, a sporadic use trail from Cirque over the saddle to Slide, well defined from Slide to Sheep; no trail from Cirque to the saddle", time_hr: 5,
      points: [[44.10125, -114.60833, "Cove Lake"], [44.10650, -114.62093, "Cirque Lake"], [44.10350, -114.62500, "Saddle above Slide (approx.)"]],
      why: "The middle option: the saddle above Slide Lake is the one spot that looks down on all of the Big Boulder Lakes at once, and Sheep Lake beyond it is quiet. Return the same way; the Bighorn Creek descent to Walker is a longer loop for a full day." },
    { id: "fish", gpx: "fishing loop", name: "Fish the basin, mellow day", from: "Cove Lake camp", miles_rt: 2, gain_ft: 400, high_ft: 10065, difficulty: "class 1 between the lakes", time_hr: 3,
      points: [[44.10125, -114.60833, "Cove Lake"], [44.10290, -114.61500, "Sapphire Lake"], [44.10650, -114.62093, "Cirque Lake"]],
      why: "Cove, Sapphire, and Cirque are the three most fished lakes in the basin, all cutthroat, stocked on a three-year rotation that lands on 2026. Limit six, Idaho license required. The rock spine above Cove is the napping spot." }
  ],
  legs: [
    { day: "Thu", from: "Trailhead", to: "creek camp", miles: 4, up_ft: 1700, down_ft: 200, time_hr: 2.25, notes: "Weather permitting. Leave Pocatello 12:30, walking by 4:30, camp by about 6:30. Gentle forest trail along Big Boulder Creek past the old mine and the Frog Lake junction; the steep part is tomorrow." },
    { day: "Fri", from: "creek camp", to: "Walker Lake → Cove Lake", miles: 3.5, up_ft: 1500, down_ft: 250, time_hr: 3.5, notes: "Two and a half miles to Walker Lake, steep and rocky at the end. At the 5.5-mile junction go right for Walker (left is Island Lake). Lunch at Walker, then the cairned use trail from the west end of the north shore up to the pass above Hook Lake and down to Cove, under a mile. Follow the GPX on this section; every trip report loses the path here." },
    { day: "Sat", from: "Cove Lake", to: "Sapphire and Cirque lakes, back to camp", miles: 3, up_ft: 700, down_ft: 700, time_hr: 3, notes: "Light packs. The three-lake loop, with the rest of the day at camp." },
    { day: "Sun", from: "Cove Lake", to: "day hike, back to camp", miles: 4, up_ft: 1100, down_ft: 1100, time_hr: 4, notes: "Pick from the day-hike list: D.O. Lee Peak for the summit crew, Hook Lake and the ridge for the rest." },
    { day: "Mon", from: "Cove Lake", to: "Trailhead", miles: 8, up_ft: 450, down_ft: 3100, time_hr: 4, notes: "Over the pass and down to Walker Lake, the one place to be careful: the use trail fades near the bottom and wanders toward the cliffs above the lake. Stay on the GPX line. Then the trail out Big Boulder Creek." },
    { day: "Sun → out", note: "Early exit from Cove Lake straight to the rigs instead of the day hike", miles: 8, up_ft: 450, down_ft: 3100 }
  ],
  alt_schedule: [],
  rain_plan: { title: "Rain plan: Pocatello Thursday night", legs: [
    ["Thu", "sleep in Pocatello; leave about 5 am Friday", 0, 0, 0],
    ["Fri", "trailhead by 8:30, hike to Walker Lake, camp (fires legal here)", 6.5, 2200, 150],
    ["Sat", "over the pass to Cove Lake, afternoon in the lakes", 1, 700, 100],
    ["Sun", "day hike from Cove, camp again", 4, 1100, 1100],
    ["Mon", "out", 8, 450, 3100]
  ] },
  gpx_segments: [{ day: "Fri", label: "Thu + Fri: trailhead to Walker Lake" }, { day: "Fri", label: "Fri: Walker Lake to Cove Lake, over the pass" }, { day: "Sat", label: "Sat + Sun: the basin lakes" }, { day: "Mon", label: "Mon: out, also the Sunday early exit" }],
  water: "Water everywhere: Big Boulder Creek the whole way in, Walker Lake, and the basin lakes. Filter everything.",
  bears_food: "Black bear country, no established grizzlies. Forest Service rule: hang food 10 ft up and 4 ft out, or use canisters. Mountain goats and bighorn are common in the basin; September is hunting season, so a bright layer is smart.",
  permits_regs: "No permit; sign the trailhead register. Wilderness rules: group limit 12 people, camp on used surfaces 200 ft from water, catholes 200 ft from water. Campfires prohibited above 8,800 ft except within 200 yards of Walker or Island Lake, so the basin camp is stoves only.",
  fishing: "Cutthroat in every lake, rainbows in Walker and Cove too; no goldens. Cove, Sapphire, and Cirque are the best. Limit six, no special rules, Idaho license required.",
  hazards: "The Walker-to-pass section is loose rock and route-finding, and the descent is where parties hit the cliffs above Walker Lake: follow the GPX. Afternoon wind at Cove has hit 40 mph. Storms build fast and the basin is above treeline with nowhere to hide. Clear nights at 9,850 ft drop into the teens and twenties: 20°F bags. Altitude on night one is the other common complaint. Microspikes only if the forecast turns to snow.",
  cell_sat: "No cell service from Livingston Mill on. Carry the satellite messenger; last text from the East Fork road.",
  best_photo_spots: ["The pass above Hook Lake with the white face of D.O. Lee straight ahead, late light", "The rock spine above Cove Lake, 360 degrees", "Sapphire Lake from the peninsula", "Cirque Lake against the east face of D.O. Lee", "The saddle above Slide Lake, all the lakes at once", "Walker Lake reflection at dawn, before the wind"],
  sources: ["https://www.alltrails.com/trail/us/idaho/big-boulder-lakes-via-walker-lake", "https://thebigoutside.com/exploring-a-wilderness-hopeful-idahos-white-cloud-mountains/", "https://noahlangphotography.com/blog/walker-lake-trail-big-boulder-lakes-white-cloud-mountains-idaho", "https://backcountrypost.com/threads/big-boulder-lakes-white-clouds-july-3-5-2015.4940/", "https://www.summitpost.org/big-boulder-lakes/568943"],
};
