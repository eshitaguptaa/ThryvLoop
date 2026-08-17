'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AppWindow,
  BellRing,
  Clock,
  Keyboard,
  MonitorSmartphone,
  MousePointer2,
  Pause,
  Play,
  ShieldCheck,
  Volume2,
  X,
  Zap,
} from 'lucide-react';
import { isSystemIdleDetectionSupported } from '@/lib/systemActivity';

/**
 * Focusing consent — comparison layout, no scroll on a normal viewport.
 */
export default function FocusSessionConsentModal({
  open,
  busy = false,
  onClose,
  onAllowAndStart,
  onStartWithoutActivity,
}) {
  const systemSupported = isSystemIdleDetectionSupported();

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape' && !busy) onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busy, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[220] flex items-center justify-center p-3 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button
            type="button"
            aria-label="Dismiss"
            disabled={busy}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={() => {
              if (!busy) onClose?.();
            }}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="focus-consent-title"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.99 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className="relative w-full max-w-[44rem] overflow-hidden rounded-[1.6rem] border border-white/12 bg-slate-950 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.85)]"
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: systemSupported
                  ? 'radial-gradient(ellipse 70% 45% at 12% 0%, rgba(52,211,153,0.18), transparent 52%), radial-gradient(ellipse 50% 40% at 100% 0%, rgba(80,67,243,0.14), transparent 48%), linear-gradient(165deg, #0d1524 0%, #070a12 100%)'
                  : 'radial-gradient(ellipse 70% 45% at 12% 0%, rgba(56,189,248,0.16), transparent 52%), radial-gradient(ellipse 50% 40% at 100% 0%, rgba(80,67,243,0.14), transparent 48%), linear-gradient(165deg, #0d1524 0%, #070a12 100%)',
              }}
              aria-hidden
            />

            <div className="relative px-5 py-5 sm:px-7 sm:py-6">
              <Header
                systemSupported={systemSupported}
                busy={busy}
                onClose={onClose}
              />

              {systemSupported ? (
                <ChromiumBody
                  busy={busy}
                  onAllowAndStart={onAllowAndStart}
                  onStartWithoutActivity={onStartWithoutActivity}
                />
              ) : (
                <FallbackBody busy={busy} onStartWithoutActivity={onStartWithoutActivity} />
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function Header({ systemSupported, busy, onClose }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <Image
          src="/LandingPageImages/logo.png"
          alt=""
          width={36}
          height={36}
          className="h-9 w-9 shrink-0 rounded-xl object-contain"
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight text-white">ThryvLoop</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full border border-white/12 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55">
              Focus session
            </span>
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                systemSupported
                  ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200/90'
                  : 'border-sky-400/25 bg-sky-400/10 text-sky-200/90'
              }`}
            >
              {systemSupported ? 'Chrome / Edge' : 'Safari / Firefox'}
            </span>
          </div>
        </div>
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={onClose}
        className="cursor-pointer rounded-xl p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}

function Spec({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-black/25 text-current">
        <Icon className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
      </span>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">{label}</p>
        <p className="mt-0.5 text-[13px] font-medium text-white/90">{value}</p>
      </div>
    </div>
  );
}

function RuleChip({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-white/50">
      {children}
    </span>
  );
}

function ChromiumBody({ busy, onAllowAndStart, onStartWithoutActivity }) {
  return (
    <>
      <h2
        id="focus-consent-title"
        className="mt-4 text-[1.35rem] font-semibold leading-tight tracking-tight text-white sm:text-[1.5rem]"
      >
        How should Focusing track your time?
      </h2>
      <p className="mt-1.5 text-[13px] text-white/50">
        Two ways to stay honest. Change later by toggling Focusing off, then on.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => void onAllowAndStart?.()}
          className={[
            'flex min-w-0 cursor-pointer flex-col rounded-2xl border border-emerald-400/40 bg-emerald-400/[0.11] p-3.5 text-left sm:p-4',
            'shadow-[0_0_0_1px_rgba(52,211,153,0.08),0_12px_32px_-16px_rgba(52,211,153,0.45)]',
            'transition hover:border-emerald-300/55 hover:bg-emerald-400/[0.16] active:scale-[0.99]',
            'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60',
          ].join(' ')}
        >
          <span className="flex items-start justify-between gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400 text-slate-950">
              <Zap className="h-5 w-5" strokeWidth={2.5} aria-hidden />
            </span>
            <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-200">
              Recommended
            </span>
          </span>
          <span className="mt-3 text-[15px] font-semibold tracking-tight text-white sm:text-base">
            Activity detection
          </span>
          <span className="mt-0.5 text-[12px] text-emerald-200/70">Watches real computer idle</span>

          <div className="mt-3.5 space-y-2.5 text-emerald-100/80">
            <Spec icon={MonitorSmartphone} label="Other apps" value="Keeps running" />
            <Spec icon={Pause} label="Pauses" value="~10 min computer idle" />
            <Spec icon={Play} label="Resumes" value="When you move" />
            <Spec icon={ShieldCheck} label="Permission" value="Browser asks once" />
          </div>

          <span className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-emerald-400 text-[13px] font-semibold text-slate-950">
            {busy ? 'Starting…' : 'Allow activity & start'}
          </span>
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={() => void onStartWithoutActivity?.()}
          className={[
            'flex min-w-0 cursor-pointer flex-col rounded-2xl border border-white/14 bg-white/[0.04] p-3.5 text-left sm:p-4',
            'transition hover:border-white/22 hover:bg-white/[0.07] active:scale-[0.99]',
            'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60',
          ].join(' ')}
        >
          <span className="flex items-start justify-between gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/12 bg-white/5 text-sky-300">
              <BellRing className="h-5 w-5" strokeWidth={2.25} aria-hidden />
            </span>
            <span className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">
              Fallback
            </span>
          </span>
          <span className="mt-3 text-[15px] font-semibold tracking-tight text-white sm:text-base">
            Check-ins instead
          </span>
          <span className="mt-0.5 text-[12px] text-white/40">No idle permission needed</span>

          <div className="mt-3.5 space-y-2.5 text-sky-100/70">
            <Spec icon={MonitorSmartphone} label="Other apps" value="Keeps running" />
            <Spec icon={Volume2} label="Check-in" value="Sound every 12–22 min" />
            <Spec icon={Clock} label="Reply" value="2 min, or it pauses" />
            <Spec icon={AppWindow} label="This window" value="~10 min idle pauses" />
          </div>

          <span className="mt-4 inline-flex h-10 items-center justify-center rounded-xl border border-white/14 bg-white/8 text-[13px] font-semibold text-white/85">
            {busy ? 'Starting…' : 'Start without detection'}
          </span>
        </button>
      </div>

      <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
        <RuleChip>Only Active time counts</RuleChip>
        <RuleChip>Away never counts</RuleChip>
        <RuleChip>Manual Away never auto-resumes</RuleChip>
        <RuleChip>Notices stay in ThryvLoop</RuleChip>
      </div>
    </>
  );
}

function FlowStep({ n, label }) {
  return (
    <li className="flex min-w-0 flex-1 flex-col items-center text-center">
      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-sky-400/30 bg-sky-400/15 text-[11px] font-bold text-sky-200">
        {n}
      </span>
      <span className="mt-1.5 text-[12px] font-medium leading-snug text-white/80">{label}</span>
    </li>
  );
}

function FallbackBody({ busy, onStartWithoutActivity }) {
  return (
    <>
      <h2
        id="focus-consent-title"
        className="mt-4 text-[1.35rem] font-semibold leading-tight tracking-tight text-white sm:text-[1.5rem]"
      >
        How Focusing will track your time
      </h2>
      <p className="mt-1.5 text-[13px] text-white/50">
        Safari and Firefox can&apos;t detect computer idle. Check-ins keep the clock honest.
      </p>

      <ol className="relative mt-4 grid grid-cols-4 gap-1 rounded-2xl border border-white/10 bg-white/[0.04] px-2 py-3.5 sm:px-3">
        <span
          className="pointer-events-none absolute left-[12%] right-[12%] top-[1.7rem] h-px bg-gradient-to-r from-sky-400/0 via-sky-400/35 to-sky-400/0"
          aria-hidden
        />
        <FlowStep n="1" label="Work in any app" />
        <FlowStep n="2" label="Ping every 12–22 min" />
        <FlowStep n="3" label="Confirm within 2 min" />
        <FlowStep n="4" label="Miss it → pause" />
      </ol>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
          <Spec icon={Clock} label="What counts" value="Active time only — Away never" />
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
          <Spec icon={Keyboard} label="This window idle" value="Pauses after ~10 min" />
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
          <Spec icon={MousePointer2} label="You set Away" value="Stays off until you start" />
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
          <Spec icon={BellRing} label="Notices" value="Sound + toast, in ThryvLoop" />
        </div>
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={() => void onStartWithoutActivity?.()}
        className={[
          'mt-3.5 inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-xl',
          'bg-emerald-400 text-[15px] font-semibold text-slate-950',
          'shadow-[0_14px_32px_-12px_rgba(52,211,153,0.5)]',
          'transition hover:bg-emerald-300 active:scale-[0.99]',
          'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60',
        ].join(' ')}
      >
        {busy ? 'Starting…' : 'Start Focusing'}
      </button>
    </>
  );
}
