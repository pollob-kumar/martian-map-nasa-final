import { BASE } from "./route";

export type Site = {
  id: string;
  name: string;
  kind: "landing" | "feature";
  lat: number;
  lon: number; // planetocentric, east-positive, -180..180
  note: string;
  sourceUrl: string;
};

export const SITES: Site[] = [
  {
    id: "perseverance",
    name: "Perseverance · Jezero Crater",
    kind: "landing",
    lat: BASE.lat,
    lon: BASE.lon,
    note: "Octavia E. Butler Landing, 18 Feb 2021. Perseverance route starts here.",
    sourceUrl: "https://science.nasa.gov/mission/mars-2020-perseverance/",
  },
  {
    id: "curiosity",
    name: "Curiosity · Gale Crater",
    kind: "landing",
    lat: -4.5895,
    lon: 137.4417,
    note: "Bradbury Landing, 6 Aug 2012.",
    sourceUrl: "https://science.nasa.gov/mission/msl-curiosity/",
  },
  {
    id: "insight",
    name: "InSight · Elysium Planitia",
    kind: "landing",
    lat: 4.502,
    lon: 135.623,
    note: "Landed 26 Nov 2018.",
    sourceUrl: "https://science.nasa.gov/mission/insight/",
  },
  {
    id: "opportunity",
    name: "Opportunity · Meridiani Planum",
    kind: "landing",
    lat: -1.9462,
    lon: -5.5266,
    note: "Eagle crater, 25 Jan 2004.",
    sourceUrl: "https://science.nasa.gov/mission/mer-opportunity/",
  },
  {
    id: "spirit",
    name: "Spirit · Gusev Crater",
    kind: "landing",
    lat: -14.5684,
    lon: 175.4726,
    note: "Columbia Memorial Station, 4 Jan 2004.",
    sourceUrl: "https://science.nasa.gov/mission/mer-spirit/",
  },
  {
    id: "olympus",
    name: "Olympus Mons",
    kind: "feature",
    lat: 18.65,
    lon: -133.8,
    note: "Largest volcano in the Solar System.",
    sourceUrl: "https://planetarynames.wr.usgs.gov/Feature/4453",
  },
  {
    id: "valles",
    name: "Valles Marineris",
    kind: "feature",
    lat: -14.01,
    lon: -58.59,
    note: "Canyon system ~4,000 km long.",
    sourceUrl: "https://planetarynames.wr.usgs.gov/Feature/6288",
  },
  {
    id: "hellas",
    name: "Hellas Planitia",
    kind: "feature",
    lat: -42.43,
    lon: 70.5,
    note: "Giant impact basin.",
    sourceUrl: "https://planetarynames.wr.usgs.gov/Feature/2432",
  },
];
