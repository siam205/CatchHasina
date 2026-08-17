import type { LevelDefinition, WallSegment } from "@/game/state/gameTypes";

const wall = (x1: number, y1: number, x2: number, y2: number, thickness = 4): WallSegment => ({
  start: { x: x1, y: y1 },
  end: { x: x2, y: y2 },
  thickness,
});

const boundaryWalls = [
  wall(44, 18, 44, 510),
  wall(916, 18, 916, 510),
  wall(44, 510, 916, 510),
  wall(44, 18, 250, 18),
  wall(710, 18, 916, 18),
];

export const LEVEL_CONFIGS: LevelDefinition[] = [
  {
    level: 1,
    width: 960,
    height: 540,
    walls: [
      ...boundaryWalls,
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
  {
    level: 2,
    width: 960,
    height: 540,
    walls: [
      ...boundaryWalls,
      wall(200, 120, 760, 120),
      wall(200, 120, 200, 300),
      wall(760, 120, 760, 300),
      wall(200, 300, 400, 300),
      wall(560, 300, 760, 300),
      wall(400, 300, 400, 470),
      wall(560, 300, 560, 470),
      wall(400, 470, 560, 470),
      wall(44, 400, 200, 400),
      wall(760, 400, 916, 400),
    ],
    vehicleStart: {
      position: { x: 480, y: 250 },
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
      { id: "level-2-star-1", position: { x: 320, y: 230 }, value: 125, collected: false },
      { id: "level-2-star-2", position: { x: 640, y: 230 }, value: 125, collected: false },
      { id: "level-2-star-3", position: { x: 320, y: 420 }, value: 125, collected: false },
      { id: "level-2-star-4", position: { x: 640, y: 420 }, value: 125, collected: false },
    ],
    maxCollisions: 7,
    timeLimitSeconds: 110,
    difficultyMultiplier: 1.1,
  },
  {
    level: 3,
    width: 960,
    height: 540,
    walls: [
      ...boundaryWalls,
      wall(180, 105, 780, 105),
      wall(180, 105, 180, 260),
      wall(780, 105, 780, 260),
      wall(480, 105, 480, 220),
      wall(180, 260, 360, 260),
      wall(600, 260, 780, 260),
      wall(360, 260, 360, 455),
      wall(600, 260, 600, 455),
      wall(360, 455, 600, 455),
      wall(44, 360, 180, 360),
      wall(780, 360, 916, 360),
      wall(480, 360, 480, 455),
    ],
    vehicleStart: {
      position: { x: 480, y: 300 },
      rotation: 0,
      width: 34,
      height: 66,
      speed: 0,
    },
    destination: {
      position: { x: 480, y: 60 },
      radius: 25,
    },
    collectibles: [
      { id: "level-3-star-1", position: { x: 290, y: 180 }, value: 150, collected: false },
      { id: "level-3-star-2", position: { x: 670, y: 180 }, value: 150, collected: false },
      { id: "level-3-star-3", position: { x: 240, y: 420 }, value: 150, collected: false },
      { id: "level-3-star-4", position: { x: 720, y: 420 }, value: 150, collected: false },
      { id: "level-3-star-5", position: { x: 480, y: 500 }, value: 150, collected: false },
    ],
    maxCollisions: 6,
    timeLimitSeconds: 100,
    difficultyMultiplier: 1.25,
  },
];

export const initialLevel = LEVEL_CONFIGS[0];
