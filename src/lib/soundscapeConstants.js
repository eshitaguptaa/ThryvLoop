const atm = (file) => `/sounds/atmosphere/${encodeURIComponent(file)}`;
const neu = (file) => `/sounds/neural/${encodeURIComponent(file)}`;
const rhy = (file) => `/sounds/rythm/${encodeURIComponent(file)}`;

/** Ordered by likely user preference within each category (favourites first). */
export const SOUNDSCAPE_LIBRARY = {
  Atmosphere: [
    { id: 'heavy-rain', name: 'Heavy Rain', description: 'Deep • Immersive', icon: 'rain' },
    { id: 'cafe-ambience', name: 'Café Ambience', description: 'Warm • Social', icon: 'cafe' },
    { id: 'light-rain', name: 'Light Rain', description: 'Soft • Gentle', icon: 'rain' },
    { id: 'forest', name: 'Forest', description: 'Nature • Calm', icon: 'forest' },
    { id: 'ocean-waves', name: 'Ocean Waves', description: 'Rhythmic • Coastal', icon: 'ocean' },
    { id: 'office-ambience', name: 'Office Ambience', description: 'Work • Neutral', icon: 'office' },
    { id: 'waterfall', name: 'Waterfall', description: 'Flowing • Peaceful', icon: 'waterfall' },
    { id: 'fire', name: 'Fire Crackle', description: 'Cozy • Interior', icon: 'fire' },
    { id: 'thunderstorm', name: 'Thunderstorm', description: 'Dramatic • Intense', icon: 'thunder' },
    { id: 'breeze', name: 'Breeze', description: 'Airy • Subtle', icon: 'breeze' },
  ],
  Neural: [
    { id: 'gamma-40hz', name: 'Gamma 40Hz', description: 'Deep Focus', icon: 'neural' },
    { id: 'beta-18hz-study', name: 'Beta 18Hz', description: 'Study Focus', icon: 'neural' },
    { id: 'smr-14hz-flow', name: 'SMR 14Hz', description: 'Flow State', icon: 'neural' },
    { id: 'beta-20hz-peak', name: 'Beta 20Hz', description: 'Peak Productivity', icon: 'neural' },
    { id: 'beta-16hz-attention', name: 'Beta 16Hz', description: 'Attention Boost', icon: 'neural' },
    { id: 'alpha-10hz-creative', name: 'Alpha 10Hz', description: 'Creative Thinking', icon: 'neural' },
    { id: 'beta-15hz-cognitive', name: 'Beta 15Hz', description: 'Cognitive Boost', icon: 'neural' },
    { id: 'alpha-8hz-calm', name: 'Alpha 8Hz', description: 'Calm Focus', icon: 'neural' },
  ],
  Rhythm: [
    { id: 'lofi', name: 'Chill Lo-Fi', description: 'Relax • Study', icon: 'lofi' },
    { id: 'piano-motivation', name: 'Piano Motivation', description: 'Uplifting • Focus', icon: 'piano' },
    { id: 'productivity-01', name: 'Productivity Mix', description: 'Energetic • Drive', icon: 'lofi' },
    { id: 'synthwave', name: 'Synthwave', description: 'Retro • Vibes', icon: 'synthwave' },
    { id: 'jazz', name: 'Jazz', description: 'Smooth • Groove', icon: 'jazz' },
    { id: 'ambient-space', name: 'Ambient Space', description: 'Atmospheric • Float', icon: 'ambient' },
    { id: 'productivity-02', name: 'Productivity Flow', description: 'Steady • Momentum', icon: 'lofi' },
    { id: 'cinematic-classical', name: 'Cinematic Classical', description: 'Epic • Inspiring', icon: 'classical' },
  ],
};

export const SOUNDSCAPE_SOUND_FILES = {
  'heavy-rain': atm('Heavy Rain.mp3'),
  'light-rain': atm('Light rain.mp3'),
  thunderstorm: atm('thunderstorm.mp3'),
  'ocean-waves': atm('ocean waves.mp3'),
  waterfall: atm('waterfall.mp3'),
  forest: atm('forest.mp3'),
  fire: atm('fire.mp3'),
  breeze: atm('breeze.mp3'),
  'cafe-ambience': atm('cafe ambience.mp3'),
  'office-ambience': atm('office ambience.mp3'),

  'gamma-40hz': neu('gamma, 40hz, deep focus.mp3'),
  'beta-16hz-attention': neu('beta, 16hz, attention boost.mp3'),
  'beta-15hz-cognitive': neu('beta, 15hz, Cognitive Boostwav.mp3'),
  'beta-18hz-study': neu('beta, 18hz, study focus.mp3'),
  'beta-20hz-peak': neu('high beta, 20hz, peak productivity.mp3'),
  'smr-14hz-flow': neu('SMR (Sensorimotor Rhythm), 14hz, flow state.mp3'),
  'alpha-10hz-creative': neu('Alpha, 10hz, Creative Thinking.mp3'),
  'alpha-8hz-calm': neu('Alpha, 8hz, Calm Focus.mp3'),

  lofi: rhy('lofi.mp3'),
  'piano-motivation': rhy('piano motivation.mp3'),
  'productivity-01': rhy('productivity-01.mp3'),
  synthwave: rhy('synthwave.mp3'),
  jazz: rhy('jazz.mp3'),
  'ambient-space': rhy('Abient space.mp3'),
  'productivity-02': rhy('productivity-02.mp3'),
  'cinematic-classical': rhy('cinematic-classical-vibes.mp3'),

  // Legacy IDs — keep saved mixes working
  rain: atm('Heavy Rain.mp3'),
  binaural: neu('gamma, 40hz, deep focus.mp3'),
};

export const LEGACY_SOUND_ID_MAP = {
  rain: 'heavy-rain',
  binaural: 'gamma-40hz',
};

export const DEFAULT_BOOTSTRAP_SOUNDS = [
  { id: 'heavy-rain', name: 'Heavy Rain', volume: 60, category: 'Atmosphere' },
  { id: 'gamma-40hz', name: 'Gamma 40Hz', volume: 50, category: 'Neural' },
  { id: 'forest', name: 'Forest', volume: 30, category: 'Atmosphere' },
];

export const DEFAULT_SOUNDSCAPE_RECIPES = [
  {
    id: 'deep-dive',
    name: 'Deep Dive',
    icon: 'bolt',
    sounds: [
      { id: 'heavy-rain', volume: 60, category: 'Atmosphere' },
      { id: 'gamma-40hz', volume: 50, category: 'Neural' },
      { id: 'forest', volume: 30, category: 'Atmosphere' },
    ],
  },
  {
    id: 'code-flow',
    name: 'Code Flow',
    icon: 'code',
    sounds: [
      { id: 'lofi', volume: 55, category: 'Rhythm' },
      { id: 'beta-18hz-study', volume: 45, category: 'Neural' },
      { id: 'cafe-ambience', volume: 35, category: 'Atmosphere' },
    ],
  },
  {
    id: 'creative-spark',
    name: 'Creative Spark',
    icon: 'pen',
    sounds: [
      { id: 'synthwave', volume: 50, category: 'Rhythm' },
      { id: 'alpha-10hz-creative', volume: 40, category: 'Neural' },
      { id: 'fire', volume: 30, category: 'Atmosphere' },
    ],
  },
  {
    id: 'zen-zone',
    name: 'Zen Zone',
    icon: 'lotus',
    sounds: [
      { id: 'waterfall', volume: 50, category: 'Atmosphere' },
      { id: 'forest', volume: 40, category: 'Atmosphere' },
      { id: 'alpha-8hz-calm', volume: 35, category: 'Neural' },
    ],
  },
  {
    id: 'office-privacy',
    name: 'Office Privacy',
    icon: 'briefcase',
    sounds: [
      { id: 'office-ambience', volume: 45, category: 'Atmosphere' },
      { id: 'light-rain', volume: 40, category: 'Atmosphere' },
      { id: 'smr-14hz-flow', volume: 30, category: 'Neural' },
    ],
  },
];

const soundNameEntries = Object.values(SOUNDSCAPE_LIBRARY).flatMap((sounds) =>
  sounds.map((sound) => [sound.id, sound.name])
);

export const SOUNDSCAPE_SOUND_NAMES = Object.fromEntries([
  ...soundNameEntries,
  ['rain', 'Heavy Rain'],
  ['binaural', 'Gamma 40Hz'],
  ['spaces', 'Spaces'],
]);

const soundIconEntries = Object.values(SOUNDSCAPE_LIBRARY).flatMap((sounds) =>
  sounds.map((sound) => [sound.id, sound.icon])
);

export const SOUNDSCAPE_SOUND_ICONS = Object.fromEntries([
  ...soundIconEntries,
  ['rain', 'rain'],
  ['binaural', 'neural'],
  ['spaces', 'spaces'],
]);

/** @param {string} soundId */
export function normalizeSoundscapeSoundId(soundId) {
  return LEGACY_SOUND_ID_MAP[soundId] || soundId;
}

/** @param {string} soundId */
export function getSoundscapeSoundName(soundId) {
  const normalized = normalizeSoundscapeSoundId(soundId);
  return SOUNDSCAPE_SOUND_NAMES[normalized] || SOUNDSCAPE_SOUND_NAMES[soundId] || soundId;
}

/** @param {string} soundId */
export function getSoundscapeSoundIcon(soundId) {
  const normalized = normalizeSoundscapeSoundId(soundId);
  return SOUNDSCAPE_SOUND_ICONS[normalized] || SOUNDSCAPE_SOUND_ICONS[soundId] || 'neural';
}

/** Categories where only one sound may be in the mix at a time. */
export const SINGLE_INSTANCE_SOUND_CATEGORIES = ['Neural', 'Rhythm'];

/** Keep only the last sound per single-instance category (e.g. one Neural, one Rhythm). */
export function enforceSingleInstanceCategories(sounds) {
  if (!Array.isArray(sounds) || sounds.length === 0) return sounds;
  const lastIndexByCategory = new Map();
  sounds.forEach((sound, index) => {
    if (SINGLE_INSTANCE_SOUND_CATEGORIES.includes(sound.category)) {
      lastIndexByCategory.set(sound.category, index);
    }
  });
  return sounds.filter((sound, index) => {
    if (!SINGLE_INSTANCE_SOUND_CATEGORIES.includes(sound.category)) return true;
    return lastIndexByCategory.get(sound.category) === index;
  });
}

/** @param {{ id?: string, name?: string, volume?: number, category?: string } | null | undefined} sound */
export function normalizeActiveSound(sound) {
  if (!sound?.id) return null;
  const id = normalizeSoundscapeSoundId(sound.id);
  if (!SOUNDSCAPE_SOUND_FILES[id]) return null;
  const category =
    sound.category ||
    Object.entries(SOUNDSCAPE_LIBRARY).find(([, sounds]) => sounds.some((s) => s.id === id))?.[0] ||
    'Atmosphere';
  return {
    id,
    name: getSoundscapeSoundName(id),
    volume: sound.volume ?? 50,
    category,
  };
}
