'use client';

import VolumeSlider from '@/components/soundscape/VolumeSlider';
import SoundIcon from '@/components/soundscape/icons/SoundIcon';

export default function MasterControls({
  masterVolume,
  sessionPlaying,
  spacesVolume,
  spacesPaused,
  onMasterVolumeChange,
  onMasterVolumeCommit,
  onToggleMasterMute,
  onSpacesVolumeChange,
  onToggleSpacesMute,
}) {
  const showMainMuted = masterVolume === 0 || !sessionPlaying;
  const showSpacesMuted = spacesVolume === 0 || spacesPaused || !sessionPlaying;

  return (
    <div className="flex items-center gap-6 flex-wrap">
      <div className="flex items-center gap-3 w-48 opacity-60 hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={onToggleMasterMute}
          className="shrink-0 transition-colors hover:opacity-100 cursor-pointer p-1 -ml-1"
          title={
            !sessionPlaying
              ? 'Play all sounds'
              : masterVolume === 0
                ? 'Unmute main volume'
                : 'Mute main volume'
          }
        >
          {showMainMuted ? (
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M7 14l12-12" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          )}
        </button>
        <VolumeSlider
          value={masterVolume}
          onChange={onMasterVolumeChange}
          onCommit={onMasterVolumeCommit}
          className="flex-1 h-1"
        />
      </div>

      <div className="flex items-center gap-3 w-48 opacity-60 hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={onToggleSpacesMute}
          className={`shrink-0 flex items-center gap-2 text-xs transition-colors cursor-pointer p-1 -ml-1 ${
            showSpacesMuted ? 'text-orange-400' : 'text-white/60 hover:text-white'
          }`}
          title={showSpacesMuted ? 'Unmute Spaces audio' : 'Mute Spaces audio'}
        >
          {showSpacesMuted ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M7 14l12-12" />
            </svg>
          ) : (
            <SoundIcon soundId="spaces" className="w-4 h-4" />
          )}
          <span>Spaces</span>
        </button>
        <VolumeSlider
          value={spacesVolume}
          onChange={onSpacesVolumeChange}
          className="flex-1 h-1"
        />
      </div>
    </div>
  );
}
