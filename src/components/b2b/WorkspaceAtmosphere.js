/**
 * Ambient backdrop for B2B workspaces.
 * Light: quiet neutral dots only (no color washes).
 * Dark: soft color orbs + dots.
 */
export default function WorkspaceAtmosphere({ variant = 'org' }) {
  const isDirectory = variant === 'directory';

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      {/* Light: subtle paper grain / soft top wash only */}
      <div className="absolute inset-0 bg-[#f4f6f9] dark:bg-transparent" />
      <div
        className={[
          'absolute inset-0 dark:hidden',
          '[background-image:radial-gradient(circle_at_center,rgba(15,23,42,0.055)_1px,transparent_1px)]',
          '[background-size:20px_20px]',
        ].join(' ')}
      />

      {/* Dark only: color atmosphere */}
      <div
        className={[
          'absolute inset-0 hidden dark:block',
          isDirectory
            ? 'bg-[radial-gradient(ellipse_90%_70%_at_50%_-10%,rgba(93,63,211,0.22),transparent_55%),radial-gradient(ellipse_60%_45%_at_100%_20%,rgba(56,189,248,0.1),transparent_50%),radial-gradient(ellipse_50%_40%_at_0%_80%,rgba(45,212,191,0.08),transparent_45%)]'
            : 'bg-[radial-gradient(ellipse_80%_55%_at_80%_-5%,rgba(93,63,211,0.2),transparent_50%),radial-gradient(ellipse_55%_40%_at_5%_30%,rgba(56,189,248,0.08),transparent_45%),radial-gradient(ellipse_40%_30%_at_90%_70%,rgba(45,212,191,0.06),transparent_40%)]',
        ].join(' ')}
      />
      <div
        className={`ws-orb absolute -top-24 right-[-8%] h-[28rem] w-[28rem] rounded-full blur-3xl hidden dark:block ${
          isDirectory ? 'bg-[rgba(93,63,211,0.25)]' : 'bg-[rgba(93,63,211,0.18)]'
        }`}
      />
      <div
        className={`ws-orb absolute bottom-[-10%] left-[-6%] h-[22rem] w-[22rem] rounded-full blur-3xl hidden dark:block [animation-delay:-6s] ${
          isDirectory ? 'bg-[rgba(56,189,248,0.12)]' : 'bg-[rgba(45,212,191,0.08)]'
        }`}
      />
      <div
        className={[
          'absolute inset-0 hidden dark:block opacity-50',
          '[background-image:radial-gradient(circle_at_center,rgba(148,163,184,0.14)_1px,transparent_1px)]',
          '[background-size:22px_22px]',
          '[mask-image:radial-gradient(ellipse_85%_75%_at_50%_40%,black_20%,transparent_85%)]',
        ].join(' ')}
      />
      <div className="absolute inset-0 hidden dark:block bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.35)_100%)]" />
    </div>
  );
}
