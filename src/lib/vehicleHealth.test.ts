import { describe, expect, it } from "vitest";
import { getVehicleHealth } from "./vehicleHealth";

describe("getVehicleHealth", () => {
  it("keeps a healthy green ring above half health", () => {
    expect(getVehicleHealth(8, 2)).toEqual({
      remaining: 6,
      ratio: 0.75,
      state: "healthy",
      color: "#39ff14",
    });
  });

  it("uses orange in the warning range", () => {
    expect(getVehicleHealth(8, 4).state).toBe("warning");
    expect(getVehicleHealth(8, 4).color).toBe("#ff9f0a");
  });

  it("uses red and reaches zero at the damage limit", () => {
    expect(getVehicleHealth(8, 8)).toEqual({
      remaining: 0,
      ratio: 0,
      state: "critical",
      color: "#ff003c",
    });
  });
});
