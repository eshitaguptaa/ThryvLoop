export const SOUNDSCAPE_SOUND_FILES = {
  rain: '/sounds/rain.mp3',
  binaural: '/sounds/binaural.mp3',
  lofi: '/sounds/lofi.mp3',
  fire: '/sounds/fire.mp3',
  forest: '/sounds/forest.mp3',
  synthwave: '/sounds/synthwave.mp3',
  waterfall: '/sounds/waterfall.mp3',
};

export const SOUNDSCAPE_SOUND_NAMES = {
  rain: 'Heavy Rain',
  binaural: 'Binaural (40Hz)',
  lofi: 'Chill Lo-Fi',
  fire: 'Fire Crackle',
  forest: 'Forest',
  synthwave: 'Synthwave',
  waterfall: 'Waterfall',
};

/** @param {string} soundId */
export function getSoundscapeSoundName(soundId) {
  return SOUNDSCAPE_SOUND_NAMES[soundId] || soundId;
}
