// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// Never set ssr.external or resolve.external: the Worker has no runtime module resolution, so
// the build fails. Never add compression (compressPublicAssets, vite-plugin-compression):
// hosting already compresses at the edge.
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";

// The dev-only TanStack devtools plugin tags every JSX element with data-tsd-source. React Three
// Fiber treats "data-tsd-source" as a nested path (obj.data.tsd.source) on three.js objects and
// throws, blanking the globe. Strip the tag from files that render R3F elements.
function stripDevtoolsSourceFromR3F(): Plugin {
  return {
    name: "red-nav:strip-tsd-source-r3f",
    enforce: "pre",
    apply: "serve",
    transform(code, id) {
      if (!/\.[jt]sx$/.test(id.split("?")[0] ?? "")) return null;
      if (!code.includes("@react-three/") || !code.includes("data-tsd-source")) return null;
      return { code: code.replace(/\s+data-tsd-source="[^"]*"/g, ""), map: null };
    },
  };
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [stripDevtoolsSourceFromR3F()],
  },
});
