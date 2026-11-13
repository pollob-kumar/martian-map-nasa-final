// @ts-nocheck -- ported as-is from nasa-martian-map/frontend
import { lazy, Suspense } from 'react';
import { HelmetLoading } from '@/components/hud/HelmetLoading';

// The HUD uses WebAudio and three.js/WebGL (browser only), so it is loaded client-side only.
const MarsHudApp = lazy(() => import('./MarsHudApp'));

export default function MarsHudLoader({ regionId }: { regionId: string }) {
  return (
    <Suspense
      fallback={<HelmetLoading />}
    >
      <MarsHudApp regionId={regionId} />
    </Suspense>
  );
}
