import React, { useState } from 'react';
import { Heart, Lock } from 'lucide-react';
import AdBanner from './AdBanner';
import SourdoughGuide from './SourdoughGuide';

const RecipeList = ({
  recipes,
  categories,
  ads,
  user,
  userProfile,
  favoriteIds      = [],
  onSelectRecipe,
  onToggleFavorite,
  onShowRegisterPrompt,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('Wszystkie');

  const isZakwasy = selectedCategory === 'Zakwasy';

  const filtered = (Array.isArray(recipes) ? recipes : Object.values(recipes)).filter(
    r => selectedCategory === 'Wszystkie' || r.category === selectedCategory
  );

  const handleCardClick = (r) => {
    if (!user && !r.isPublic) {
      onShowRegisterPrompt?.();
      return;
    }
    onSelectRecipe?.(r);
  };

  return (
    <div>
      <AdBanner ads={ads} calculatorId="piekarz" />

      <div className="flex flex-wrap gap-2 px-4 pt-4 pb-2">
        {['Wszystkie', ...categories].map(c => (
          <button
            key={c}
            onClick={() => setSelectedCategory(c)}
            className={`flex-none px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-wide whitespace-nowrap transition-all ${
              selectedCategory === c
                ? 'text-white shadow-md'
                : 'bg-[var(--bg-card)] text-[var(--text-dim)] border border-[var(--border)]'
            }`}
            style={selectedCategory === c ? { background: '#c8860a' } : {}}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Zakwasy — osobny przewodnik */}
      {isZakwasy ? (
        <SourdoughGuide />
      ) : (
        <div className="px-4 pb-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {filtered.map(r => {
            const isFav = favoriteIds.includes(r.id);
            const isLocked = !user && !r.isPublic;

            return (
              <div
                key={r.id}
                className="relative bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden"
              >
                {/* Serduszko — ukryte dla zablokowanych */}
                {!isLocked && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(r.id); }}
                    className="absolute top-2 right-2 z-10 p-1.5 rounded-xl transition-all"
                    aria-label={isFav ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
                  >
                    <Heart
                      size={16}
                      strokeWidth={2}
                      style={isFav ? { color: '#c8860a' } : { color: 'var(--text-dim)' }}
                      fill={isFav ? '#c8860a' : 'none'}
                    />
                  </button>
                )}

                <button
                  onClick={() => handleCardClick(r)}
                  className="flex flex-col w-full text-left active:scale-[0.98] transition-transform"
                >
                  <div className="w-full aspect-square border-b border-[var(--border)] overflow-hidden relative">
                    {r.imageUrl
                      ? <img
                          src={r.imageUrl}
                          className={`w-full h-full object-cover transition-all ${isLocked ? 'opacity-40 blur-[1px]' : ''}`}
                          alt={r.name}
                          onError={e => { e.currentTarget.src = '/piekarz-banner.jpg'; }}
                        />
                      : <img
                          src="/piekarz-banner.jpg"
                          className={`w-full h-full object-cover transition-all ${isLocked ? 'opacity-40 blur-[1px]' : ''}`}
                          alt="pieczywo"
                        />
                    }

                    {/* Nakładka kłódki */}
                    {isLocked && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-[var(--bg-card)]/80 backdrop-blur-sm rounded-2xl p-3 border border-[var(--border)]">
                          <Lock size={22} className="text-[var(--text-dim)]" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-2.5">
                    {r.ownerId === 'ADMIN' && (
                      <span className="text-[8px] font-black bg-amber-900/20 text-blue-900 dark:text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-full uppercase inline-block mb-1">
                        ⭐ Wzorzec
                      </span>
                    )}
                    <p className={`font-black text-xs leading-tight line-clamp-2 ${isLocked ? 'text-[var(--text-dim)]' : 'text-[var(--text)]'}`}>
                      {r.name}
                    </p>
                    <p className="text-[9px] font-bold text-[var(--text-dim)] uppercase tracking-wider mt-0.5">{r.category}</p>
                    {isLocked && (
                      <p className="text-[8px] font-black uppercase tracking-wide mt-1" style={{ color: '#c8860a' }}>
                        Zaloguj się
                      </p>
                    )}
                  </div>
                </button>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="col-span-4 text-center text-[var(--text-dim)] text-sm font-bold py-16">
              Brak receptur w tej kategorii
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecipeList;
