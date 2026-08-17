import type { Destination, Vehicle } from "@/game/state/gameTypes";

export class DestinationSystem {
  detect(vehicle: Vehicle, destination: Destination) {
    const vehicleRadius = Math.max(vehicle.width, vehicle.height) / 2;
    const distance = Math.hypot(
      vehicle.position.x - destination.position.x,
      vehicle.position.y - destination.position.y,
    );

    return distance <= vehicleRadius + destination.radius;
  }
}
