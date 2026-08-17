'use client';

import { useOrganizationList } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  deleteWorkspace,
  leaveWorkspace,
  updateWorkspaceSettings,
} from '@/app/(b2b)/o/actions';
import FocusHoursEditor from '@/components/b2b/FocusHoursEditor';
import {
  workspacePanelCool,
  workspacePanelDanger,
  workspacePanelHero,
  workspacePanelRaised,
} from '@/components/b2b/workspaceShellClasses';
import WorkspaceConfirmModal from '@/components/b2b/WorkspaceConfirmModal';
import WorkspaceLogoField from '@/components/b2b/WorkspaceLogoField';
import WorkspacePageHeader from '@/components/b2b/WorkspacePageHeader';
import SettingsSaveToast from '@/components/b2b/SettingsSaveToast';
import { DEFAULT_FOCUS_WINDOWS, parseFocusHours } from '@/lib/orgPulse';

const fieldClass =
  'mt-1.5 w-full rounded-lg border border-border/80 bg-background/90 dark:bg-background/70 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D3FD3]/25 backdrop-blur-sm';

const optionIdle =
  'flex items-start gap-3 rounded-xl border border-border/80 bg-background/50 dark:bg-background/30 p-3.5 cursor-pointer transition-all hover:border-border hover:bg-background/80';
const optionActive =
  'flex items-start gap-3 rounded-xl border border-[#5D3FD3]/40 bg-[rgba(93,63,211,0.08)] dark:bg-[rgba(93,63,211,0.16)] p-3.5 cursor-pointer shadow-[inset_0_0_0_1px_rgba(93,63,211,0.12)] transition-all';

const NAME_DEBOUNCE_MS = 500;
const WINDOWS_DEBOUNCE_MS = 400;

/**
 * @param {{
 *   name: string,
 *   policy: string,
 *   focusEnabled: boolean,
 *   timezone: string,
 *   windows: Array<{ day: number, start: string, end: string }>,
 *   logoFile?: File | null,
 *   removeLogo?: boolean,
 * }} data
 */
function buildSettingsFormData(data) {
  const fd = new FormData();
  fd.set('name', data.name.trim());
  fd.set('insights_policy', data.policy);
  fd.set('focus_enabled', data.focusEnabled ? 'true' : 'false');
  fd.set('focus_timezone', data.timezone || 'UTC');
  fd.set('focus_windows', JSON.stringify(data.windows || []));
  if (data.removeLogo) fd.set('remove_logo', '1');
  if (data.logoFile) fd.set('logo', data.logoFile);
  return fd;
}

export default function OrgSettingsForm({
  orgSlug,
  orgName,
  orgImageUrl = null,
  insightsPolicy,
  focusHours: initialFocus,
  isAdmin,
}) {
  const initial = parseFocusHours(initialFocus);
  const router = useRouter();
  const { setActive } = useOrganizationList();
  const [name, setName] = useState(orgName || '');
  const [policy, setPolicy] = useState(insightsPolicy || 'team_only');
  const [focusEnabled, setFocusEnabled] = useState(Boolean(initial.enabled));
  const [timezone, setTimezone] = useState(initial.timezone || 'UTC');
  const [windows, setWindows] = useState(() => initial.windows ?? []);
  const [displayImageUrl, setDisplayImageUrl] = useState(orgImageUrl);
  const [confirmVariant, setConfirmVariant] = useState(/** @type {null | 'leave' | 'delete'} */ (null));
  const [confirmError, setConfirmError] = useState('');
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved | error
  const [saveError, setSaveError] = useState('');

  const closeConfirm = useCallback(() => {
    if (confirmBusy) return;
    setConfirmVariant(null);
    setConfirmError('');
  }, [confirmBusy]);

  const runConfirm = useCallback(async () => {
    if (!confirmVariant) return;
    setConfirmBusy(true);
    setConfirmError('');
    try {
      const res =
        confirmVariant === 'delete'
          ? await deleteWorkspace(orgSlug)
          : await leaveWorkspace(orgSlug);
      if (res?.error) {
        setConfirmError(res.error);
        setConfirmBusy(false);
        return;
      }
      if (typeof setActive === 'function') {
        void setActive({ organization: null });
      }
      window.location.assign('/o');
    } catch (e) {
      if (e && typeof e === 'object' && 'digest' in e && String(e.digest).startsWith('NEXT_REDIRECT')) {
        window.location.assign('/o');
        return;
      }
      const message = e instanceof Error ? e.message : 'Something went wrong.';
      setConfirmError(message);
      setConfirmBusy(false);
    }
  }, [confirmVariant, orgSlug, setActive]);

  const readyRef = useRef(false);
  const saveGenRef = useRef(0);
  const snapshotRef = useRef({
    name: orgName || '',
    policy: insightsPolicy || 'team_only',
    focusEnabled: Boolean(initial.enabled),
    timezone: initial.timezone || 'UTC',
    windows: initial.windows ?? [],
  });

  useEffect(() => {
    setDisplayImageUrl(orgImageUrl);
  }, [orgImageUrl]);

  useEffect(() => {
    // Skip first paint so mount doesn't POST
    const t = requestAnimationFrame(() => {
      readyRef.current = true;
    });
    return () => cancelAnimationFrame(t);
  }, []);

  const persist = useCallback(
    async (patch = {}) => {
      const next = {
        name: patch.name !== undefined ? patch.name : snapshotRef.current.name,
        policy: patch.policy !== undefined ? patch.policy : snapshotRef.current.policy,
        focusEnabled:
          patch.focusEnabled !== undefined
            ? patch.focusEnabled
            : snapshotRef.current.focusEnabled,
        timezone: patch.timezone !== undefined ? patch.timezone : snapshotRef.current.timezone,
        windows: patch.windows !== undefined ? patch.windows : snapshotRef.current.windows,
        logoFile: patch.logoFile ?? null,
        removeLogo: Boolean(patch.removeLogo),
      };

      if (next.name.trim().length < 2) {
        setSaveStatus('error');
        setSaveError('Name needs at least 2 characters');
        return;
      }

      snapshotRef.current = {
        name: next.name,
        policy: next.policy,
        focusEnabled: next.focusEnabled,
        timezone: next.timezone,
        windows: next.windows,
      };

      const gen = ++saveGenRef.current;
      setSaveStatus('saving');
      setSaveError('');

      try {
        const res = await updateWorkspaceSettings(
          orgSlug,
          null,
          buildSettingsFormData(next)
        );
        if (gen !== saveGenRef.current) return;
        if (res?.error) {
          setSaveStatus('error');
          setSaveError(res.error);
          return;
        }
        setSaveStatus('saved');
        if (patch.removeLogo) setDisplayImageUrl(null);
        // Refresh server props (logo URL, name in chrome, etc.)
        router.refresh();
      } catch (e) {
        if (gen !== saveGenRef.current) return;
        setSaveStatus('error');
        setSaveError(e instanceof Error ? e.message : 'Could not save');
      }
    },
    [orgSlug, router]
  );

  // Debounced name
  useEffect(() => {
    if (!readyRef.current) return;
    if (name.trim() === snapshotRef.current.name.trim()) return;
    if (name.trim().length < 2) return;
    const t = setTimeout(() => {
      void persist({ name });
    }, NAME_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [name, persist]);

  // Debounced windows (time picks fire often)
  useEffect(() => {
    if (!readyRef.current) return;
    const prev = JSON.stringify(snapshotRef.current.windows);
    const next = JSON.stringify(windows);
    if (prev === next) return;
    const t = setTimeout(() => {
      void persist({ windows });
    }, WINDOWS_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [windows, persist]);

  const setPolicyAndSave = (next) => {
    setPolicy(next);
    void persist({ policy: next });
  };


  const setTimezoneAndSave = (next) => {
    setTimezone(next);
    void persist({ timezone: next });
  };

  const onWindowsChange = (next) => {
    setWindows(next);
  };

  const handleFocusEnabled = (next) => {
    setFocusEnabled(next);
    if (next && windows.length === 0) {
      const seed = DEFAULT_FOCUS_WINDOWS.map((w) => ({ ...w }));
      setWindows(seed);
      void persist({ focusEnabled: next, windows: seed });
      return;
    }
    void persist({ focusEnabled: next });
  };

  if (!isAdmin) {
    return (
      <div className="w-full min-w-0 space-y-6">
        <WorkspacePageHeader
          eyebrow="Settings"
          title="Workspace"
          description="Team policies and account options for this workspace."
        />

        <section className={`${workspacePanelDanger} p-5 sm:p-6 w-full`}>
          <h2 className="text-sm font-semibold text-foreground mb-1">Leave workspace</h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-2xl">
            You will lose access to shared work for <strong>{orgName}</strong>.
          </p>
          <button
            type="button"
            disabled={confirmBusy}
            onClick={() => {
              setConfirmError('');
              setConfirmVariant('leave');
            }}
            className="rounded-lg border border-rose-300/80 text-rose-700 dark:text-rose-300 px-4 py-2 text-sm font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/40"
          >
            Leave workspace
          </button>
        </section>

        <WorkspaceConfirmModal
          open={confirmVariant === 'leave'}
          variant="leave"
          workspaceName={orgName || orgSlug}
          busy={confirmBusy}
          error={confirmError}
          onCancel={closeConfirm}
          onConfirm={runConfirm}
        />
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-6 sm:space-y-7">
      <SettingsSaveToast status={saveStatus} message={saveError} />

      <WorkspacePageHeader
        eyebrow="Settings"
        title="Workspace"
        description={`Name, logo, transparency, and focus hours for ${orgName}.`}
      />

      <div className="w-full space-y-5 sm:space-y-6">
        <section className={`${workspacePanelHero} p-5 sm:p-6 lg:p-8 w-full`}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5D3FD3] dark:text-indigo-300 mb-1.5">
            Identity
          </p>
          <h2 className="text-base sm:text-lg font-semibold text-foreground mb-4 tracking-tight">
            General
          </h2>
          <div className="space-y-5">
            <WorkspaceLogoField
              nameHint={name}
              currentImageUrl={displayImageUrl}
              allowRemove
              onLogoFile={(file) => {
                void persist({ logoFile: file });
              }}
              onLogoRemove={() => {
                setDisplayImageUrl(null);
                void persist({ removeLogo: true });
              }}
            />
            <div>
              <label
                htmlFor="ws-name"
                className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Workspace name
              </label>
              <input
                id="ws-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                minLength={2}
                className={fieldClass}
              />
            </div>
          </div>
        </section>

        <div
          role="group"
          aria-labelledby="ws-transparency-heading"
          className={`${workspacePanelCool} p-5 sm:p-6 lg:p-7 w-full min-w-0`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-700 dark:text-sky-300 mb-1.5">
            Visibility
          </p>
          <h2 id="ws-transparency-heading" className="text-base font-semibold text-foreground">
            Transparency
          </h2>
          <p className="text-xs text-muted-foreground mb-4 mt-1 leading-relaxed">
            Team Insights (velocity + leaderboard) is always visible to every member. This setting
            only controls personal report deep-dives. Team is notified on change.
          </p>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setPolicyAndSave('team_only')}
              className={`text-left ${policy === 'team_only' ? optionActive : optionIdle}`}
            >
              <span className="mt-1 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border border-current">
                {policy === 'team_only' ? (
                  <span className="h-2 w-2 rounded-full bg-[#5D3FD3]" />
                ) : null}
              </span>
              <span>
                <span className="block text-sm font-semibold text-foreground">
                  Team analytics only
                </span>
                <span className="text-xs text-muted-foreground leading-relaxed">
                  Everyone sees Insights ranks and velocity. Admins cannot open full personal analytics for others.
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setPolicyAndSave('full_individual')}
              className={`text-left ${policy === 'full_individual' ? optionActive : optionIdle}`}
            >
              <span className="mt-1 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border border-current">
                {policy === 'full_individual' ? (
                  <span className="h-2 w-2 rounded-full bg-[#5D3FD3]" />
                ) : null}
              </span>
              <span>
                <span className="block text-sm font-semibold text-foreground">
                  Full individual transparency
                </span>
                <span className="text-xs text-muted-foreground leading-relaxed">
                  Same team Insights board, plus admins can open members&apos; personal reports (not other admins). Members can only open their own.
                </span>
              </span>
            </button>
          </div>
        </div>

        <div
          role="group"
          aria-labelledby="ws-focus-hours-heading"
          className={`${workspacePanelRaised} p-5 sm:p-6 lg:p-7 w-full min-w-0`}
        >
          <FocusHoursEditor
            enabled={focusEnabled}
            onEnabledChange={handleFocusEnabled}
            timezone={timezone}
            onTimezoneChange={setTimezoneAndSave}
            windows={windows}
            onWindowsChange={onWindowsChange}
          />
        </div>
      </div>

      <section className={`${workspacePanelDanger} p-5 sm:p-6 w-full`}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-rose-600 dark:text-rose-400 mb-1.5">
          Irreversible
        </p>
        <h2 className="text-base font-semibold text-foreground mb-1">Danger zone</h2>
        <p className="text-xs text-muted-foreground mb-4 leading-relaxed max-w-2xl">
          Leaving removes your access. Deleting removes the workspace for everyone.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={confirmBusy}
            onClick={() => {
              setConfirmError('');
              setConfirmVariant('leave');
            }}
            className="rounded-lg border border-border bg-background/60 px-4 py-2 text-sm font-semibold hover:bg-muted"
          >
            Leave workspace
          </button>
          <button
            type="button"
            disabled={confirmBusy}
            onClick={() => {
              setConfirmError('');
              setConfirmVariant('delete');
            }}
            className="rounded-lg border border-rose-300 text-rose-700 dark:text-rose-300 dark:border-rose-500/40 px-4 py-2 text-sm font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/40"
          >
            Delete workspace
          </button>
        </div>
      </section>

      <WorkspaceConfirmModal
        open={confirmVariant === 'leave' || confirmVariant === 'delete'}
        variant={confirmVariant === 'delete' ? 'delete' : 'leave'}
        workspaceName={name.trim() || orgName || orgSlug}
        busy={confirmBusy}
        error={confirmError}
        onCancel={closeConfirm}
        onConfirm={runConfirm}
      />
    </div>
  );
}
