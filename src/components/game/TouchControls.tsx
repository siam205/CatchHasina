"use client";

import type { PointerEvent } from "react";
import type { VehicleAction } from "@/game/state/gameTypes";

interface TouchControlsProps {
  onActionChange: (action: VehicleAction, pressed: boolean) => void;
}

export function TouchControls({ onActionChange }: TouchControlsProps) {
  return (
    <div className="flex items-center justify-center gap-3" aria-label="Vehicle touch controls">
      <ControlButton action="turnLeft" label="Left" onActionChange={onActionChange} />
      <div className="flex flex-col gap-3">
        <ControlButton action="accelerate" label="Accelerate" onActionChange={onActionChange} />
        <ControlButton action="brake" label="Brake" onActionChange={onActionChange} />
      </div>
      <ControlButton action="turnRight" label="Right" onActionChange={onActionChange} />
    </div>
  );
}

interface ControlButtonProps {
  action: VehicleAction;
  label: string;
  onActionChange: (action: VehicleAction, pressed: boolean) => void;
}

function ControlButton({ action, label, onActionChange }: ControlButtonProps) {
  const handlePress = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    onActionChange(action, true);
  };

  const handleRelease = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    onActionChange(action, false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <button
      type="button"
      aria-label={label}
      className="grid h-16 min-w-16 touch-none select-none place-items-center rounded-xl border border-neon-blue/70 bg-neon-blue/10 px-3 text-xs font-black uppercase tracking-[0.12em] text-neon-blue shadow-[0_0_12px_rgba(0,140,255,0.2)] transition active:bg-neon-blue/30"
      onPointerDown={handlePress}
      onPointerUp={handleRelease}
      onPointerCancel={handleRelease}
      onLostPointerCapture={() => onActionChange(action, false)}
    >
      {label}
    </button>
  );
}
