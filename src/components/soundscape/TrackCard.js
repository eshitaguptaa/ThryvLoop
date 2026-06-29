'use client';

import VolumeSlider from '@/components/soundscape/VolumeSlider';
import SoundIcon from '@/components/soundscape/icons/SoundIcon';

export default function TrackCard({
  track,
  soloTrackId,
  sessionPlaying,
  onTogglePlay,
  onToggleMute,
  onToggleSolo,
  onRemove,
  onVolumeChange,
  onVolumeCommit,
}) {
  const isSolo = soloTrackId === track.id;
  const isMuted = track.volume === 0;
  const isLoading = track.loadState === 'loading';
  const hasError = track.loadState === 'error';

  return (
    <div className="bg-[#18181b] border border-white/5 rounded-2xl p-5 relative group">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <div className="text-purple-500 shrink-0">
            <SoundIcon soundId={track.id} className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-white font-medium text-sm block truncate">{track.name}</span>
            {isLoading && <span className="text-white/40 text-xs">Loading…</span>}
            {hasError && <span className="text-orange-400 text-xs">Failed to load</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onTogglePlay(track.id)}
            className={`transition-colors ${
              track.playing && sessionPlaying
                ? 'text-purple-400'
                : 'text-white/20 hover:text-purple-400'
            }`}
            title={track.playing && sessionPlaying ? 'Pause track' : 'Play track'}
          >
            {track.playing && sessionPlaying ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={() => onToggleMute(track.id)}
            className={`transition-colors ${isMuted ? 'text-orange-400' : 'text-white/20 hover:text-purple-400'}`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5.586 15H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15.536 8.464a5 5 0 0 1 0 7.072m2.828-9.9a9 9 0 0 1 0 12.728M5.586 15H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={() => onToggleSolo(track.id)}
            className={`transition-colors ${isSolo ? 'text-purple-400' : 'text-white/20 hover:text-purple-400'}`}
            title={isSolo ? 'Disable solo' : 'Solo this track'}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 14v-4a7 7 0 0 1 7-7h4a7 7 0 0 1 7 7v4" />
              <path d="M9 18v2a3 3 0 0 0 6 0v-2" />
              <path d="M5 18h14" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onRemove(track.id)}
            className="text-white/20 hover:text-orange-400 transition-colors"
            title="Remove sound"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <VolumeSlider
          value={track.volume}
          onChange={(v) => onVolumeChange(track.id, v)}
          onCommit={() => onVolumeCommit(track.id)}
          className="flex-1 h-1.5 bg-[#2d2d36] rounded-full"
        />
        <span className="text-white/40 text-xs w-6 text-right">{track.volume}%</span>
      </div>
    </div>
  );
}
