/**
 * Route-level loading UI for B2B workspaces (used by loading.js).
 * Server Component — pure CSS motion, matches workspace shell surfaces.
 */
import Image from 'next/image';

export default function WorkspaceRouteLoading({
  message = 'Loading page',
  variant = 'page',
}) {
  const isFull = variant === 'full';

  return (
    <div
      className={`ws-route-loading ${isFull ? 'ws-route-loading--full' : ''}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={message}
    >
      <div className="ws-route-loading__progress" aria-hidden>
        <span className="ws-route-loading__progress-bar" />
      </div>

      <div className="ws-route-loading__stage">
        <div className="ws-route-loading__mark" aria-hidden>
          <span className="ws-route-loading__ring ws-route-loading__ring--outer" />
          <span className="ws-route-loading__ring ws-route-loading__ring--mid" />
          <span className="ws-route-loading__core">
            <Image
              src="/LandingPageImages/logo.png"
              alt=""
              width={40}
              height={40}
              priority
              className="ws-route-loading__logo"
            />
          </span>
          <span className="ws-route-loading__orbit" />
        </div>

        <p className="ws-route-loading__message">{message}</p>
        <p className="ws-route-loading__hint">Assembling your workspace view</p>
      </div>

      <div className="ws-route-loading__skeleton" aria-hidden>
        <div className="ws-route-loading__skel-header">
          <div className="ws-route-loading__skel-line ws-route-loading__skel-line--eyebrow" />
          <div className="ws-route-loading__skel-line ws-route-loading__skel-line--title" />
          <div className="ws-route-loading__skel-line ws-route-loading__skel-line--desc" />
        </div>

        <div className="ws-route-loading__skel-toolbar">
          <div className="ws-route-loading__skel-chip" />
          <div className="ws-route-loading__skel-chip" />
          <div className="ws-route-loading__skel-chip ws-route-loading__skel-chip--wide" />
        </div>

        <div className="ws-route-loading__skel-grid">
          <div className="ws-route-loading__skel-card ws-route-loading__skel-card--tall" />
          <div className="ws-route-loading__skel-card" />
          <div className="ws-route-loading__skel-card" />
          <div className="ws-route-loading__skel-card ws-route-loading__skel-card--wide" />
        </div>
      </div>
    </div>
  );
}
