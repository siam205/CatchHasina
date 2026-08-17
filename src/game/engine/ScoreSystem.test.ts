import { describe, expect, it } from "vitest";
import { ScoreSystem } from "./ScoreSystem";

describe("ScoreSystem", () => {
  it("applies the level multiplier to collectible points", () => {
    const system = new ScoreSystem();

    expect(system.collectiblePoints(125, 1.1)).toBe(138);
  });

  it("calculates the completion bonus from the difficulty multiplier", () => {
    const system = new ScoreSystem();

    expect(system.completionPoints(1.25)).toBe(1250);
  });
});
