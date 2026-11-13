import surfaceA from "@/assets/mars_surface_rocks_a.jpg";
import surfaceB from "@/assets/mars_surface_rocks_b.jpg";
import santaCruz from "@/assets/jezero_santa_cruz_hill.jpg";
import delta from "@/assets/jezero_delta_remnant.jpg";
import neretva from "@/assets/jezero_neretva_vallis.jpg";
import landing from "@/assets/jezero_landing_site_360.jpg";

export type VisorPhoto = {
  url: string;
  /** width / height of the stored (cropped) file */
  aspect: number;
  /** Collision-hazard bracket on a real rock, in percent of the photo */
  hazard: { x: number; y: number; w: number; h: number };
  title: string;
  alt: string;
  /** NASA Photojournal ID, when known */
  pia?: string;
  date: string;
  credit: string;
  pageUrl: string;
  fileUrl?: string;
  edit: string;
};

const PJ = "https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia";

// Only real NASA Perseverance (Mastcam-Z) photos of Jezero Crater. Edits are crop + resize only.
export const VISOR_PHOTOS: VisorPhoto[] = [
  {
    url: santaCruz,
    aspect: 1920 / 1088,
    hazard: { x: 34.3, y: 53.4, w: 5, h: 6 },
    title: "“Santa Cruz” hill inside Jezero Crater",
    alt: "Rock-strewn Jezero Crater floor with the Santa Cruz hill and the crater rim on the horizon",
    pia: "PIA24546",
    date: "Sol 68 · 29 Apr 2021 · Mastcam-Z, natural colour",
    credit: "NASA/JPL-Caltech/ASU/MSSS",
    pageUrl: "https://science.nasa.gov/photojournal/mastcam-z-views-santa-cruz-on-mars/",
    fileUrl: `${PJ}/pia24/pia24546/PIA24546.jpg`,
    edit: "Resized to 1920 px wide.",
  },
  {
    url: surfaceA,
    aspect: 1558 / 1156,
    hazard: { x: 69.7, y: 45.5, w: 9, h: 9 },
    title: "Rocky ground (team-supplied photo 1)",
    alt: "Mars surface with scattered rocks and pale bedrock",
    date: "Perseverance raw image (exact NASA image ID to be confirmed)",
    credit: "NASA/JPL-Caltech (supplied by the Martian Map team)",
    pageUrl: "https://mars.nasa.gov/mars2020/multimedia/raw-images/",
    edit: "Black frame border trimmed.",
  },
  {
    url: delta,
    aspect: 1596 / 1186,
    hazard: { x: 52.6, y: 55.2, w: 10, h: 7 },
    title: "Remnant of the ancient Jezero river delta",
    alt: "Layered delta remnant cliff in Jezero Crater with dark boulders in the foreground",
    pia: "PIA24485",
    date: "Sol 4 · 22 Feb 2021 · Mastcam-Z, natural colour",
    credit: "NASA/JPL-Caltech/ASU/MSSS",
    pageUrl: "https://science.nasa.gov/resource/perseverance-view-of-the-delta-in-jezero-crater/",
    fileUrl: `${PJ}/pia24/pia24485/PIA24485.jpg`,
    edit: "Black frame border trimmed.",
  },
  {
    url: surfaceB,
    aspect: 1558 / 1156,
    hazard: { x: 45, y: 44, w: 11, h: 7 },
    title: "Boulders and pebbles (team-supplied photo 2)",
    alt: "Mars surface with large boulders and pebbles",
    date: "Perseverance raw image (exact NASA image ID to be confirmed)",
    credit: "NASA/JPL-Caltech (supplied by the Martian Map team)",
    pageUrl: "https://mars.nasa.gov/mars2020/multimedia/raw-images/",
    edit: "Black frame border trimmed.",
  },
  {
    url: neretva,
    aspect: 1920 / 1092,
    hazard: { x: 51.3, y: 39.6, w: 7, h: 6 },
    title: "Neretva Vallis — the river channel that fed Jezero",
    alt: "Sand-rippled Neretva Vallis river channel under a hazy butterscotch sky",
    pia: "PIA26335",
    date: "Sol 1152 · 17 May 2024 · Mastcam-Z mosaic, natural colour",
    credit: "NASA/JPL-Caltech/ASU/MSSS",
    pageUrl: "https://science.nasa.gov/photojournal/perseverances-view-of-neretva-vallis-river-channel/",
    fileUrl: `${PJ}/pia26/pia26335/PIA26335.jpg`,
    edit: "Cropped to the centre section of the panorama, resized to 1920 px wide.",
  },
  {
    url: landing,
    aspect: 1830 / 1040,
    hazard: { x: 58, y: 51, w: 9, h: 6 },
    title: "Octavia E. Butler landing site, first 360° panorama",
    alt: "Dark Jezero Crater floor at the landing site with the crater rim on the horizon",
    pia: "PIA24264",
    date: "Sol 3 · 21 Feb 2021 · Mastcam-Z, natural colour",
    credit: "NASA/JPL-Caltech/MSSS/ASU",
    pageUrl: "https://science.nasa.gov/photojournal/mastcam-zs-first-360-degree-panorama/",
    fileUrl: `${PJ}/pia24/pia24264/PIA24264.jpg`,
    edit: "Cropped to the rover-free left section of the panorama, resized.",
  },
];
