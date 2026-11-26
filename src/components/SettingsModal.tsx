import React from 'react';
import {
  Gamepad2,
  Music,
  Sliders,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { soundEngine } from '../game/audio';
import { GameSettings } from '../types/game';

interface SettingsModalProps {
  settings: GameSettings;
  onChange: (next: GameSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onChange,
  onClose,
}) => {
  const toggleMusic = () => {
    soundEngine.unlock();
    soundEngine.playClick();
    const nextMusic = !settings.musicEnabled;
    if (nextMusic) soundEngine.startMusic();
    onChange({ ...settings, musicEnabled: nextMusic });
  };

  const toggleSfx = () => {
    soundEngine.unlock();
    const nextSfx = !settings.sfxEnabled;
    onChange({ ...settings, sfxEnabled: nextSfx });
    if (nextSfx) {
      soundEngine.playClick();
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#0c4a6e]/80 p-4">
      <div className="animate-pop-in w-full max-w-md overflow-hidden rounded-3xl border-4 border-white bg-[#0f172a] text-white shadow-[0_22px_50px_rgba(2,6,23,0.75)]">
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-[#0284c7] to-[#6366f1] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <Sliders className="h-6 w-6 text-[#fef08a]" />
            <h2 className="font-display text-2xl font-bold">SETTINGS</h2>
          </div>
          <button
            type="button"
            aria-label="Close Settings"
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border-2 border-white/80 bg-[#0f172a]/70 text-white hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-4 p-5">
          {/* Music ON/OFF */}
          <div className="flex items-center justify-between rounded-2xl border-2 border-slate-700 bg-slate-800/90 p-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0284c7] text-white">
                <Music className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-base font-bold">
                  Background Music
                </p>
                <p className="text-xs font-semibold text-slate-400">
                  Upbeat sky synth soundtrack
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleMusic}
              className={`font-display min-w-[72px] cursor-pointer rounded-xl border-2 border-white/80 px-3.5 py-1.5 text-sm font-bold shadow-[0_3px_0_#020617] active:translate-y-0.5 ${
                settings.musicEnabled
                  ? 'bg-[#22c55e] text-white'
                  : 'bg-slate-700 text-slate-300'
              }`}
            >
              {settings.musicEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Sound Effects ON/OFF */}
          <div className="flex items-center justify-between rounded-2xl border-2 border-slate-700 bg-slate-800/90 p-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f97316] text-white">
                {settings.sfxEnabled ? (
                  <Volume2 className="h-5 w-5" />
                ) : (
                  <VolumeX className="h-5 w-5" />
                )}
              </div>
              <div>
                <p className="font-display text-base font-bold">
                  Sound Effects
                </p>
                <p className="text-xs font-semibold text-slate-400">
                  Jumps, coins, checkpoints & hits
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleSfx}
              className={`font-display min-w-[72px] cursor-pointer rounded-xl border-2 border-white/80 px-3.5 py-1.5 text-sm font-bold shadow-[0_3px_0_#020617] active:translate-y-0.5 ${
                settings.sfxEnabled
                  ? 'bg-[#22c55e] text-white'
                  : 'bg-slate-700 text-slate-300'
              }`}
            >
              {settings.sfxEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Master Volume Slider */}
          <div className="rounded-2xl border-2 border-slate-700 bg-slate-800/90 p-3.5">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="font-display text-base font-bold">
                Master Volume
              </span>
              <span className="tabular-nums rounded-lg bg-slate-900 px-2.5 py-0.5 text-sm font-extrabold text-[#38bdf8]">
                {Math.round(settings.volume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(settings.volume * 100)}
              onChange={(e) => {
                soundEngine.unlock();
                onChange({
                  ...settings,
                  volume: Number(e.target.value) / 100,
                });
              }}
              className="h-3 w-full cursor-pointer accent-[#38bdf8]"
            />
          </div>

          {/* Mobile Touch Controls Preference */}
          <div className="rounded-2xl border-2 border-slate-700 bg-slate-800/90 p-3.5">
            <div className="mb-2.5 flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-[#4ade80]" />
              <span className="font-display text-base font-bold">
                On-Screen Touch Buttons
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['auto', 'on', 'off'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    onChange({ ...settings, touchControls: mode });
                  }}
                  className={`font-display cursor-pointer rounded-xl border-2 py-2 text-xs font-bold uppercase transition-colors ${
                    settings.touchControls === mode
                      ? 'border-white bg-[#0284c7] text-white'
                      : 'border-slate-700 bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {mode === 'auto' ? 'Auto' : mode === 'on' ? 'Show' : 'Hide'}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="font-display mt-1 cursor-pointer rounded-2xl border-2 border-white bg-gradient-to-b from-[#4ade80] to-[#16a34a] py-3 text-lg font-bold text-white shadow-[0_5px_0_#14532d] transition-transform hover:scale-[1.02] active:translate-y-0.5"
          >
            DONE
          </button>
        </div>
      </div>
    </div>
  );
};
