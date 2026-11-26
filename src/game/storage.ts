import { GameSettings, SaveProgress } from '../types/game';

const STORAGE_KEY = 'sky_jump_ultimate_obby_save_v1';

export const DEFAULT_SETTINGS: GameSettings = {
  musicEnabled: true,
  sfxEnabled: true,
  volume: 0.7,
  touchControls: 'auto',
};

export const DEFAULT_PROGRESS: SaveProgress = {
  unlockedLevel: 1,
  completedLevels: [],
  bestScores: {},
  totalCoins: 0,
  settings: { ...DEFAULT_SETTINGS },
};

export function loadProgress(): SaveProgress {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROGRESS, settings: { ...DEFAULT_SETTINGS } };
    const parsed = JSON.parse(raw) as Partial<SaveProgress>;
    return {
      unlockedLevel:
        typeof parsed.unlockedLevel === 'number'
          ? Math.max(1, Math.min(10, parsed.unlockedLevel))
          : 1,
      completedLevels: Array.isArray(parsed.completedLevels)
        ? parsed.completedLevels.filter((n) => typeof n === 'number')
        : [],
      bestScores:
        parsed.bestScores && typeof parsed.bestScores === 'object'
          ? parsed.bestScores
          : {},
      totalCoins:
        typeof parsed.totalCoins === 'number' ? Math.max(0, parsed.totalCoins) : 0,
      settings: {
        musicEnabled:
          typeof parsed.settings?.musicEnabled === 'boolean'
            ? parsed.settings.musicEnabled
            : DEFAULT_SETTINGS.musicEnabled,
        sfxEnabled:
          typeof parsed.settings?.sfxEnabled === 'boolean'
            ? parsed.settings.sfxEnabled
            : DEFAULT_SETTINGS.sfxEnabled,
        volume:
          typeof parsed.settings?.volume === 'number'
            ? Math.max(0, Math.min(1, parsed.settings.volume))
            : DEFAULT_SETTINGS.volume,
        touchControls:
          parsed.settings?.touchControls === 'on' ||
          parsed.settings?.touchControls === 'off' ||
          parsed.settings?.touchControls === 'auto'
            ? parsed.settings.touchControls
            : 'auto',
      },
    };
  } catch {
    return { ...DEFAULT_PROGRESS, settings: { ...DEFAULT_SETTINGS } };
  }
}

export function saveProgress(progress: SaveProgress): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore storage quota or private mode errors
  }
}
