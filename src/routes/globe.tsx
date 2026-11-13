import { createFileRoute } from "@tanstack/react-router";
import { GlobePage } from "@/components/globe/GlobePage";

export const Route = createFileRoute("/globe")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Mars Globe — Martian Map" },
      {
        name: "description",
        content:
          "Interactive 3D Mars globe wrapped in NASA's Viking MDIM 2.1 colour mosaic, with real landing sites and the Perseverance traverse.",
      },
      { property: "og:title", content: "Mars Globe — Martian Map" },
      {
        property: "og:description",
        content: "Explore Mars in 3D with NASA Viking imagery, mission landing sites and the real Perseverance route.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GlobePage,
});

