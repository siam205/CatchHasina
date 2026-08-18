import type { Collectible, Hazard, LevelDefinition, WallSegment } from "@/game/state/gameTypes";

const wall = (x1: number, y1: number, x2: number, y2: number, thickness = 6): WallSegment => ({
  start: { x: x1, y: y1 },
  end: { x: x2, y: y2 },
  thickness,
});

const hazard = (id: string, x: number, y: number, radius = 34): Hazard => ({
  id,
  position: { x, y },
  radius,
});

/** Rectangular room outline, used for maze blocks, islands, and spiral rings. */
const box = (x1: number, y1: number, x2: number, y2: number, thickness = 6) => [
  wall(x1, y1, x2, y1, thickness),
  wall(x2, y1, x2, y2, thickness),
  wall(x1, y2, x2, y2, thickness),
  wall(x1, y1, x1, y2, thickness),
];

/** Level boundary with a single opening in the top edge. */
const createBoundaryWalls = (
  width: number,
  height: number,
  horizontalMargin: number,
  verticalMargin: number,
  exitStart: number,
  exitEnd: number,
  thickness = 6,
) => [
  wall(horizontalMargin, verticalMargin, horizontalMargin, height - verticalMargin, thickness),
  wall(width - horizontalMargin, verticalMargin, width - horizontalMargin, height - verticalMargin, thickness),
  wall(horizontalMargin, height - verticalMargin, width - horizontalMargin, height - verticalMargin, thickness),
  wall(horizontalMargin, verticalMargin, exitStart, verticalMargin, thickness),
  wall(exitEnd, verticalMargin, width - horizontalMargin, verticalMargin, thickness),
];

/** Fully sealed boundary, for levels whose target sits inside the maze rather than past its edge. */
const createSealedBoundary = (
  width: number,
  height: number,
  horizontalMargin: number,
  verticalMargin: number,
  thickness = 6,
) => box(horizontalMargin, verticalMargin, width - horizontalMargin, height - verticalMargin, thickness);

const stars = (level: number, value: number, points: Array<[number, number]>): Collectible[] =>
  points.map(([x, y], index) => ({
    id: `level-${level}-star-${index + 1}`,
    position: { x, y },
    value,
    collected: false,
  }));

const hazards = (level: number, points: Array<[number, number]>): Hazard[] =>
  points.map(([x, y], index) => hazard(`level-${level}-hazard-${index + 1}`, x, y));

const car = (x: number, y: number) => ({
  position: { x, y },
  rotation: 0,
  width: 34,
  height: 66,
  speed: 0,
});

export const LEVEL_CONFIGS: LevelDefinition[] = [
  // 1 — Loop around a single block. Teaches steering and collecting, forgives everything.
  {
    level: 1,
    name: "Open Yard",
    width: 960,
    height: 540,
    walls: [
      ...createBoundaryWalls(960, 540, 44, 18, 420, 540, 4),
      ...box(320, 170, 640, 370, 4),
      wall(200, 370, 200, 522, 4),
    ],
    vehicleStart: car(480, 450),
    destination: { position: { x: 480, y: 80 }, radius: 25 },
    collectibles: stars(1, 100, [[180, 270], [780, 270], [120, 450]]),
    hazards: [],
    maxCollisions: 8,
    timeLimitSeconds: 120,
    difficultyMultiplier: 1,
  },

  // 2 — Two routes up. Left is a slow chicane, right is direct but guarded.
  {
    level: 2,
    name: "Twin Alleys",
    width: 1600,
    height: 900,
    walls: [
      ...createBoundaryWalls(1600, 900, 60, 30, 740, 860),
      ...box(400, 220, 1260, 720),
      wall(60, 400, 250, 400),
      wall(210, 560, 400, 560),
      wall(1400, 700, 1540, 700),
    ],
    vehicleStart: car(800, 800),
    destination: { position: { x: 800, y: 110 }, radius: 28 },
    collectibles: stars(2, 125, [[230, 800], [1470, 790], [150, 300], [1370, 320]]),
    hazards: hazards(2, [[1330, 470]]),
    maxCollisions: 7,
    timeLimitSeconds: 115,
    difficultyMultiplier: 1.15,
  },

  // 3 — City blocks. Every street looks alike, so the mini map starts earning its place.
  {
    level: 3,
    name: "The Grid",
    width: 2000,
    height: 1250,
    walls: [
      ...createBoundaryWalls(2000, 1250, 70, 34, 930, 1070),
      ...box(250, 250, 630, 510),
      ...box(810, 250, 1190, 510),
      ...box(1370, 250, 1750, 510),
      ...box(250, 750, 630, 1030),
      ...box(810, 750, 1190, 1030),
      ...box(1370, 750, 1750, 1030),
      wall(630, 250, 810, 250),
      wall(1190, 1030, 1370, 1030),
    ],
    vehicleStart: car(1000, 1120),
    destination: { position: { x: 1000, y: 130 }, radius: 28 },
    collectibles: stars(3, 150, [[160, 630], [1840, 630], [720, 890], [1280, 370], [1000, 630]]),
    hazards: hazards(3, [[500, 580], [1500, 580]]),
    maxCollisions: 6,
    timeLimitSeconds: 110,
    difficultyMultiplier: 1.3,
  },

  // 4 — Ring road with four spokes. Take the wrong spoke and you pay for a full lap.
  {
    level: 4,
    name: "Roundabout",
    width: 2200,
    height: 1400,
    walls: [
      ...createBoundaryWalls(2200, 1400, 80, 40, 1020, 1180),
      ...box(820, 540, 1380, 860),
      wall(540, 280, 1020, 280),
      wall(1180, 280, 1660, 280),
      wall(540, 1120, 1020, 1120),
      wall(1180, 1120, 1660, 1120),
      wall(540, 280, 540, 720),
      wall(540, 880, 540, 1120),
      wall(1660, 280, 1660, 720),
      wall(1660, 880, 1660, 1120),
      wall(80, 700, 540, 700),
      wall(1660, 700, 2120, 700),
    ],
    vehicleStart: car(1100, 1240),
    destination: { position: { x: 1100, y: 120 }, radius: 29 },
    collectibles: stars(4, 175, [[700, 1240], [1500, 1240], [680, 700], [1520, 700], [700, 380], [760, 190]]),
    hazards: hazards(4, [[900, 950], [1500, 450]]),
    maxCollisions: 6,
    timeLimitSeconds: 105,
    difficultyMultiplier: 1.45,
  },

  // 5 — The one switchback level, with dead-end pockets holding the richest stars.
  {
    level: 5,
    name: "Switchback Pass",
    width: 2400,
    height: 1600,
    walls: [
      ...createBoundaryWalls(2400, 1600, 90, 44, 1120, 1280),
      wall(90, 1240, 1980, 1240),
      wall(420, 940, 2310, 940),
      wall(90, 640, 1980, 640),
      wall(420, 340, 2310, 340),
      wall(400, 1400, 400, 1556),
      wall(400, 1400, 760, 1400),
      wall(1600, 640, 1600, 800),
      wall(1600, 800, 1950, 800),
    ],
    vehicleStart: car(1400, 1450),
    destination: { position: { x: 1200, y: 140 }, radius: 30 },
    collectibles: stars(5, 200, [[580, 1480], [1780, 720], [2150, 1100], [250, 800], [2150, 500], [700, 450], [1200, 180]]),
    hazards: hazards(5, [[900, 1150], [900, 850], [1500, 550]]),
    maxCollisions: 5,
    timeLimitSeconds: 100,
    difficultyMultiplier: 1.6,
  },

  // 6 — Concentric rings with opposed openings. Half a lap per ring, and the target is the centre.
  {
    level: 6,
    name: "The Spiral",
    width: 2400,
    height: 2400,
    walls: [
      ...createSealedBoundary(2400, 2400, 100, 100),
      wall(360, 360, 2040, 360),
      wall(360, 360, 360, 2040),
      wall(2040, 360, 2040, 2040),
      wall(360, 2040, 1060, 2040),
      wall(1340, 2040, 2040, 2040),
      wall(620, 1780, 1780, 1780),
      wall(620, 620, 620, 1780),
      wall(1780, 620, 1780, 1780),
      wall(620, 620, 1060, 620),
      wall(1340, 620, 1780, 620),
      wall(880, 880, 1520, 880),
      wall(880, 880, 880, 1520),
      wall(1520, 880, 1520, 1520),
      wall(880, 1520, 1060, 1520),
      wall(1340, 1520, 1520, 1520),
    ],
    vehicleStart: car(1200, 2170),
    destination: { position: { x: 1200, y: 1200 }, radius: 30 },
    collectibles: stars(6, 225, [[400, 2170], [2000, 2170], [230, 1200], [2170, 1200], [490, 1200], [1910, 1200], [750, 1200], [1650, 1200]]),
    hazards: hazards(6, [[1200, 190], [800, 450], [1600, 1610], [900, 1870]]),
    maxCollisions: 5,
    timeLimitSeconds: 105,
    difficultyMultiplier: 1.75,
  },

  // 7 — Offset blocks braid the streets: no dead ends, but no straight run either.
  {
    level: 7,
    name: "The Braid",
    width: 2800,
    height: 1600,
    walls: [
      ...createBoundaryWalls(2800, 1600, 100, 50, 1300, 1500),
      ...box(435, 290, 855, 680),
      ...box(1190, 290, 1610, 680),
      ...box(1945, 290, 2365, 680),
      ...box(605, 920, 1025, 1310),
      ...box(1360, 920, 1780, 1310),
      ...box(2115, 920, 2535, 1310),
    ],
    vehicleStart: car(1400, 1430),
    destination: { position: { x: 1400, y: 170 }, radius: 30 },
    collectibles: stars(7, 250, [[270, 1430], [2530, 1430], [1000, 170], [2200, 170], [270, 800], [2530, 800], [1200, 1100]]),
    hazards: hazards(7, [[955, 750], [1712, 830], [270, 400], [1950, 1100]]),
    maxCollisions: 4,
    timeLimitSeconds: 95,
    difficultyMultiplier: 1.9,
  },

  // 8 — A fork with teeth: the left comb is clean and long, the right is short and mined.
  {
    level: 8,
    name: "Comb Fork",
    width: 3000,
    height: 1800,
    walls: [
      ...createBoundaryWalls(3000, 1800, 110, 55, 1400, 1600),
      wall(1500, 300, 1500, 1300),
      wall(360, 1120, 1500, 1120),
      wall(110, 900, 1250, 900),
      wall(360, 680, 1500, 680),
      wall(110, 460, 1250, 460),
      wall(1500, 1120, 2640, 1120),
      wall(1750, 900, 2890, 900),
      wall(1500, 680, 2640, 680),
      wall(1750, 460, 2890, 460),
    ],
    vehicleStart: car(1500, 1580),
    destination: { position: { x: 1500, y: 155 }, radius: 31 },
    collectibles: stars(8, 275, [[600, 1580], [2400, 1580], [230, 1000], [1370, 790], [230, 560], [2770, 1000], [1620, 790], [2770, 560]]),
    hazards: hazards(8, [[2100, 970], [2400, 750], [1900, 530], [2500, 1190]]),
    maxCollisions: 4,
    timeLimitSeconds: 90,
    difficultyMultiplier: 2.05,
  },

  // 9 — Vertical comb with barely enough room to turn. Precision over speed.
  {
    level: 9,
    name: "Narrow Gauge",
    width: 2600,
    height: 1800,
    walls: [
      ...createBoundaryWalls(2600, 1800, 110, 55, 2290, 2450),
      wall(348, 300, 348, 1745),
      wall(586, 55, 586, 1500),
      wall(824, 300, 824, 1745),
      wall(1062, 55, 1062, 1500),
      wall(1300, 300, 1300, 1745),
      wall(1538, 55, 1538, 1500),
      wall(1776, 300, 1776, 1745),
      wall(2014, 55, 2014, 1500),
      wall(2252, 300, 2252, 1745),
    ],
    vehicleStart: car(229, 1620),
    destination: { position: { x: 2371, y: 160 }, radius: 31 },
    collectibles: stars(9, 300, [[229, 900], [470, 400], [700, 1300], [940, 400], [1180, 1300], [1420, 400], [1900, 1300], [2371, 900]]),
    hazards: hazards(9, [[398, 900], [874, 700], [1350, 1100], [1826, 700], [2064, 1100]]),
    maxCollisions: 3,
    timeLimitSeconds: 95,
    difficultyMultiplier: 2.2,
  },

  // 10 — Grid, then island, then switchbacks. Everything the previous nine taught, back to back.
  {
    level: 10,
    name: "The Gauntlet",
    width: 3600,
    height: 2200,
    walls: [
      ...createBoundaryWalls(3600, 2200, 120, 60, 1700, 1900),
      wall(120, 1500, 1600, 1500),
      wall(1900, 1500, 3480, 1500),
      wall(120, 700, 1300, 700),
      wall(1600, 700, 3480, 700),
      ...box(400, 1720, 900, 1920),
      ...box(1200, 1720, 1700, 1920),
      ...box(2000, 1720, 2500, 1920),
      ...box(2800, 1720, 3300, 1920),
      ...box(1200, 940, 2400, 1260),
      wall(120, 540, 3100, 540),
      wall(500, 380, 3480, 380),
      wall(120, 220, 3100, 220),
    ],
    vehicleStart: car(1750, 2030),
    destination: { position: { x: 1800, y: 140 }, radius: 32 },
    collectibles: stars(10, 325, [[260, 2030], [3390, 2030], [1050, 1610], [2650, 1610], [300, 800], [3300, 800], [700, 1400], [2900, 1400], [3300, 620], [1800, 300]]),
    hazards: hazards(10, [[700, 1100], [2900, 1100], [250, 460]]),
    maxCollisions: 3,
    timeLimitSeconds: 105,
    difficultyMultiplier: 2.4,
  },
];

export const initialLevel = LEVEL_CONFIGS[0];
