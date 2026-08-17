import {
  COLLISION_COOLDOWN_SECONDS,
  COLLISION_FLASH_SECONDS,
  COLLISION_SHAKE_SECONDS,
  COLLECTION_EFFECT_SECONDS,
  COMPLETION_ANIMATION_SECONDS,
  EXPLOSION_ANIMATION_SECONDS,
  LOGICAL_CANVAS_WIDTH,
  START_COUNTDOWN_SECONDS,
} from "@/lib/constants";
import type { AudioSettings, GameSnapshot, LevelDefinition, MiniMapState, Point, VehicleAction } from "@/game/state/gameTypes";
import { AudioManager } from "./AudioManager";
import { Camera } from "./Camera";
import { CollisionSystem } from "./CollisionSystem";
import { CollectibleSystem } from "./CollectibleSystem";
import { DestinationSystem } from "./DestinationSystem";
import { GameLoop } from "./GameLoop";
import { HazardSystem } from "./HazardSystem";
import { InputManager } from "./InputManager";
import { ParticleSystem } from "./ParticleSystem";
import { Renderer, type CollectionRenderEffect, type RenderEffects } from "./Renderer";
import { ScoreSystem } from "./ScoreSystem";
import { VehicleController } from "./VehicleController";

type SnapshotListener = (snapshot: GameSnapshot) => void;

interface CollectionEffectState {
  position: Point;
  remainingSeconds: number;
}

export class GameEngine {
  private readonly loop: GameLoop;
  private readonly renderer: Renderer;
  private readonly audioManager: AudioManager;
  private readonly camera: Camera;
  private readonly inputManager: InputManager;
  private readonly vehicleController: VehicleController;
  private readonly collisionSystem: CollisionSystem;
  private readonly hazardSystem: HazardSystem;
  private readonly collectibleSystem: CollectibleSystem;
  private readonly destinationSystem: DestinationSystem;
  private readonly scoreSystem: ScoreSystem;
  private readonly particleSystem: ParticleSystem;
  private readonly snapshotListeners = new Set<SnapshotListener>();
  private snapshot: GameSnapshot;
  private animationTime = 0;
  private collisionCooldownRemaining = 0;
  private collisionFlashRemaining = 0;
  private collisionShakeRemaining = 0;
  private collectionEffects: CollectionEffectState[] = [];
  private remainingTimeSeconds: number;
  private countdownRemaining = 0;
  private completionAnimationRemaining = 0;
  private explosionAnimationRemaining = 0;
  private explosionPosition: Point | null = null;
  private trailSpawnRemaining = 0;
  private reducedMotion: boolean;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly level: LevelDefinition,
    audioSettings: AudioSettings,
    reducedMotion = false,
  ) {
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas rendering is not available.");

    this.renderer = new Renderer(context);
    this.audioManager = new AudioManager({ ...audioSettings });
    this.camera = new Camera();
    this.inputManager = new InputManager(() => this.togglePause());
    this.vehicleController = new VehicleController(level.vehicleStart);
    this.collisionSystem = new CollisionSystem();
    this.hazardSystem = new HazardSystem();
    this.collectibleSystem = new CollectibleSystem();
    this.destinationSystem = new DestinationSystem();
    this.scoreSystem = new ScoreSystem();
    this.particleSystem = new ParticleSystem();
    this.remainingTimeSeconds = level.timeLimitSeconds;
    this.reducedMotion = reducedMotion;
    this.snapshot = this.createInitialSnapshot();
    this.resize(canvas.clientWidth || LOGICAL_CANVAS_WIDTH, 1);
    this.loop = new GameLoop((elapsedSeconds) => {
      this.animationTime += elapsedSeconds;
      this.update(elapsedSeconds);
    });
  }

  start() {
    if (this.snapshot.status !== "idle") return;
    this.beginCountdown();
  }

  stop() {
    this.loop.stop();
    this.inputManager.detach();
    this.audioManager.stopMusic();
    this.audioManager.stopEngine();
  }

  destroy() {
    this.stop();
    this.audioManager.destroy();
  }

  pause() {
    if (this.snapshot.status !== "playing") return;

    this.loop.stop();
    this.inputManager.detach();
    this.audioManager.pauseMusic();
    this.audioManager.pauseEngine();
    this.snapshot = { ...this.snapshot, status: "paused" };
    this.notifySnapshotListeners();
    this.render();
  }

  resume() {
    if (this.snapshot.status !== "paused") return;

    this.snapshot = { ...this.snapshot, status: "playing" };
    this.inputManager.attach();
    this.audioManager.resumeMusic();
    this.audioManager.resumeEngine();
    this.notifySnapshotListeners();
    this.loop.start();
  }

  restart() {
    this.stop();
    this.vehicleController.reset();
    this.collectibleSystem.reset();
    this.particleSystem.reset();
    this.camera.reset();
    this.animationTime = 0;
    this.collisionCooldownRemaining = 0;
    this.collisionFlashRemaining = 0;
    this.collisionShakeRemaining = 0;
    this.collectionEffects = [];
    this.completionAnimationRemaining = 0;
    this.explosionAnimationRemaining = 0;
    this.explosionPosition = null;
    this.trailSpawnRemaining = 0;
    this.remainingTimeSeconds = this.level.timeLimitSeconds;
    this.snapshot = this.createInitialSnapshot();
    this.beginCountdown();
  }

  resize(cssWidth: number, devicePixelRatio: number) {
    this.renderer.resize(this.canvas, cssWidth, devicePixelRatio);
    this.render();
  }

  setAction(action: VehicleAction, pressed: boolean) {
    this.inputManager.setAction(action, pressed);
  }

  toggleSound() {
    const enabled = !this.snapshot.soundEnabled;
    this.audioManager.setSoundEnabled(enabled);
    if (enabled && this.snapshot.status === "playing") this.audioManager.startEngine();
    this.snapshot = { ...this.snapshot, soundEnabled: enabled };
    this.notifySnapshotListeners();
  }

  toggleMusic() {
    const enabled = !this.snapshot.musicEnabled;
    this.audioManager.setMusicEnabled(enabled);
    if (enabled && this.snapshot.status === "playing") this.audioManager.startMusic();
    this.snapshot = { ...this.snapshot, musicEnabled: enabled };
    this.notifySnapshotListeners();
  }

  setReducedMotion(reducedMotion: boolean) {
    this.reducedMotion = reducedMotion;
    if (reducedMotion) this.particleSystem.reset();
  }

  getSnapshot() {
    return this.snapshot;
  }

  getMiniMapState(): MiniMapState {
    return {
      vehiclePosition: { ...this.vehicleController.getVehicle().position },
      cameraPosition: { ...this.camera.getPosition() },
      collectedIds: this.collectibleSystem.getCollectedIds(),
    };
  }

  subscribe(listener: SnapshotListener) {
    this.snapshotListeners.add(listener);
    listener(this.snapshot);
    return () => this.snapshotListeners.delete(listener);
  }

  private update(elapsedSeconds: number) {
    this.updateEffects(elapsedSeconds);

    if (this.snapshot.status === "starting") {
      this.updateCountdown(elapsedSeconds);
      this.render();
      return;
    }

    if (this.snapshot.status === "completed") {
      this.completionAnimationRemaining = Math.max(0, this.completionAnimationRemaining - elapsedSeconds);
      this.render();
      if (this.completionAnimationRemaining === 0) this.stop();
      return;
    }

    if (this.snapshot.status === "exploding") {
      this.explosionAnimationRemaining = Math.max(0, this.explosionAnimationRemaining - elapsedSeconds);
      this.render();
      if (this.explosionAnimationRemaining === 0) {
        this.snapshot = { ...this.snapshot, status: "failed" };
        this.notifySnapshotListeners();
        this.stop();
      }
      return;
    }

    if (this.snapshot.status !== "playing") {
      this.render();
      return;
    }

    if (this.updateTimer(elapsedSeconds)) {
      this.render();
      this.stop();
      return;
    }

    this.collisionCooldownRemaining = Math.max(0, this.collisionCooldownRemaining - elapsedSeconds);
    const startPosition = this.vehicleController.getLastSafePosition();
    this.vehicleController.update(this.inputManager.getState(), elapsedSeconds, this.level);
    this.audioManager.updateEngineSpeed(this.vehicleController.getVehicle().speed);
    this.updateVehicleTrail();

    const collision = this.collisionSystem.detect(
      this.vehicleController.getVehicle(),
      startPosition,
      this.level.walls,
    );
    const hazard = collision
      ? null
      : this.hazardSystem.detect(this.vehicleController.getVehicle(), startPosition, this.level.hazards);

    const failed = collision ? this.handleCollision() : hazard ? this.handleHazard() : false;
    let completed = false;
    if (!collision && !hazard) {
      this.vehicleController.commitSafePosition();
      this.handleCollectibles();
      if (this.destinationSystem.detect(this.vehicleController.getVehicle(), this.level.destination)) {
        completed = this.completeLevel();
      }
    }

    this.render();

    if (failed) {
      this.inputManager.detach();
      if (this.explosionAnimationRemaining === 0) this.stop();
    }
    else if (completed) this.inputManager.detach();
  }

  private handleCollision() {
    this.vehicleController.restoreLastSafePosition();
    this.vehicleController.stop();
    this.collisionFlashRemaining = COLLISION_FLASH_SECONDS;
    this.collisionShakeRemaining = COLLISION_SHAKE_SECONDS;

    if (this.collisionCooldownRemaining > 0) return false;

    this.collisionCooldownRemaining = COLLISION_COOLDOWN_SECONDS;
    this.audioManager.playCollision();
    if (!this.reducedMotion) this.particleSystem.spawnCollision(this.vehicleController.getVehicle().position);

    const collisionsUsed = this.snapshot.collisionsUsed + 1;
    const failed = collisionsUsed >= this.snapshot.maxCollisions;
    this.snapshot = {
      ...this.snapshot,
      collisionsUsed,
      status: failed ? "failed" : "playing",
      failureReason: failed ? "collisionLimit" : undefined,
    };
    if (failed) this.audioManager.playFailure();
    this.notifySnapshotListeners();
    return failed;
  }

  private handleHazard() {
    const vehiclePosition = { ...this.vehicleController.getVehicle().position };
    this.vehicleController.stop();
    this.explosionPosition = vehiclePosition;
    this.explosionAnimationRemaining = EXPLOSION_ANIMATION_SECONDS;
    this.audioManager.playExplosion();
    this.audioManager.pauseMusic();
    this.audioManager.pauseEngine();
    if (!this.reducedMotion) this.particleSystem.spawnExplosion(vehiclePosition);
    this.snapshot = {
      ...this.snapshot,
      status: "exploding",
      failureReason: "hazard",
    };
    this.notifySnapshotListeners();
    return true;
  }

  private updateCountdown(elapsedSeconds: number) {
    this.countdownRemaining = Math.max(0, this.countdownRemaining - elapsedSeconds);
    const countdownSeconds = Math.ceil(this.countdownRemaining);

    if (countdownSeconds === 0) {
      this.snapshot = { ...this.snapshot, status: "playing", countdownSeconds: 0 };
      this.inputManager.attach();
      this.audioManager.startMusic();
      this.audioManager.startEngine();
      this.notifySnapshotListeners();
      return;
    }

    if (countdownSeconds !== this.snapshot.countdownSeconds) {
      this.snapshot = { ...this.snapshot, countdownSeconds };
      this.notifySnapshotListeners();
    }
  }

  private updateTimer(elapsedSeconds: number) {
    this.remainingTimeSeconds = Math.max(0, this.remainingTimeSeconds - elapsedSeconds);
    if (this.remainingTimeSeconds === 0) {
      this.vehicleController.stop();
      this.audioManager.playFailure();
      this.snapshot = {
        ...this.snapshot,
        status: "failed",
        remainingTimeSeconds: 0,
        failureReason: "timeLimit",
      };
      this.notifySnapshotListeners();
      return true;
    }

    const remainingTimeSeconds = Math.ceil(this.remainingTimeSeconds);
    if (remainingTimeSeconds !== this.snapshot.remainingTimeSeconds) {
      this.snapshot = { ...this.snapshot, remainingTimeSeconds };
      this.notifySnapshotListeners();
    }
    return false;
  }

  private updateEffects(elapsedSeconds: number) {
    this.collisionFlashRemaining = Math.max(0, this.collisionFlashRemaining - elapsedSeconds);
    this.collisionShakeRemaining = Math.max(0, this.collisionShakeRemaining - elapsedSeconds);
    this.particleSystem.update(elapsedSeconds);
    this.trailSpawnRemaining = Math.max(0, this.trailSpawnRemaining - elapsedSeconds);
    this.collectionEffects = this.collectionEffects
      .map((effect) => ({ ...effect, remainingSeconds: effect.remainingSeconds - elapsedSeconds }))
      .filter((effect) => effect.remainingSeconds > 0);
  }

  private getRenderEffects(): RenderEffects {
    const collectionEffects: CollectionRenderEffect[] = this.collectionEffects.map((effect) => ({
      position: effect.position,
      progress: 1 - effect.remainingSeconds / COLLECTION_EFFECT_SECONDS,
    }));

    return {
      collisionFlashProgress: this.collisionFlashRemaining / COLLISION_FLASH_SECONDS,
      collisionShakeProgress: this.reducedMotion ? 0 : this.collisionShakeRemaining / COLLISION_SHAKE_SECONDS,
      collectionEffects: this.reducedMotion ? [] : collectionEffects,
      completionProgress: this.reducedMotion || this.completionAnimationRemaining === 0
        ? 0
        : 1 - this.completionAnimationRemaining / COMPLETION_ANIMATION_SECONDS,
      explosionProgress: this.explosionAnimationRemaining === 0
        ? 0
        : 1 - this.explosionAnimationRemaining / EXPLOSION_ANIMATION_SECONDS,
      explosionPosition: this.explosionPosition,
      particles: this.reducedMotion ? [] : this.particleSystem.getParticles(),
      reducedMotion: this.reducedMotion,
    };
  }

  private render() {
    const vehicle = this.vehicleController.getVehicle();
    this.camera.update(vehicle.position, this.level.width, this.level.height);
    this.renderer.render(
      this.level,
      this.animationTime,
      vehicle,
      this.collectibleSystem.getCollectedIds(),
      this.camera.getPosition(),
      this.getRenderEffects(),
    );
  }

  private handleCollectibles() {
    const collected = this.collectibleSystem.collect(
      this.vehicleController.getVehicle(),
      this.level.collectibles,
    );
    if (collected.length === 0) return;

    collected.forEach((collectible) => {
      if (!this.reducedMotion) this.particleSystem.spawnCollectible(collectible.position);
    });
    this.audioManager.playCollectible();
    this.collectionEffects.push(...collected.map((collectible) => ({
      position: { ...collectible.position },
      remainingSeconds: COLLECTION_EFFECT_SECONDS,
    })));

    const points = collected.reduce(
      (total, collectible) => total + this.scoreSystem.collectiblePoints(
        collectible.value,
        this.level.difficultyMultiplier,
      ),
      0,
    );
    this.snapshot = {
      ...this.snapshot,
      score: this.snapshot.score + points,
      collectiblesCollected: this.collectibleSystem.getCollectedCount(),
    };
    this.notifySnapshotListeners();
  }

  private completeLevel() {
    const completionPoints = this.scoreSystem.completionPoints(this.level.difficultyMultiplier);
    this.snapshot = {
      ...this.snapshot,
      status: "completed",
      score: this.snapshot.score + completionPoints,
      failureReason: undefined,
    };
    this.completionAnimationRemaining = COMPLETION_ANIMATION_SECONDS;
    this.audioManager.playComplete();
    this.audioManager.pauseMusic();
    this.audioManager.pauseEngine();
    if (!this.reducedMotion) this.particleSystem.spawnCompletion(this.level.destination.position);
    this.notifySnapshotListeners();
    return true;
  }

  private beginCountdown() {
    this.countdownRemaining = START_COUNTDOWN_SECONDS;
    this.snapshot = {
      ...this.snapshot,
      status: "starting",
      countdownSeconds: START_COUNTDOWN_SECONDS,
      remainingTimeSeconds: this.level.timeLimitSeconds,
      failureReason: undefined,
    };
    this.notifySnapshotListeners();
    this.render();
    this.loop.start();
  }

  private createInitialSnapshot(): GameSnapshot {
    const audioSettings = this.audioManager.getSettings();
    return {
      status: "idle",
      level: this.level.level,
      score: 0,
      collisionsUsed: 0,
      maxCollisions: this.level.maxCollisions,
      collectiblesCollected: 0,
      totalCollectibles: this.level.collectibles.length,
      remainingTimeSeconds: this.level.timeLimitSeconds,
      countdownSeconds: 0,
      soundEnabled: audioSettings.soundEnabled,
      musicEnabled: audioSettings.musicEnabled,
    };
  }

  private updateVehicleTrail() {
    if (this.reducedMotion || this.trailSpawnRemaining > 0) return;

    const vehicle = this.vehicleController.getVehicle();
    if (Math.abs(vehicle.speed) < 35) return;

    this.particleSystem.spawnTrail(vehicle);
    this.trailSpawnRemaining = 0.045;
  }

  private togglePause() {
    if (this.snapshot.status === "playing") this.pause();
    else if (this.snapshot.status === "paused") this.resume();
  }

  private notifySnapshotListeners() {
    for (const listener of this.snapshotListeners) listener(this.snapshot);
  }
}
