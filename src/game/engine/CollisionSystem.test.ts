import { describe, expect, it } from "vitest";
import type { Vehicle, WallSegment } from "@/game/state/gameTypes";
import { CollisionSystem } from "./CollisionSystem";

const wall: WallSegment = {
  start: { x: 20, y: 100 },
  end: { x: 220, y: 100 },
  thickness: 4,
};

const vehicle: Vehicle = {
  position: { x: 100, y: 50 },
  rotation: 0,
  width: 34,
  height: 66,
  speed: 0,
};

describe("CollisionSystem", () => {
  it("does not report a vehicle that is outside the wall radius", () => {
    const system = new CollisionSystem();

    expect(system.detect(vehicle, vehicle.position, [wall])).toBeNull();
  });

  it("reports a vehicle overlapping a wall segment", () => {
    const system = new CollisionSystem();
    const overlapping = { ...vehicle, position: { x: 100, y: 70 } };

    expect(system.detect(overlapping, vehicle.position, [wall])).toEqual(wall);
  });

  it("detects a wall crossed between frames", () => {
    const system = new CollisionSystem();
    const crossed = { ...vehicle, position: { x: 100, y: 150 } };

    expect(system.detect(crossed, vehicle.position, [wall])).toEqual(wall);
  });
});
