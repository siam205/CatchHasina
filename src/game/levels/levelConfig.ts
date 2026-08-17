import type { LevelDefinition, WallSegment } from "@/game/state/gameTypes";

const wall = (x1: number, y1: number, x2: number, y2: number, thickness = 4): WallSegment => ({
  start: { x: x1, y: y1 },
  end: { x: x2, y: y2 },
  thickness,
});

const createBoundaryWalls = (
  width: number,
  height: number,
  horizontalMargin: number,
  verticalMargin: number,
  exitStart: number,
  exitEnd: number,
  thickness = 4,
) => [
  wall(horizontalMargin, verticalMargin, horizontalMargin, height - verticalMargin, thickness),
  wall(width - horizontalMargin, verticalMargin, width - horizontalMargin, height - verticalMargin, thickness),
  wall(horizontalMargin, height - verticalMargin, width - horizontalMargin, height - verticalMargin, thickness),
  wall(horizontalMargin, verticalMargin, exitStart, verticalMargin, thickness),
  wall(exitEnd, verticalMargin, width - horizontalMargin, verticalMargin, thickness),
];

const levelOneBoundary = createBoundaryWalls(960, 540, 44, 18, 250, 710);
const levelTwoBoundary = createBoundaryWalls(1920, 1080, 72, 36, 820, 1100, 6);
const levelThreeBoundary = createBoundaryWalls(2400, 1500, 90, 42, 1040, 1360, 6);

export const LEVEL_CONFIGS: LevelDefinition[] = [
  {
    level: 1,
    width: 960,
    height: 540,
    walls: [
      ...levelOneBoundary,
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
    width: 1920,
    height: 1080,
    walls: [
      ...levelTwoBoundary,
      wall(260, 320, 1550, 320, 6),
      wall(260, 320, 260, 620, 6),
      wall(1550, 320, 1550, 500, 6),
      wall(420, 690, 1300, 690, 6),
      wall(420, 690, 420, 900, 6),
      wall(1300, 690, 1300, 820, 6),
      wall(420, 900, 900, 900, 6),
      wall(1100, 900, 1300, 900, 6),
      wall(72, 580, 260, 580, 6),
      wall(1550, 580, 1848, 580, 6),
    ],
    vehicleStart: {
      position: { x: 960, y: 820 },
      rotation: 0,
      width: 34,
      height: 66,
      speed: 0,
    },
    destination: {
      position: { x: 960, y: 82 },
      radius: 30,
    },
    collectibles: [
      { id: "level-2-star-1", position: { x: 600, y: 820 }, value: 125, collected: false },
      { id: "level-2-star-2", position: { x: 1400, y: 820 }, value: 125, collected: false },
      { id: "level-2-star-3", position: { x: 1400, y: 540 }, value: 125, collected: false },
      { id: "level-2-star-4", position: { x: 1680, y: 540 }, value: 125, collected: false },
    ],
    maxCollisions: 7,
    timeLimitSeconds: 110,
    difficultyMultiplier: 1.1,
  },
  {
    level: 3,
    width: 2400,
    height: 1500,
    walls: [
      ...levelThreeBoundary,
      wall(300, 400, 2050, 400, 6),
      wall(300, 400, 300, 850, 6),
      wall(2050, 400, 2050, 650, 6),
      wall(500, 850, 1800, 850, 6),
      wall(500, 850, 500, 1200, 6),
      wall(1800, 850, 1800, 1050, 6),
      wall(500, 1200, 1400, 1200, 6),
      wall(1400, 1050, 1400, 1200, 6),
      wall(90, 670, 300, 670, 6),
      wall(2050, 670, 2310, 670, 6),
      wall(900, 1050, 1200, 1050, 6),
    ],
    vehicleStart: {
      position: { x: 1200, y: 1280 },
      rotation: 0,
      width: 34,
      height: 66,
      speed: 0,
    },
    destination: {
      position: { x: 1200, y: 88 },
      radius: 30,
    },
    collectibles: [
      { id: "level-3-star-1", position: { x: 720, y: 1120 }, value: 150, collected: false },
      { id: "level-3-star-2", position: { x: 1600, y: 1120 }, value: 150, collected: false },
      { id: "level-3-star-3", position: { x: 650, y: 650 }, value: 150, collected: false },
      { id: "level-3-star-4", position: { x: 1750, y: 650 }, value: 150, collected: false },
      { id: "level-3-star-5", position: { x: 1200, y: 600 }, value: 150, collected: false },
    ],
    maxCollisions: 6,
    timeLimitSeconds: 100,
    difficultyMultiplier: 1.25,
  },
];

export const initialLevel = LEVEL_CONFIGS[0];
