import { BASE_COMPLETION_SCORE } from "@/lib/constants";

export class ScoreSystem {
  collectiblePoints(value: number, difficultyMultiplier: number) {
    return Math.round(value * difficultyMultiplier);
  }

  completionPoints(difficultyMultiplier: number) {
    return Math.round(BASE_COMPLETION_SCORE * difficultyMultiplier);
  }
}
