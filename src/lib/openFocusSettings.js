/** Valid settings modal sidebar panels. */
export const SETTINGS_PANELS = ['composer', 'focusflow', 'integrations'];

export function normalizeSettingsPanel(panel) {
  if (panel === 'focusflow' || panel === 'integrations') return panel;
  return 'composer';
}

/** Open the soundscape / settings modal on a specific panel. */
export function openFocusSettings(panel = 'composer') {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('open-soundscape-composer', {
      detail: { panel: normalizeSettingsPanel(panel) },
    })
  );
}

/** Open settings modal on the Integrations panel. */
export function openIntegrationsSettings() {
  openFocusSettings('integrations');
}
