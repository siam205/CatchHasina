export type FrameCallback = (elapsedSeconds: number) => void;

export class GameLoop {
  private animationFrameId: number | null = null;
  private previousTime = 0;
  private running = false;

  constructor(private readonly onFrame: FrameCallback) {}

  start() {
    if (this.running) return;
    this.running = true;
    this.previousTime = performance.now();
    this.animationFrameId = requestAnimationFrame(this.tick);
  }

  stop() {
    this.running = false;
    if (this.animationFrameId === null) return;
    cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = null;
  }

  private readonly tick = (time: number) => {
    if (!this.running) return;

    const elapsedSeconds = Math.min((time - this.previousTime) / 1000, 0.1);
    this.previousTime = time;
    this.onFrame(elapsedSeconds);

    if (!this.running) return;
    this.animationFrameId = requestAnimationFrame(this.tick);
  };
}
