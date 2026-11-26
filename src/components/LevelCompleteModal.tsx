import React from 'react';
import {
  ArrowRight,
  Coins,
  Grid,
  RotateCcw,
  Star,
  Trophy,
} from 'lucide-react';
import { soundEngine } from '../game/audio';
import { LevelCompleteStats } from '../types/game';

interface LevelCompleteModalProps {
  stats: LevelCompleteStats;
  onNextLevel: () => void;
  onRestart: () => void;
  onLevelSelect: () => void;
}

export const LevelCompleteModal: React.FC<LevelCompleteModalProps> = ({
  stats,
  onNextLevel,
  onRestart,
  onLevelSelect,
}) => {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#0c4a6e]/75 p-4">
      <div className="animate-pop-in w-full max-w-md overflow-hidden rounded-3xl border-4 border-white bg-[#0f172a] text-white shadow-[0_24px_55px_rgba(2,6,23,0.8)]">
        {/* Celebratory Banner */}
        <div className="bg-gradient-to-b from-[#22c55e] to-[#059669] px-6 pt-5 pb-6 text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-white ${
                  idx <= stats.stars
                    ? 'bg-[#facc15] text-[#713f12] shadow-[0_4px_0_#a16207]'
                    : 'bg-emerald-900/50 text-emerald-200/40'
                }`}
              >
                <Star
                  className={`h-7 w-7 ${
                    idx <= stats.stars ? 'fill-[#713f12]' : ''
                  }`}
                />
              </div>
            ))}
          </div>

          <p className="text-xs font-extrabold tracking-widest text-[#dcfce7] uppercase">
            Level {stats.levelId} Complete
          </p>
          <h2 className="font-display mt-0.5 text-3xl font-bold text-white drop-shadow-sm">
            {stats.levelName}
          </h2>
        </div>

        {/* Score & Coin Breakdown */}
        <div className="flex flex-col gap-3 p-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border-2 border-slate-700 bg-slate-800/90 p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs font-extrabold tracking-wider text-slate-400 uppercase">
                <Trophy className="h-4 w-4 text-[#38bdf8]" />
                <span>Score</span>
              </div>
              <p className="tabular-nums font-display mt-1 text-2xl font-bold text-[#fef08a]">
                {stats.score.toLocaleString()}
              </p>
              {stats.isNewBest && (
                <span className="mt-1 inline-block rounded-md bg-[#f97316] px-2 py-0.5 text-[10px] font-black tracking-wider text-white uppercase">
                  New Best!
                </span>
              )}
            </div>

            <div className="rounded-2xl border-2 border-slate-700 bg-slate-800/90 p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs font-extrabold tracking-wider text-slate-400 uppercase">
                <Coins className="h-4 w-4 text-[#facc15]" />
                <span>Coins</span>
              </div>
              <p className="tabular-nums font-display mt-1 text-2xl font-bold text-white">
                {stats.coinsCollected}/{stats.totalLevelCoins}
              </p>
              <span className="mt-1 inline-block rounded-md bg-[#eab308] px-2 py-0.5 text-[10px] font-black tracking-wider text-slate-950 uppercase">
                +{stats.rewardCoins} Bonus
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-slate-700/80 bg-slate-900/70 px-4 py-2.5 text-xs font-bold text-slate-300">
            <span>
              Best Score:{' '}
              <strong className="tabular-nums text-white">
                {stats.bestScore.toLocaleString()}
              </strong>
            </span>
            <span>
              Time:{' '}
              <strong className="tabular-nums text-white">
                {stats.elapsedTime.toFixed(1)}s
              </strong>
            </span>
            <span>
              Falls:{' '}
              <strong className="tabular-nums text-white">{stats.falls}</strong>
            </span>
          </div>

          {/* Primary Actions */}
          {stats.hasNextLevel ? (
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onNextLevel();
              }}
              className="font-display mt-1 flex cursor-pointer items-center justify-center gap-2.5 rounded-2xl border-2 border-white bg-gradient-to-b from-[#4ade80] to-[#16a34a] py-3.5 text-xl font-bold text-white shadow-[0_5px_0_#14532d] transition-transform hover:scale-[1.02] active:translate-y-0.5"
            >
              <span>NEXT LEVEL</span>
              <ArrowRight className="h-6 w-6" />
            </button>
          ) : (
            <div className="rounded-2xl border-2 border-[#facc15] bg-[#713f12]/40 px-4 py-3 text-center text-sm font-extrabold text-[#fef08a]">
              All 10 Sky Levels Conquered! You are the Ultimate Obby Champion!
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onRestart();
              }}
              className="font-display flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-white/80 bg-[#0284c7] py-3 text-base font-bold text-white shadow-[0_4px_0_#0c4a6e] transition-transform hover:scale-[1.02] active:translate-y-0.5"
            >
              <RotateCcw className="h-4 w-4" />
              <span>RESTART</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onLevelSelect();
              }}
              className="font-display flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-slate-600 bg-slate-800 py-3 text-base font-bold text-white shadow-[0_4px_0_#020617] transition-transform hover:scale-[1.02] active:translate-y-0.5"
            >
              <Grid className="h-4 w-4 text-[#38bdf8]" />
              <span>LEVELS</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
