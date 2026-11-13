import { createFileRoute } from "@tanstack/react-router";

// Lists the real sound files shipped in public/sounds/ so the HUD plays them instead of the
// synthesized fallback. Slots without a file (click, alert) keep the built-in sound.
const SOUND_FILES: Record<string, string> = {
  wind: "/sounds/wind.mp3",
  footstep: "/sounds/footstep.mp3",
  lock: "/sounds/lock.mp3",
  suit: "/sounds/suit.mp3",
};

export const Route = createFileRoute("/api/sounds")({
  server: { handlers: { GET: () => Response.json(SOUND_FILES) } },
});
