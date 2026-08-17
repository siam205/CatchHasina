"use client";

import { useEffect, useRef, type MutableRefObject } from "react";
import { GameEngine } from "@/game/engine/GameEngine";
import { LOGICAL_CANVAS_HEIGHT, LOGICAL_CANVAS_WIDTH, NEON_BLUE, NEON_GREEN, NEON_RED, NEON_YELLOW } from "@/lib/constants";
import type { LevelDefinition, MiniMapState, Point } from "@/game/state/gameTypes";

const MINI_MAP_WIDTH = 240;
const MINI_MAP_HEIGHT = 135;

interface MiniMapProps {
  level: LevelDefinition;
  engineRef: MutableRefObject<GameEngine | null>;
}

export function MiniMap({ level, engineRef }: MiniMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const resize = () => {
      const cssWidth = Math.max(1, canvas.clientWidth || MINI_MAP_WIDTH);
      const cssHeight = cssWidth * (MINI_MAP_HEIGHT / MINI_MAP_WIDTH);
      const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(cssWidth * devicePixelRatio);
      canvas.height = Math.round(cssHeight * devicePixelRatio);
      context.setTransform(
        canvas.width / MINI_MAP_WIDTH,
        0,
        0,
        canvas.height / MINI_MAP_HEIGHT,
        0,
        0,
      );
    };

    const observer = new ResizeObserver(resize);
    resize();
    observer.observe(canvas);

    let animationFrameId = 0;
    const render = () => {
      drawMiniMap(context, level, engineRef.current?.getMiniMapState());
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      observer.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, [engineRef, level]);

  return (
    <div className="pointer-events-none absolute bottom-4 right-4 z-10 w-36 overflow-hidden rounded-xl border border-white/20 bg-black/75 p-2 shadow-[0_0_18px_rgba(0,0,0,0.65)] sm:w-56 sm:p-3">
      <p className="mb-1 text-[9px] font-black uppercase tracking-[0.2em] text-white/60">Mini map</p>
      <canvas ref={canvasRef} aria-label="Zoomed-out maze mini map" className="block aspect-video w-full rounded-md border border-white/10" />
      <div className="mt-2 flex justify-between text-[8px] font-bold uppercase tracking-[0.12em] text-white/45">
        <span className="text-neon-blue">Vehicle</span>
        <span className="text-neon-green">Destination</span>
      </div>
    </div>
  );
}

function drawMiniMap(context: CanvasRenderingContext2D, level: LevelDefinition, state: MiniMapState | undefined) {
  const mapper = createMapper(level);
  const vehiclePosition = state?.vehiclePosition ?? level.vehicleStart.position;
  const cameraPosition = state?.cameraPosition ?? { x: 0, y: 0 };
  const collectedIds = state?.collectedIds ?? new Set<string>();

  context.clearRect(0, 0, MINI_MAP_WIDTH, MINI_MAP_HEIGHT);
  context.fillStyle = "#050507";
  context.fillRect(0, 0, MINI_MAP_WIDTH, MINI_MAP_HEIGHT);

  context.save();
  context.lineCap = "round";
  context.strokeStyle = NEON_RED;
  context.shadowColor = NEON_RED;
  context.shadowBlur = 4;
  level.walls.forEach((wall) => {
    const start = mapper(wall.start);
    const end = mapper(wall.end);
    context.lineWidth = Math.max(1, wall.thickness * mapper.scale * 1.4);
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.stroke();
  });
  context.restore();

  level.hazards.forEach((hazard) => {
    drawPoint(context, mapper(hazard.position), 3.5, NEON_RED);
  });

  const destination = mapper(level.destination.position);
  drawPoint(context, destination, 4, NEON_GREEN);

  level.collectibles.forEach((collectible) => {
    if (collectedIds.has(collectible.id)) return;
    drawPoint(context, mapper(collectible.position), 3, NEON_YELLOW);
  });

  const vehicle = mapper(vehiclePosition);
  drawPoint(context, vehicle, 4, NEON_BLUE);

  const cameraTopLeft = mapper(cameraPosition);
  const cameraWidth = Math.min(level.width, LOGICAL_CANVAS_WIDTH) * mapper.scale;
  const cameraHeight = Math.min(level.height, LOGICAL_CANVAS_HEIGHT) * mapper.scale;
  context.save();
  context.strokeStyle = "rgba(255, 255, 255, 0.8)";
  context.lineWidth = 1;
  context.setLineDash([3, 2]);
  context.strokeRect(cameraTopLeft.x, cameraTopLeft.y, cameraWidth, cameraHeight);
  context.restore();
}

function createMapper(level: LevelDefinition) {
  const padding = 8;
  const scale = Math.min(
    (MINI_MAP_WIDTH - padding * 2) / level.width,
    (MINI_MAP_HEIGHT - padding * 2) / level.height,
  );
  const offsetX = (MINI_MAP_WIDTH - level.width * scale) / 2;
  const offsetY = (MINI_MAP_HEIGHT - level.height * scale) / 2;
  const mapPoint = (point: Point) => ({
    x: offsetX + point.x * scale,
    y: offsetY + point.y * scale,
  });

  return Object.assign(mapPoint, { scale });
}

function drawPoint(context: CanvasRenderingContext2D, point: Point, radius: number, color: string) {
  context.save();
  context.fillStyle = color;
  context.shadowColor = color;
  context.shadowBlur = 7;
  context.beginPath();
  context.arc(point.x, point.y, radius, 0, Math.PI * 2);
  context.fill();
  context.restore();
}
