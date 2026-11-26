import React from 'react';
import { Grid, Play, Settings, Trophy, Coins } from 'lucide-react';
import { SaveProgress } from '../types/game';
import { soundEngine } from '../game/audio';

interface MainMenuProps {
  progress: SaveProgress;
  onPlay: () => void;
  onOpenLevels: () => void;
  onOpenSettings: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  progress,
  onPlay,
  onOpenLevels,
  onOpenSettings,
}) => {
  const bestTotal = Object.values(progress.bestScores).reduce(
    (sum, s) => sum + s,
    0
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-4 sm:p-6">
      {/* Top Bar: Stats + Settings Icon */}
      <div className="flex items-start justify-between gap-3">
        <div className="pointer-events-auto flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 rounded-2xl border-2 border-white/90 bg-[#0f172a]/85 px-3.5 py-2 text-white shadow-lg">
            <Coins className="h-5 w-5 text-[#facc15]" />
            <span className="tabular-nums text-sm font-extrabold">
              {progress.totalCoins.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border-2 border-white/90 bg-[#0f172a]/85 px-3.5 py-2 text-white shadow-lg">
            <Trophy className="h-5 w-5 text-[#38bdf8]" />
            <span className="tabular-nums text-sm font-extrabold">
              {bestTotal.toLocaleString()}
            </span>
          </div>
        </div>

        <button
          type="button"
          aria-label="Settings"
          onClick={() => {
            soundEngine.unlock();
            soundEngine.playClick();
            onOpenSettings();
          }}
          className="pointer-events-auto flex h-12 w-12 cursor-pointer items-center justify-center rounded-2xl border-2 border-white bg-[#0f172a]/85 text-white shadow-[0_4px_0_#020617] transition-transform hover:scale-105 active:translate-y-0.5 active:shadow-[0_2px_0_#020617]"
        >
          <Settings className="h-6 w-6" />
        </button>
      </div>

      {/* Center-Left / Center Hero Title Lockup & CTA */}
      <div className="my-auto flex flex-col items-center text-center">
        {/* Bespoke Inline SVG Title Lockup */}
        <div className="animate-float-slow mb-6 max-w-xl px-2">
          <svg
            viewBox="0 0 640 190"
            className="h-auto w-full max-w-[520px] drop-shadow-[0_10px_18px_rgba(12,74,110,0.45)]"
            role="img"
            aria-label="SKY JUMP: ULTIMATE OBBY"
          >
            <defs>
              <linearGradient id="skyTitleGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="55%" stopColor="#FEF08A" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
              <linearGradient id="badgeGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#0EA5E9" />
                <stop offset="50%" stopColor="#6366F1" />
                <stop offset="100%" stopColor="#EC4899" />
              </linearGradient>
            </defs>

            {/* Cloud wings behind title */}
            <g opacity="0.95">
              <circle cx="96" cy="82" r="28" fill="#FFFFFF" />
              <circle cx="122" cy="70" r="34" fill="#FFFFFF" />
              <circle cx="544" cy="82" r="28" fill="#FFFFFF" />
              <circle cx="518" cy="70" r="34" fill="#FFFFFF" />
            </g>

            {/* Main Chunky Title */}
            <text
              x="320"
              y="102"
              textAnchor="middle"
              fontFamily="Fredoka, sans-serif"
              fontWeight="700"
              fontSize="84"
              letterSpacing="3"
              fill="#0C4A6E"
              stroke="#0C4A6E"
              strokeWidth="16"
              strokeLinejoin="round"
              transform="translate(0, 7)"
            >
              SKY JUMP
            </text>
            <text
              x="320"
              y="102"
              textAnchor="middle"
              fontFamily="Fredoka, sans-serif"
              fontWeight="700"
              fontSize="84"
              letterSpacing="3"
              fill="url(#skyTitleGrad)"
              stroke="#FFFFFF"
              strokeWidth="5"
              strokeLinejoin="round"
            >
              SKY JUMP
            </text>

            {/* Subtitle Ribbon */}
            <rect
              x="145"
              y="124"
              width="350"
              height="44"
              rx="14"
              fill="#0F172A"
              transform="translate(0, 4)"
            />
            <rect
              x="145"
              y="124"
              width="350"
              height="44"
              rx="14"
              fill="url(#badgeGrad)"
              stroke="#FFFFFF"
              strokeWidth="3.5"
            />
            <text
              x="320"
              y="153"
              textAnchor="middle"
              fontFamily="Fredoka, sans-serif"
              fontWeight="700"
              fontSize="23"
              letterSpacing="5"
              fill="#FFFFFF"
            >
              ULTIMATE OBBY
            </text>
          </svg>
        </div>

        {/* Action Buttons */}
        <div className="pointer-events-auto flex flex-col items-center gap-3.5 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              soundEngine.unlock();
              soundEngine.playClick();
              soundEngine.startMusic();
              onPlay();
            }}
            className="font-display flex min-w-[220px] cursor-pointer items-center justify-center gap-3 rounded-2xl border-4 border-white bg-gradient-to-b from-[#4ade80] to-[#16a34a] px-9 py-4 text-2xl font-bold tracking-wide text-white shadow-[0_7px_0_#14532d,0_16px_28px_rgba(15,23,42,0.38)] transition-transform hover:scale-105 active:translate-y-1 active:shadow-[0_3px_0_#14532d]"
          >
            <Play className="h-7 w-7 fill-white" />
            <span>PLAY</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.unlock();
              soundEngine.playClick();
              onOpenLevels();
            }}
            className="font-display flex min-w-[180px] cursor-pointer items-center justify-center gap-2.5 rounded-2xl border-4 border-white bg-gradient-to-b from-[#38bdf8] to-[#0284c7] px-7 py-4 text-xl font-bold tracking-wide text-white shadow-[0_7px_0_#0c4a6e,0_16px_28px_rgba(15,23,42,0.35)] transition-transform hover:scale-105 active:translate-y-1 active:shadow-[0_3px_0_#0c4a6e]"
          >
            <Grid className="h-6 w-6" />
            <span>LEVELS</span>
          </button>
        </div>
      </div>

      {/* Bottom Control Hint */}
      <div className="flex justify-center">
        <div className="rounded-xl border border-white/50 bg-[#0f172a]/80 px-4 py-1.5 text-center text-xs font-bold tracking-wider text-white/95 shadow-md sm:text-sm">
          WASD / Arrows Move &middot; Space Jump &middot; Drag Camera &middot; Esc Pause
        </div>
      </div>
    </div>
  );
};
