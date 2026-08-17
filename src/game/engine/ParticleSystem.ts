import type { Point, Vehicle } from "@/game/state/gameTypes";

export interface Particle {
  position: Point;
  velocity: Point;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export class ParticleSystem {
  private readonly particles: Particle[] = [];

  update(elapsedSeconds: number) {
    for (const particle of this.particles) {
      particle.life -= elapsedSeconds;
      particle.position.x += particle.velocity.x * elapsedSeconds;
      particle.position.y += particle.velocity.y * elapsedSeconds;
      particle.velocity.x *= 0.94;
      particle.velocity.y *= 0.94;
    }

    for (let index = this.particles.length - 1; index >= 0; index -= 1) {
      if (this.particles[index].life <= 0) this.particles.splice(index, 1);
    }
  }

  spawnTrail(vehicle: Vehicle) {
    const rearX = vehicle.position.x - Math.sin(vehicle.rotation) * vehicle.height * 0.42;
    const rearY = vehicle.position.y + Math.cos(vehicle.rotation) * vehicle.height * 0.42;
    this.spawn({ x: rearX, y: rearY }, "#008cff", 1, 8, 2, 0.24);
  }

  spawnCollision(position: Point) {
    this.spawnBurst(position, "#ff003c", 10, 90, 3, 0.35);
  }

  spawnCollectible(position: Point) {
    this.spawnBurst(position, "#fff200", 12, 70, 3, 0.45);
  }

  spawnCompletion(position: Point) {
    this.spawnBurst(position, "#39ff14", 28, 130, 4, 1.1);
    this.spawnBurst(position, "#fff200", 18, 90, 3, 0.9);
  }

  getParticles() {
    return this.particles;
  }

  reset() {
    this.particles.length = 0;
  }

  private spawnBurst(position: Point, color: string, count: number, speed: number, size: number, life: number) {
    for (let index = 0; index < count; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const magnitude = speed * (0.55 + Math.random() * 0.45);
      this.spawn(
        position,
        color,
        1,
        0,
        size * (0.7 + Math.random() * 0.6),
        life * (0.75 + Math.random() * 0.5),
        { x: Math.cos(angle) * magnitude, y: Math.sin(angle) * magnitude },
      );
    }
  }

  private spawn(position: Point, color: string, count: number, speed: number, size: number, life: number, velocity?: Point) {
    for (let index = 0; index < count; index += 1) {
      this.particles.push({
        position: { ...position },
        velocity: velocity ?? { x: (Math.random() - 0.5) * speed, y: (Math.random() - 0.5) * speed },
        life,
        maxLife: life,
        size,
        color,
      });
    }
  }
}
