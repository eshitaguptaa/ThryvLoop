'use client';

import { MAX_TRACKS } from '@/lib/soundscape/persistence';
import TrackCard from '@/components/soundscape/TrackCard';
import MasterControls from '@/components/soundscape/MasterControls';

export default function ActiveMixer({
  tracks,
  masterVolume,
  sessionPlaying,
  soloTrackId,
  spacesVolume,
  spacesPaused,
  onMasterVolumeChange,
  onMasterVolumeCommit,
  onToggleMasterMute,
  onSpacesVolumeChange,
  onToggleSpacesMute,
  onToggleTrackPlay,
  onToggleTrackMute,
  onToggleSolo,
  onRemoveTrack,
  onTrackVolumeChange,
  onTrackVolumeCommit,
  onScrollToLibrary,
}) {
  const emptySlots = Math.max(0, MAX_TRACKS - tracks.length);

  return (
    <section>
      <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
        <h3 className="text-lg font-medium text-white">Active Mixer</h3>
        <MasterControls
          masterVolume={masterVolume}
          sessionPlaying={sessionPlaying}
          spacesVolume={spacesVolume}
          spacesPaused={spacesPaused}
          onMasterVolumeChange={onMasterVolumeChange}
          onMasterVolumeCommit={onMasterVolumeCommit}
          onToggleMasterMute={onToggleMasterMute}
          onSpacesVolumeChange={onSpacesVolumeChange}
          onToggleSpacesMute={onToggleSpacesMute}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tracks.map((track) => (
          <TrackCard
            key={track.id}
            track={track}
            soloTrackId={soloTrackId}
            sessionPlaying={sessionPlaying}
            onTogglePlay={onToggleTrackPlay}
            onToggleMute={onToggleTrackMute}
            onToggleSolo={onToggleSolo}
            onRemove={onRemoveTrack}
            onVolumeChange={onTrackVolumeChange}
            onVolumeCommit={onTrackVolumeCommit}
          />
        ))}

        {[...Array(emptySlots)].map((_, i) => (
          <button
            key={`empty-${i}`}
            type="button"
            onClick={onScrollToLibrary}
            className="bg-[#18181b]/50 border border-white/5 border-dashed rounded-2xl p-5 flex items-center justify-center hover:border-purple-500/50 hover:bg-[#18181b] transition-colors min-h-[140px]"
          >
            <span className="text-white/20 text-sm">Add Sound</span>
          </button>
        ))}
      </div>
    </section>
  );
}
