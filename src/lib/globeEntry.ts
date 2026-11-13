export const MISSION_ENTRY_DELAY_MS = 3000;
export const MISSION_ENTRY_SCROLLS = 3;
export const MARSWALK_ENTRY = { to: "/mission-map", search: { marswalk: true } } as const;
export function shouldEnterMission(scrolls: number) {
  return scrolls >= MISSION_ENTRY_SCROLLS;
}