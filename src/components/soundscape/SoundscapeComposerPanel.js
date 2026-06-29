'use client';

import { useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { unlockSoundscapePlayback } from '@/hooks/soundscape/useSoundscapeEngine';
import { useSoundscapeRecipes } from '@/hooks/soundscape/useSoundscapeRecipes';
import ActiveMixer from '@/components/soundscape/ActiveMixer';
import SoundLibrary from '@/components/soundscape/SoundLibrary';
import FocusRecipes from '@/components/soundscape/FocusRecipes';
import { useSoundscapeStore } from '@/stores/soundscapeStore';

export default function SoundscapeComposerPanel() {
  const { user } = useUser();
  const userId = user?.id ?? null;
  const libraryRef = useRef(null);

  const tracks = useSoundscapeStore((s) => s.tracks);
  const masterVolume = useSoundscapeStore((s) => s.masterVolume);
  const sessionPlaying = useSoundscapeStore((s) => s.sessionPlaying);
  const soloTrackId = useSoundscapeStore((s) => s.soloTrackId);
  const spacesVolume = useSoundscapeStore((s) => s.spacesVolume);
  const spacesPaused = useSoundscapeStore((s) => s.spacesPaused);
  const autoplayBlocked = useSoundscapeStore((s) => s.autoplayBlocked);

  const toggleLibrarySound = useSoundscapeStore((s) => s.toggleLibrarySound);
  const setMasterVolume = useSoundscapeStore((s) => s.setMasterVolume);
  const toggleMasterMute = useSoundscapeStore((s) => s.toggleMasterMute);
  const setSpacesVolume = useSoundscapeStore((s) => s.setSpacesVolume);
  const toggleSpacesMute = useSoundscapeStore((s) => s.toggleSpacesMute);
  const toggleTrackPlay = useSoundscapeStore((s) => s.toggleTrackPlay);
  const toggleTrackMute = useSoundscapeStore((s) => s.toggleTrackMute);
  const toggleSolo = useSoundscapeStore((s) => s.toggleSolo);
  const removeTrack = useSoundscapeStore((s) => s.removeTrack);
  const setTrackVolume = useSoundscapeStore((s) => s.setTrackVolume);
  const commitTrackVolume = useSoundscapeStore((s) => s.commitTrackVolume);
  const applyRecipe = useSoundscapeStore((s) => s.applyRecipe);

  const { recipes, removeRecipe } = useSoundscapeRecipes(userId);

  const activeTrackIds = tracks.map((t) => t.id);
  const spacesActive = !spacesPaused && spacesVolume > 0;

  const scrollToLibrary = () => {
    libraryRef.current?.querySelector('[data-library-section]')?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
  };

  return (
    <div className="p-8 space-y-10">
      {autoplayBlocked && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 flex items-center justify-between gap-4">
          <p className="text-amber-200 text-sm">
            Browser blocked autoplay. Tap to start audio.
          </p>
          <button
            type="button"
            onClick={() => unlockSoundscapePlayback(userId)}
            className="shrink-0 px-4 py-2 rounded-lg bg-amber-500 text-black text-sm font-medium hover:bg-amber-400 transition-colors"
          >
            Enable audio
          </button>
        </div>
      )}

      <ActiveMixer
        tracks={tracks}
        masterVolume={masterVolume}
        sessionPlaying={sessionPlaying}
        soloTrackId={soloTrackId}
        spacesVolume={spacesVolume}
        spacesPaused={spacesPaused}
        onMasterVolumeChange={setMasterVolume}
        onMasterVolumeCommit={() => {}}
        onToggleMasterMute={toggleMasterMute}
        onSpacesVolumeChange={setSpacesVolume}
        onToggleSpacesMute={toggleSpacesMute}
        onToggleTrackPlay={toggleTrackPlay}
        onToggleTrackMute={toggleTrackMute}
        onToggleSolo={toggleSolo}
        onRemoveTrack={removeTrack}
        onTrackVolumeChange={setTrackVolume}
        onTrackVolumeCommit={commitTrackVolume}
        onScrollToLibrary={scrollToLibrary}
      />

      <div ref={libraryRef}>
        <SoundLibrary activeTrackIds={activeTrackIds} onToggleSound={toggleLibrarySound} />
      </div>

      <FocusRecipes
        recipes={recipes}
        activeTrackIds={activeTrackIds}
        spacesActive={spacesActive}
        onSelect={(recipe) => applyRecipe(recipe.sounds, recipe.globalVolume)}
        onDelete={(id, e) => {
          e.preventDefault();
          e.stopPropagation();
          void removeRecipe(id);
        }}
      />
    </div>
  );
}
