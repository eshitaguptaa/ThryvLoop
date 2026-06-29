'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useUser, useAuth } from '@clerk/nextjs';
import {
  getUserStorageItem,
  getUserStorageJson,
  setUserStorageItem,
  setUserStorageJson,
} from '@/utils/userStorage';
import WorkspaceIntegrations from '@/components/workspace/WorkspaceIntegrations';
import FocusFlowSettingsPanel from '@/components/focus/FocusFlowSettingsPanel';
import SoundscapeComposerPanel from '@/components/soundscape/SoundscapeComposerPanel';
import SoundscapeSliderStyles from '@/components/soundscape/SoundscapeSliderStyles';
import RecipeIcon from '@/components/soundscape/icons/RecipeIcon';
import { useSoundscapeRecipes } from '@/hooks/soundscape/useSoundscapeRecipes';
import { useSoundscapeStore } from '@/stores/soundscapeStore';

function normalizeSettingsPanel(panel) {
  if (panel === 'focusflow' || panel === 'integrations') return panel;
  return 'composer';
}

export default function SoundscapeComposer({
  isOpen,
  onClose,
  initialPanel = 'composer',
  integrationsOAuth = null,
  onIntegrationsOAuthConsumed,
}) {
  const { user } = useUser();
  const { getToken } = useAuth();
  const userId = user?.id || null;

  const getItem = useCallback((key) => getUserStorageItem(userId, key, key), [userId]);
  const getJson = useCallback((key) => getUserStorageJson(userId, key, key), [userId]);
  const setItem = useCallback((key, value) => setUserStorageItem(userId, key, value), [userId]);
  const setJson = useCallback((key, value) => setUserStorageJson(userId, key, value), [userId]);

  const [settingsPanel, setSettingsPanel] = useState(normalizeSettingsPanel(initialPanel));
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [recipeName, setRecipeName] = useState('');
  const [recipeType, setRecipeType] = useState('bolt');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState(null);

  const openSaveTimerRecipeRef = useRef(null);

  const tracks = useSoundscapeStore((s) => s.tracks);
  const sessionPlaying = useSoundscapeStore((s) => s.sessionPlaying);
  const toggleSession = useSoundscapeStore((s) => s.toggleSession);

  const { recipes, saveRecipe, removeRecipe } = useSoundscapeRecipes(userId);

  useEffect(() => {
    if (!isOpen) return;
    setSettingsPanel(normalizeSettingsPanel(initialPanel));
  }, [isOpen, initialPanel]);

  const handleSaveRecipeClick = () => {
    if (settingsPanel === 'focusflow') {
      openSaveTimerRecipeRef.current?.();
      return;
    }
    if (tracks.length === 0) {
      alert('Please add at least one sound before saving a recipe.');
      return;
    }
    setRecipeName('');
    setRecipeType('bolt');
    setShowSaveModal(true);
  };

  const handleConfirmSaveSoundRecipe = async () => {
    const name = recipeName.trim();
    if (!name) {
      alert('Please enter a recipe name.');
      return;
    }
    if (!userId) {
      alert('You must be signed in to save a recipe.');
      return;
    }

    const draft = useSoundscapeStore.getState().getRecipeDraft();
    draft.name = name;
    draft.icon = recipeType;
    draft.globalVolume = useSoundscapeStore.getState().masterVolume;

    if (draft.sounds.filter((s) => s.id !== 'spaces').length === 0) {
      alert('Please add at least one sound before saving a recipe.');
      return;
    }

    const nameExists = recipes.some((r) => r.name.toLowerCase() === name.toLowerCase());
    if (nameExists) {
      alert('A recipe with this name already exists.');
      return;
    }

    try {
      await saveRecipe(draft);
      setShowSaveModal(false);
      setRecipeName('');
      setRecipeType('bolt');
    } catch {
      alert('Could not save recipe. Please try again.');
    }
  };

  const closeSaveModal = () => {
    setShowSaveModal(false);
    setRecipeName('');
    setRecipeType('bolt');
  };

  const layerCount = tracks.length;

  const modalContent = (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 ease-out ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300 ease-out ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      <div
        className={`relative w-full max-w-[1000px] bg-[#0f0f12] rounded-3xl shadow-[0_24px_80px_-24px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.06)] overflow-hidden flex flex-col max-h-[90vh] transition-all duration-300 ease-out ${
          isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
        }`}
      >
        <div className="flex items-center justify-between px-8 py-6 border-b border-white/[0.06]">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Settings</h2>
            <p className="text-white/50 text-sm mt-1">
              {settingsPanel === 'composer'
                ? `Mixing ${layerCount} layers`
                : settingsPanel === 'integrations'
                  ? 'Google Calendar & Gmail'
                  : 'Timer, presets & sound'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {settingsPanel === 'composer' && (
              <button
                type="button"
                onClick={toggleSession}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-[#2d2d36] hover:bg-[#3d3d46] text-white transition-colors"
                title={sessionPlaying ? 'Pause all sounds' : 'Play all sounds'}
              >
                {sessionPlaying ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
            )}
            {settingsPanel !== 'integrations' && (
              <button
                type="button"
                data-save-recipe
                onClick={handleSaveRecipeClick}
                className="px-5 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-sm font-medium rounded-full transition-colors"
              >
                Save Recipe
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-[#2d2d36] hover:bg-white/10 text-white/60 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          <div className="w-[200px] shrink-0 border-r border-white/[0.06] bg-[#0c0c0e]/80 flex flex-col py-5 px-3">
            <div className="text-white/40 text-xs font-medium tracking-wide mb-3 px-3">Panel</div>
            {[
              { id: 'composer', label: 'Composer' },
              { id: 'focusflow', label: 'Focus Flow' },
              { id: 'integrations', label: 'Integrations' },
            ].map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSettingsPanel(id)}
                className={`mb-1.5 px-4 py-3 rounded-xl text-left text-sm font-medium transition-all duration-200 ${
                  settingsPanel === id
                    ? 'bg-[#8b5cf6] text-white shadow-[0_0_16px_rgba(139,92,246,0.25)]'
                    : 'text-white/60 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar min-w-0">
            {settingsPanel === 'focusflow' ? (
              <FocusFlowSettingsPanel
                userId={userId}
                getItem={getItem}
                setItem={setItem}
                setJson={setJson}
                getToken={getToken}
                onRequestSaveTimerRecipe={(openFn) => {
                  openSaveTimerRecipeRef.current = openFn;
                }}
              />
            ) : settingsPanel === 'integrations' ? (
              <div className="p-8 max-w-2xl mx-auto bg-gradient-to-b from-[#0f0f12] via-[#0f0f12] to-[#0a0a0c]">
                <WorkspaceIntegrations
                  embedded
                  oauthConnected={integrationsOAuth?.connected}
                  oauthError={integrationsOAuth?.error}
                  onOAuthNoticeConsumed={onIntegrationsOAuthConsumed}
                />
              </div>
            ) : (
              <SoundscapeComposerPanel />
            )}
          </div>
        </div>

        <div className="px-8 py-4 bg-[#0a0a0c] border-t border-white/5 flex justify-between items-center text-xs text-white/30">
          <div className="flex items-center gap-2">
            {settingsPanel === 'focusflow' ? (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6]" />
                <span>Timer: Paused</span>
              </>
            ) : settingsPanel === 'integrations' ? (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span>Google Workspace</span>
              </>
            ) : (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span>Audio Engine: Ready</span>
                <span className="opacity-50">|</span>
                <span>Sample Rate: 48kHz</span>
              </>
            )}
          </div>
          <div>© 2024 ThryvLoop Productivity Inc.</div>
        </div>
      </div>

      {showSaveModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeSaveModal} />
          <div className="relative bg-[#0f0f12] rounded-2xl border border-white/5 shadow-2xl p-8 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-6">Save Recipe</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Recipe Name</label>
                <input
                  type="text"
                  value={recipeName}
                  onChange={(e) => setRecipeName(e.target.value)}
                  placeholder="e.g., My Focus Mix"
                  className="w-full px-4 py-2.5 bg-[#18181b] border border-white/5 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 transition-colors"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void handleConfirmSaveSoundRecipe();
                    if (e.key === 'Escape') closeSaveModal();
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-3">Recipe Type</label>
                <div className="grid grid-cols-5 gap-3">
                  {['bolt', 'code', 'pen', 'lotus', 'briefcase'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setRecipeType(type)}
                      className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                        recipeType === type
                          ? 'bg-[#8b5cf6]/20 border-[#8b5cf6] text-purple-400'
                          : 'bg-[#18181b] border-white/5 text-white/50 hover:border-white/10 hover:text-white'
                      }`}
                    >
                      <RecipeIcon icon={type} className="w-5 h-5" />
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeSaveModal}
                  className="flex-1 px-4 py-2.5 bg-[#18181b] hover:bg-[#202024] text-white/70 hover:text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleConfirmSaveSoundRecipe()}
                  className="flex-1 px-4 py-2.5 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-lg transition-colors font-medium"
                >
                  Save Recipe
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && recipeToDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => {
              setShowDeleteConfirm(false);
              setRecipeToDelete(null);
            }}
          />
          <div className="relative bg-[#0f0f12] rounded-2xl border border-white/5 shadow-2xl p-8 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-2">Delete Recipe</h3>
            <p className="text-white/60 text-sm mb-6">
              Delete <span className="text-white font-medium">&quot;{recipeToDelete.name}&quot;</span>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setRecipeToDelete(null);
                }}
                className="flex-1 px-4 py-2.5 bg-[#18181b] hover:bg-[#202024] text-white/70 hover:text-white rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  void removeRecipe(recipeToDelete.id);
                  setShowDeleteConfirm(false);
                  setRecipeToDelete(null);
                }}
                className="flex-1 px-4 py-2.5 bg-[#2d2d36] hover:bg-[#3d3d46] text-white rounded-lg transition-colors font-medium border border-white/10"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <SoundscapeSliderStyles />
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
}
