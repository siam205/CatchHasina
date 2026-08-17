import {
  VEHICLE_ACCELERATION,
  VEHICLE_BRAKE_ACCELERATION,
  VEHICLE_FRICTION,
  VEHICLE_MAX_REVERSE_SPEED,
  VEHICLE_MAX_SPEED,
  VEHICLE_TURN_SPEED,
} from "@/lib/constants";
import type { Vehicle, VehicleInput } from "@/game/state/gameTypes";

interface MovementBounds {
  width: number;
  height: number;
}

export class VehicleController {
  private readonly vehicle: Vehicle;
  private lastSafePosition: Vehicle["position"];

  constructor(start: Vehicle) {
    this.vehicle = {
      ...start,
      position: { ...start.position },
      speed: 0,
    };
    this.lastSafePosition = { ...this.vehicle.position };
  }

  update(input: VehicleInput, elapsedSeconds: number, bounds: MovementBounds) {
    this.updateSpeed(input, elapsedSeconds);
    this.updateRotation(input, elapsedSeconds);
    this.updatePosition(elapsedSeconds, bounds);
  }

  getVehicle() {
    return this.vehicle;
  }

  getLastSafePosition() {
    return this.lastSafePosition;
  }

  commitSafePosition() {
    this.lastSafePosition = { ...this.vehicle.position };
  }

  restoreLastSafePosition() {
    this.vehicle.position = { ...this.lastSafePosition };
  }

  stop() {
    this.vehicle.speed = 0;
  }

  private updateSpeed(input: VehicleInput, elapsedSeconds: number) {
    if (input.accelerate) {
      this.vehicle.speed += VEHICLE_ACCELERATION * elapsedSeconds;
    }

    if (input.brake) {
      this.vehicle.speed -= VEHICLE_BRAKE_ACCELERATION * elapsedSeconds;
    }

    if (!input.accelerate && !input.brake) {
      this.vehicle.speed = moveTowardZero(this.vehicle.speed, VEHICLE_FRICTION * elapsedSeconds);
    }

    this.vehicle.speed = Math.max(
      -VEHICLE_MAX_REVERSE_SPEED,
      Math.min(VEHICLE_MAX_SPEED, this.vehicle.speed),
    );
  }

  private updateRotation(input: VehicleInput, elapsedSeconds: number) {
    const turnDirection = Number(input.turnRight) - Number(input.turnLeft);
    if (turnDirection === 0 || Math.abs(this.vehicle.speed) < 1) return;

    const speedRatio = Math.min(Math.abs(this.vehicle.speed) / VEHICLE_MAX_SPEED, 1);
    const travelDirection = this.vehicle.speed < 0 ? -1 : 1;
    this.vehicle.rotation += turnDirection * VEHICLE_TURN_SPEED * speedRatio * travelDirection * elapsedSeconds;
  }

  private updatePosition(elapsedSeconds: number, bounds: MovementBounds) {
    const directionX = Math.sin(this.vehicle.rotation);
    const directionY = -Math.cos(this.vehicle.rotation);
    const nextX = this.vehicle.position.x + directionX * this.vehicle.speed * elapsedSeconds;
    const nextY = this.vehicle.position.y + directionY * this.vehicle.speed * elapsedSeconds;
    const margin = Math.max(this.vehicle.width, this.vehicle.height) / 2;

    this.vehicle.position.x = clamp(nextX, margin, bounds.width - margin);
    this.vehicle.position.y = clamp(nextY, margin, bounds.height - margin);
  }
}

function moveTowardZero(value: number, amount: number) {
  if (Math.abs(value) <= amount) return 0;
  return value - Math.sign(value) * amount;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}
