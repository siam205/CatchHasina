import { describe, expect, it } from "vitest";
import { LEVEL_CONFIGS } from "@/game/levels/levelConfig";
import {
  findObstructedEntities,
  findUnreachableCollectibles,
  isDestinationReachable,
  isPointReachable,
  isStartClear,
} from "./MazeValidator";

/** Extra collision radius a route must tolerate before we call it comfortable to drive. */
const COMFORT_CLEARANCE = 16;

describe("authored maze integrity", () => {
  it.each(LEVEL_CONFIGS.map((level) => [level.level, level.name, level] as const))(
    "level %i (%s) connects the start to the destination",
    (_level, _name, level) => {
      expect(isDestinationReachable(level)).toBe(true);
    },
  );

  it.each(LEVEL_CONFIGS.map((level) => [level.level, level.name, level] as const))(
    "level %i (%s) spawns the car in open space",
    (_level, _name, level) => {
      expect(isStartClear(level, COMFORT_CLEARANCE)).toBe(true);
    },
  );

  it.each(LEVEL_CONFIGS.map((level) => [level.level, level.name, level] as const))(
    "level %i (%s) leaves every collectible reachable",
    (_level, _name, level) => {
      expect(findUnreachableCollectibles(level)).toEqual([]);
    },
  );

  it.each(LEVEL_CONFIGS.map((level) => [level.level, level.name, level] as const))(
    "level %i (%s) keeps entities out of walls and hazards",
    (_level, _name, level) => {
      expect(findObstructedEntities(level)).toEqual([]);
    },
  );

  it.each(LEVEL_CONFIGS.map((level) => [level.level, level.name, level] as const))(
    "level %i (%s) offers at least one route with room to spare",
    (_level, _name, level) => {
      expect(isPointReachable(level, level.destination.position, { clearance: COMFORT_CLEARANCE })).toBe(true);
    },
  );
});

describe("authored level progression", () => {
  it("numbers levels consecutively from one", () => {
    expect(LEVEL_CONFIGS.map((level) => level.level)).toEqual(
      LEVEL_CONFIGS.map((_level, index) => index + 1),
    );
  });

  it("never gets easier as levels advance", () => {
    for (let index = 1; index < LEVEL_CONFIGS.length; index += 1) {
      const previous = LEVEL_CONFIGS[index - 1];
      const current = LEVEL_CONFIGS[index];
      expect(current.difficultyMultiplier).toBeGreaterThan(previous.difficultyMultiplier);
      expect(current.maxCollisions).toBeLessThanOrEqual(previous.maxCollisions);
    }
  });

  it("gives every level a distinct name", () => {
    const names = LEVEL_CONFIGS.map((level) => level.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
