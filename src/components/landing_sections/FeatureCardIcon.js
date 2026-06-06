const MaterialSymbol = ({ icon, className = '', fill = 0 }) => (
  <span
    className={`material-symbols-outlined ${className}`}
    style={{
      fontVariationSettings: `'FILL' ${fill}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
    }}
  >
    {icon}
  </span>
);

const TONES = {
  purple: 'bg-purple-50 text-purple-700 border border-purple-100/80',
  blue: 'bg-sky-50 text-sky-700 border border-sky-100/80',
  violet: 'bg-violet-50 text-violet-700 border border-violet-100/80',
  brand: 'bg-[#5D3FD3]/10 text-[#5D3FD3] border border-[#5D3FD3]/15',
  amber: 'bg-amber-50 text-amber-800 border border-amber-100/80',
  indigo: 'bg-indigo-50 text-indigo-700 border border-indigo-100/80',
  dark: 'bg-white/10 text-white border border-white/15',
};

/**
 * Consistent feature-card icon — Material Symbol in a flat tint chip (no emoji).
 */
export default function FeatureCardIcon({
  icon,
  tone = 'purple',
  size = 'md',
  className = '',
  fill = 0,
}) {
  const sizeClass = size === 'sm' ? 'h-9 w-9' : 'h-10 w-10';
  const iconClass = size === 'sm' ? 'text-[20px]' : 'text-[22px]';

  return (
    <div
      className={`inline-flex shrink-0 items-center justify-center rounded-lg ${sizeClass} ${TONES[tone] ?? TONES.purple} ${className}`}
    >
      <MaterialSymbol icon={icon} className={iconClass} fill={fill} />
    </div>
  );
}
