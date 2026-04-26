import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { ChevronDown, ChevronUp, Droplets, Clock, Thermometer } from 'lucide-react';

const SourdoughGuide = () => {
  const [sourdoughs, setSourdoughs] = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'piekarz_sourdough'), snap => {
      setSourdoughs(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    });
    return unsub;
  }, []);

  if (sourdoughs.length === 0) {
    return (
      <div className="px-4 py-10 text-center">
        <div className="text-5xl mb-4">🌾</div>
        <p className="font-bold text-[var(--text-dim)] text-sm uppercase tracking-widest">
          Brak przewodników zakwasów
        </p>
        <p className="text-xs text-[var(--text-dim)] mt-2">Admin wkrótce doda przepisy na zakwasy</p>
      </div>
    );
  }

  return (
    <div className="px-4 pb-6 space-y-4">
      <div className="pt-4 pb-2">
        <h3 className="text-xl font-black uppercase italic tracking-tighter text-[var(--text)]">Zakwasy</h3>
        <p className="text-xs text-[var(--text-dim)] font-medium mt-1">Przewodniki hodowania zakwasów</p>
      </div>

      {sourdoughs.map(s => (
        <div key={s.id} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[2rem] overflow-hidden">
          {s.imageUrl && (
            <div className="w-full overflow-hidden" style={{ height: '160px' }}>
              <img src={s.imageUrl} alt={s.name} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-black text-[var(--text)] text-lg leading-tight">{s.name}</h4>
                {s.flourType && (
                  <p className="text-[10px] font-black uppercase tracking-widest mt-1" style={{ color: '#c8860a' }}>
                    {s.flourType}
                  </p>
                )}
              </div>
              <button
                onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                className="p-2 rounded-xl bg-[var(--bg-input)] text-[var(--text-dim)] hover:text-[var(--text)] transition-colors shrink-0"
              >
                {expanded === s.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>

            {/* Parametry zakwasu */}
            <div className="flex gap-3 mt-4 flex-wrap">
              {s.hydration != null && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-input)] rounded-xl">
                  <Droplets size={12} style={{ color: '#c8860a' }} />
                  <span className="text-[10px] font-black text-[var(--text)] uppercase">Hydracja: {s.hydration}%</span>
                </div>
              )}
              {s.feedingRatio && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-input)] rounded-xl">
                  <span className="text-[10px] font-black text-[var(--text)] uppercase">Dokarmianie: {s.feedingRatio}</span>
                </div>
              )}
              {s.feedingSchedule && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-input)] rounded-xl">
                  <Clock size={12} className="text-[var(--text-dim)]" />
                  <span className="text-[10px] font-black text-[var(--text)] uppercase">{s.feedingSchedule}</span>
                </div>
              )}
            </div>

            {/* Opis */}
            {s.description && (
              <p className="text-sm text-[var(--text-dim)] mt-3 leading-relaxed">{s.description}</p>
            )}

            {/* Etapy — rozwijane */}
            {expanded === s.id && s.stages?.length > 0 && (
              <div className="mt-5 space-y-3">
                <p className="text-[9px] font-black text-[var(--text-dim)] uppercase tracking-widest">Etapy hodowania</p>
                {s.stages.map((stage, i) => (
                  <div key={i} className="p-4 bg-[var(--bg)] border border-[var(--border)] rounded-2xl">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-black shrink-0"
                        style={{ background: '#c8860a' }}
                      >
                        {stage.day ?? i + 1}
                      </div>
                      <span className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-wide">
                        Dzień {stage.day ?? i + 1}
                      </span>
                      {stage.temp != null && (
                        <div className="flex items-center gap-1 ml-auto text-[10px] text-[var(--text-dim)] font-bold">
                          <Thermometer size={11} />
                          {stage.temp}°C
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-[var(--text)] leading-relaxed pl-10">{stage.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SourdoughGuide;
