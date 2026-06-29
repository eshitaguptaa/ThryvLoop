'use client';

import RecipeIcon from '@/components/soundscape/icons/RecipeIcon';

export default function FocusRecipes({ recipes, activeTrackIds, spacesActive, onSelect, onDelete }) {
  const isRecipeActive = (recipe) => {
    const recipeSoundIds = recipe.sounds
      .filter((s) => s.id !== 'spaces')
      .map((s) => s.id)
      .sort();
    const activeIds = [...activeTrackIds].sort();
    if (recipeSoundIds.length !== activeIds.length) return false;
    if (!recipeSoundIds.every((id, i) => id === activeIds[i])) return false;
    const recipeHasSpaces = recipe.sounds.some((s) => s.id === 'spaces');
    return recipeHasSpaces ? spacesActive : !spacesActive;
  };

  return (
    <section>
      <h3 className="text-lg font-medium text-white mb-4">Focus Recipes</h3>
      <div className="flex gap-3 flex-wrap">
        {recipes.map((recipe) => {
          const isActive = isRecipeActive(recipe);
          return (
            <div key={recipe.id} className="relative group">
              <button
                type="button"
                onClick={() => onSelect(recipe)}
                className={`
                  px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 transition-all relative
                  ${
                    isActive
                      ? 'bg-[#5b21b6] text-white border border-[#7c3aed]'
                      : 'bg-[#18181b] border border-white/5 text-white/50 hover:bg-[#202024] hover:text-white'
                  }
                `}
              >
                <RecipeIcon icon={recipe.icon} className={`w-4 h-4 ${isActive ? 'text-[#a78bfa]' : ''}`} />
                {recipe.name}
              </button>
              {recipe.isCustom && (
                <button
                  type="button"
                  onClick={(e) => onDelete(recipe.id, e)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-[#2d2d36] hover:bg-[#3d3d46] border border-white/10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete recipe"
                >
                  <svg className="w-3 h-3 text-white/60 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
