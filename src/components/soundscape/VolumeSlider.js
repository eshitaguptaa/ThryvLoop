'use client';

export default function VolumeSlider({
  value,
  onChange,
  onCommit,
  className = 'flex-1 h-1.5',
  gradientClass = 'slider-purple',
}) {
  return (
    <input
      type="range"
      min="0"
      max="100"
      value={value}
      onChange={(e) => onChange?.(parseInt(e.target.value, 10))}
      onPointerUp={() => onCommit?.(value)}
      onPointerCancel={() => onCommit?.(value)}
      className={`${className} bg-white/10 rounded-full appearance-none cursor-pointer ${gradientClass}`}
      style={{
        background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${value}%, rgba(255,255,255,0.1) ${value}%, rgba(255,255,255,0.1) 100%)`,
      }}
    />
  );
}
