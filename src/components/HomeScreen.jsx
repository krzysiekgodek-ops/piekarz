import React, { useState } from 'react';
import { Heart } from 'lucide-react';

const STORAGE_KEY = 'favorite_calculators';

const CALCULATORS = [
  {
    id: 'piekarski',
    name: 'Piekarski Mistrz',
    description: 'Kalkulator procentów piekarskich',
    banner: '/piekarz_baner.png',
    logo: '/piekarz_logo.png',
  },
  {
    id: 'masarski',
    name: 'Masarski Master',
    description: 'Kalkulator receptur wędlin i mięs',
    banner: '/masarz_banner.jpg',
    logo: '/masarz_logo.png',
    url: 'https://www.masarz.ebra.pl',
  },
  {
    id: 'nalewki',
    name: 'Nalewkarz Master',
    description: 'Receptury nalewek i nastawów',
    banner: '/nalewki_baner.png',
    logo: '/nalewki_logo.jpg',
    url: 'https://www.nalewki.ebra.pl',
  },
];

const HomeScreen = ({ setActiveTab }) => {
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
  });

  const toggleFavorite = (id, e) => {
    e.stopPropagation();
    const updated = favorites.includes(id)
      ? favorites.filter(f => f !== id)
      : [...favorites, id];
    setFavorites(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleCardClick = (calc) => {
    if (calc.url) {
      window.open(calc.url, '_blank');
    } else {
      setActiveTab('calculator');
    }
  };

  const sorted = [...CALCULATORS].sort((a, b) => {
    const aFav = favorites.includes(a.id) ? 0 : 1;
    const bFav = favorites.includes(b.id) ? 0 : 1;
    return aFav - bFav;
  });

  return (
    <div className="p-5 pt-6">
      <h2 className="text-3xl font-black uppercase italic tracking-tighter text-[var(--text)] leading-none mb-2">Kalkulatory</h2>
      <p className="text-sm text-[var(--text-dim)] font-medium mb-6">Wybierz kalkulator, aby rozpocząć pracę</p>

      <div className="flex flex-col gap-4">
        {sorted.map(calc => {
          const isFav = favorites.includes(calc.id);
          return (
            <div
              key={calc.id}
              className="relative overflow-hidden rounded-2xl cursor-pointer group hover:shadow-lg transition-shadow"
              style={{ border: '1px solid var(--border)' }}
              onClick={() => handleCardClick(calc)}
            >
              <div className="relative h-36 overflow-hidden">
                <img
                  src={calc.banner}
                  alt={calc.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center gap-3">
                <img src={calc.logo} alt="" className="h-10 w-10 object-contain" />
                <div>
                  <div className="text-white font-bold text-sm">{calc.name}</div>
                  <div className="text-white/70 text-xs">{calc.description}</div>
                </div>
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium">
                  Aktywny
                </span>
              </div>
              <button
                onClick={(e) => toggleFavorite(calc.id, e)}
                aria-label={isFav ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
                className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm transition-transform active:scale-90 hover:scale-110"
              >
                <Heart
                  size={18}
                  strokeWidth={2}
                  fill={isFav ? '#c8860a' : 'none'}
                  stroke={isFav ? '#c8860a' : 'white'}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HomeScreen;
