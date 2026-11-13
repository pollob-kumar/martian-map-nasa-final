// Real NASA imagery from red-nav-n399, shared with the nasa-martian-map helmet scene.
import { PANO } from "./walkSite";
import { VISOR_PHOTOS } from "./visorPhotos";
import cardVanZyl from "@/assets/card_van_zyl.jpg";
import cardFlight from "@/assets/card_ingenuity_flight1.jpg";
import cardDeployed from "@/assets/card_ingenuity_deployed.jpg";

export { PANO };

export type ScenePhoto = {
  url: string;
  aspect: number;
  title: string;
  credit: string;
  date: string;
  pia?: string | undefined;
  pageUrl?: string | undefined;
  facts: string[];
};

// NASA facts per photo, keyed by PIA id (team photos without an id get general Jezero facts).
const FACTS: Record<string, string[]> = {
  PIA24546: [
    "Santa Cruz is a hill about 2.5 km from the rover inside Jezero Crater.",
    "The crater rim seen behind it is roughly 45 km across.",
    "Taken by Mastcam-Z, Perseverance's zoomable stereo camera pair.",
  ],
  PIA24485: [
    "This scarp is a remnant of the fan-shaped delta that once filled part of Jezero.",
    "Layered rock here was laid down by a river flowing into a lake ~3.5 billion years ago.",
    "Deltas are prime places to search for preserved signs of ancient microbial life.",
  ],
  PIA26335: [
    "Neretva Vallis is the ancient river channel that carried water into Jezero Crater.",
    "Perseverance found the 'Cheyava Falls' rock with possible biosignature features near here in 2024.",
    "This view is a mosaic of many Mastcam-Z frames stitched together.",
  ],
  PIA24264: [
    "First 360° panorama from the Octavia E. Butler landing site, sol 3.",
    "Perseverance landed on 18 February 2021 using Terrain-Relative Navigation.",
    "The landing site is named after science-fiction author Octavia E. Butler.",
  ],
};
const GENERIC = [
  "Jezero Crater floor: volcanic rocks later altered by water.",
  "Loose rocks like these are collision hazards a suited astronaut must route around.",
  "Perseverance has collected rock cores here for the Mars Sample Return campaign.",
];

export const SCENE_PHOTOS: ScenePhoto[] = [
  ...VISOR_PHOTOS.map((p) => ({
    url: p.url,
    aspect: p.aspect,
    title: p.title.replace(/[“”"]/g, ""),
    credit: p.credit,
    date: p.date,
    pia: p.pia,
    pageUrl: p.pageUrl,
    facts: (p.pia && FACTS[p.pia]) || GENERIC,
  })),
  {
    url: cardVanZyl, aspect: 1024 / 576, title: "Van Zyl Overlook", credit: "NASA/JPL-Caltech/ASU/MSSS",
    date: "Sol 46 · April 2021 · Mastcam-Z", pia: "PIA24663",
    pageUrl: "https://science.nasa.gov/photojournal/",
    facts: [
      "Perseverance parked here to watch Ingenuity's flights from a safe distance.",
      "Named after Jakob van Zyl, a JPL engineer who died in 2020.",
      "The 360° panorama around you in this scene is built from this site.",
    ],
  },
  {
    url: cardFlight, aspect: 1024 / 761, title: "Ingenuity first flight", credit: "NASA/JPL-Caltech",
    date: "Sol 58 · 19 Apr 2021 · Mastcam-Z", pia: "PIA24550",
    pageUrl: "https://science.nasa.gov/photojournal/ingenuitys-first-flight-recorded-by-mastcam-z/",
    facts: [
      "First powered, controlled flight on another planet.",
      "Ingenuity rose 3 m, hovered and landed — about 39 seconds in the air.",
      "Filmed by Perseverance from about 64 m away.",
    ],
  },
  {
    url: cardDeployed, aspect: 1024 / 762, title: "Ingenuity deployed", credit: "NASA/JPL-Caltech",
    date: "Sol 43 · 4 Apr 2021", pia: "PIA24541",
    pageUrl: "https://science.nasa.gov/resource/ingenuity-deployed-on-mars/",
    facts: [
      "The 1.8 kg helicopter after being dropped from the rover's belly.",
      "Its rotors spin at about 2,400 rpm to fly in air 1% as dense as Earth's.",
      "Ingenuity went on to make 72 flights before ending its mission in 2024.",
    ],
  },
];
