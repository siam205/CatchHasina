import { describe, expect, it } from "vitest";
import { LEVEL_CONFIGS } from "@/game/levels/levelConfig";
import { isDestinationReachable } from "./MazeValidator";

describe("authored maze reachability", () => {
  it("keeps every authored level connected from its start to its destination", () => {
    for (const level of LEVEL_CONFIGS) {
      expect(isDestinationReachable(level), `Level ${level.level} should be reachable`).toBe(true);
    }
  });
});
