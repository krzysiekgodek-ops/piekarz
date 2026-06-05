import React from 'react';
import DOMPurify from 'dompurify';
import { Plus, Lightbulb } from 'lucide-react';

const stripHtml = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
};

const TipsList = ({ tips = [], userProfile, onSelectTip, onAddTip }) => {
  return (
    <div>
      {/* Nagłówek sekcji */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tighter text-[var(--text)] leading-none">
            Porady
          </h2>
          <p className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-widest mt-0.5">
            Wiedza piekarska
          </p>
        </div>
        {userProfile?.isAdmin && (
          <button
            onClick={onAddTip}
            className="flex items-center gap-2 px-4 py-2.5 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"
            style={{ background: '#c8860a', boxShadow: '0 4px 14px rgba(200,134,10,0.3)' }}
          >
            <Plus size={14} /> Dodaj
          </button>
        )}
      </div>

      {/* Lista porad */}
      {tips.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-8 gap-4">
          <div className="w-16 h-16 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] flex items-center justify-center">
            <Lightbulb size={28} className="text-[var(--text-dim)]" />
          </div>
          <p className="text-[var(--text-dim)] text-sm font-bold text-center">
            Brak porad. Wróć wkrótce!
          </p>
        </div>
      ) : (
        <div className="px-4 pb-6 flex flex-col gap-3">
          {tips.map(tip => {
            const preview = stripHtml(tip.content).slice(0, 120);
            return (
              <button
                key={tip.id}
                onClick={() => onSelectTip(tip)}
                className="w-full text-left bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden active:scale-[0.99] transition-transform"
              >
                <div className="flex gap-0">
                  {/* Zdjęcie — opcjonalne, po lewej */}
                  {tip.imageUrl && (
                    <div className="w-28 flex-none">
                      <img
                        src={tip.imageUrl}
                        alt={tip.title}
                        className="w-full h-full object-cover"
                        style={{ minHeight: '90px', maxHeight: '110px' }}
                      />
                    </div>
                  )}

                  {/* Treść */}
                  <div className={`flex-1 p-3.5 ${!tip.imageUrl ? 'pl-4' : ''}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Lightbulb size={11} style={{ color: '#c8860a' }} className="flex-none" />
                      <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#c8860a' }}>
                        Porada
                      </span>
                    </div>
                    <p className="font-black text-[var(--text)] text-sm leading-tight line-clamp-2 mb-1">
                      {tip.title}
                    </p>
                    {preview && (
                      <p className="text-[11px] text-[var(--text-dim)] font-medium leading-snug line-clamp-2">
                        {preview}…
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TipsList;
