import { describe, expect, it } from "vitest";
import { Camera } from "./Camera";

describe("Camera", () => {
  it("keeps the camera centered on a target inside a larger world", () => {
    const camera = new Camera();

    camera.update({ x: 1200, y: 800 }, 2400, 1500);

    expect(camera.getPosition()).toEqual({ x: 720, y: 530 });
  });

  it("clamps to the world edges", () => {
    const camera = new Camera();

    camera.update({ x: 20, y: 20 }, 2400, 1500);

    expect(camera.getPosition()).toEqual({ x: 0, y: 0 });
  });
});
