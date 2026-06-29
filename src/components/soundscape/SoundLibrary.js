'use client';

import { useState } from 'react';
import SoundIcon from '@/components/soundscape/icons/SoundIcon';
import { getLibraryTabSounds } from '@/stores/soundscapeStore';

const TABS = ['Atmosphere', 'Neural', 'Rhythm'];

export default function SoundLibrary({ activeTrackIds, onToggleSound }) {
  const [activeTab, setActiveTab] = useState('Atmosphere');
  const sounds = getLibraryTabSounds(activeTab);

  return (
    <section data-library-section>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h3 className="text-lg font-medium text-white">Library</h3>
        <div className="bg-[#18181b] p-1 rounded-full flex">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-[#8b5cf6] text-white shadow-lg'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {sounds.map((sound) => {
          const isActive = activeTrackIds.includes(sound.id);
          return (
            <button
              key={sound.id}
              type="button"
              onClick={() => onToggleSound(sound.id, activeTab)}
              className={`
                relative px-6 py-8 rounded-3xl border transition-all duration-200 flex flex-col items-center justify-center gap-4 group
                ${
                  isActive
                    ? 'bg-[#8b5cf6]/10 border-[#8b5cf6] shadow-[0_0_15px_rgba(139,92,246,0.15)]'
                    : 'bg-[#18181b] border-white/5 hover:border-white/10 hover:bg-[#202024]'
                }
              `}
              style={{ minHeight: '140px' }}
            >
              <div
                className={`${
                  isActive ? 'text-[#8b5cf6]' : 'text-white/70 group-hover:text-white'
                } transition-colors`}
              >
                <SoundIcon soundId={sound.id} className="w-8 h-8" />
              </div>
              <div className="text-center">
                <div className="text-white font-medium text-sm mb-1">{sound.name}</div>
                <div className={`text-xs ${isActive ? 'text-[#8b5cf6]' : 'text-white/30'}`}>
                  {isActive ? 'Active' : sound.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
