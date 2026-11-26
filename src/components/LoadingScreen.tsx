import React from 'react';

interface LoadingScreenProps {
  progress: number;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-[#0284c7] via-[#38bdf8] to-[#bae6fd] px-6 text-white">
      {/* Decorative floating sky emblem */}
      <div className="animate-float-slow mb-6 flex flex-col items-center">
        <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-3xl border-4 border-white bg-gradient-to-br from-[#fb923c] to-[#f97316] shadow-[0_10px_0_#c2410c,0_20px_35px_rgba(12,74,110,0.35)]">
          <svg
            viewBox="0 0 64 64"
            className="h-14 w-14 text-white"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M32 8L40 24L56 26L44 38L47 54L32 46L17 54L20 38L8 26L24 24L32 8Z"
              fill="#FEF08A"
              stroke="#FFFFFF"
              strokeWidth="3"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1 className="font-display text-center text-4xl font-bold tracking-wide text-white drop-shadow-[0_4px_0_rgba(12,74,110,0.55)] sm:text-5xl">
          SKY JUMP
        </h1>
        <p className="font-display mt-1 rounded-xl bg-[#0369a1] px-4 py-1 text-sm font-bold tracking-[0.22em] text-[#fef08a] shadow-md">
          ULTIMATE OBBY
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-xs">
        <div className="h-5 w-full overflow-hidden rounded-2xl border-2 border-white bg-[#0c4a6e]/55 p-1 shadow-inner">
          <div
            className="h-full rounded-xl bg-gradient-to-r from-[#facc15] via-[#fde047] to-[#4ade80] transition-all duration-150 ease-out"
            style={{ width: `${Math.min(100, Math.max(6, progress))}%` }}
          />
        </div>
        <div className="mt-2.5 flex items-center justify-between text-xs font-extrabold tracking-wider text-white/95 uppercase">
          <span>Building Sky Islands</span>
          <span className="tabular-nums">{Math.round(progress)}%</span>
        </div>
      </div>
    </div>
  );
};
