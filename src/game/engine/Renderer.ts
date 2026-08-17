import type { Collectible, Destination, Hazard, LevelDefinition, Point, Vehicle, WallSegment } from "@/game/state/gameTypes";
import {
  CANVAS_BACKGROUND,
  CANVAS_BORDER,
  LOGICAL_CANVAS_HEIGHT,
  LOGICAL_CANVAS_WIDTH,
  NEON_BLUE,
  NEON_GREEN,
  NEON_RED,
  NEON_YELLOW,
} from "@/lib/constants";
import type { Particle } from "./ParticleSystem";

export interface RenderEffects {
  collisionFlashProgress: number;
  collisionShakeProgress: number;
  collectionEffects: CollectionRenderEffect[];
  completionProgress: number;
  explosionProgress: number;
  explosionPosition: Point | null;
  particles: Particle[];
  reducedMotion: boolean;
}

export interface CollectionRenderEffect {
  position: Point;
  progress: number;
}

export class Renderer {
  private readonly destinationImage = new Image();
  private readonly collectibleImage = new Image();
  private readonly hazardImage = new Image();
  private readonly explosionImage = new Image();

  constructor(private readonly context: CanvasRenderingContext2D) {
    this.destinationImage.src = "/images/destination.webp";
    this.collectibleImage.src = "/images/bonus-point.webp";
    this.hazardImage.src = "/images/hazard-modi.webp";
    this.explosionImage.src = "/images/explosion.webp";
  }

  resize(canvas: HTMLCanvasElement, cssWidth: number, devicePixelRatio: number) {
    const safeWidth = Math.max(1, cssWidth);
    const safeHeight = safeWidth * (LOGICAL_CANVAS_HEIGHT / LOGICAL_CANVAS_WIDTH);
    const pixelWidth = Math.max(1, Math.round(safeWidth * devicePixelRatio));
    const pixelHeight = Math.max(1, Math.round(safeHeight * devicePixelRatio));

    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }

    this.context.setTransform(
      pixelWidth / LOGICAL_CANVAS_WIDTH,
      0,
      0,
      pixelHeight / LOGICAL_CANVAS_HEIGHT,
      0,
      0,
    );
  }

  render(
    level: LevelDefinition,
    animationTime: number,
    vehicle: Vehicle,
    collectedIds: ReadonlySet<string>,
    camera: Point,
    effects: RenderEffects,
  ) {
    const viewportWidth = LOGICAL_CANVAS_WIDTH;
    const viewportHeight = LOGICAL_CANVAS_HEIGHT;
    const visualTime = effects.reducedMotion ? 0 : animationTime;

    this.context.fillStyle = CANVAS_BACKGROUND;
    this.context.fillRect(0, 0, viewportWidth, viewportHeight);
    this.drawVignette(viewportWidth, viewportHeight);

    this.context.save();
    if (!effects.reducedMotion && effects.collisionShakeProgress > 0) {
      const shake = effects.collisionShakeProgress * 5;
      this.context.translate(
        Math.sin(animationTime * 70) * shake,
        Math.cos(animationTime * 64) * shake,
      );
    }
    this.context.translate(-camera.x, -camera.y);
    level.walls.forEach((segment) => this.drawWall(segment));
    level.hazards.forEach((hazard) => this.drawHazard(hazard, visualTime));
    this.drawDestination(level.destination, visualTime);
    level.collectibles.forEach((collectible, index) => {
      if (!collectedIds.has(collectible.id)) this.drawCollectible(collectible, visualTime, index);
    });
    effects.collectionEffects.forEach((effect) => this.drawCollectionEffect(effect));
    if (!effects.reducedMotion) effects.particles.forEach((particle) => this.drawParticle(particle));
    if (!effects.reducedMotion && effects.completionProgress > 0) {
      this.drawCompletionEffect(level.destination, effects.completionProgress);
    }
    if (!effects.explosionPosition) this.drawVehicle(vehicle);
    if (effects.explosionPosition) this.drawExplosionEffect(effects.explosionPosition, effects.explosionProgress);
    this.context.restore();

    this.drawBoundary(viewportWidth, viewportHeight);

    if (effects.collisionFlashProgress > 0) {
      this.context.save();
      this.context.globalAlpha = effects.collisionFlashProgress * 0.22;
      this.context.fillStyle = NEON_RED;
      this.context.fillRect(0, 0, viewportWidth, viewportHeight);
      this.context.restore();
    }
  }

  private drawVignette(width: number, height: number) {
    const gradient = this.context.createRadialGradient(width / 2, height / 2, 80, width / 2, height / 2, width * 0.7);
    gradient.addColorStop(0, "rgba(24, 12, 20, 0.18)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.55)");
    this.context.fillStyle = gradient;
    this.context.fillRect(0, 0, width, height);
  }

  private drawBoundary(width: number, height: number) {
    this.context.save();
    this.context.strokeStyle = CANVAS_BORDER;
    this.context.lineWidth = 2;
    this.context.strokeRect(1, 1, width - 2, height - 2);
    this.context.restore();
  }

  private drawWall(segment: WallSegment) {
    this.drawNeonLine(segment.start, segment.end, NEON_RED, segment.thickness);
  }

  private drawHazard(hazard: Hazard, animationTime: number) {
    const pulse = 1 + Math.sin(animationTime * 2.6) * 0.06;
    const radius = hazard.radius * pulse;

    if (this.isImageReady(this.hazardImage)) {
      this.drawImageMarker(this.hazardImage, hazard.position, radius, NEON_RED);
      return;
    }

    this.context.save();
    this.context.fillStyle = NEON_RED;
    this.context.shadowColor = NEON_RED;
    this.context.shadowBlur = 18;
    this.context.globalAlpha = 0.75;
    this.context.beginPath();
    this.context.arc(hazard.position.x, hazard.position.y, radius, 0, Math.PI * 2);
    this.context.fill();
    this.context.restore();
  }

  private drawNeonLine(start: Point, end: Point, color: string, width: number) {
    const drawLine = () => {
      this.context.beginPath();
      this.context.moveTo(start.x, start.y);
      this.context.lineTo(end.x, end.y);
      this.context.stroke();
    };

    this.context.save();
    this.context.lineCap = "round";
    this.context.shadowColor = color;
    this.context.shadowBlur = 18;
    this.context.strokeStyle = color;
    this.context.globalAlpha = 0.45;
    this.context.lineWidth = width * 4;
    drawLine();

    this.context.shadowBlur = 8;
    this.context.globalAlpha = 0.9;
    this.context.lineWidth = width * 2;
    drawLine();

    this.context.shadowBlur = 0;
    this.context.globalAlpha = 1;
    this.context.strokeStyle = color;
    this.context.lineWidth = width;
    drawLine();
    this.context.restore();
  }

  private drawDestination(destination: Destination, animationTime: number) {
    const pulse = 1 + Math.sin(animationTime * 2.4) * 0.08;
    const radius = destination.radius * pulse;

    if (this.isImageReady(this.destinationImage)) {
      this.drawImageMarker(this.destinationImage, destination.position, radius, NEON_GREEN);
      return;
    }

    this.context.save();
    this.context.strokeStyle = NEON_GREEN;
    this.context.shadowColor = NEON_GREEN;
    this.context.shadowBlur = 24;
    this.context.globalAlpha = 0.38;
    this.context.lineWidth = 10;
    this.context.beginPath();
    this.context.arc(destination.position.x, destination.position.y, radius, 0, Math.PI * 2);
    this.context.stroke();

    this.context.globalAlpha = 1;
    this.context.shadowBlur = 8;
    this.context.lineWidth = 3;
    this.context.beginPath();
    this.context.arc(destination.position.x, destination.position.y, radius, 0, Math.PI * 2);
    this.context.stroke();

    this.context.shadowBlur = 0;
    this.context.globalAlpha = 0.18;
    this.context.fillStyle = NEON_GREEN;
    this.context.beginPath();
    this.context.arc(destination.position.x, destination.position.y, radius - 5, 0, Math.PI * 2);
    this.context.fill();
    this.context.restore();
  }

  private drawCollectible(collectible: Collectible, animationTime: number, index: number) {
    const rotation = animationTime * 0.35 + index * 0.6;
    const pulse = 1 + Math.sin(animationTime * 3 + index) * 0.08;
    const outerRadius = 19 * pulse;
    const innerRadius = 8 * pulse;

    if (this.isImageReady(this.collectibleImage)) {
      this.drawImageMarker(this.collectibleImage, collectible.position, outerRadius, NEON_YELLOW);
      return;
    }

    this.context.save();
    this.context.translate(collectible.position.x, collectible.position.y);
    this.context.rotate(rotation);
    this.context.strokeStyle = NEON_YELLOW;
    this.context.shadowColor = NEON_YELLOW;
    this.context.shadowBlur = 16;
    this.context.globalAlpha = 0.5;
    this.context.lineWidth = 7;
    this.drawStar(outerRadius, innerRadius);

    this.context.shadowBlur = 4;
    this.context.globalAlpha = 1;
    this.context.lineWidth = 2;
    this.drawStar(outerRadius, innerRadius);
    this.context.restore();
  }

  private drawImageMarker(image: HTMLImageElement, position: Point, radius: number, color: string) {
    const imageRadius = Math.max(1, radius - 4);

    this.context.save();
    this.context.fillStyle = "rgba(0, 0, 0, 0.72)";
    this.context.beginPath();
    this.context.arc(position.x, position.y, imageRadius, 0, Math.PI * 2);
    this.context.fill();

    this.context.beginPath();
    this.context.arc(position.x, position.y, imageRadius, 0, Math.PI * 2);
    this.context.clip();
    this.context.globalAlpha = 0.96;
    this.context.drawImage(image, position.x - imageRadius, position.y - imageRadius, imageRadius * 2, imageRadius * 2);
    this.context.restore();

    this.context.save();
    this.context.strokeStyle = color;
    this.context.shadowColor = color;
    this.context.shadowBlur = 18;
    this.context.globalAlpha = 0.55;
    this.context.lineWidth = 7;
    this.context.beginPath();
    this.context.arc(position.x, position.y, radius, 0, Math.PI * 2);
    this.context.stroke();

    this.context.shadowBlur = 5;
    this.context.globalAlpha = 1;
    this.context.lineWidth = 2;
    this.context.beginPath();
    this.context.arc(position.x, position.y, radius, 0, Math.PI * 2);
    this.context.stroke();
    this.context.restore();
  }

  private isImageReady(image: HTMLImageElement) {
    return image.complete && image.naturalWidth > 0;
  }

  private drawCollectionEffect(effect: CollectionRenderEffect) {
    const radius = 10 + effect.progress * 34;
    const alpha = 1 - effect.progress;

    this.context.save();
    this.context.translate(effect.position.x, effect.position.y);
    this.context.strokeStyle = NEON_YELLOW;
    this.context.shadowColor = NEON_YELLOW;
    this.context.shadowBlur = 16;
    this.context.globalAlpha = alpha;
    this.context.lineWidth = 3;
    this.context.beginPath();
    this.context.arc(0, 0, radius, 0, Math.PI * 2);
    this.context.stroke();

    this.context.lineWidth = 2;
    for (let ray = 0; ray < 8; ray += 1) {
      const angle = (ray * Math.PI) / 4;
      const startRadius = radius + 5;
      const endRadius = radius + 13;
      this.context.beginPath();
      this.context.moveTo(Math.cos(angle) * startRadius, Math.sin(angle) * startRadius);
      this.context.lineTo(Math.cos(angle) * endRadius, Math.sin(angle) * endRadius);
      this.context.stroke();
    }
    this.context.restore();
  }

  private drawParticle(particle: Particle) {
    const alpha = Math.max(0, Math.min(1, particle.life / particle.maxLife));
    this.context.save();
    this.context.globalAlpha = alpha;
    this.context.fillStyle = particle.color;
    this.context.shadowColor = particle.color;
    this.context.shadowBlur = 10;
    this.context.beginPath();
    this.context.arc(particle.position.x, particle.position.y, particle.size, 0, Math.PI * 2);
    this.context.fill();
    this.context.restore();
  }

  private drawCompletionEffect(destination: Destination, progress: number) {
    const radius = destination.radius + progress * 120;
    const alpha = 1 - progress;

    this.context.save();
    this.context.strokeStyle = NEON_GREEN;
    this.context.shadowColor = NEON_GREEN;
    this.context.shadowBlur = 20;
    this.context.globalAlpha = alpha;
    this.context.lineWidth = 4;
    this.context.beginPath();
    this.context.arc(destination.position.x, destination.position.y, radius, 0, Math.PI * 2);
    this.context.stroke();
    this.context.restore();
  }

  private drawExplosionEffect(position: Point, progress: number) {
    const radius = 12 + progress * 70;
    const alpha = Math.max(0, 1 - progress);

    if (this.isImageReady(this.explosionImage)) {
      const imageSize = 110 + progress * 150;
      this.context.save();
      this.context.globalAlpha = alpha;
      this.context.shadowColor = NEON_RED;
      this.context.shadowBlur = 28;
      this.context.drawImage(
        this.explosionImage,
        position.x - imageSize / 2,
        position.y - imageSize / 2,
        imageSize,
        imageSize,
      );
      this.context.restore();
    }

    this.context.save();
    this.context.translate(position.x, position.y);
    this.context.strokeStyle = NEON_RED;
    this.context.shadowColor = NEON_RED;
    this.context.shadowBlur = 24;
    this.context.globalAlpha = alpha;
    this.context.lineWidth = 8;
    this.context.beginPath();
    this.context.arc(0, 0, radius, 0, Math.PI * 2);
    this.context.stroke();

    this.context.strokeStyle = "#ff9f0a";
    this.context.shadowColor = "#ff9f0a";
    this.context.lineWidth = 4;
    for (let ray = 0; ray < 10; ray += 1) {
      const angle = (ray * Math.PI * 2) / 10;
      const innerRadius = radius * 0.7;
      const outerRadius = radius + 18;
      this.context.beginPath();
      this.context.moveTo(Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius);
      this.context.lineTo(Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius);
      this.context.stroke();
    }
    this.context.restore();
  }

  private drawStar(outerRadius: number, innerRadius: number) {
    this.context.beginPath();
    for (let point = 0; point < 10; point += 1) {
      const radius = point % 2 === 0 ? outerRadius : innerRadius;
      const angle = -Math.PI / 2 + (point * Math.PI) / 5;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (point === 0) this.context.moveTo(x, y);
      else this.context.lineTo(x, y);
    }
    this.context.closePath();
    this.context.stroke();
  }

  private drawVehicle(vehicle: Vehicle) {
    const { width, height } = vehicle;

    this.context.save();
    this.context.translate(vehicle.position.x, vehicle.position.y);
    this.context.rotate(vehicle.rotation);
    this.context.lineJoin = "round";
    this.context.strokeStyle = NEON_BLUE;
    this.context.shadowColor = NEON_BLUE;
    this.context.shadowBlur = 20;
    this.context.globalAlpha = 0.45;
    this.context.lineWidth = 9;
    this.drawVehicleBody(width, height);

    this.context.shadowBlur = 7;
    this.context.globalAlpha = 1;
    this.context.lineWidth = 3;
    this.drawVehicleBody(width, height);

    this.context.shadowBlur = 0;
    this.context.fillStyle = "rgba(0, 140, 255, 0.18)";
    this.context.fill();
    this.context.strokeStyle = "#55b5ff";
    this.context.lineWidth = 1;
    this.drawVehicleBody(width, height);

    this.drawVehicleWindow(width, height);
    this.drawVehicleWheel(-width / 2 - 1, -height * 0.27, 4, 11);
    this.drawVehicleWheel(width / 2 + 1, -height * 0.27, 4, 11);
    this.drawVehicleWheel(-width / 2 - 1, height * 0.27, 4, 11);
    this.drawVehicleWheel(width / 2 + 1, height * 0.27, 4, 11);
    this.context.restore();
  }

  private drawVehicleBody(width: number, height: number) {
    this.context.beginPath();
    this.context.moveTo(0, -height / 2);
    this.context.quadraticCurveTo(width / 2, -height * 0.37, width / 2, -height * 0.14);
    this.context.lineTo(width / 2, height * 0.3);
    this.context.quadraticCurveTo(width * 0.4, height / 2, 0, height / 2);
    this.context.quadraticCurveTo(-width * 0.4, height / 2, -width / 2, height * 0.3);
    this.context.lineTo(-width / 2, -height * 0.14);
    this.context.quadraticCurveTo(-width / 2, -height * 0.37, 0, -height / 2);
    this.context.closePath();
    this.context.stroke();
  }

  private drawVehicleWindow(width: number, height: number) {
    this.context.fillStyle = "rgba(0, 20, 55, 0.86)";
    this.context.strokeStyle = NEON_BLUE;
    this.context.lineWidth = 1.5;
    this.context.beginPath();
    this.context.moveTo(-width * 0.28, -height * 0.22);
    this.context.quadraticCurveTo(0, -height * 0.34, width * 0.28, -height * 0.22);
    this.context.lineTo(width * 0.24, height * 0.04);
    this.context.lineTo(-width * 0.24, height * 0.04);
    this.context.closePath();
    this.context.fill();
    this.context.stroke();
  }

  private drawVehicleWheel(x: number, y: number, width: number, height: number) {
    this.context.fillStyle = NEON_BLUE;
    this.context.fillRect(x - width / 2, y - height / 2, width, height);
  }
}
