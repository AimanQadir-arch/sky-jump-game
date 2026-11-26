export type GameScreen =
  | 'loading'
  | 'menu'
  | 'levelSelect'
  | 'playing'
  | 'paused'
  | 'levelComplete';

export type PlatformType =
  | 'normal'
  | 'moving'
  | 'disappearing'
  | 'bounce'
  | 'narrow'
  | 'checkpoint'
  | 'finish';

export interface PlatformDef {
  id: string;
  type: PlatformType;
  position: [number, number, number];
  size: [number, number, number];
  color?: string;
  // Moving platform config
  moveOffset?: [number, number, number];
  moveSpeed?: number;
  movePhase?: number;
  // Bounce config
  bounceForce?: number;
  // Checkpoint index
  checkpointIndex?: number;
}

export interface RotatingObstacleDef {
  id: string;
  position: [number, number, number];
  length: number;
  thickness: number;
  speed: number; // radians per second
  blades?: number; // 1 = full bar (2 sides), 2 = cross (4 sides)
  color?: string;
  phase?: number;
}

export interface CoinDef {
  id: string;
  position: [number, number, number];
}

export interface LevelTheme {
  skyTop: string;
  skyBottom: string;
  fogColor: string;
  accentColor: string;
  normalColor: string;
  movingColor: string;
  disappearingColor: string;
  narrowColor: string;
  obstacleColor: string;
}

export interface LevelDef {
  id: number;
  name: string;
  subtitle: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  rewardCoins: number;
  theme: LevelTheme;
  spawn: [number, number, number];
  fallLimitY: number;
  platforms: PlatformDef[];
  obstacles: RotatingObstacleDef[];
  coins: CoinDef[];
}

export interface GameSettings {
  musicEnabled: boolean;
  sfxEnabled: boolean;
  volume: number; // 0 to 1
  touchControls: 'auto' | 'on' | 'off';
}

export interface SaveProgress {
  unlockedLevel: number;
  completedLevels: number[];
  bestScores: Record<number, number>;
  totalCoins: number;
  settings: GameSettings;
}

export interface HudSnapshot {
  levelId: number;
  levelName: string;
  score: number;
  coinsCollected: number;
  totalLevelCoins: number;
  progress: number; // 0..1
  checkpointReached: number;
  totalCheckpoints: number;
  elapsedTime: number;
  falls: number;
}

export interface LevelCompleteStats {
  levelId: number;
  levelName: string;
  score: number;
  bestScore: number;
  isNewBest: boolean;
  coinsCollected: number;
  totalLevelCoins: number;
  rewardCoins: number;
  elapsedTime: number;
  falls: number;
  stars: 1 | 2 | 3;
  hasNextLevel: boolean;
}
