export interface AuthUser {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

export interface ServerScore {
  id: string;
  level: number;
  score: number;
  collectiblesCollected: number;
  totalCollectibles: number;
  collisionsUsed: number;
  remainingTimeSeconds: number;
}

export interface ServerAchievement {
  achievementKey: string;
  unlockedAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  collectiblesCollected: number;
  collisionsUsed: number;
  remainingTimeSeconds: number;
  isCurrentUser: boolean;
}
