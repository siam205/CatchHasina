import { LOGICAL_CANVAS_HEIGHT, LOGICAL_CANVAS_WIDTH } from "@/lib/constants";
import type { Point } from "@/game/state/gameTypes";

export class Camera {
  private position: Point = { x: 0, y: 0 };

  update(target: Point, worldWidth: number, worldHeight: number) {
    this.position.x = clamp(
      target.x - LOGICAL_CANVAS_WIDTH / 2,
      0,
      Math.max(0, worldWidth - LOGICAL_CANVAS_WIDTH),
    );
    this.position.y = clamp(
      target.y - LOGICAL_CANVAS_HEIGHT / 2,
      0,
      Math.max(0, worldHeight - LOGICAL_CANVAS_HEIGHT),
    );
  }

  reset() {
    this.position = { x: 0, y: 0 };
  }

  getPosition() {
    return this.position;
  }
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}
