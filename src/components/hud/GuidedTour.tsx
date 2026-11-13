import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TOUR_STOPS } from "@/data/guidedTour";

export function GuidedTour({ index, playing, complete, onStep, onPlaying, onClose }: {
  index: number;
  playing: boolean;
  complete: boolean;
  onStep: (index: number) => void;
  onPlaying: (playing: boolean) => void;
  onClose: () => void;
}) {
  const stop = TOUR_STOPS[index];
  if (!stop) return null;
  return (
    <section aria-label="Landing to delta guided tour" className="mt-4 w-full max-w-3xl px-2 sm:px-0 border-y border-border py-4 text-foreground">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-hud">{complete ? "TOUR COMPLETE" : `GUIDED TOUR · ${index + 1} / ${TOUR_STOPS.length}`}</p>
          <h2 className="mt-1 font-display text-lg font-semibold">{stop.title}</h2>
        </div>
        <Button variant="ghost" size="icon" aria-label="Close guided tour" title="Close guided tour" onClick={onClose}><X /></Button>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{stop.description}</p>
      <p className="mt-2 font-mono text-xs text-muted-foreground">NASA photo sequence · not a reconstructed walking route</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button variant="outline" size="icon" aria-label="Previous tour stop" title="Previous tour stop" disabled={index === 0} onClick={() => onStep(index - 1)}><ChevronLeft /></Button>
        <Button variant="outline" size="icon" aria-label={playing ? "Pause tour" : "Play tour"} title={playing ? "Pause tour" : "Play tour"} disabled={complete} onClick={() => onPlaying(!playing)}>{playing ? <Pause /> : <Play />}</Button>
        <Button variant="outline" size="icon" aria-label="Next tour stop" title="Next tour stop" disabled={index === TOUR_STOPS.length - 1} onClick={() => onStep(index + 1)}><ChevronRight /></Button>
        <Button variant="ghost" size="icon" aria-label="Restart tour" title="Restart tour" onClick={() => { onStep(0); onPlaying(true); }}><RotateCcw /></Button>
        <div className="flex flex-wrap gap-1">
          {TOUR_STOPS.map((item, i) => <Button key={item.id} variant={i === index ? "secondary" : "ghost"} size="sm" aria-label={`Tour stop ${i + 1}: ${item.title}`} aria-pressed={i === index} onClick={() => onStep(i)}>{i + 1}</Button>)}
        </div>
      </div>
    </section>
  );
}