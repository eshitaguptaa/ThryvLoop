'use client';

import { useEffect, useState } from 'react';
import FeatureCardIcon from '@/components/landing_sections/FeatureCardIcon';

const RECIPES = [
  {
    id: 'deep-dive',
    name: 'Deep Dive',
    icon: 'bolt',
    layers: ['Heavy Rain', 'Binaural', 'Forest'],
  },
  {
    id: 'code-flow',
    name: 'Code Flow',
    icon: 'code',
    layers: ['Lo-Fi', 'Binaural', 'Fire'],
  },
  {
    id: 'zen-zone',
    name: 'Zen Zone',
    icon: 'spa',
    layers: ['Waterfall', 'Forest', 'Binaural'],
  },
];

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

function Waveform({ active }) {
  return (
    <div className="flex items-center justify-center gap-1 h-10 w-full max-w-[180px]" aria-hidden>
      {Array.from({ length: 12 }).map((_, i) => (
        <span
          key={i}
          className={`w-1 rounded-full bg-violet-400/90 origin-center ${active ? 'composer-wave-bar' : 'opacity-25'}`}
          style={{
            height: active ? `${10 + (i % 4) * 4}px` : '6px',
            animationDelay: active ? `${i * 0.07}s` : undefined,
          }}
        />
      ))}
    </div>
  );
}

export default function SoundscapeComposerShowcase() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [playing, setPlaying] = useState(true);
  const recipe = RECIPES[index];

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % RECIPES.length);
        setVisible(true);
      }, 220);
    }, 4800);
    return () => clearInterval(interval);
  }, []);

  const goTo = (i) => {
    if (i === index) return;
    setVisible(false);
    setTimeout(() => {
      setIndex(i);
      setVisible(true);
    }, 220);
  };

  return (
    <>
      <style jsx global>{`
        @keyframes composer-wave {
          0%, 100% { transform: scaleY(0.4); opacity: 0.5; }
          50% { transform: scaleY(1); opacity: 1; }
        }
        .composer-wave-bar {
          animation: composer-wave 1s ease-in-out infinite;
        }
      `}</style>

      <div className="group relative flex flex-col overflow-hidden rounded-3xl bg-card border border-border shadow-xl shadow-gray-100/60 dark:shadow-black/30 hover:shadow-2xl hover:shadow-violet-500/10 hover:-translate-y-1 transition-all duration-300 h-full">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-violet-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-violet-500/18 transition-colors duration-500" />

        <div className="p-8 pb-2 relative z-10 shrink-0">
          <FeatureCardIcon icon="graphic_eq" tone="violet" className="mb-5" fill={1} />
        <h3 className="landing-card-title mb-1.5">Soundscape Composer</h3>
        <p className="landing-card-desc">
            Layer ambient sounds into focus recipes.
          </p>
        </div>

        <div className="px-8 pb-8 relative z-10 flex flex-col flex-1 min-h-0">
          <div
            className="relative flex-1 min-h-[220px] lg:min-h-0 rounded-2xl overflow-hidden border border-violet-500/10 shadow-xl"
            style={{ background: 'linear-gradient(165deg, #1e1630 0%, #0f0f12 60%, #0a0a0c 100%)' }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

            <div
              className={`relative z-10 h-full flex flex-col items-center justify-center px-10 py-10 text-center transition-all duration-300 ease-out ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              }`}
            >
              <div className="h-14 w-14 rounded-2xl bg-[#8b5cf6] text-white flex items-center justify-center shadow-lg shadow-violet-500/30 mb-5">
                <MaterialSymbol icon={recipe.icon} className="text-2xl" />
              </div>

              <p className="text-lg font-bold text-white tracking-tight">{recipe.name}</p>
              <p className="text-sm text-white/40 mt-2">{recipe.layers.length} ambient layers</p>

              <div className="mt-8 mb-6">
                <Waveform active={playing} />
              </div>

              <button
                type="button"
                onClick={() => setPlaying((p) => !p)}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#0f0f12] shadow-lg shadow-violet-500/25 hover:scale-105 active:scale-95 transition-transform"
                aria-label={playing ? 'Pause mix' : 'Play mix'}
              >
                {playing ? (
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex justify-center gap-2 mt-4 shrink-0">
            {RECIPES.map((r, i) => (
              <button
                key={r.id}
                type="button"
                onMouseEnter={() => goTo(i)}
                onFocus={() => goTo(i)}
                onClick={() => goTo(i)}
                aria-label={`Preview ${r.name}`}
                aria-pressed={i === index}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index ? 'w-5 bg-[#8b5cf6]' : 'w-1.5 bg-gray-200 hover:bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
