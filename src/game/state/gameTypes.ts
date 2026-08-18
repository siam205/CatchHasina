export type GameStatus = "idle" | "starting" | "playing" | "paused" | "exploding" | "completed" | "failed";
export type FailureReason = "collisionLimit" | "timeLimit" | "hazard";

export interface Point {
  x: number;
  y: number;
}

export interface Vehicle {
  position: Point;
  rotation: number;
  width: number;
  height: number;
  speed: number;
}

export type VehicleAction = "accelerate" | "brake" | "turnLeft" | "turnRight";

export interface VehicleInput {
  accelerate: boolean;
  brake: boolean;
  turnLeft: boolean;
  turnRight: boolean;
}

export interface AudioSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
}

export interface WallSegment {
  start: Point;
  end: Point;
  thickness: number;
}

export interface Destination {
  position: Point;
  radius: number;
}

export interface Collectible {
  id: string;
  position: Point;
  value: number;
  collected: boolean;
}

export interface Hazard {
  id: string;
  position: Point;
  radius: number;
}

export interface LevelDefinition {
  level: number;
  name: string;
  width: number;
  height: number;
  walls: WallSegment[];
  vehicleStart: Vehicle;
  destination: Destination;
  collectibles: Collectible[];
  hazards: Hazard[];
  maxCollisions: number;
  timeLimitSeconds: number;
  difficultyMultiplier: number;
}

export interface GameSnapshot {
  status: GameStatus;
  level: number;
  score: number;
  collisionsUsed: number;
  maxCollisions: number;
  collectiblesCollected: number;
  totalCollectibles: number;
  remainingTimeSeconds: number;
  countdownSeconds: number;
  soundEnabled: boolean;
  musicEnabled: boolean;
  failureReason?: FailureReason;
}

export interface MiniMapState {
  vehiclePosition: Point;
  cameraPosition: Point;
  collectedIds: ReadonlySet<string>;
}

export interface LevelRecord {
  completions: number;
  bestScore: number;
  bestCollisions: number;
  bestCollectibles: number;
  bestRemainingTimeSeconds: number;
}
