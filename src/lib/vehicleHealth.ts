export type VehicleHealthState = "healthy" | "warning" | "critical";

export interface VehicleHealth {
  remaining: number;
  ratio: number;
  state: VehicleHealthState;
  color: string;
}

export function getVehicleHealth(maxCollisions: number, collisionsUsed: number): VehicleHealth {
  const safeMaximum = Math.max(0, maxCollisions);
  const remaining = Math.max(0, safeMaximum - Math.max(0, collisionsUsed));
  const ratio = safeMaximum === 0 ? 0 : remaining / safeMaximum;

  if (ratio > 0.5) {
    return { remaining, ratio, state: "healthy", color: "#39ff14" };
  }

  if (ratio > 0.2) {
    return { remaining, ratio, state: "warning", color: "#ff9f0a" };
  }

  return { remaining, ratio, state: "critical", color: "#ff003c" };
}
