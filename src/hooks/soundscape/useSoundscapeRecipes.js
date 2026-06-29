'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { DEFAULT_SOUNDSCAPE_RECIPES } from '@/lib/soundscapeConstants';
import { getClerkSupabaseToken } from '@/lib/clerkSupabaseToken';
import {
  getSupabaseClient,
  getUserStorageJson,
  setSupabaseAuthToken,
  setUserStorageJson,
} from '@/utils/userStorage';

function mapSoundscapeRecipeRow(row) {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    sounds: row.sounds || [],
    globalVolume: row.global_volume ?? 75,
    timestamp: new Date(row.updated_at || row.created_at).getTime(),
    isCustom: true,
  };
}

function isLocalSoundscapeRecipeId(id) {
  return typeof id === 'string' && id.startsWith('custom-recipe-');
}

export function useSoundscapeRecipes(userId) {
  const { getToken } = useAuth();
  const [customRecipes, setCustomRecipes] = useState([]);

  useEffect(() => {
    if (!userId || typeof window === 'undefined') return;
    let cancelled = false;

    const loadRecipes = async () => {
      const cached = getUserStorageJson(userId, 'soundscape-custom-recipes', 'soundscape-custom-recipes');
      const cachedRecipes = Array.isArray(cached) ? cached : [];
      if (cachedRecipes.length > 0 && !cancelled) {
        setCustomRecipes(cachedRecipes);
      }

      try {
        const token = await getClerkSupabaseToken(getToken, Boolean(userId));
        if (token) setSupabaseAuthToken(token);
      } catch {
        // keep cached
      }

      const supabase = getSupabaseClient();
      if (!supabase || cancelled) return;

      const { data, error } = await supabase
        .from('soundscape_recipes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (cancelled) return;
      if (error) return;

      const remoteRecipes = (data || []).map(mapSoundscapeRecipeRow);
      if (remoteRecipes.length > 0) {
        setCustomRecipes(remoteRecipes);
        setUserStorageJson(userId, 'soundscape-custom-recipes', remoteRecipes);
      }
    };

    void loadRecipes();
    return () => {
      cancelled = true;
    };
  }, [userId, getToken]);

  const recipes = [...DEFAULT_SOUNDSCAPE_RECIPES, ...customRecipes];

  const appendRecipe = useCallback(
    (recipe) => {
      setCustomRecipes((prev) => {
        const next = [...prev, recipe];
        if (userId) setUserStorageJson(userId, 'soundscape-custom-recipes', next);
        return next;
      });
    },
    [userId]
  );

  const removeRecipe = useCallback(
    async (recipeId) => {
      if (userId && !isLocalSoundscapeRecipeId(recipeId)) {
        try {
          const token = await getClerkSupabaseToken(getToken, Boolean(userId));
          if (token) setSupabaseAuthToken(token);
          const supabase = getSupabaseClient();
          if (supabase) {
            await supabase.from('soundscape_recipes').delete().eq('id', recipeId).eq('user_id', userId);
          }
        } catch {
          // local delete still proceeds
        }
      }
      setCustomRecipes((prev) => {
        const next = prev.filter((r) => r.id !== recipeId);
        if (userId) setUserStorageJson(userId, 'soundscape-custom-recipes', next);
        return next;
      });
    },
    [userId, getToken]
  );

  const saveRecipe = useCallback(
    async (draft) => {
      if (!userId) throw new Error('Sign in required');

      try {
        const token = await getClerkSupabaseToken(getToken, Boolean(userId));
        if (token) setSupabaseAuthToken(token);
      } catch {
        // fall back to local
      }

      const supabase = getSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase
          .from('soundscape_recipes')
          .insert({
            user_id: userId,
            name: draft.name,
            icon: draft.icon,
            sounds: draft.sounds,
            global_volume: draft.globalVolume,
            updated_at: new Date().toISOString(),
          })
          .select('*')
          .maybeSingle();

        if (!error && data) {
          appendRecipe(mapSoundscapeRecipeRow(data));
          return;
        }
      }

      appendRecipe({
        id: `custom-recipe-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: draft.name,
        icon: draft.icon,
        sounds: draft.sounds,
        globalVolume: draft.globalVolume,
        timestamp: Date.now(),
        isCustom: true,
      });
    },
    [userId, getToken, appendRecipe]
  );

  return { recipes, saveRecipe, removeRecipe };
}
