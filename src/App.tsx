import { useCallback, useEffect, useRef, useState } from 'react';
import { GameHud } from './components/GameHud';
import { LevelCompleteModal } from './components/LevelCompleteModal';
import { LevelSelectModal } from './components/LevelSelectModal';
import { LoadingScreen } from './components by/LoadingScreen';
import { MainMenu } from './components/MainMenu';
import { PauseModal } from './components/PauseModal';
import { SettingsModal } from './components/SettingsModal';
import { soundEngine } from './game/audio';
import { ObbyEngine } from './game/ObbyEngine';
import { loadProgress, saveProgress } from './game/storage';
import {
  GameScreen,
  GameSettings,
  HudSnapshot,
  LevelCompleteStats,
  SaveProgress,
} from './types/game';

const INITIAL_HUD: HudSnapshot = {
  levelId: 1,
  levelName: 'Sunlit Meadows',
  score: 0,
  coinsCollected: 0,
  totalLevelCoins: 0,
  progress: 0,
  checkpointReached: 0,
  totalCheckpoints: 1,
  elapsedTime: 0,
  falls: 0,
};

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<ObbyEngine | null>(null);

  const [progress, setProgress] = useState<SaveProgress>(() => loadProgress());
  const progressRef = useRef<SaveProgress>(progress);
  progressRef.current = progress;

  const [screen, setScreen] = useState<GameScreen>('loading');
  const screenRef = useRef<GameScreen>(screen);
  screenRef.current = screen;

  const [loadingPct, setLoadingPct] = useState(10);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [completeStats, setCompleteStats] = useState<LevelCompleteStats | null>(
    null
  );
  const [activeLevelId, setActiveLevelId] = useState<number>(() =>
    Math.min(10, Math.max(1, loadProgress().unlockedLevel))
  );

  // Sync audio settings whenever progress.settings changes
  useEffect(() => {
    soundEngine.applySettings(progress.settings);
    saveProgress(progress);
  }, [progress]);

  // Smooth animated loading screen sequence
  useEffect(() => {
    let pct = 12;
    const timer = window.setInterval(() => {
      pct += 16 + Math.random() * 14;
      if (pct >= 100) {
        setLoadingPct(100);
        window.clearInterval(timer);
        window.setTimeout(() => {
          setScreen((curr) => (curr === 'loading' ? 'menu' : curr));
        }, 220);
      } else {
        setLoadingPct(pct);
      }
    }, 110);

    return () => window.clearInterval(timer);
  }, []);

  // Handle level completion & save progress
  const handleLevelComplete = useCallback((stats: LevelCompleteStats) => {
    setCompleteStats(stats);
    setScreen('levelComplete');

    setProgress((prev) => {
      const completedSet = new Set(prev.completedLevels);
      completedSet.add(stats.levelId);
      const nextUnlocked = Math.min(
        10,
        Math.max(prev.unlockedLevel, stats.levelId + 1)
      );
      const bestScores = {
        ...prev.bestScores,
        [stats.levelId]: Math.max(
          prev.bestScores[stats.levelId] ?? 0,
          stats.score
        ),
      };
      return {
        ...prev,
        unlockedLevel: nextUnlocked,
        completedLevels: Array.from(completedSet),
        bestScores,
        totalCoins:
          prev.totalCoins + stats.coinsCollected + stats.rewardCoins,
      };
    });
  }, []);

  // Initialize isolated Three.js ObbyEngine once
  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const engine = new ObbyEngine(container, {
      onHudUpdate: (snapshot) => setHud(snapshot),
      onLevelComplete: handleLevelComplete,
    });
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [handleLevelComplete]);

  const startLevel = useCallback((levelId: number) => {
    const clamped = Math.max(1, Math.min(10, levelId));
    setActiveLevelId(clamped);
    setCompleteStats(null);
    setSettingsOpen(false);
    setScreen('playing');
    engineRef.current?.loadLevel(
      clamped,
      'playing',
      progressRef.current.bestScores
    );
  }, []);

  const handlePlay = useCallback(() => {
    startLevel(progressRef.current.unlockedLevel);
  }, [startLevel]);

  const handlePause = useCallback(() => {
    if (screenRef.current !== 'playing') return;
    setScreen('paused');
    engineRef.current?.setMode('paused');
  }, []);

  const handleResume = useCallback(() => {
    setSettingsOpen(false);
    setScreen('playing');
    engineRef.current?.setMode('playing');
  }, []);

  const handleRestart = useCallback(() => {
    startLevel(activeLevelId);
  }, [activeLevelId, startLevel]);

  const handleNextLevel = useCallback(() => {
    if (activeLevelId < 10) {
      startLevel(activeLevelId + 1);
    }
  }, [activeLevelId, startLevel]);

  const handleMainMenu = useCallback(() => {
    setSettingsOpen(false);
    setCompleteStats(null);
    setScreen('menu');
    engineRef.current?.loadLevel(
      1,
      'showcase',
      progressRef.current.bestScores
    );
  }, []);

  const handleUpdateSettings = useCallback((nextSettings: GameSettings) => {
    setProgress((prev) => ({ ...prev, settings: nextSettings }));
  }, []);

  const handleToggleMute = useCallback(() => {
    setProgress((prev) => {
      const currentlyMuted =
        !prev.settings.musicEnabled && !prev.settings.sfxEnabled;
      return {
        ...prev,
        settings: {
          ...prev.settings,
          musicEnabled: currentlyMuted ? true : false,
          sfxEnabled: currentlyMuted ? true : false,
        },
      };
    });
  }, []);

  // Keyboard shortcuts (Escape / P to pause/resume, Enter on Menu to Play)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (settingsOpen) {
          setSettingsOpen(false);
          return;
        }
        if (screenRef.current === 'playing') {
          handlePause();
        } else if (screenRef.current === 'paused') {
          handleResume();
        }
      } else if (
        (e.code === 'Enter' || e.code === 'Space') &&
        screenRef.current === 'menu' &&
        !settingsOpen
      ) {
        e.preventDefault();
        soundEngine.unlock();
        soundEngine.playClick();
        soundEngine.startMusic();
        handlePlay();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handlePause, handlePlay, handleResume, settingsOpen]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#38bdf8]">
      {/* Dedicated isolated WebGL canvas container */}
      <div
        ref={canvasMountRef}
        className="absolute inset-0 h-full w-full"
      />

      {/* Screen 1: Animated Loading Screen */}
      {screen === 'loading' && <LoadingScreen progress={loadingPct} />}

      {/* Screen 2 & 3: Main Menu with Title & Play Button */}
      {screen === 'menu' && (
        <MainMenu
          progress={progress}
          onPlay={handlePlay}
          onOpenLevels={() => setScreen('levelSelect')}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      )}

      {/* Screen 4: Level Selection Screen */}
      {screen === 'levelSelect' && (
        <LevelSelectModal
          progress={progress}
          onSelectLevel={startLevel}
          onBack={() => setScreen('menu')}
        />
      )}

      {/* Screen 5: Gameplay HUD + Mobile Touch Controls */}
      {screen === 'playing' && (
        <GameHud
          hud={hud}
          settings={progress.settings}
          onPause={handlePause}
          onOpenSettings={() => {
            engineRef.current?.setMode('paused');
            setSettingsOpen(true);
          }}
          onToggleMute={handleToggleMute}
          onTouchMove={(x, z) => engineRef.current?.setTouchInput(x, z)}
          onTouchJump={() => engineRef.current?.triggerJump()}
        />
      )}

      {/* Screen 6: Pause Menu */}
      {screen === 'paused' && !settingsOpen && (
        <PauseModal
          levelId={hud.levelId}
          levelName={hud.levelName}
          onResume={handleResume}
          onRestart={handleRestart}
          onLevelSelect={() => {
            engineRef.current?.setMode('showcase');
            setScreen('levelSelect');
          }}
          onOpenSettings={() => setSettingsOpen(true)}
          onMainMenu={handleMainMenu}
        />
      )}

      {/* Screen 7: Settings Menu */}
      {settingsOpen && (
        <SettingsModal
          settings={progress.settings}
          onChange={handleUpdateSettings}
          onClose={() => {
            setSettingsOpen(false);
            if (screen === 'playing') {
              engineRef.current?.setMode('playing');
            }
          }}
        />
      )}

      {/* Screen 8, 9, 10: Level Completed Screen with Next Level & Restart */}
      {screen === 'levelComplete' && completeStats && (
        <LevelCompleteModal
          stats={completeStats}
          onNextLevel={handleNextLevel}
          onRestart={handleRestart}
          onLevelSelect={() => {
            setCompleteStats(null);
            engineRef.current?.setMode('showcase');
            setScreen('levelSelect');
          }}
        />
      )}
    </div>
  );
}
