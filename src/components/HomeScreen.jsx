import React, { useState } from 'react';
import { Heart } from 'lucide-react';

const STORAGE_KEY = 'favorite_calculators';

const KALKULATORY = [
  {
    id: 'piekarski',
    name: 'Piekarski Master',
    description: 'Receptury piekarskie i zakwasy',
    active: true,
    type: 'internal',
    banner: '/banner_piekarz.png',
    logo: '/logo_piekarz.png',
    buttonColor: '#DC2626',
  },
  {
    id: 'masarski',
    name: 'Masarski Master',
    description: 'Receptury mięsne i wędliniarskie',
    active: true,
    type: 'external',
    url: 'https://masarz.ebra.pl',
    banner: '/masarz-banner.jpg',
    logo: '/logo_masarz.svg',
    buttonColor: '#DC2626',
  },
  {
    id: 'nalewki',
    name: 'Mistrz Nalewek',
    description: 'Receptury nalewek i nastawów',
    active: false,
    banner: '/nalewki.png',
  },
  {
    id: 'techniczny',
    name: 'Kalkulator Techniczny',
    description: 'Obliczenia technologiczne',
    active: false,
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--text-dim)]">
        <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18"/>
      </svg>
    ),
  },
  {
    id: 'autoserwis',
    name: 'Auto Serwis',
    description: 'Kalkulator serwisowy',
    active: false,
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--text-dim)]">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3 0 2.12 2.12 0 0 1 0-3l6.91-6.91a6 6 0 0 1 7.94-7.94L14.7 6.3z"/>
      </svg>
    ),
  },
];

const HomeScreen = ({ setActiveTab }) => {
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
  });
  const [toast, setToast] = useState(false);

  const toggleFavorite = (id, e) => {
    e.stopPropagation();
    const updated = favorites.includes(id)
      ? favorites.filter(f => f !== id)
      : [...favorites, id];
    setFavorites(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleCardClick = (calc) => {
    if (!calc.active) {
      setToast(true);
      setTimeout(() => setToast(false), 2500);
      return;
    }
    if (calc.type === 'external') {
      window.open(calc.url, '_blank', 'noopener,noreferrer');
    } else {
      setActiveTab('recipes');
    }
  };

  const sorted = [...KALKULATORY].sort((a, b) => {
    const aFav = favorites.includes(a.id) ? 0 : 1;
    const bFav = favorites.includes(b.id) ? 0 : 1;
    return aFav - bFav;
  });

  return (
    <div className="p-5 pt-6">
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[var(--bg-input)] text-[var(--text)] text-xs font-bold px-5 py-2.5 rounded-full shadow-lg tracking-wider pointer-events-none">
          Wkrótce dostępne
        </div>
      )}

      <div className="flex justify-center mb-5">
        <img src="/logo_piekarz.png" alt="Piekarski Master" className="h-16 w-auto drop-shadow" />
      </div>

      <h2 className="text-3xl font-black uppercase italic tracking-tighter text-[var(--text)] leading-none mb-2">Kalkulatory</h2>
      <p className="text-sm text-[var(--text-dim)] font-medium mb-6">Wybierz kalkulator, aby rozpocząć pracę</p>

      <div className="flex flex-col gap-4">
        {sorted.map(calc => {
          const isFav = favorites.includes(calc.id);
          return (
            <div key={calc.id} className="relative">
              <button
                onClick={() => handleCardClick(calc)}
                className={`w-full text-left bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border)] overflow-hidden transition-all ${
                  calc.active ? 'shadow-xl hover:shadow-2xl group' : 'opacity-60'
                }`}
              >
                {calc.banner ? (
                  <div className="relative w-full overflow-hidden" style={{ height: '200px' }}>
                    <img
                      src={calc.banner}
                      alt={calc.name}
                      className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ${calc.active ? 'group-hover:scale-105' : 'grayscale'}`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent" />
                    {calc.logo && (
                      <div className="absolute top-4 left-0 right-0 flex justify-center z-10">
                        <img src={calc.logo} alt="Logo" className="h-12 w-auto drop-shadow" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex flex-col justify-center px-7 gap-1">
                      <p className="text-2xl font-black uppercase italic tracking-tighter text-white leading-none drop-shadow">
                        {calc.name}
                      </p>
                      <p className="text-sm text-slate-300 font-medium">{calc.description}</p>
                      <span
                        className="mt-3 self-start text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-wider text-white"
                        style={{ backgroundColor: calc.active ? calc.buttonColor : 'var(--bg-input)', color: calc.active ? '#fff' : 'var(--text-dim)' }}
                      >
                        {calc.active ? 'Otwórz' : 'Wkrótce'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="h-28 bg-[var(--bg)] flex items-center justify-center grayscale">
                      {calc.icon}
                    </div>
                    <div className="p-6 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="text-xl font-black uppercase italic tracking-tighter text-[var(--text)]">{calc.name}</h3>
                        <p className="text-xs text-[var(--text-dim)] font-medium mt-1">{calc.description}</p>
                      </div>
                      <span className="shrink-0 text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-wider bg-[var(--bg-input)] text-[var(--text-dim)]">
                        Wkrótce
                      </span>
                    </div>
                  </>
                )}
              </button>

              <button
                onClick={(e) => toggleFavorite(calc.id, e)}
                aria-label={isFav ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
                className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-[var(--bg-card)]/90 backdrop-blur-sm shadow-md transition-transform active:scale-90 hover:scale-110"
              >
                <Heart
                  size={18}
                  strokeWidth={2}
                  fill={isFav ? '#DC2626' : 'none'}
                  stroke={isFav ? '#DC2626' : 'var(--text-dim)'}
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
