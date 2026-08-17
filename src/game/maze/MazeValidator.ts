import type { LevelDefinition, Point } from "@/game/state/gameTypes";
import { CollisionSystem } from "@/game/engine/CollisionSystem";
import { HazardSystem } from "@/game/engine/HazardSystem";

export function isDestinationReachable(level: LevelDefinition, gridStep = 24) {
  const collisionSystem = new CollisionSystem();
  const hazardSystem = new HazardSystem();
  const destination = level.destination.position;
  if (!isSafe(destination)) return false;

  const columns = Math.floor(level.width / gridStep) + 1;
  const rows = Math.floor(level.height / gridStep) + 1;
  const candidates: Array<{ column: number; row: number; position: Point; distance: number }> = [];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const position = gridPosition(column, row);
      if (!isSafe(position)) continue;
      candidates.push({ column, row, position, distance: distance(position, level.vehicleStart.position) });
    }
  }

  candidates.sort((first, second) => first.distance - second.distance);
  const queue = candidates
    .filter((candidate) => canTravel(level.vehicleStart.position, candidate.position))
    .map((candidate) => ({ column: candidate.column, row: candidate.row }));
  const visited = new Set(queue.map((node) => nodeKey(node.column, node.row)));

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;

    const currentPosition = gridPosition(current.column, current.row);
    if (canTravel(currentPosition, destination)) return true;

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

  function gridPosition(column: number, row: number): Point {
    return {
      x: Math.min(column * gridStep, level.width),
      y: Math.min(row * gridStep, level.height),
    };
  }

  function isSafe(position: Point) {
    const vehicle = { ...level.vehicleStart, position };
    return collisionSystem.detect(vehicle, position, level.walls) === null
      && hazardSystem.detect(vehicle, position, level.hazards) === null;
  }

  function canTravel(from: Point, to: Point) {
    const vehicle = { ...level.vehicleStart, position: to };
    return collisionSystem.detect(vehicle, from, level.walls) === null
      && hazardSystem.detect(vehicle, from, level.hazards) === null;
  }
}

function nodeKey(column: number, row: number) {
  return `${column}:${row}`;
}

function distance(first: Point, second: Point) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}
