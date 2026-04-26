import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import AdBanner from './AdBanner';
import SourdoughGuide from './SourdoughGuide';

const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[var(--text-dim)] flex-none">
    <path d="m9 18 6-6-6-6" />
  </svg>
);

const RecipeList = ({
  recipes,
  categories,
  ads,
  user,
  userProfile,
  favoriteIds     = [],
  onSelectRecipe,
  onToggleFavorite,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('Wszystkie');

  const isZakwasy = selectedCategory === 'Zakwasy';

  const filtered = (Array.isArray(recipes) ? recipes : Object.values(recipes)).filter(
    r => selectedCategory === 'Wszystkie' || r.category === selectedCategory
  );

  return (
    <div>
      <AdBanner ads={ads} calculatorId="piekarz" />

      <div className="flex gap-2 px-4 pt-4 pb-2 overflow-x-auto scrollbar-hide">
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
        <div className="px-4 pb-4 grid grid-cols-2 gap-2">
          {filtered.map(r => {
            const isFav = favoriteIds.includes(r.id);
            return (
              <div
                key={r.id}
                className="relative bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden"
              >
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

                <button
                  onClick={() => onSelectRecipe?.(r)}
                  className="flex flex-col w-full text-left active:scale-[0.98] transition-transform"
                >
                  <div className="w-full aspect-square border-b border-[var(--border)] overflow-hidden">
                    {r.imageUrl
                      ? <img
                          src={r.imageUrl}
                          className="w-full h-full object-cover"
                          alt={r.name}
                          onError={e => { e.currentTarget.src = '/piekarz-banner.jpg'; }}
                        />
                      : <img src="/piekarz-banner.jpg" className="w-full h-full object-cover" alt="pieczywo" />
                    }
                  </div>
                  <div className="p-2.5">
                    {r.ownerId === 'ADMIN' && (
                      <span className="text-[8px] font-black bg-amber-900/20 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-full uppercase inline-block mb-1">
                        ⭐ Wzorzec
                      </span>
                    )}
                    <p className="font-black text-[var(--text)] text-xs leading-tight line-clamp-2">{r.name}</p>
                    <p className="text-[9px] font-bold text-[var(--text-dim)] uppercase tracking-wider mt-0.5">{r.category}</p>
                  </div>
                </button>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="col-span-2 text-center text-[var(--text-dim)] text-sm font-bold py-16">
              Brak receptur w tej kategorii
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecipeList;
