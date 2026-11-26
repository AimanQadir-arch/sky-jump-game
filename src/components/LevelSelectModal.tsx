import React from 'react';
import { ArrowLeft, CheckCircle2, Coins, Lock, Play, Trophy } from 'lucide-react';
import { LEVELS } from '../game/levels';
import { soundEngine } from '../game/audio';
import { SaveProgress } from '../types/game';

interface LevelSelectModalProps {
  progress: SaveProgress;
  onSelectLevel: (levelId: number) => void;
  onBack: () => void;
}

const DIFF_COLORS: Record<string, string> = {
  Easy: 'bg-[#22c55e] text-white',
  Medium: 'bg-[#f59e0b] text-slate-950',
  Hard: 'bg-[#f97316] text-white',
  Expert: 'bg-[#ec4899] text-white',
};

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  progress,
  onSelectLevel,
  onBack,
}) => {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#0c4a6e]/75 p-3 sm:p-6">
      <div className="animate-pop-in flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border-4 border-white bg-[#0f172a] text-white shadow-[0_20px_50px_rgba(2,6,23,0.75)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-slate-700/80 bg-gradient-to-r from-[#0284c7] to-[#6366f1] px-5 py-4">
          <button
            type="button"
            onClick={() => {
              soundEngine.unlock();
              soundEngine.playClick();
              onBack();
            }}
            className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-white bg-[#0f172a]/70 px-3.5 py-2 text-sm font-extrabold text-white shadow-[0_3px_0_#020617] transition-transform hover:scale-105 active:translate-y-0.5"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>BACK</span>
          </button>

          <h2 className="font-display text-xl font-bold tracking-wide sm:text-2xl">
            SELECT LEVEL
          </h2>

          <div className="flex items-center gap-1.5 rounded-xl border-2 border-white/70 bg-[#0f172a]/70 px-3 py-1.5 text-sm font-extrabold">
            <Coins className="h-4 w-4 text-[#facc15]" />
            <span className="tabular-nums">{progress.totalCoins}</span>
          </div>
        </div>

        {/* 10 Levels Grid */}
        <div className="grid grid-cols-1 gap-3 overflow-y-auto p-4 sm:grid-cols-2 sm:p-5">
          {LEVELS.map((lvl) => {
            const unlocked = lvl.id <= progress.unlockedLevel;
            const completed = progress.completedLevels.includes(lvl.id);
            const best = progress.bestScores[lvl.id] ?? 0;

            return (
              <button
                key={lvl.id}
                type="button"
                disabled={!unlocked}
                onClick={() => {
                  if (!unlocked) return;
                  soundEngine.unlock();
                  soundEngine.playClick();
                  soundEngine.startMusic();
                  onSelectLevel(lvl.id);
                }}
                className={`group relative flex items-center justify-between gap-3 rounded-2xl border-2 p-3.5 text-left transition-transform ${
                  unlocked
                    ? 'cursor-pointer border-slate-600 bg-slate-800/95 hover:scale-[1.015] hover:border-[#38bdf8] active:translate-y-0.5'
                    : 'cursor-not-allowed border-slate-800 bg-slate-900/80 opacity-65'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className="font-display flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-white/80 text-2xl font-bold text-white shadow-md"
                    style={{
                      backgroundColor: unlocked
                        ? lvl.theme.normalColor
                        : '#334155',
                    }}
                  >
                    {unlocked ? lvl.id : <Lock className="h-6 w-6 text-slate-300" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display truncate text-base font-bold text-white sm:text-lg">
                        {lvl.name}
                      </span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[11px] font-extrabold uppercase ${
                          DIFF_COLORS[lvl.difficulty]
                        }`}
                      >
                        {lvl.difficulty}
                      </span>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs font-bold text-slate-300">
                      <span className="flex items-center gap-1">
                        <Trophy className="h-3.5 w-3.5 text-[#38bdf8]" />
                        <span className="tabular-nums">
                          {best > 0 ? best.toLocaleString() : '—'}
                        </span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Coins className="h-3.5 w-3.5 text-[#facc15]" />
                        <span className="tabular-nums">+{lvl.rewardCoins}</span>
                      </span>
                      {completed && (
                        <span className="flex items-center gap-1 text-[#4ade80]">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Cleared</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {unlocked && (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#22c55e] text-white shadow-[0_3px_0_#14532d] group-hover:bg-[#4ade80]">
                    <Play className="h-5 w-5 fill-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
