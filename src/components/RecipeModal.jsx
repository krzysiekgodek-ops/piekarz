import React, { useState } from 'react';
import { X, Plus, Trash2, Save, Upload } from 'lucide-react';
import { MYDEVIL_URL } from '../firebase';

const ACCENT = '#c8860a';

const EMPTY_RECIPE = {
  name: '',
  category: '',
  flours: [{ name: 'Mąka pszenna T550', percent: 100 }],
  ingredients: [
    { name: 'Woda',    percent: 70, unit: 'g' },
    { name: 'Sól',     percent: 2,  unit: 'g' },
    { name: 'Drożdże', percent: 1,  unit: 'g' },
  ],
  waterTemp: 28,
  stages: [],
  description: '',
  imageUrl: '',
  videoUrl: '',
};

const RecipeModal = ({ user, categories, initialRecipe, onClose, onSave, recipeCount = 0, recipeLimit = Infinity }) => {
  const isNew = !initialRecipe?.id;
  const overLimit = isNew && recipeCount >= recipeLimit;

  const [formRecipe, setFormRecipe] = useState(() => {
    if (!initialRecipe) return EMPTY_RECIPE;
    return {
      ...EMPTY_RECIPE,
      ...initialRecipe,
      flours: Array.isArray(initialRecipe.flours) && initialRecipe.flours.length > 0
        ? initialRecipe.flours
        : EMPTY_RECIPE.flours,
      ingredients: Array.isArray(initialRecipe.ingredients) && initialRecipe.ingredients.length > 0
        ? initialRecipe.ingredients
        : EMPTY_RECIPE.ingredients,
      stages: Array.isArray(initialRecipe.stages) ? initialRecipe.stages : [],
    };
  });

  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (!user) return alert("Musisz być zalogowany, aby wgrać zdjęcie.");
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return alert("Dozwolone formaty: JPG, PNG, WEBP.");
    if (file.size > 5 * 1024 * 1024) return alert("Plik jest za duży. Maksymalny rozmiar to 5 MB.");
    setIsUploading(true);
    const formData = new FormData(); formData.append('file', file);
    try {
      const res = await fetch(MYDEVIL_URL, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) setFormRecipe(prev => ({ ...prev, imageUrl: data.url }));
    } catch { alert("Błąd uploadu."); } finally { setIsUploading(false); }
  };

  const updateFlour = (i, field, value) => {
    const list = [...formRecipe.flours];
    list[i] = { ...list[i], [field]: value };
    setFormRecipe({ ...formRecipe, flours: list });
  };

  const updateIngredient = (i, field, value) => {
    const list = [...formRecipe.ingredients];
    list[i] = { ...list[i], [field]: value };
    setFormRecipe({ ...formRecipe, ingredients: list });
  };

  const updateStage = (i, field, value) => {
    const list = [...formRecipe.stages];
    list[i] = { ...list[i], [field]: value };
    setFormRecipe({ ...formRecipe, stages: list });
  };

  const totalFlourPercent = formRecipe.flours.reduce((acc, f) => acc + Number(f.percent ?? 0), 0);
  const flourOk = Math.abs(totalFlourPercent - 100) < 0.01;

  const inputCls = "w-full p-4 border-2 border-[var(--border)] rounded-2xl font-bold bg-[var(--bg)] text-[var(--text)] placeholder-[var(--text-dim)] outline-none";
  const smInputCls = "p-3 border-2 border-[var(--border)] rounded-xl font-bold bg-[var(--bg)] text-[var(--text)] placeholder-[var(--text-dim)] outline-none";

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl animate-in zoom-in-95 duration-200"
      style={{ background: 'var(--bg-overlay)' }}
    >
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[4rem] w-full max-w-7xl max-h-[90vh] overflow-y-auto p-10 relative">
        <button onClick={onClose} className="absolute top-8 right-8 p-2 bg-[var(--bg-input)] text-[var(--text-dim)] hover:text-[var(--text)] rounded-full transition-colors"><X /></button>
        <h2 className="text-3xl font-black uppercase mb-10 italic text-left leading-none tracking-tighter text-[var(--text)]">Zarządzanie Recepturą</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 text-left text-[var(--text)]">

          {/* Lewa kolumna — metadane */}
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-[var(--text-dim)] uppercase ml-4">Nazwa receptury</p>
              <input placeholder="Np. Chleb pszenny na drożdżach" className={inputCls} value={formRecipe.name} onChange={e => setFormRecipe({ ...formRecipe, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-[var(--text-dim)] uppercase ml-4">Kategoria</p>
              <select className={`${inputCls} cursor-pointer`} value={formRecipe.category} onChange={e => setFormRecipe({ ...formRecipe, category: e.target.value })}>
                <option value="">Wybierz...</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Temperatura wody */}
            <div className="space-y-1">
              <p className="text-[10px] font-black text-[var(--text-dim)] uppercase ml-4">Temperatura wody (°C)</p>
              <input type="number" className={inputCls} placeholder="28" value={formRecipe.waterTemp ?? ''} onChange={e => setFormRecipe({ ...formRecipe, waterTemp: e.target.value === '' ? null : Number(e.target.value) })} />
            </div>

            {/* Opis */}
            <div className="space-y-1">
              <p className="text-[10px] font-black text-[var(--text-dim)] uppercase ml-4">Opis</p>
              <textarea placeholder="Opis receptury..." className={`${inputCls} h-32`} value={formRecipe.description} onChange={e => setFormRecipe({ ...formRecipe, description: e.target.value })} />
            </div>

            {/* Link YouTube */}
            <div className="space-y-1">
              <p className="text-[10px] font-black text-[var(--text-dim)] uppercase ml-4">Link do YouTube (opcjonalnie)</p>
              <input placeholder="https://youtube.com/..." className={inputCls} value={formRecipe.videoUrl} onChange={e => setFormRecipe({ ...formRecipe, videoUrl: e.target.value })} />
            </div>

            {/* Zdjęcie */}
            <div className="bg-[var(--bg)] p-6 rounded-[2.5rem] border-2 border-dashed border-[var(--border)] text-center min-h-[140px] flex items-center justify-center relative overflow-hidden text-[var(--text-dim)]">
              {formRecipe.imageUrl ? (
                <>
                  <img src={formRecipe.imageUrl} className="w-full h-32 object-cover rounded-2xl shadow-lg" alt="Podgląd" />
                  <button onClick={() => setFormRecipe({ ...formRecipe, imageUrl: '' })} className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full shadow-lg"><X size={12} /></button>
                </>
              ) : (
                <label className="cursor-pointer w-full">
                  <Upload size={40} className="mx-auto mb-2 opacity-30" />
                  <span className="text-[9px] font-black uppercase tracking-widest">{isUploading ? 'Wgrywanie...' : 'Wgraj zdjęcie'}</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={isUploading} />
                </label>
              )}
            </div>
          </div>

          {/* Prawa kolumna — składniki */}
          <div className="space-y-6">

            {/* Mąki */}
            <div>
              <div className="flex justify-between items-center font-black uppercase text-[var(--text-dim)] ml-2 tracking-widest mb-3">
                <span>Mąka (suma = 100%)</span>
                <button
                  onClick={() => setFormRecipe({ ...formRecipe, flours: [...formRecipe.flours, { name: '', percent: 0 }] })}
                  className="p-2 text-white rounded-lg shadow-lg"
                  style={{ background: ACCENT }}
                >
                  <Plus size={16} />
                </button>
              </div>
              {formRecipe.flours.map((f, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input placeholder="Rodzaj mąki" className={`flex-1 ${smInputCls}`} value={f.name} onChange={e => updateFlour(i, 'name', e.target.value)} />
                  <div className="relative">
                    <input type="number" min="0" max="100" step="1" className={`w-24 text-center font-black pr-6 ${smInputCls}`} style={{ color: ACCENT }} value={f.percent ?? ''} onChange={e => updateFlour(i, 'percent', Number(e.target.value))} />
                    <span className="absolute right-2 top-3.5 text-[8px] font-black text-[var(--text-dim)]">%</span>
                  </div>
                  <button onClick={() => { const l = [...formRecipe.flours]; l.splice(i, 1); setFormRecipe({ ...formRecipe, flours: l }); }} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                </div>
              ))}
              <div className={`flex justify-between px-2 py-2 text-[10px] font-black uppercase ${flourOk ? 'text-green-500' : 'text-red-500'}`}>
                <span>Suma mąki:</span>
                <span>{totalFlourPercent.toFixed(1)}% {flourOk ? '✓' : '← musi być 100%'}</span>
              </div>
            </div>

            {/* Składniki */}
            <div>
              <div className="flex justify-between items-center font-black uppercase text-[var(--text-dim)] ml-2 tracking-widest mb-3">
                <span>Składniki (% mąki)</span>
                <button
                  onClick={() => setFormRecipe({ ...formRecipe, ingredients: [...formRecipe.ingredients, { name: '', percent: 0, unit: 'g' }] })}
                  className="p-2 bg-[var(--bg-input)] text-[var(--text)] rounded-lg shadow-lg"
                >
                  <Plus size={16} />
                </button>
              </div>
              {formRecipe.ingredients.map((ing, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input placeholder="Składnik" className={`flex-1 ${smInputCls}`} value={ing.name} onChange={e => updateIngredient(i, 'name', e.target.value)} />
                  <div className="relative">
                    <input type="number" min="0" step="0.1" className={`w-20 text-center font-black pr-5 ${smInputCls}`} value={ing.percent ?? ''} onChange={e => updateIngredient(i, 'percent', Number(e.target.value))} />
                    <span className="absolute right-2 top-3.5 text-[8px] font-black text-[var(--text-dim)]">%</span>
                  </div>
                  <select className={`w-16 text-center text-xs ${smInputCls}`} value={ing.unit} onChange={e => updateIngredient(i, 'unit', e.target.value)}>
                    <option value="g">g</option>
                    <option value="ml">ml</option>
                    <option value="l">l</option>
                    <option value="szt">szt</option>
                  </select>
                  <button onClick={() => { const l = [...formRecipe.ingredients]; l.splice(i, 1); setFormRecipe({ ...formRecipe, ingredients: l }); }} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>

            {/* Etapy produkcji */}
            <div>
              <div className="flex justify-between items-center font-black uppercase text-[var(--text-dim)] ml-2 tracking-widest mb-3">
                <span>Etapy produkcji</span>
                <button
                  onClick={() => setFormRecipe({ ...formRecipe, stages: [...formRecipe.stages, { name: '', duration: null, durationUnit: 'min', temp: null, description: '' }] })}
                  className="p-2 bg-[var(--bg-input)] text-[var(--text)] rounded-lg shadow-lg"
                >
                  <Plus size={16} />
                </button>
              </div>
              {formRecipe.stages.map((stage, i) => (
                <div key={i} className="mb-4 p-4 bg-[var(--bg)] border border-[var(--border)] rounded-2xl space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full text-white text-[10px] font-black flex items-center justify-center shrink-0" style={{ background: ACCENT }}>{i + 1}</span>
                    <input placeholder="Nazwa etapu" className={`flex-1 ${smInputCls}`} value={stage.name} onChange={e => updateStage(i, 'name', e.target.value)} />
                    <button onClick={() => { const l = [...formRecipe.stages]; l.splice(i, 1); setFormRecipe({ ...formRecipe, stages: l }); }} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                  </div>
                  <div className="flex gap-2">
                    <input type="number" placeholder="Czas" className={`flex-1 ${smInputCls}`} value={stage.duration ?? ''} onChange={e => updateStage(i, 'duration', e.target.value === '' ? null : Number(e.target.value))} />
                    <select className={`w-20 text-xs ${smInputCls}`} value={stage.durationUnit || 'min'} onChange={e => updateStage(i, 'durationUnit', e.target.value)}>
                      <option value="min">min</option>
                      <option value="h">h</option>
                    </select>
                    <input type="number" placeholder="°C" className={`w-20 ${smInputCls}`} value={stage.temp ?? ''} onChange={e => updateStage(i, 'temp', e.target.value === '' ? null : Number(e.target.value))} />
                  </div>
                  <textarea placeholder="Opis etapu..." className={`w-full ${smInputCls} h-16`} value={stage.description} onChange={e => updateStage(i, 'description', e.target.value)} />
                </div>
              ))}
              {formRecipe.stages.length === 0 && (
                <p className="text-[10px] text-[var(--text-dim)] italic px-2">Brak etapów — kliknij + aby dodać</p>
              )}
            </div>

          </div>
        </div>

        {overLimit && (
          <p className="mt-10 text-center text-sm font-bold text-red-500">
            Osiągnięto limit {recipeLimit} receptur dla aktywnego planu. Kup wyższy plan, aby dodać więcej.
          </p>
        )}

        <button
          onClick={() => !overLimit && onSave(formRecipe)}
          disabled={overLimit}
          className={`w-full mt-4 py-6 rounded-3xl font-black uppercase tracking-widest shadow-2xl transition-all text-white ${
            overLimit ? 'bg-[var(--bg-input)] text-[var(--text-dim)] cursor-not-allowed' : ''
          }`}
          style={!overLimit ? { background: ACCENT } : {}}
        >
          <Save className="inline mr-2" /> Zapisz Recepturę
        </button>
      </div>
    </div>
  );
};

export default RecipeModal;
