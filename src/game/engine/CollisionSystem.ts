import type { Point, Vehicle, WallSegment } from "@/game/state/gameTypes";

export class CollisionSystem {
  detect(vehicle: Vehicle, startPosition: Point, walls: WallSegment[]) {
    const radius = Math.max(vehicle.width, vehicle.height) / 2;
    const travelDistance = distance(startPosition, vehicle.position);
    const sampleDistance = Math.max(radius * 0.5, 1);
    const sampleCount = Math.max(1, Math.ceil(travelDistance / sampleDistance));

    for (let sample = 0; sample <= sampleCount; sample += 1) {
      const progress = sample / sampleCount;
      const position = interpolate(startPosition, vehicle.position, progress);

      for (const wall of walls) {
        const collisionDistance = radius + wall.thickness / 2;
        if (distanceToSegment(position, wall) <= collisionDistance) return wall;
      }
    }

    return null;
  }
}

export function distanceToSegment(point: Point, segment: WallSegment) {
  const segmentX = segment.end.x - segment.start.x;
  const segmentY = segment.end.y - segment.start.y;
  const segmentLengthSquared = segmentX * segmentX + segmentY * segmentY;

  if (segmentLengthSquared === 0) return distance(point, segment.start);

  const projection = ((point.x - segment.start.x) * segmentX + (point.y - segment.start.y) * segmentY) / segmentLengthSquared;
  const clampedProjection = Math.max(0, Math.min(1, projection));
  const closestPoint = {
    x: segment.start.x + clampedProjection * segmentX,
    y: segment.start.y + clampedProjection * segmentY,
  };

  return distance(point, closestPoint);
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
