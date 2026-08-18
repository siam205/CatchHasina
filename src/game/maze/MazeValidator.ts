import type { LevelDefinition, Point, Vehicle } from "@/game/state/gameTypes";
import { CollisionSystem, distanceToSegment } from "@/game/engine/CollisionSystem";
import { HazardSystem } from "@/game/engine/HazardSystem";
import { COLLECTIBLE_HIT_RADIUS } from "@/lib/constants";

const DEFAULT_GRID_STEP = 24;
const SEED_SEARCH_RINGS = 4;

export interface ReachabilityOptions {
  /** Sampling resolution of the search grid, in world units. */
  gridStep?: number;
  /** Extra collision radius added to the probe vehicle, used to prove a route has room to spare. */
  clearance?: number;
  /** How close the probe centre must get to the target instead of reaching it exactly. */
  proximity?: number;
}

export function isDestinationReachable(level: LevelDefinition, gridStep = DEFAULT_GRID_STEP) {
  return isPointReachable(level, level.destination.position, { gridStep });
}

export function isPointReachable(level: LevelDefinition, target: Point, options: ReachabilityOptions = {}) {
  const { gridStep = DEFAULT_GRID_STEP, clearance = 0, proximity = 0 } = options;
  const probe = inflateVehicle(level.vehicleStart, clearance);
  const probeRadius = Math.max(probe.width, probe.height) / 2;
  const captureRadius = proximity > 0 ? proximity + probeRadius : 0;
  const collisionSystem = new CollisionSystem();
  const hazardSystem = new HazardSystem();

  const isSafe = (position: Point) => {
    const vehicle = { ...probe, position };
    return collisionSystem.detect(vehicle, position, level.walls) === null
      && hazardSystem.detect(vehicle, position, level.hazards) === null;
  };

  const canTravel = (from: Point, to: Point) => {
    const vehicle = { ...probe, position: to };
    return collisionSystem.detect(vehicle, from, level.walls) === null
      && hazardSystem.detect(vehicle, from, level.hazards) === null;
  };

  // An exact target must itself be standable; a proximity target only needs a safe cell nearby.
  if (captureRadius === 0 && !isSafe(target)) return false;

  const columns = Math.floor(level.width / gridStep) + 1;
  const rows = Math.floor(level.height / gridStep) + 1;
  const gridPosition = (column: number, row: number): Point => ({
    x: Math.min(column * gridStep, level.width),
    y: Math.min(row * gridStep, level.height),
  });

  const start = level.vehicleStart.position;
  const startColumn = clamp(Math.round(start.x / gridStep), 0, columns - 1);
  const startRow = clamp(Math.round(start.y / gridStep), 0, rows - 1);

  // Seed from the nearest safe cells the probe can drive to directly, expanding ring by ring.
  const seeds: Array<{ column: number; row: number }> = [];
  for (let ring = 0; ring <= SEED_SEARCH_RINGS && seeds.length === 0; ring += 1) {
    for (let rowOffset = -ring; rowOffset <= ring; rowOffset += 1) {
      for (let columnOffset = -ring; columnOffset <= ring; columnOffset += 1) {
        if (Math.max(Math.abs(rowOffset), Math.abs(columnOffset)) !== ring) continue;
        const column = startColumn + columnOffset;
        const row = startRow + rowOffset;
        if (column < 0 || column >= columns || row < 0 || row >= rows) continue;
        const position = gridPosition(column, row);
        if (!isSafe(position) || !canTravel(start, position)) continue;
        seeds.push({ column, row });
      }
    }
  }
  if (seeds.length === 0) return false;

  const reaches = captureRadius > 0
    ? (from: Point) => distance(from, target) <= captureRadius
    : (from: Point) => distance(from, target) <= gridStep * 3 && canTravel(from, target);

  const queue = [...seeds];
  const visited = new Set(seeds.map((seed) => nodeKey(seed.column, seed.row)));

  for (let head = 0; head < queue.length; head += 1) {
    const current = queue[head];
    const currentPosition = gridPosition(current.column, current.row);
    if (reaches(currentPosition)) return true;

    const neighbors = [
      { column: current.column - 1, row: current.row },
      { column: current.column + 1, row: current.row },
      { column: current.column, row: current.row - 1 },
      { column: current.column, row: current.row + 1 },
    ];

    for (const neighbor of neighbors) {
      if (neighbor.column < 0 || neighbor.column >= columns || neighbor.row < 0 || neighbor.row >= rows) continue;
      const key = nodeKey(neighbor.column, neighbor.row);
      if (visited.has(key)) continue;

      const neighborPosition = gridPosition(neighbor.column, neighbor.row);
      if (!isSafe(neighborPosition) || !canTravel(currentPosition, neighborPosition)) continue;
      visited.add(key);
      queue.push(neighbor);
    }
  }

  return false;
}

/** Collectibles a player could never pick up, even with perfect driving. */
export function findUnreachableCollectibles(level: LevelDefinition, options: ReachabilityOptions = {}) {
  return level.collectibles
    .filter((collectible) => !isPointReachable(level, collectible.position, { ...options, proximity: COLLECTIBLE_HIT_RADIUS }))
    .map((collectible) => collectible.id);
}

/** Entities authored inside wall geometry, or stars buried inside a lethal hazard. */
export function findObstructedEntities(level: LevelDefinition) {
  const obstructed: string[] = [];

  const touchesWall = (position: Point, radius: number) =>
    level.walls.some((wall) => distanceToSegment(position, wall) <= wall.thickness / 2 + radius);

  if (touchesWall(level.destination.position, 0)) obstructed.push("destination");

  for (const collectible of level.collectibles) {
    if (touchesWall(collectible.position, 0)) obstructed.push(collectible.id);
    else if (level.hazards.some((hazard) => distance(collectible.position, hazard.position) <= hazard.radius)) {
      obstructed.push(collectible.id);
    }
  }

  for (const hazard of level.hazards) {
    if (touchesWall(hazard.position, 0)) obstructed.push(hazard.id);
  }

  return obstructed;
}

/** The car must not spawn inside a wall or on top of a hazard. */
export function isStartClear(level: LevelDefinition, clearance = 0) {
  const probe = inflateVehicle(level.vehicleStart, clearance);
  const position = level.vehicleStart.position;
  return new CollisionSystem().detect({ ...probe, position }, position, level.walls) === null
    && new HazardSystem().detect({ ...probe, position }, position, level.hazards) === null;
}

function inflateVehicle(vehicle: Vehicle, clearance: number): Vehicle {
  if (clearance <= 0) return vehicle;
  return { ...vehicle, width: vehicle.width + clearance * 2, height: vehicle.height + clearance * 2 };
}

function nodeKey(column: number, row: number) {
  return `${column}:${row}`;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}

function distance(first: Point, second: Point) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}
