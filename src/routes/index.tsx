import { createFileRoute, redirect } from "@tanstack/react-router";
import { GlobePage } from "@/components/globe/GlobePage";
import { isMarswalkEntry } from "@/lib/visorReturn";

export const Route = createFileRoute("/")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { marswalk?: boolean } => ({ marswalk: isMarswalkEntry(search["marswalk"]) }),
  beforeLoad: ({ search }) => {
    if (search.marswalk) throw redirect({ to: "/mission-map", search: { marswalk: true } });
  },
  head: () => ({ meta: [
    { title: "Martian Map — Explore Mars" },
    { name: "description", content: "Explore NASA's Viking Mars globe, choose a landing site and continue to the Jezero Mission Map." },
    { property: "og:title", content: "Martian Map — Explore Mars" },
    { property: "og:description", content: "NASA Mars imagery, real landing sites and Jezero mission exploration." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: GlobePage,
});
