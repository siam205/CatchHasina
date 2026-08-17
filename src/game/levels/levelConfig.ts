import type { LevelDefinition, WallSegment } from "@/game/state/gameTypes";

const wall = (x1: number, y1: number, x2: number, y2: number, thickness = 4): WallSegment => ({
  start: { x: x1, y: y1 },
  end: { x: x2, y: y2 },
  thickness,
});

export const LEVEL_CONFIGS: LevelDefinition[] = [
  {
    level: 1,
    width: 960,
    height: 540,
    walls: [
      wall(44, 18, 44, 510),
      wall(916, 18, 916, 510),
      wall(44, 510, 916, 510),
      wall(44, 18, 250, 18),
      wall(710, 18, 916, 18),
      wall(250, 150, 675, 150),
      wall(480, 150, 480, 510),
      wall(250, 348, 250, 510),
      wall(675, 348, 916, 348),
    ],
    vehicleStart: {
      position: { x: 520, y: 278 },
      rotation: 0,
      width: 34,
      height: 66,
      speed: 0,
    },
    destination: {
      position: { x: 480, y: 68 },
      radius: 25,
    },
    collectibles: [
      { id: "level-1-star-1", position: { x: 350, y: 275 }, value: 100, collected: false },
      { id: "level-1-star-2", position: { x: 785, y: 275 }, value: 100, collected: false },
      { id: "level-1-star-3", position: { x: 155, y: 420 }, value: 100, collected: false },
    ],
    maxCollisions: 8,
    timeLimitSeconds: 120,
    difficultyMultiplier: 1,
  },
];

export const initialLevel = LEVEL_CONFIGS[0];
