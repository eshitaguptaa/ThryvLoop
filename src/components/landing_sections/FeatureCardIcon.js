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
  purple: 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-100/80 dark:border-purple-800/50',
  blue: 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-100/80 dark:border-sky-800/50',
  violet: 'bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border border-violet-100/80 dark:border-violet-800/50',
  brand: 'bg-[#5D3FD3]/10 text-[#5D3FD3] border border-[#5D3FD3]/15',
  amber: 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-100/80 dark:border-amber-800/50',
  indigo: 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-100/80 dark:border-indigo-800/50',
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
