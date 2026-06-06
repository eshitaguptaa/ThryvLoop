/** Focus Spaces — ambient background catalog (YouTube 4K study/work videos). */

export const SPACES_CATEGORIES = [
  { id: 'all', name: 'All', icon: null },
  { id: 'nature', name: 'Nature', icon: '🏔️' },
  { id: 'cafe', name: 'Cafe', icon: '☕' },
  { id: 'urban', name: 'Urban', icon: '🪟' },
  { id: 'floral', name: 'Floral', icon: '🌸' },
  { id: 'vintage', name: 'Vintage', icon: '📷' },
];

export const SPACES_CATALOG = [
  {
    id: 1,
    name: 'Peaceful World Landscapes',
    image: 'https://img.youtube.com/vi/lIU4vtkLnDc/maxresdefault.jpg',
    videoId: 'lIU4vtkLnDc',
    badge: '4K ULTRA HD',
    category: 'nature',
  },
  {
    id: 2,
    name: 'Moraine Lake Relaxation',
    image: 'https://img.youtube.com/vi/Se5NjX-cM5I/maxresdefault.jpg',
    videoId: 'Se5NjX-cM5I',
    badge: '4K ULTRA HD',
    category: 'nature',
  },
  {
    id: 3,
    name: 'Tropical Waterfall',
    image: 'https://img.youtube.com/vi/JdlTsEoJtLA/maxresdefault.jpg',
    videoId: 'JdlTsEoJtLA',
    badge: '4K HDR',
    category: 'nature',
  },
  {
    id: 4,
    name: 'Clearwater Mountain Lake',
    image: 'https://img.youtube.com/vi/80tY1jKlH9o/maxresdefault.jpg',
    videoId: '80tY1jKlH9o',
    badge: '4K ULTRA HD',
    category: 'nature',
  },
  {
    id: 5,
    name: 'Forest Rain Ambience',
    image: 'https://img.youtube.com/vi/mpRv4Ar-TTI/maxresdefault.jpg',
    videoId: 'mpRv4Ar-TTI',
    badge: '4K ULTRA HD',
    category: 'nature',
  },
  {
    id: 6,
    name: 'Ocean Waves',
    image: 'https://img.youtube.com/vi/y6ZavlQ1w4o/maxresdefault.jpg',
    videoId: 'y6ZavlQ1w4o',
    badge: '4K ULTRA HD',
    category: 'nature',
  },
  {
    id: 7,
    name: 'Amsterdam Canal Cafe',
    image: 'https://img.youtube.com/vi/FWtf1pHBsZQ/maxresdefault.jpg',
    videoId: 'FWtf1pHBsZQ',
    badge: '4K ULTRA HD',
    category: 'cafe',
  },
  {
    id: 8,
    name: 'Rainy Cozy Coffee Shop',
    image: 'https://img.youtube.com/vi/kjnBNkUE5IY/maxresdefault.jpg',
    videoId: 'kjnBNkUE5IY',
    badge: '4K ULTRA HD',
    category: 'cafe',
  },
  {
    id: 9,
    name: 'Tokyo Ghibli Vibes Cafe',
    image: 'https://img.youtube.com/vi/_MBnoMojjE4/maxresdefault.jpg',
    videoId: '_MBnoMojjE4',
    badge: '4K ULTRA HD',
    category: 'cafe',
  },
  {
    id: 10,
    name: 'Parisian Cafe Autumn',
    image: 'https://img.youtube.com/vi/vb9z91KsxFE/maxresdefault.jpg',
    videoId: 'vb9z91KsxFE',
    badge: '4K ULTRA HD',
    category: 'cafe',
  },
  {
    id: 11,
    name: 'Tokyo Ginza Night Walk',
    image: 'https://img.youtube.com/vi/xvwfZAwJqHA/maxresdefault.jpg',
    videoId: 'xvwfZAwJqHA',
    badge: '4K HDR',
    category: 'urban',
  },
  {
    id: 12,
    name: 'New York City Night',
    image: 'https://img.youtube.com/vi/23uRPFhhwNU/maxresdefault.jpg',
    videoId: '23uRPFhhwNU',
    badge: '4K HDR',
    category: 'urban',
  },
  {
    id: 13,
    name: 'Cherry Blossoms',
    image: 'https://img.youtube.com/vi/Q4MIOG1BpU0/maxresdefault.jpg',
    videoId: 'Q4MIOG1BpU0',
    badge: '4K HDR',
    category: 'floral',
  },
  {
    id: 14,
    name: 'Spring Garden & Birds',
    image: 'https://img.youtube.com/vi/dYfMj1SjzRc/maxresdefault.jpg',
    videoId: 'dYfMj1SjzRc',
    badge: '4K HDR',
    category: 'floral',
  },
  {
    id: 15,
    name: 'Vintage Room Oldies',
    image: 'https://img.youtube.com/vi/WinMvfKVUx0/maxresdefault.jpg',
    videoId: 'WinMvfKVUx0',
    badge: 'COZY',
    category: 'vintage',
  },
];

export function filterSpacesByCategory(categoryId) {
  if (categoryId === 'all') return SPACES_CATALOG;
  return SPACES_CATALOG.filter((space) => space.category === categoryId);
}
