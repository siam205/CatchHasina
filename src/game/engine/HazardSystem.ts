import type { Hazard, Point, Vehicle } from "@/game/state/gameTypes";

export class HazardSystem {
  detect(vehicle: Vehicle, startPosition: Point, hazards: Hazard[]) {
    const vehicleRadius = Math.max(vehicle.width, vehicle.height) / 2;
    const travelDistance = distance(startPosition, vehicle.position);
    const sampleDistance = Math.max(vehicleRadius * 0.5, 1);
    const sampleCount = Math.max(1, Math.ceil(travelDistance / sampleDistance));

    for (let sample = 0; sample <= sampleCount; sample += 1) {
      const progress = sample / sampleCount;
      const position = interpolate(startPosition, vehicle.position, progress);

      for (const hazard of hazards) {
        if (distance(position, hazard.position) <= vehicleRadius + hazard.radius) return hazard;
      }
    }

    return null;
  }
}

function distance(first: Point, second: Point) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function interpolate(start: Point, end: Point, progress: number): Point {
  return {
    x: start.x + (end.x - start.x) * progress,
    y: start.y + (end.y - start.y) * progress,
  };
}
