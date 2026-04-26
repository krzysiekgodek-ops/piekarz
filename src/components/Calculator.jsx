import React, { useState, useMemo } from 'react';
import { ArrowLeft, Hash, Droplets, Thermometer, BookOpen, Edit3, Printer, ChevronDown, ChevronUp } from 'lucide-react';

const ACCENT = '#c8860a';

const Calculator = ({ user, userProfile, recipe, totalTarget, setTotalTarget, onBack, onEditRecipe }) => {
  const [stagesOpen, setStagesOpen] = useState(true);

  const flourKg = totalTarget;

  const calculations = useMemo(() => {
    if (!recipe) return { flours: [], ingredients: [], totalFlourPercent: 0 };

    // Baza obliczeniowa: łączna ilość mąki podana przez użytkownika
    // Wzór: składnik_g = (procent / 100) * suma_mąki_g
    const totalFlourG = flourKg * 1000;

    const flours = (recipe.flours || []).map(f => ({
      ...f,
      grams: Math.round((Number(f.percent ?? 0) / 100) * totalFlourG),
    }));

    const totalFlourPercent = flours.reduce((acc, f) => acc + Number(f.percent ?? 0), 0);

    const ingredients = (recipe.ingredients || []).map(ing => ({
      ...ing,
      grams: Math.round((Number(ing.percent ?? 0) / 100) * totalFlourG),
    }));

    // Weryfikacja w konsoli (Problem 4)
    console.group(`[Kalkulator] ${recipe.name} — mąka: ${flourKg} kg (${totalFlourG} g)`);
    ingredients.forEach(ing => {
      console.log(`  ${ing.name}: ${ing.percent}% × ${totalFlourG}g = ${ing.grams} ${ing.unit || 'g'}`);
    });
    console.groupEnd();

    return { flours, ingredients, totalFlourPercent };
  }, [recipe, flourKg]);

  if (!recipe) {
    return (
      <div className="flex items-center justify-center py-24 px-8">
        <p className="text-[var(--text-dim)] font-bold text-sm text-center">
          Wybierz recepturę z zakładki Receptury
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="no-print">

        {/* Nagłówek */}
        <div className="bg-[var(--bg)] px-4 pt-4 pb-5">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-[var(--text-dim)] text-[11px] font-black uppercase tracking-wider mb-4"
          >
            <ArrowLeft size={14} /> Wróć
          </button>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: ACCENT }}>
                {recipe.category}
              </span>
              <h2 className="text-3xl font-black uppercase text-[var(--text)] leading-tight mt-1 break-words">
                {recipe.name}
              </h2>
            </div>
            {recipe.imageUrl && (
              <div className="w-20 h-20 rounded-2xl overflow-hidden flex-none border-2 border-[var(--border)] shadow-xl">
                <img src={recipe.imageUrl} alt={recipe.name} className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </div>

        {/* Ilość mąki */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] mx-4 mt-4 rounded-3xl p-6 shadow-xl">
          <p className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest text-center mb-1">
            Ilość mąki (kg)
          </p>
          <input
            type="number"
            min="0.1"
            max="100"
            step="0.1"
            value={totalTarget}
            onChange={e => setTotalTarget(Math.min(100, Math.max(0.1, Number(e.target.value))))}
            className="text-7xl font-black w-full text-center bg-transparent outline-none text-[var(--text)] tabular-nums"
          />
          <input
            type="range"
            min="0.1"
            max="20"
            step="0.1"
            value={totalTarget}
            onChange={e => setTotalTarget(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none mt-4 bg-[var(--border)]"
            style={{ accentColor: ACCENT }}
          />
          <div className="flex justify-between text-[10px] font-bold text-[var(--text-dim)] mt-1.5">
            <span>0.1 kg</span>
            <span>20 kg</span>
          </div>
        </div>

        {/* Mąka */}
        {calculations.flours.length > 0 && (
          <div className="px-4 mt-6">
            <h3 className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest mb-3 flex items-center gap-2">
              <Hash size={12} /> Mąka (baza 100%)
            </h3>
            <div className="space-y-2">
              {calculations.flours.map((f, i) => (
                <div key={i} className="flex justify-between items-center p-4 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)]">
                  <div>
                    <p className="font-black text-[var(--text)] text-sm">{f.name}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wide mt-0.5" style={{ color: ACCENT }}>
                      {f.percent}% mąki
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-[var(--text)] tabular-nums">{f.grams}</span>
                    <span className="text-xs text-[var(--text-dim)] font-bold ml-1">g</span>
                  </div>
                </div>
              ))}
              {/* Suma mąki */}
              <div className="flex justify-between items-center px-4 py-2">
                <span className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest">Suma mąki</span>
                <span className="font-black text-[var(--text)] tabular-nums">
                  {Math.round(flourKg * 1000)} g
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Składniki */}
        {calculations.ingredients.length > 0 && (
          <div className="px-4 mt-6">
            <h3 className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest mb-3 flex items-center gap-2">
              <Droplets size={12} /> Składniki
            </h3>
            <div className="space-y-2">
              {calculations.ingredients.map((ing, i) => (
                <div key={i} className="flex justify-between items-center p-4 bg-[var(--bg-input)] rounded-2xl relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: ACCENT }} />
                  <div className="pl-3">
                    <p className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest">{ing.name}</p>
                    <p className="text-2xl font-black text-[var(--text)] tabular-nums leading-tight">
                      {ing.grams}
                      <span className="text-xs text-[var(--text-dim)] font-black ml-1">{ing.unit || 'g'}</span>
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-[var(--text-dim)] uppercase">{ing.percent}% mąki</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Temperatura wody */}
        {recipe.waterTemp != null && (
          <div className="px-4 mt-4">
            <div className="flex items-center justify-between p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl">
              <div className="flex items-center gap-2">
                <Thermometer size={16} style={{ color: ACCENT }} />
                <span className="text-sm font-black text-[var(--text)] uppercase tracking-wide">Temperatura wody</span>
              </div>
              <span className="text-2xl font-black text-[var(--text)] tabular-nums">{recipe.waterTemp}°C</span>
            </div>
          </div>
        )}

        {/* Etapy produkcji */}
        {recipe.stages?.length > 0 && (
          <div className="px-4 mt-6">
            <button
              onClick={() => setStagesOpen(o => !o)}
              className="w-full flex items-center justify-between text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest mb-3"
            >
              <span className="flex items-center gap-2">
                <BookOpen size={12} /> Etapy produkcji
              </span>
              {stagesOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {stagesOpen && (
              <div className="space-y-3">
                {recipe.stages.map((stage, i) => (
                  <div key={i} className="p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-black shrink-0"
                        style={{ background: ACCENT }}
                      >
                        {i + 1}
                      </div>
                      <p className="font-black text-[var(--text)] text-sm flex-1">{stage.name}</p>
                      <div className="flex items-center gap-2 shrink-0 text-[10px] font-bold text-[var(--text-dim)]">
                        {stage.duration != null && (
                          <span>{stage.duration} {stage.durationUnit || 'min'}</span>
                        )}
                        {stage.temp != null && (
                          <span className="flex items-center gap-0.5">
                            <Thermometer size={10} />
                            {stage.temp}°C
                          </span>
                        )}
                      </div>
                    </div>
                    {stage.description && (
                      <p className="text-xs text-[var(--text-dim)] leading-relaxed pl-10">{stage.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Opis */}
        {recipe.description && (
          <div className="px-4 mt-6">
            <div className="p-5 bg-[var(--bg-card)] border-2 border-dashed border-[var(--border)] rounded-3xl">
              <h5 className="flex items-center gap-2 text-[10px] font-black uppercase text-[var(--text-dim)] mb-4 tracking-widest">
                <BookOpen size={13} /> Opis
              </h5>
              <p className="text-sm text-[var(--text)] leading-relaxed font-medium">{recipe.description}</p>
            </div>
          </div>
        )}

        {/* Link YouTube */}
        {recipe.videoUrl && (
          <div className="px-4 mt-4">
            <a
              href={recipe.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 border border-[var(--border)] rounded-2xl text-xs font-black uppercase text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"
            >
              ▶ Film YouTube
            </a>
          </div>
        )}

        {/* Przyciski akcji */}
        <div className="px-4 mt-6 flex gap-3">
          {(recipe.ownerId === user?.uid || userProfile?.isAdmin) && (
            <button
              onClick={() => onEditRecipe(recipe)}
              className="flex-1 py-4 bg-[var(--bg-input)] text-[var(--text)] rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
            >
              <Edit3 size={15} /> Edytuj
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="flex-1 py-4 text-white rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 shadow-lg active:scale-[0.97] transition-transform"
            style={{ background: ACCENT }}
          >
            <Printer size={15} /> Drukuj
          </button>
        </div>

      </div>

      {/* Karta do druku */}
      <div className="hidden print:block print-container text-black font-serif text-left">
        <div className="flex justify-between items-center border-b-4 border-black pb-6 mb-8">
          <div className="w-32"><img src="/logo.svg" alt="EBRA" className="w-full" /></div>
          <div className="text-right">
            <h1 className="text-sm font-bold tracking-widest text-slate-400 uppercase leading-none">EBRA Rzemiosło</h1>
            <h2 className="text-3xl font-black tracking-tighter italic uppercase mt-2">Karta Receptury</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-8 mb-10 border-b-2 border-slate-100 pb-8">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 leading-none">Nazwa Wyrobu:</p>
            <h3 className="text-4xl font-black uppercase italic leading-none">{recipe.name}</h3>
            <p className="mt-4 border-2 border-black inline-block px-4 py-1 text-xs font-bold uppercase tracking-widest leading-none">{recipe.category}</p>
          </div>
          <div className="text-right flex flex-col justify-end">
            <p className="text-[10px] uppercase font-bold text-slate-400 leading-none">Mąka:</p>
            <p className="text-6xl font-black tabular-nums leading-none mt-2">{totalTarget} <span className="text-xl font-black">KG</span></p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-10 mb-10">
          <div>
            <h4 className="text-xs font-black uppercase border-b-2 border-black pb-2 mb-4">Mąka</h4>
            <table className="w-full text-sm border-collapse">
              <thead><tr className="text-left border-b border-slate-300"><th className="pb-2">Rodzaj</th><th className="pb-2 text-right">%</th><th className="pb-2 text-right">Gramów</th></tr></thead>
              <tbody>
                {calculations.flours.map((f, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="py-3 font-bold">{f.name}</td>
                    <td className="py-3 text-right">{f.percent}%</td>
                    <td className="py-3 text-right font-black">{f.grams} g</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-black">
                  <td className="py-2 font-black">Suma</td>
                  <td className="py-2 text-right font-black">100%</td>
                  <td className="py-2 text-right font-black">{Math.round(flourKg * 1000)} g</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <h4 className="text-xs font-black uppercase border-b-2 border-black pb-2 mb-4">Składniki</h4>
            <table className="w-full text-sm border-collapse">
              <thead><tr className="text-left border-b border-slate-300"><th className="pb-2">Składnik</th><th className="pb-2 text-right">%</th><th className="pb-2 text-right">Ilość</th></tr></thead>
              <tbody>
                {calculations.ingredients.map((ing, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="py-3">{ing.name}</td>
                    <td className="py-3 text-right">{ing.percent}%</td>
                    <td className="py-3 text-right font-black">{ing.grams} {ing.unit || 'g'}</td>
                  </tr>
                ))}
                {recipe.waterTemp != null && (
                  <tr className="border-b border-slate-100">
                    <td className="py-3 italic text-slate-500" colSpan={2}>Temperatura wody</td>
                    <td className="py-3 text-right font-black">{recipe.waterTemp}°C</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {recipe.stages?.length > 0 && (
          <div className="border-2 border-black p-8 rounded-2xl mb-10 bg-slate-50/50">
            <h4 className="text-xs font-black uppercase mb-4">Etapy produkcji</h4>
            <div className="space-y-3">
              {recipe.stages.map((stage, i) => (
                <div key={i} className="flex gap-4 border-b border-slate-100 pb-3">
                  <span className="w-6 h-6 bg-black text-white text-[10px] font-black rounded-full flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <div>
                    <p className="font-black text-sm">{stage.name}
                      {stage.duration != null && <span className="font-normal text-xs text-slate-500 ml-2">— {stage.duration} {stage.durationUnit || 'min'}</span>}
                      {stage.temp != null && <span className="font-normal text-xs text-slate-500 ml-2">— {stage.temp}°C</span>}
                    </p>
                    {stage.description && <p className="text-xs text-slate-600 mt-1">{stage.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t-2 border-dashed border-slate-300 pt-6 text-center">
          <h4 className="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-widest italic">Notatki z produkcji:</h4>
          <div className="space-y-8">{[1, 2, 3].map(l => <div key={l} className="border-b border-slate-200 w-full h-1" />)}</div>
          <div className="mt-12 flex justify-between items-center text-[8px] font-bold text-slate-300 uppercase tracking-[0.4em]">
            <span>Piekarski Master PRO</span><span>ebra.pl</span><span>{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Calculator;
