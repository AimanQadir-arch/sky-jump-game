import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Coins,
  Flag,
  Pause,
  Settings,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { GameSettings, HudSnapshot } from '../types/game';
import { soundEngine } from '../game/audio';

interface GameHudProps {
  hud: HudSnapshot;
  settings: GameSettings;
  onPause: () => void;
  onOpenSettings: () => void;
  onToggleMute: () => void;
  onTouchMove: (x: number, z: number) => void;
  onTouchJump: () => void;
}

export const GameHud: React.FC<GameHudProps> = ({
  hud,
  settings,
  onPause,
  onOpenSettings,
  onToggleMute,
  onTouchMove,
  onTouchJump,
}) => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const activeDirs = useRef<{
    left: boolean;
    right: boolean;
    up: boolean;
    down: boolean;
  }>({ left: false, right: false, up: false, down: false });

  useEffect(() => {
    const checkTouch = () => {
      const hasTouch =
        'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsTouchDevice(hasTouch || window.innerWidth < 820);
    };
    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  const showTouchControls =
    settings.touchControls === 'on' ||
    (settings.touchControls === 'auto' && isTouchDevice);

  const syncDirection = () => {
    const d = activeDirs.current;
    const x = (d.right ? 1 : 0) - (d.left ? 1 : 0);
    const z = (d.down ? 1 : 0) - (d.up ? 1 : 0);
    onTouchMove(x, z);
  };

  const bindDir = (key: 'left' | 'right' | 'up' | 'down') => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      soundEngine.unlock();
      activeDirs.current[key] = true;
      syncDirection();
    },
    onPointerUp: (e: React.PointerEvent) => {
      e.preventDefault();
      activeDirs.current[key] = false;
      syncDirection();
    },
    onPointerLeave: () => {
      if (activeDirs.current[key]) {
        activeDirs.current[key] = false;
        syncDirection();
      }
    },
    onPointerCancel: () => {
      activeDirs.current[key] = false;
      syncDirection();
    },
  });

  const isMuted = !settings.musicEnabled && !settings.sfxEnabled;
  const pct = Math.round(hud.progress * 100);

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-3 sm:p-4">
      {/* TOP HUD BAR */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        {/* Top-Left: Level & Course Progress */}
        <div className="flex flex-col gap-1.5 rounded-2xl border-2 border-white/90 bg-[#0f172a]/85 px-3.5 py-2 text-white shadow-lg">
          <div className="flex items-center gap-2">
            <span className="font-display rounded-lg bg-[#0284c7] px-2 py-0.5 text-xs font-bold tracking-wider uppercase">
              LVL {hud.levelId}
            </span>
            <span className="font-display max-w-[140px] truncate text-sm font-bold sm:max-w-none sm:text-base">
              {hud.levelName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-2.5 w-28 overflow-hidden rounded-full bg-slate-700 sm:w-36">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#38bdf8] to-[#4ade80] transition-all duration-150"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="tabular-nums text-xs font-extrabold text-[#bae6fd]">
              {pct}%
            </span>
            {hud.totalCheckpoints > 0 && (
              <span className="flex items-center gap-1 text-xs font-extrabold text-[#4ade80]">
                <Flag className="h-3.5 w-3.5" />
                <span className="tabular-nums">
                  {hud.checkpointReached}/{hud.totalCheckpoints}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Top-Center: Score & Coins */}
        <div className="flex items-center gap-2 rounded-2xl border-2 border-white/90 bg-[#0f172a]/85 px-3.5 py-2 text-white shadow-lg">
          <div className="flex items-center gap-1.5 border-r border-slate-700 pr-3">
            <Coins className="h-5 w-5 text-[#facc15]" />
            <span className="tabular-nums text-sm font-black sm:text-base">
              {hud.coinsCollected}/{hud.totalLevelCoins}
            </span>
          </div>
          <div className="flex items-center gap-1.5 pl-1">
            <span className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">
              SCORE
            </span>
            <span className="tabular-nums text-sm font-black text-[#fef08a] sm:text-base">
              {hud.score.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Top-Right: Sound, Settings, Pause */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
            onClick={() => {
              soundEngine.unlock();
              onToggleMute();
            }}
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl border-2 border-white bg-[#0f172a]/85 text-white shadow-[0_4px_0_#020617] transition-transform hover:scale-105 active:translate-y-0.5"
          >
            {isMuted ? (
              <VolumeX className="h-5 w-5 text-rose-400" />
            ) : (
              <Volume2 className="h-5 w-5 text-[#4ade80]" />
            )}
          </button>

          <button
            type="button"
            aria-label="Settings"
            onClick={() => {
              soundEngine.unlock();
              soundEngine.playClick();
              onOpenSettings();
            }}
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl border-2 border-white bg-[#0f172a]/85 text-white shadow-[0_4px_0_#020617] transition-transform hover:scale-105 active:translate-y-0.5"
          >
            <Settings className="h-5 w-5" />
          </button>

          <button
            type="button"
            aria-label="Pause"
            onClick={() => {
              soundEngine.unlock();
              soundEngine.playClick();
              onPause();
            }}
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl border-2 border-white bg-[#f97316] text-white shadow-[0_4px_0_#9a3412] transition-transform hover:scale-105 active:translate-y-0.5"
          >
            <Pause className="h-5 w-5 fill-white" />
          </button>
        </div>
      </div>

      {/* BOTTOM TOUCH CONTROLS (Android / Mobile / Toggleable) */}
      {showTouchControls && (
        <div className="flex items-end justify-between gap-4 pb-1 sm:px-2">
          {/* Left: Virtual Directional Pad (Left, Right, Forward, Back) */}
          <div className="pointer-events-auto grid touch-none grid-cols-3 gap-1.5 select-none">
            <div />
            <button
              type="button"
              aria-label="Move Forward"
              {...bindDir('up')}
              className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-white/90 bg-[#0f172a]/80 text-white shadow-[0_4px_0_#020617] active:translate-y-0.5 active:bg-[#0284c7]"
            >
              <ArrowUp className="h-7 w-7" />
            </button>
            <div />

            <button
              type="button"
              aria-label="Move Left"
              {...bindDir('left')}
              className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-white/90 bg-[#0f172a]/80 text-white shadow-[0_4px_0_#020617] active:translate-y-0.5 active:bg-[#0284c7]"
            >
              <ArrowLeft className="h-7 w-7" />
            </button>
            <button
              type="button"
              aria-label="Move Backward"
              {...bindDir('down')}
              className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-white/90 bg-[#0f172a]/80 text-white shadow-[0_4px_0_#020617] active:translate-y-0.5 active:bg-[#0284c7]"
            >
              <ArrowDown className="h-7 w-7" />
            </button>
            <button
              type="button"
              aria-label="Move Right"
              {...bindDir('right')}
              className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-white/90 bg-[#0f172a]/80 text-white shadow-[0_4px_0_#020617] active:translate-y-0.5 active:bg-[#0284c7]"
            >
              <ArrowRight className="h-7 w-7" />
            </button>
          </div>

          {/* Right: Big Tactile Virtual JUMP Button */}
          <button
            type="button"
            aria-label="Jump"
            onPointerDown={(e) => {
              e.preventDefault();
              soundEngine.unlock();
              onTouchJump();
            }}
            className="font-display pointer-events-auto flex h-24 w-24 touch-none items-center justify-center rounded-full border-4 border-white bg-gradient-to-b from-[#4ade80] to-[#16a34a] text-lg font-bold tracking-wider text-white shadow-[0_6px_0_#14532d,0_10px_24px_rgba(2,6,23,0.45)] select-none active:translate-y-1 active:shadow-[0_2px_0_#14532d]"
          >
            JUMP
          </button>
        </div>
      )}
    </div>
  );
};
