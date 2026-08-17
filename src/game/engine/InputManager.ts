import type { VehicleAction, VehicleInput } from "@/game/state/gameTypes";

const actionByCode: Partial<Record<string, VehicleAction>> = {
  ArrowUp: "accelerate",
  KeyW: "accelerate",
  ArrowDown: "brake",
  KeyS: "brake",
  ArrowLeft: "turnLeft",
  KeyA: "turnLeft",
  ArrowRight: "turnRight",
  KeyD: "turnRight",
};

export class InputManager {
  private readonly pressedActions = new Set<VehicleAction>();
  private attached = false;

  constructor(private readonly onPauseToggle: () => void) {}

  attach() {
    if (this.attached) return;

    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("blur", this.clear);
    this.attached = true;
  }

  detach() {
    if (!this.attached) return;

    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    window.removeEventListener("blur", this.clear);
    this.clear();
    this.attached = false;
  }

  setAction(action: VehicleAction, pressed: boolean) {
    if (pressed) this.pressedActions.add(action);
    else this.pressedActions.delete(action);
  }

  getState(): VehicleInput {
    return {
      accelerate: this.pressedActions.has("accelerate"),
      brake: this.pressedActions.has("brake"),
      turnLeft: this.pressedActions.has("turnLeft"),
      turnRight: this.pressedActions.has("turnRight"),
    };
  }

  private readonly handleKeyDown = (event: KeyboardEvent) => {
    if (event.code === "KeyP" || event.code === "Escape") {
      event.preventDefault();
      this.onPauseToggle();
      return;
    }

    const action = actionByCode[event.code];
    if (!action) return;

    event.preventDefault();
    this.setAction(action, true);
  };

  private readonly handleKeyUp = (event: KeyboardEvent) => {
    const action = actionByCode[event.code];
    if (!action) return;

    event.preventDefault();
    this.setAction(action, false);
  };

  private readonly clear = () => {
    this.pressedActions.clear();
  };
}
