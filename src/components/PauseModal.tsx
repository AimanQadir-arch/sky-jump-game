import React from 'react';
import { Grid, Home, Play, RotateCcw, Settings } from 'lucide-react';
import { soundEngine } from '../game/audio';

interface PauseModalProps {
  levelId: number;
  levelName: string;
  onResume: () => void;
  onRestart: () => void;
  onLevelSelect: () => void;
  onOpenSettings: () => void;
  onMainMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  levelId,
  levelName,
  onResume,
  onRestart,
  onLevelSelect,
  onOpenSettings,
  onMainMenu,
}) => {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#0c4a6e]/75 p-4">
      <div className="animate-pop-in w-full max-w-sm overflow-hidden rounded-3xl border-4 border-white bg-[#0f172a] text-white shadow-[0_22px_50px_rgba(2,6,23,0.75)]">
        <div className="bg-gradient-to-r from-[#0284c7] to-[#6366f1] px-6 py-4 text-center">
          <p className="text-xs font-extrabold tracking-widest text-[#bae6fd] uppercase">
            Level {levelId} &middot; {levelName}
          </p>
          <h2 className="font-display mt-0.5 text-3xl font-bold">PAUSED</h2>
        </div>

        <div className="flex flex-col gap-3 p-5">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onResume();
            }}
            className="font-display flex cursor-pointer items-center justify-center gap-2.5 rounded-2xl border-2 border-white bg-gradient-to-b from-[#4ade80] to-[#16a34a] py-3.5 text-xl font-bold text-white shadow-[0_5px_0_#14532d] transition-transform hover:scale-[1.02] active:translate-y-0.5"
          >
            <Play className="h-5 w-5 fill-white" />
            <span>RESUME</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onRestart();
            }}
            className="font-display flex cursor-pointer items-center justify-center gap-2.5 rounded-2xl border-2 border-white/80 bg-[#0284c7] py-3 text-lg font-bold text-white shadow-[0_4px_0_#0c4a6e] transition-transform hover:scale-[1.02] active:translate-y-0.5"
          >
            <RotateCcw className="h-5 w-5" />
            <span>RESTART LEVEL</span>
          </button>

          <div className="grid grid-cols-2 gap-3">
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

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onOpenSettings();
              }}
              className="font-display flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-slate-600 bg-slate-800 py-3 text-base font-bold text-white shadow-[0_4px_0_#020617] transition-transform hover:scale-[1.02] active:translate-y-0.5"
            >
              <Settings className="h-4 w-4 text-[#facc15]" />
              <span>SETTINGS</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onMainMenu();
            }}
            className="font-display mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-slate-700 bg-slate-900 py-2.5 text-base font-bold text-slate-200 transition-colors hover:border-slate-500 hover:text-white"
          >
            <Home className="h-4 w-4" />
            <span>MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
