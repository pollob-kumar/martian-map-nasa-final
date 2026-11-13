import { Footprints, Map, Navigation, Pause, Wrench, Eye, RotateCcw, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
type Props = {
  activeMode: string; isWalking: boolean;
  onModeChange: (mode: "MAP" | "NAVIGATION" | "TOOLS") => void;
  onToggleWalking: () => void; onResetView: () => void;
  onToggleInformation?: () => void; onToggleViewMode?: () => void;
};
export function MobileMissionDock(props: Props) {
  return (
    <div className="mission-mobile-dock absolute inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 px-3 pt-2 text-foreground backdrop-blur-xl">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" title="Reset view" aria-label="Reset view" onClick={props.onResetView}><RotateCcw /></Button>
          <Button variant="ghost" size="icon" title="Camera view" aria-label="Camera view" onClick={props.onToggleViewMode}><Eye /></Button>
          <Button variant="ghost" size="icon" title="Sites and hazards" aria-label="Sites and hazards" onClick={props.onToggleInformation}><Info /></Button>
        </div>
      </div>
      <nav aria-label="Mobile mission navigation" className="grid grid-cols-4 gap-1">
        <Button variant={props.activeMode === "MAP" ? "default" : "secondary"} className="h-14 flex-col gap-1 text-xs" onClick={() => props.onModeChange("MAP")}><Map />Map & Route</Button>
        <Button variant={props.activeMode === "NAVIGATION" ? "default" : "secondary"} className="h-14 flex-col gap-1 text-xs" onClick={() => props.onModeChange("NAVIGATION")}><Navigation />Explore</Button>
        <Button variant={props.isWalking ? "default" : "outline"} aria-pressed={props.isWalking} className="h-14 flex-col gap-1 text-xs" onClick={props.onToggleWalking}>{props.isWalking ? <Pause /> : <Footprints />}{props.isWalking ? "Stop" : "Walk"}</Button>
        <Button variant={props.activeMode === "TOOLS" ? "default" : "secondary"} className="h-14 flex-col gap-1 text-xs" onClick={() => props.onModeChange("TOOLS")}><Wrench />Tools</Button>
      </nav>
    </div>
  );
}