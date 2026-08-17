import { describe, expect, it } from "vitest";
import type { Hazard, Vehicle } from "@/game/state/gameTypes";
import { HazardSystem } from "./HazardSystem";

const vehicle: Vehicle = {
  position: { x: 40, y: 100 },
  rotation: 0,
  width: 34,
  height: 66,
  speed: 0,
};

const hazard: Hazard = {
  id: "hazard-test",
  position: { x: 100, y: 100 },
  radius: 24,
};

describe("HazardSystem", () => {
  it("detects a hazard touched between frames", () => {
    const system = new HazardSystem();
    const nextVehicle = { ...vehicle, position: { x: 160, y: 100 } };

    expect(system.detect(nextVehicle, vehicle.position, [hazard])).toEqual(hazard);
  });

  it("does not report a distant hazard", () => {
    const system = new HazardSystem();

    expect(system.detect(vehicle, vehicle.position, [{ ...hazard, position: { x: 300, y: 300 } }])).toBeNull();
  });
});
