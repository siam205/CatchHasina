import { COLLECTIBLE_HIT_RADIUS } from "@/lib/constants";
import type { Collectible, Vehicle } from "@/game/state/gameTypes";

export class CollectibleSystem {
  private readonly collectedIds = new Set<string>();

  collect(vehicle: Vehicle, collectibles: Collectible[]) {
    const vehicleRadius = Math.max(vehicle.width, vehicle.height) / 2;
    const newlyCollected: Collectible[] = [];

    for (const collectible of collectibles) {
      if (this.collectedIds.has(collectible.id)) continue;

      const distance = Math.hypot(
        vehicle.position.x - collectible.position.x,
        vehicle.position.y - collectible.position.y,
      );
      if (distance > vehicleRadius + COLLECTIBLE_HIT_RADIUS) continue;

      this.collectedIds.add(collectible.id);
      newlyCollected.push(collectible);
    }

    return newlyCollected;
  }

  getCollectedIds() {
    return this.collectedIds;
  }

  getCollectedCount() {
    return this.collectedIds.size;
  }
}
