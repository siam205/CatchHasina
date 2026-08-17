import {
  COLLISION_COOLDOWN_SECONDS,
  COLLISION_FLASH_SECONDS,
  COLLISION_SHAKE_SECONDS,
  LOGICAL_CANVAS_WIDTH,
} from "@/lib/constants";
import type { GameSnapshot, LevelDefinition, VehicleAction } from "@/game/state/gameTypes";
import { CollisionSystem } from "./CollisionSystem";
import { GameLoop } from "./GameLoop";
import { InputManager } from "./InputManager";
import { Renderer, type RenderEffects } from "./Renderer";
import { VehicleController } from "./VehicleController";

type SnapshotListener = (snapshot: GameSnapshot) => void;

export class GameEngine {
  private readonly loop: GameLoop;
  private readonly renderer: Renderer;
  private readonly inputManager: InputManager;
  private readonly vehicleController: VehicleController;
  private readonly collisionSystem: CollisionSystem;
  private readonly snapshotListeners = new Set<SnapshotListener>();
  private snapshot: GameSnapshot;
  private animationTime = 0;
  private collisionCooldownRemaining = 0;
  private collisionFlashRemaining = 0;
  private collisionShakeRemaining = 0;

  constructor(private readonly canvas: HTMLCanvasElement, private readonly level: LevelDefinition) {
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas rendering is not available.");

    this.renderer = new Renderer(context);
    this.inputManager = new InputManager();
    this.vehicleController = new VehicleController(level.vehicleStart);
    this.collisionSystem = new CollisionSystem();
    this.resize(canvas.clientWidth || LOGICAL_CANVAS_WIDTH, 1);
    this.snapshot = {
      status: "idle",
      level: level.level,
      score: 0,
      collisionsUsed: 0,
      maxCollisions: level.maxCollisions,
      collectiblesCollected: 0,
      totalCollectibles: level.collectibles.length,
    };
    this.loop = new GameLoop((elapsedSeconds) => {
      this.animationTime += elapsedSeconds;
      this.update(elapsedSeconds);
    });
  }

  start() {
    this.snapshot = { ...this.snapshot, status: "playing" };
    this.inputManager.attach();
    this.notifySnapshotListeners();
    this.render();
    this.loop.start();
  }

  stop() {
    this.loop.stop();
    this.inputManager.detach();
  }

  resize(cssWidth: number, devicePixelRatio: number) {
    this.renderer.resize(this.canvas, cssWidth, devicePixelRatio);
    this.render();
  }

  setAction(action: VehicleAction, pressed: boolean) {
    this.inputManager.setAction(action, pressed);
  }

  getSnapshot() {
    return this.snapshot;
  }

  subscribe(listener: SnapshotListener) {
    this.snapshotListeners.add(listener);
    listener(this.snapshot);
    return () => this.snapshotListeners.delete(listener);
  }

  private update(elapsedSeconds: number) {
    this.updateEffects(elapsedSeconds);

    if (this.snapshot.status !== "playing") {
      this.render();
      return;
    }

    this.collisionCooldownRemaining = Math.max(0, this.collisionCooldownRemaining - elapsedSeconds);
    const startPosition = this.vehicleController.getLastSafePosition();
    this.vehicleController.update(this.inputManager.getState(), elapsedSeconds, this.level);

    const collision = this.collisionSystem.detect(
      this.vehicleController.getVehicle(),
      startPosition,
      this.level.walls,
    );

    const failed = collision ? this.handleCollision() : false;
    if (!collision) this.vehicleController.commitSafePosition();

    this.render();

    if (failed) {
      this.loop.stop();
      this.inputManager.detach();
    }
  }

  private handleCollision() {
    this.vehicleController.restoreLastSafePosition();
    this.vehicleController.stop();

    this.collisionFlashRemaining = COLLISION_FLASH_SECONDS;
    this.collisionShakeRemaining = COLLISION_SHAKE_SECONDS;

    if (this.collisionCooldownRemaining > 0) return false;

    this.collisionCooldownRemaining = COLLISION_COOLDOWN_SECONDS;
    const collisionsUsed = this.snapshot.collisionsUsed + 1;
    const status = collisionsUsed >= this.snapshot.maxCollisions ? "failed" : "playing";
    this.snapshot = { ...this.snapshot, collisionsUsed, status };
    this.notifySnapshotListeners();
    return status === "failed";
  }

  private updateEffects(elapsedSeconds: number) {
    this.collisionFlashRemaining = Math.max(0, this.collisionFlashRemaining - elapsedSeconds);
    this.collisionShakeRemaining = Math.max(0, this.collisionShakeRemaining - elapsedSeconds);
  }

  private getRenderEffects(): RenderEffects {
    return {
      collisionFlashProgress: this.collisionFlashRemaining / COLLISION_FLASH_SECONDS,
      collisionShakeProgress: this.collisionShakeRemaining / COLLISION_SHAKE_SECONDS,
    };
  }

  private render() {
    this.renderer.render(
      this.level,
      this.animationTime,
      this.vehicleController.getVehicle(),
      this.getRenderEffects(),
    );
  }

  private notifySnapshotListeners() {
    for (const listener of this.snapshotListeners) listener(this.snapshot);
  }
}
