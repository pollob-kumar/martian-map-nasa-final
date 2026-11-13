import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, Globe2, Map, ScanEye, Database } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BackButton() {
  const router = useRouter();
  return <Button variant="secondary" size="icon" aria-label="Back" title="Back" onClick={() => {
    if (router.history.canGoBack()) router.history.back();
    else void router.navigate({ to: "/globe" });
  }}><ArrowLeft /></Button>;
}

const pages = [
  { to: "/globe", label: "Mars", icon: Globe2 },
  { to: "/mission-map", label: "Mission", icon: Map },
  { to: "/visor", label: "Visor", icon: ScanEye },
  { to: "/sources", label: "Sources", icon: Database },
] as const;

export function AppNavigation() {
  const path = useRouterState({ select: s => s.location.pathname });
  return <nav aria-label="App navigation" className="app-page-navigation fixed inset-x-0 bottom-0 z-[70] grid grid-cols-5 items-center gap-1 border-t border-border bg-background/95 px-2 pt-2 backdrop-blur-xl md:hidden">
    <div className="flex justify-center"><BackButton /></div>
    {pages.map(({ to, label, icon: Icon }) => {
      const active = path === to || (to === "/globe" && path === "/");
      return <Button key={to} asChild variant={active ? "default" : "secondary"} className="h-12 min-w-0 flex-col gap-1 px-1 text-[11px]">
        <Link to={to} aria-current={active ? "page" : undefined}><Icon /><span>{label}</span></Link>
      </Button>;
    })}
  </nav>;
}