export const TOUR_STOPS = [
  {
    id: "landing",
    pia: "PIA24264",
    title: "Octavia E. Butler landing site",
    description: "Perseverance landed in Jezero Crater on 18 February 2021. Its first Mastcam-Z panorama shows the crater floor where the mission began.",
  },
  {
    id: "crater-floor",
    pia: "PIA24546",
    title: "Across the Jezero crater floor",
    description: "Santa Cruz hill rises beyond the rocky crater floor. These Mastcam-Z observations help scientists examine the landscape surrounding the rover's early exploration area.",
  },
  {
    id: "delta",
    pia: "PIA24485",
    title: "The ancient river delta",
    description: "An ancient river deposited sediment in Jezero's lake, building a delta. Its layered rocks are a major target in the search for evidence of past habitable environments.",
  },
] as const;

export function clampTourStop(index: number) {
  return Math.max(0, Math.min(TOUR_STOPS.length - 1, Math.trunc(index)));
}