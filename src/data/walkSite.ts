// Walk-mode site: Van Zyl Overlook ↔ Octavia E. Butler Landing, Jezero Crater.
// Every position, date and number below comes from NASA sources listed in WALK_SOURCES.
import { WAYPOINTS, BASE } from "./route";
import { localEnuM } from "@/lib/mars";
import type { Pose, Spot, Zone } from "@/lib/walk";
import { WALK } from "@/lib/walk";
import pano0 from "@/assets/walk_pano_vz_0.jpg";
import pano1 from "@/assets/walk_pano_vz_1.jpg";
import pano2 from "@/assets/walk_pano_vz_2.jpg";
import pano3 from "@/assets/walk_pano_vz_3.jpg";
import ground from "@/assets/walk_ground_hirise.jpg";
import groundDetail from "@/assets/walk_ground_detail_pia24663.jpg";
import cardVanZyl from "@/assets/card_van_zyl.jpg";
import cardFlight from "@/assets/card_ingenuity_flight1.jpg";
import cardDeployed from "@/assets/card_ingenuity_deployed.jpg";
import cardDrive from "@/assets/card_first_drive.jpg";
import landingPhoto from "@/assets/jezero_landing_site_360.jpg";
import deltaPhoto from "@/assets/jezero_delta_remnant.jpg";

const wp = (rmc: string) => {
  const w = WAYPOINTS.find((x) => x.rmc === rmc);
  if (!w) throw new Error(`waypoint ${rmc} missing`);
  return w;
};

/** Walk origin = where the PIA24663 360° panorama was shot (rover waypoint 3_2046). */
export const ORIGIN = wp("3_2046");
const enu = (lat: number, lon: number) => localEnuM(lat, lon, ORIGIN.lat, ORIGIN.lon);

/** PIA24663 (23265 × 5165 px, 360°). Rows 0–880 (sky, horizon, far ground; rover-free) split into 4 tiles. */
export const PANO = {
  tiles: [pano0, pano1, pano2, pano3],
  srcWidth: 23265,
  bandRows: 880,
  /** Row of eye-level horizon in the source image. */
  horizonRow: 610,
  /** Fraction of panorama width that faces north. Aligned on Perseverance's own wheel tracks
   *  toward waypoint 3_1950 (bearing 291° from Van Zyl Overlook), which sit at 0.8205 of the width. */
  northFrac: 0.0122,
  sky: "#c6a580",
};

/** HiRISE colour basemap (25 cm/px), 256 m square centred on ORIGIN, north up. */
export const GROUND = { url: ground, sizeM: 256 };

/** Fine grain for the ground near your feet: a 3.12 m patch of real sand and pebbles at Van Zyl Overlook,
 *  projected top-down from PIA24663's near-field rows (~3 mm/px), high-passed so HiRISE keeps the colour. */
export const GROUND_DETAIL = { url: groundDetail, tileM: 3.12 };

export type PoiPhoto = { url: string; caption: string; credit: string; pageUrl: string };
export type Poi = Spot & {
  name: string;
  short: string;
  kind: "Rover stop" | "Helicopter" | "Landmark";
  lat?: number;
  lon?: number;
  summary: string;
  facts: [string, string][];
  photo: PoiPhoto;
  sources: { label: string; href: string }[];
};

const MMGIS = "https://mars.nasa.gov/mmgis-maps/M20/Layers/json/";
const SRC = {
  waypoints: { label: "Rover waypoints (NASA MMGIS)", href: `${MMGIS}M20_waypoints.json` },
  surface: { label: "Surface view sites (NASA MMGIS)", href: `${MMGIS}M20_surfaceexperience.json` },
  heli: { label: "Ingenuity waypoints (NASA MMGIS)", href: `${MMGIS}m20_heli_waypoints.json` },
};

const heli0 = { lat: 18.44486301, lon: 77.45101915 }; // m20_heli_waypoints.json, Flight 0 (Sol 43)
const drive1 = wp("3_110");
const dropOff = wp("3_1416");
const ll = (lat: number, lon: number) => `${lat.toFixed(6)}°N, ${lon.toFixed(6)}°E`;
const at = (lat: number, lon: number) => {
  const [e, n] = enu(lat, lon);
  return { lat, lon, e, n };
};

// Kodiak: bearing measured in PIA24663 (0.7273 of width → 257°); distance from the PIA24485 caption.
const KODIAK_BEARING = 257;
const KODIAK_DIST_M = 2300;

export const POIS: Poi[] = [
  {
    id: "van-zyl",
    name: "Van Zyl Overlook",
    short: "Van Zyl Overlook",
    kind: "Rover stop",
    reachable: true,
    ...at(ORIGIN.lat, ORIGIN.lon),
    summary:
      "Perseverance parked here to watch Ingenuity's first flights. The 360° view around you in walk mode is NASA's panorama taken from this exact spot.",
    facts: [
      ["Rover parked", "Sols 52–65"],
      ["Waypoint", `${ORIGIN.rmc} · Sol ${ORIGIN.sol}`],
      ["Position", ll(ORIGIN.lat, ORIGIN.lon)],
      ["Elevation", `${ORIGIN.elev.toFixed(1)} m`],
      ["Rover odometer", `${ORIGIN.distTotal.toFixed(1)} m`],
      ["Distance to Ingenuity", "64.3 m (NASA)"],
      ["360° panorama", "PIA24663 · 992 Mastcam-Z images · Sols 53–64"],
    ],
    photo: {
      url: cardVanZyl,
      caption: "Crop of PIA24663, Mastcam-Z 360° view of Van Zyl Overlook",
      credit: "NASA/JPL-Caltech/ASU/MSSS",
      pageUrl: "https://science.nasa.gov/photojournal/mastcam-zs-360-degree-view-of-van-zyl-overlook/",
    },
    sources: [
      SRC.surface,
      SRC.waypoints,
      { label: "PIA24663", href: "https://science.nasa.gov/photojournal/mastcam-zs-360-degree-view-of-van-zyl-overlook/" },
      { label: "Rover 64.3 m away (NASA)", href: "https://science.nasa.gov/resource/first-video-of-nasas-ingenuity-mars-helicopter-in-flight/" },
    ],
  },
  {
    id: "wbf",
    name: "Wright Brothers Field",
    short: "Wright Brothers Field",
    kind: "Helicopter",
    reachable: true,
    ...at(heli0.lat, heli0.lon),
    summary:
      "Ingenuity's first airfield. On 19 April 2021 it made the first powered, controlled flight on another planet from this spot.",
    facts: [
      ["Ingenuity placed here", "Sol 43"],
      ["Flight 1", "Sol 58 · 19 Apr 2021 · 3 m high · 39.1 s"],
      ["Flight 2", "Sol 61 · 22 Apr 2021 · 5 m · 51.9 s"],
      ["Flight 3", "Sol 64 · 25 Apr 2021 · 5 m · 80.3 s · 102.4 m flown"],
      ["Flight 4", "Sol 69 · 30 Apr 2021 · 5 m · 116.9 s · 271.1 m flown"],
      ["Position", ll(heli0.lat, heli0.lon)],
      ["Elevation", "-2570.0 m"],
    ],
    photo: {
      url: cardFlight,
      caption: "PIA24550 · Ingenuity's first flight, seen by Mastcam-Z",
      credit: "NASA/JPL-Caltech/ASU/MSSS",
      pageUrl: "https://science.nasa.gov/photojournal/ingenuitys-first-flight-recorded-by-mastcam-z/",
    },
    sources: [
      SRC.heli,
      { label: "PIA24550", href: "https://science.nasa.gov/photojournal/ingenuitys-first-flight-recorded-by-mastcam-z/" },
    ],
  },
  {
    id: "drop-off",
    name: "Ingenuity drop-off stop",
    short: "Drop-off stop",
    kind: "Rover stop",
    reachable: true,
    ...at(dropOff.lat, dropOff.lon),
    summary:
      "After lowering Ingenuity to the ground, Perseverance drove about 4 m away and photographed it with its rear Hazard Camera.",
    facts: [
      ["Waypoint", `${dropOff.rmc} · Sol ${dropOff.sol}`],
      ["Photo taken", "4 Apr 2021 (Sol 44) · rear Hazcam"],
      ["Position", ll(dropOff.lat, dropOff.lon)],
      ["Elevation", `${dropOff.elev.toFixed(1)} m`],
      ["Rover odometer", `${dropOff.distTotal.toFixed(1)} m`],
    ],
    photo: {
      url: cardDeployed,
      caption: "PIA24541 · Ingenuity on Mars after deployment",
      credit: "NASA/JPL-Caltech",
      pageUrl: "https://science.nasa.gov/resource/ingenuity-deployed-on-mars/",
    },
    sources: [
      SRC.waypoints,
      { label: "PIA24541", href: "https://science.nasa.gov/resource/ingenuity-deployed-on-mars/" },
      { label: "Rover drove ~4 m away (NASA)", href: "https://science.nasa.gov/resource/ingenuitys-complete-deployment/" },
    ],
  },
  {
    id: "landing",
    name: "Octavia E. Butler Landing",
    short: "Landing site",
    kind: "Rover stop",
    reachable: true,
    ...at(BASE.lat, BASE.lon),
    summary: "Where Perseverance touched down on 18 February 2021. The Perseverance route and the BASE distance start here.",
    facts: [
      ["Touchdown", "18 Feb 2021"],
      ["Rover parked", "Sols 1–12"],
      ["Waypoint", `${BASE.rmc} · Sol ${BASE.sol}`],
      ["Position", ll(BASE.lat, BASE.lon)],
      ["Elevation", `${BASE.elev.toFixed(1)} m`],
      ["Rover heading", `${BASE.yaw.toFixed(1)}°`],
      ["First 360° panorama", "PIA24264 · Sol 3 · 142 images"],
    ],
    photo: {
      url: landingPhoto,
      caption: "Crop of PIA24264 · Mastcam-Z's first 360° panorama",
      credit: "NASA/JPL-Caltech/MSSS/ASU",
      pageUrl: "https://science.nasa.gov/photojournal/mastcam-zs-first-360-degree-panorama/",
    },
    sources: [
      SRC.surface,
      SRC.waypoints,
      { label: "PIA24264", href: "https://science.nasa.gov/photojournal/mastcam-zs-first-360-degree-panorama/" },
    ],
  },
  {
    id: "first-drive",
    name: "End of the first drive",
    short: "First drive",
    kind: "Rover stop",
    reachable: true,
    ...at(drive1.lat, drive1.lon),
    summary: "Perseverance's first drive on Mars, on 4 March 2021, ended here a few metres from the landing spot.",
    facts: [
      ["Date", `4 Mar 2021 · Sol ${drive1.sol}`],
      ["Waypoint", drive1.rmc],
      ["Rover odometer", `${drive1.distTotal.toFixed(1)} m`],
      ["Rover heading", `${(((drive1.yaw % 360) + 360) % 360).toFixed(1)}°`],
      ["Position", ll(drive1.lat, drive1.lon)],
      ["Elevation", `${drive1.elev.toFixed(1)} m`],
    ],
    photo: {
      url: cardDrive,
      caption: "PIA24488 · Wheel tracks from the first drive and rocket-scoured ground (Navcam, 5 Mar 2021)",
      credit: "NASA/JPL-Caltech",
      pageUrl: "https://science.nasa.gov/resource/rocket-scour-and-wheel-prints/",
    },
    sources: [
      SRC.waypoints,
      { label: "PIA24488", href: "https://science.nasa.gov/resource/rocket-scour-and-wheel-prints/" },
      { label: "First drive (NASA)", href: "https://science.nasa.gov/resource/perseverance-is-roving-on-mars/" },
    ],
  },
  {
    id: "kodiak",
    name: "Kodiak — Jezero delta remnant",
    short: "Kodiak · 2.3 km",
    kind: "Landmark",
    reachable: false,
    e: Math.sin((KODIAK_BEARING * Math.PI) / 180) * KODIAK_DIST_M,
    n: Math.cos((KODIAK_BEARING * Math.PI) / 180) * KODIAK_DIST_M,
    summary:
      "A layered butte left over from the ancient river delta. Too far to walk to, but you can see it on the horizon to the west.",
    facts: [
      ["Distance", "About 2.3 km west of the landing site (NASA)"],
      ["Visible width", "About 200 m (NASA)"],
      ["Bearing from Van Zyl", `≈${KODIAK_BEARING}° (measured in PIA24663)`],
      ["Photographed", "22 Feb 2021 · Sol 4 · Mastcam-Z"],
    ],
    photo: {
      url: deltaPhoto,
      caption: "PIA24485 · Perseverance's view of the delta remnant",
      credit: "NASA/JPL-Caltech/ASU/MSSS",
      pageUrl: "https://science.nasa.gov/resource/perseverance-view-of-the-delta-in-jezero-crater/",
    },
    sources: [{ label: "PIA24485", href: "https://science.nasa.gov/resource/perseverance-view-of-the-delta-in-jezero-crater/" }],
  },
];

export const REACHABLE = POIS.filter((p) => p.reachable);
export const LANDING = POIS.find((p) => p.id === "landing")!;
const vz = POIS[0]!;

/** Short exploration circle centred between the landing site and Van Zyl Overlook. */
export const ZONE: Zone = { e: (vz.e + LANDING.e) / 2, n: (vz.n + LANDING.n) / 2, r: WALK.ZONE_RADIUS_M };

/** Start at Van Zyl Overlook looking west toward Wright Brothers Field. */
export const START_POSE: Pose = { e: 0, n: 0, heading: 276, pitch: -4 };

export const WALK_SOURCES = [
  {
    title: "PIA24663 — Mastcam-Z 360° view of Van Zyl Overlook",
    by: "NASA/JPL-Caltech/ASU/MSSS · Sols 53–64 (Apr 2021) · 992 images",
    used:
      "The 360° horizon of the walk environment. Top 880 rows (sky, horizon and distant ground, no rover parts) cut into 4 tiles and resized to 4096 px wide. Compass-aligned using Perseverance's own wheel tracks in the image. No AI.",
    links: [
      { label: "NASA page", href: "https://science.nasa.gov/photojournal/mastcam-zs-360-degree-view-of-van-zyl-overlook/" },
      { label: "Original file", href: "https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia24/pia24663/PIA24663.jpg" },
    ],
  },
  {
    title: "HiRISE colour basemap of Jezero (25 cm/pixel)",
    by: "NASA/JPL-Caltech/University of Arizona · NASA MMGIS Mars 2020 map",
    used:
      "The ground you walk on: a 256 m square around Van Zyl Overlook stitched from zoom-19 tiles, colour-balanced per channel to match the Mastcam-Z panorama. No AI.",
    links: [
      { label: "MMGIS Mars 2020 map", href: "https://mars.nasa.gov/maps/location/?mission=M20" },
      { label: "Tile layer", href: "https://mars.nasa.gov/mmgis-maps/M20/Layers/M20_HiRISE_RGB_CTX_mosaic_25cm_v7_Merge_LERC_clip/" },
    ],
  },
  {
    title: "PIA24663 near-field ground — sharp detail under your feet",
    by: "NASA/JPL-Caltech/ASU/MSSS · Mastcam-Z · Van Zyl Overlook",
    used:
      "The HiRISE ground is only 25 cm per pixel, so close to your feet it looked blurry. A 3.12 m patch of real sand and pebbles about 4 m from the rover, taken from the lower part of the same 360° panorama, was projected to a top-down view (~3 mm per pixel) and only its fine texture is laid over the HiRISE colours within ~20 m of you. No AI.",
    links: [
      { label: "NASA page", href: "https://science.nasa.gov/photojournal/mastcam-zs-360-degree-view-of-van-zyl-overlook/" },
      { label: "Original file", href: "https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia24/pia24663/PIA24663.jpg" },
    ],
  },
  {
    title: "Ingenuity helicopter waypoints and rover surface-view sites",
    by: "NASA/JPL-Caltech · MMGIS Mars 2020 map",
    used: "Position of Wright Brothers Field, flight dates, heights, durations and distances; rover parking sols at the landing site and Van Zyl Overlook.",
    links: [SRC.heli, SRC.surface],
  },
  {
    title: "PIA24550 — Ingenuity's first flight recorded by Mastcam-Z",
    by: "NASA/JPL-Caltech/ASU/MSSS · 19 Apr 2021",
    used: "Photo on the Wright Brothers Field card. Resized only.",
    links: [{ label: "NASA page", href: "https://science.nasa.gov/photojournal/ingenuitys-first-flight-recorded-by-mastcam-z/" }],
  },
  {
    title: "PIA24541 — Ingenuity deployed on Mars",
    by: "NASA/JPL-Caltech · rear Hazcam · 4 Apr 2021 (Sol 44)",
    used: "Photo on the drop-off stop card. Thin black border trimmed, resized.",
    links: [{ label: "NASA page", href: "https://science.nasa.gov/resource/ingenuity-deployed-on-mars/" }],
  },
  {
    title: "PIA24488 — Rocket scour and wheel prints",
    by: "NASA/JPL-Caltech · Navcam · 5 Mar 2021",
    used: "Photo on the first-drive card. Black lens corners cropped off the top, resized.",
    links: [{ label: "NASA page", href: "https://science.nasa.gov/resource/rocket-scour-and-wheel-prints/" }],
  },
];
