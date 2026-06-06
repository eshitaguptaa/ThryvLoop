'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const MaterialSymbol = ({ icon, className = '', fill = 1 }) => (
  <span
    className={`material-symbols-outlined ${className}`}
    style={{
      fontVariationSettings: `'FILL' ${fill}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
    }}
  >
    {icon}
  </span>
);

const INTENSITY_PRESETS = [45, 65, 85];
const WAVE_HEIGHTS = ['h-3', 'h-6', 'h-4', 'h-8', 'h-3'];

export default function ForestRainControls() {
  const [presetIndex, setPresetIndex] = useState(1);
  const [intensity, setIntensity] = useState(INTENSITY_PRESETS[1]);
  const [playing, setPlaying] = useState(true);
  const sliderRef = useRef(null);
  const draggingRef = useRef(false);

  const setIntensityFromClientX = useCallback((clientX) => {
    const track = sliderRef.current;
    if (!track) return;
    const { left, width } = track.getBoundingClientRect();
    const pct = Math.round(Math.min(100, Math.max(0, ((clientX - left) / width) * 100)));
    setIntensity(pct);
    setPresetIndex(-1);
  }, []);

  useEffect(() => {
    const onPointerMove = (e) => {
      if (draggingRef.current) setIntensityFromClientX(e.clientX);
    };
    const onPointerUp = () => {
      draggingRef.current = false;
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [setIntensityFromClientX]);

  const stepPreset = (delta) => {
    const next = presetIndex < 0 ? 1 : (presetIndex + delta + INTENSITY_PRESETS.length) % INTENSITY_PRESETS.length;
    setPresetIndex(next);
    setIntensity(INTENSITY_PRESETS[next]);
  };

  const onSliderPointerDown = (e) => {
    draggingRef.current = true;
    sliderRef.current?.setPointerCapture(e.pointerId);
    setIntensityFromClientX(e.clientX);
  };

  return (
    <div className="glass-panel p-6 rounded-3xl shadow-2xl relative overflow-hidden group/controls">
      <div className="absolute top-0 right-0 p-10 opacity-30 group-hover/controls:opacity-50 transition-opacity">
        <MaterialSymbol icon="graphic_eq" className="text-[300px] text-white opacity-80 scale-[2.5]" fill={0} />
      </div>
      <div className="flex flex-col gap-6 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur-md flex items-center justify-center text-white ring-1 ring-white/30 shadow-lg">
              <MaterialSymbol icon="forest" className="text-2xl" />
            </div>
            <div>
              <div className="text-lg font-bold text-white leading-tight">Forest Rain</div>
              <div className="text-xs text-white/60 font-medium">Binaural Beats • 40Hz</div>
            </div>
          </div>
          <div className="flex gap-1.5 items-center h-10 px-2">
            {WAVE_HEIGHTS.map((heightClass, i) => (
              <div
                key={i}
                className={`w-1.5 bg-white/90 rounded-full shadow-[0_0_10px_white] ${heightClass} ${
                  playing ? 'sound-wave-bar' : 'opacity-50'
                }`}
                style={playing ? undefined : { height: '4px' }}
              />
            ))}
          </div>
        </div>
        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-white/70 font-semibold tracking-wide">
              <span>INTENSITY</span>
              <span>{intensity}%</span>
            </div>
            <div
              ref={sliderRef}
              role="slider"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={intensity}
              aria-label="Sound intensity"
              tabIndex={0}
              onPointerDown={onSliderPointerDown}
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                  e.preventDefault();
                  setPresetIndex(-1);
                  setIntensity((v) => Math.max(0, v - 5));
                }
                if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                  e.preventDefault();
                  setPresetIndex(-1);
                  setIntensity((v) => Math.min(100, v + 5));
                }
              }}
              className="relative w-full h-8 bg-black/40 rounded-full flex items-center px-1.5 group/slider cursor-pointer border border-white/5 hover:border-white/20 transition-colors shadow-inner touch-none"
            >
              <div className="absolute left-1 right-1 top-1/2 -translate-y-1/2 h-1.5 bg-white/10 rounded-full pointer-events-none" />
              <div
                className="absolute left-1 top-1/2 -translate-y-1/2 h-1.5 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full shadow-[0_0_12px_rgba(168,85,247,0.8)] pointer-events-none"
                style={{ width: `calc(${intensity}% - 4px)` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-white rounded-full shadow-[0_0_20px_rgba(168,85,247,0.8)] border-4 border-purple cursor-grab active:cursor-grabbing hover:scale-110 transition-transform z-10 pointer-events-none"
                style={{ left: `${intensity}%` }}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              aria-label="Lower intensity preset"
              onClick={() => stepPreset(-1)}
              className="h-12 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white transition-all backdrop-blur-sm group/btn"
            >
              <MaterialSymbol icon="skip_previous" className="group-hover/btn:-translate-x-0.5 transition-transform" fill={0} />
            </button>
            <button
              type="button"
              aria-label={playing ? 'Pause' : 'Play'}
              onClick={() => setPlaying((p) => !p)}
              className="h-12 rounded-xl bg-white text-black flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-transform hover:scale-105 active:scale-95"
            >
              <MaterialSymbol icon={playing ? 'pause' : 'play_arrow'} className="text-3xl" />
            </button>
            <button
              type="button"
              aria-label="Raise intensity preset"
              onClick={() => stepPreset(1)}
              className="h-12 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white transition-all backdrop-blur-sm group/btn"
            >
              <MaterialSymbol icon="skip_next" className="group-hover/btn:translate-x-0.5 transition-transform" fill={0} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
