# Lost Coast Trail · Tide & Permit Planner

An interactive trip planner for backpacking California's **Lost Coast Trail** (King Range Wilderness) over **2 to 6 days** in either direction (**North → South** or **South → North**).

## Features

- **Interactive Coastal Tide Map:** Visualizes the 24.6-mile coastline from Mattole Trailhead to Black Sands Beach (Shelter Cove) and live-colors the 3 impassable tide zones based on the selected day and time of day:
  - **Zone 1 · Punta Gorda** (0.25 mi, `< 6.0 ft`)
  - **Zone 2 · Sea Lion Gulch to Randall Creek** (4.0 mi, `< 2.5 ft`)
  - **Zone 3 · Miller Flat to Gitchell Creek** (4.5 mi, `< 3.0 ft`)
- **Live NOAA Tide Curves:** Fetches 6-minute and high/low predictions from **NOAA CO-OPS Station `9418024` (Shelter Cove, CA)** with daylight (sunrise/sunset) shading and a time-of-day scrubber.
- **Best Start Dates (±3 Days) with 1–3 ★ Ratings:** Evaluates a 7-day window around your selected date and rates start dates up to `★★★` based on passability and how comfortably mid-day the crossings fall relative to sunrise and sunset.
- **2–6 Day Schedule & Zone Entry Deadlines:** Computes recommended entry times, hard "hit-it-by" deadlines, and exit times at a conservative 1.0 mph pace.
- **90-Day Permit Calculator & Checklist:** Calculates the Recreation.gov (`#445864`) 90-day rolling release (`7:00 AM PT`), seasonal quotas (`60/day` summer vs. `30/day` off-season), group fees, refund deadlines, campfire bans, and safety non-negotiables.
- **Coastal Weather Almanac:** Shows Shelter Cove monthly climate normals plus the last 5 years of actual same-date weather from the Open-Meteo Historical Archive.

## Local Development

```bash
npm install
npm run dev
```

## Production Build & Netlify Deploy

`netlify.toml` is pre-configured for Netlify:

- **Build command:** `npm run build`
- **Publish directory:** `dist`

```bash
npm run build
```

## References

- [BigDirtyHikes: How to Get a Lost Coast Trail Permit](https://bigdirtyhikes.com/guides/lost-coast-trail-permit)
- [Recreation.gov Permit #445864 (King Range Wilderness)](https://www.recreation.gov/permits/445864)
- [NOAA Tide Predictions — Shelter Cove (9418024)](https://tidesandcurrents.noaa.gov/noaatidepredictions.html?id=9418024)

## License

Licensed under the **Creative Commons Attribution 4.0 International (CC BY 4.0)** license. See [LICENSE](./LICENSE).
