import React, { useState, useMemo } from 'react';
import { X, Plus, Trash2, Save, Upload } from 'lucide-react';
import { MYDEVIL_URL } from '../firebase';

const ACCENT = '#c8860a';

const EMPTY_RECIPE = {
  name: '',
  category: '',
  description: '',
  videoUrl: '',
  imageUrl: '',
  flours: [{ name: 'Mąka pszenna T550', kg: 1 }],
  ingredients: [],
  stages: [],
  waterTemp: null,
};

const initFlours = (flours) => {
  if (!Array.isArray(flours) || flours.length === 0) return EMPTY_RECIPE.flours;
  return flours.map(f => ({
    name: f.name || '',
    kg: f.kg != null ? Number(f.kg) : (f.percent != null ? Number(f.percent) / 100 : 1),
  }));
};

const RecipeModal = ({ user, categories, initialRecipe, onClose, onSave, recipeCount = 0, recipeLimit = Infinity }) => {
  const isNew = !initialRecipe?.id;
  const overLimit = isNew && recipeCount >= recipeLimit;

  const [form, setForm] = useState(() => {
    if (!initialRecipe) return EMPTY_RECIPE;
    return {
      ...EMPTY_RECIPE,
      ...initialRecipe,
      flours: initFlours(initialRecipe.flours),
      ingredients: Array.isArray(initialRecipe.ingredients)
        ? initialRecipe.ingredients.map(ing => ({ ...ing }))
        : [],
      stages: Array.isArray(initialRecipe.stages)
        ? initialRecipe.stages.map(s => ({ ...s }))
        : [],
    };
  });

  const [isUploading, setIsUploading] = useState(false);

  const totalFlourKg = useMemo(
    () => form.flours.reduce((sum, f) => sum + Number(f.kg || 0), 0),
    [form.flours]
  );

  const flourPercents = useMemo(() => {
    if (totalFlourKg <= 0) return form.flours.map(() => 0);
    return form.flours.map(f => (Number(f.kg || 0) / totalFlourKg) * 100);
  }, [form.flours, totalFlourKg]);

  const addFlour = () =>
    setForm(prev => ({ ...prev, flours: [{ name: '', kg: 0 }, ...prev.flours] }));

  const updateFlour = (i, field, value) => {
    const list = [...form.flours];
    list[i] = { ...list[i], [field]: field === 'kg' ? (value === '' ? 0 : Number(value)) : value };
    setForm(prev => ({ ...prev, flours: list }));
  };

  const removeFlour = (i) => {
    if (form.flours.length <= 1) return;
    setForm(prev => ({ ...prev, flours: prev.flours.filter((_, idx) => idx !== i) }));
  };

  const setTotalFlour = (newTotal) => {
    const total = Math.max(0, Math.min(10, Number(newTotal) || 0));
    if (totalFlourKg <= 0) {
      const kg = form.flours.length > 0 ? parseFloat((total / form.flours.length).toFixed(3)) : 0;
      setForm(prev => ({ ...prev, flours: prev.flours.map(f => ({ ...f, kg })) }));
    } else {
      const scale = total / totalFlourKg;
      setForm(prev => ({
        ...prev,
        flours: prev.flours.map(f => ({ ...f, kg: parseFloat((Number(f.kg) * scale).toFixed(3)) })),
      }));
    }
  };

  const addIngredient = () =>
    setForm(prev => ({ ...prev, ingredients: [{ name: '', percent: 0, unit: 'g' }, ...prev.ingredients] }));

  const updateIngredient = (i, field, value) => {
    const list = [...form.ingredients];
    list[i] = { ...list[i], [field]: field === 'percent' ? (value === '' ? 0 : Number(value)) : value };
    setForm(prev => ({ ...prev, ingredients: list }));
  };

  const removeIngredient = (i) =>
    setForm(prev => ({ ...prev, ingredients: prev.ingredients.filter((_, idx) => idx !== i) }));

  const addStage = () =>
    setForm(prev => ({ ...prev, stages: [{ name: '', duration: null, durationUnit: 'min', temp: null }, ...prev.stages] }));

  const updateStage = (i, field, value) => {
    const list = [...form.stages];
    const numFields = ['duration', 'temp'];
    list[i] = { ...list[i], [field]: numFields.includes(field) ? (value === '' ? null : Number(value)) : value };
    setForm(prev => ({ ...prev, stages: list }));
  };

  const removeStage = (i) =>
    setForm(prev => ({ ...prev, stages: prev.stages.filter((_, idx) => idx !== i) }));

  const handleUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (!user) return alert('Musisz być zalogowany, aby wgrać zdjęcie.');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return alert('Dozwolone formaty: JPG, PNG, WEBP.');
    if (file.size > 5 * 1024 * 1024) return alert('Plik jest za duży. Maks. 5 MB.');
    setIsUploading(true);
    const formData = new FormData(); formData.append('file', file);
    try {
      const res = await fetch(MYDEVIL_URL, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) setForm(prev => ({ ...prev, imageUrl: data.url }));
    } catch { alert('Błąd uploadu.'); } finally { setIsUploading(false); }
  };

  const handleSave = () => {
    if (overLimit) return;
    const missing = [];
    if (!form.name.trim()) missing.push('nazwa receptury');
    if (!form.category) missing.push('kategoria');
    if (!form.description.trim()) missing.push('opis');
    if (!form.flours.some(f => Number(f.kg) > 0)) missing.push('co najmniej jedna mąka z ilością > 0');
    if (missing.length) return alert('Uzupełnij: ' + missing.join(', ') + '.');

    const total = totalFlourKg;
    const floursWithPercent = form.flours.map(f => ({
      name: f.name,
      kg: Number(f.kg),
      percent: total > 0 ? parseFloat(((Number(f.kg) / total) * 100).toFixed(2)) : 0,
    }));

    onSave({ ...form, flours: floursWithPercent, imageUrl: form.imageUrl || '/default-bread.jpg' });
  };

  const inputCls = 'w-full p-4 border-2 border-[var(--border)] rounded-2xl font-bold bg-[var(--bg)] text-[var(--text)] placeholder-[var(--text-dim)] outline-none';
  const smInputCls = 'p-3 border-2 border-[var(--border)] rounded-xl font-bold bg-[var(--bg)] text-[var(--text)] placeholder-[var(--text-dim)] outline-none';

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl animate-in zoom-in-95 duration-200"
      style={{ background: 'var(--bg-overlay)' }}
    >
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[4rem] w-full max-w-7xl max-h-[90vh] overflow-y-auto p-10 relative">
        <button onClick={onClose} className="absolute top-8 right-8 p-2 bg-[var(--bg-input)] text-[var(--text-dim)] hover:text-[var(--text)] rounded-full transition-colors">
          <X />
        </button>
        <h2 className="text-3xl font-black uppercase mb-10 italic text-left leading-none tracking-tighter text-[var(--text)]">
          {isNew ? 'Nowa Receptura' : 'Edytuj Recepturę'}
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 text-left text-[var(--text)]">

          {/* ── SEKCJA 1 — Podstawowe informacje ── */}
          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-dim)] ml-2 mb-2">Sekcja 1 — Podstawowe informacje</p>

            <div className="space-y-1">
              <p className="text-[10px] font-black text-[var(--text-dim)] uppercase ml-4">Nazwa receptury *</p>
              <input
                placeholder="Np. Chleb pszenny na drożdżach"
                className={inputCls}
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-black text-[var(--text-dim)] uppercase ml-4">Kategoria *</p>
              <select
                className={`${inputCls} cursor-pointer`}
                value={form.category}
                onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
              >
                <option value="">Wybierz...</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-black text-[var(--text-dim)] uppercase ml-4">Opis *</p>
              <textarea
                placeholder="Opisz recepturę..."
                className={`${inputCls} h-32`}
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-black text-[var(--text-dim)] uppercase ml-4">Link YouTube (opcjonalnie)</p>
              <input
                placeholder="https://youtube.com/..."
                className={inputCls}
                value={form.videoUrl}
                onChange={e => setForm(prev => ({ ...prev, videoUrl: e.target.value }))}
              />
            </div>

            <div className="bg-[var(--bg)] p-6 rounded-[2.5rem] border-2 border-dashed border-[var(--border)] text-center min-h-[140px] flex items-center justify-center relative overflow-hidden text-[var(--text-dim)]">
              {form.imageUrl && form.imageUrl !== '/default-bread.jpg' ? (
                <>
                  <img src={form.imageUrl} className="w-full h-32 object-cover rounded-2xl shadow-lg" alt="Podgląd" />
                  <button
                    onClick={() => setForm(prev => ({ ...prev, imageUrl: '' }))}
                    className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full shadow-lg"
                  >
                    <X size={12} />
                  </button>
                </>
              ) : (
                <label className="cursor-pointer w-full">
                  <Upload size={40} className="mx-auto mb-2 opacity-30" />
                  <span className="text-[9px] font-black uppercase tracking-widest">
                    {isUploading ? 'Wgrywanie...' : 'Wgraj zdjęcie (opcjonalnie)'}
                  </span>
                  <p className="text-[8px] text-[var(--text-dim)] mt-1">Brak zdjęcia = domyślny chleb</p>
                  <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={isUploading} />
                </label>
              )}
            </div>
          </div>

          {/* ── Prawa kolumna ── */}
          <div className="space-y-6">

            {/* ── SEKCJA 2 — Mąka ── */}
            <div>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-dim)]">Sekcja 2 — Mąka *</p>
                  <p className="text-[9px] text-[var(--text-dim)] mt-0.5">min. 1 rodzaj mąki z ilością &gt; 0</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={addFlour}
                    className="flex items-center gap-1 px-3 py-2 text-white rounded-lg shadow text-[10px] font-black"
                    style={{ background: ACCENT }}
                  >
                    <Plus size={13} /> Mąka
                  </button>
                </div>
              </div>

              {form.flours.map((f, i) => (
                <div key={i} className="flex gap-2 mb-2 items-center">
                  <input
                    placeholder="Rodzaj mąki"
                    className={`flex-1 ${smInputCls}`}
                    value={f.name}
                    onChange={e => updateFlour(i, 'name', e.target.value)}
                  />
                  <div className="relative">
                    <input
                      type="number" min="0" max="10" step="0.01"
                      className={`w-24 text-center font-black pr-7 ${smInputCls}`}
                      value={f.kg || ''}
                      onChange={e => updateFlour(i, 'kg', e.target.value)}
                    />
                    <span className="absolute right-2 top-3.5 text-[8px] font-black text-[var(--text-dim)]">kg</span>
                  </div>
                  <span
                    className="w-16 text-center text-[10px] font-black rounded-xl py-3 shrink-0"
                    style={{ color: ACCENT, background: 'var(--bg)' }}
                  >
                    {flourPercents[i] != null ? flourPercents[i].toFixed(1) : '0.0'}%
                  </span>
                  <button
                    onClick={() => removeFlour(i)}
                    disabled={form.flours.length <= 1}
                    className="text-red-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              {/* Łączna ilość mąki + suwak */}
              <div className="mt-3 p-4 bg-[var(--bg)] rounded-2xl border border-[var(--border)]">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] font-black uppercase text-[var(--text-dim)] flex-1">Łączna ilość mąki</span>
                  <div className="relative">
                    <input
                      type="number" min="0" max="10" step="0.1"
                      className="w-24 text-center font-black pr-7 p-2 border-2 border-[var(--border)] rounded-xl bg-[var(--bg)] text-[var(--text)] outline-none text-sm"
                      style={{ color: ACCENT }}
                      value={parseFloat(totalFlourKg.toFixed(2)) || ''}
                      onChange={e => setTotalFlour(e.target.value)}
                    />
                    <span className="absolute right-2 top-2.5 text-[8px] font-black text-[var(--text-dim)]">kg</span>
                  </div>
                </div>
                <input
                  type="range" min="0" max="10" step="0.1"
                  className="w-full"
                  style={{ accentColor: ACCENT }}
                  value={Math.min(10, totalFlourKg)}
                  onChange={e => setTotalFlour(e.target.value)}
                />
              </div>
            </div>

            {/* ── SEKCJA 3 — Składniki ── */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-dim)]">Sekcja 3 — Składniki</p>
                <button
                  onClick={addIngredient}
                  className="flex items-center gap-1 px-3 py-2 bg-[var(--bg-input)] text-[var(--text)] rounded-lg shadow text-[10px] font-black"
                >
                  <Plus size={13} /> Składnik
                </button>
              </div>
              {form.ingredients.length === 0 && (
                <p className="text-[10px] text-[var(--text-dim)] italic px-2">Brak składników — kliknij + aby dodać</p>
              )}
              {form.ingredients.map((ing, i) => (
                <div key={i} className="flex gap-2 mb-2 items-center">
                  <input
                    placeholder="Składnik"
                    className={`flex-1 ${smInputCls}`}
                    value={ing.name}
                    onChange={e => updateIngredient(i, 'name', e.target.value)}
                  />
                  <input
                    type="number" min="0" step="0.1"
                    placeholder="Ilość"
                    className={`w-20 text-center font-black ${smInputCls}`}
                    value={ing.percent ?? ''}
                    onChange={e => updateIngredient(i, 'percent', e.target.value)}
                  />
                  <select
                    className={`w-16 text-center text-xs ${smInputCls}`}
                    value={ing.unit || 'g'}
                    onChange={e => updateIngredient(i, 'unit', e.target.value)}
                  >
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="ml">ml</option>
                    <option value="l">l</option>
                    <option value="szt">szt</option>
                    <option value="%">%</option>
                  </select>
                  <button onClick={() => removeIngredient(i)} className="text-red-400 hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* ── SEKCJA 4 — Etapy produkcji ── */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-dim)]">Sekcja 4 — Etapy produkcji</p>
                <button
                  onClick={addStage}
                  className="flex items-center gap-1 px-3 py-2 bg-[var(--bg-input)] text-[var(--text)] rounded-lg shadow text-[10px] font-black"
                >
                  <Plus size={13} /> Etap
                </button>
              </div>
              {form.stages.length === 0 && (
                <p className="text-[10px] text-[var(--text-dim)] italic px-2">Brak etapów — kliknij + aby dodać</p>
              )}
              {form.stages.map((stage, i) => (
                <div key={i} className="mb-3 p-4 bg-[var(--bg)] border border-[var(--border)] rounded-2xl space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-6 h-6 rounded-full text-white text-[10px] font-black flex items-center justify-center shrink-0"
                      style={{ background: ACCENT }}
                    >
                      {i + 1}
                    </span>
                    <input
                      placeholder="Nazwa etapu"
                      className={`flex-1 ${smInputCls}`}
                      value={stage.name}
                      onChange={e => updateStage(i, 'name', e.target.value)}
                    />
                    <button onClick={() => removeStage(i)} className="text-red-400 hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number" placeholder="Czas"
                      className={`flex-1 ${smInputCls}`}
                      value={stage.duration ?? ''}
                      onChange={e => updateStage(i, 'duration', e.target.value)}
                    />
                    <select
                      className={`w-20 text-xs ${smInputCls}`}
                      value={stage.durationUnit || 'min'}
                      onChange={e => updateStage(i, 'durationUnit', e.target.value)}
                    >
                      <option value="min">min</option>
                      <option value="h">h</option>
                    </select>
                    <input
                      type="number" placeholder="°C"
                      className={`w-20 ${smInputCls}`}
                      value={stage.temp ?? ''}
                      onChange={e => updateStage(i, 'temp', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {overLimit && (
          <p className="mt-10 text-center text-sm font-bold text-red-500">
            Osiągnięto limit {recipeLimit} receptur. Kup wyższy plan, aby dodać więcej.
          </p>
        )}

        <div className="flex gap-4 mt-8">
          <button
            onClick={onClose}
            className="flex-1 py-5 rounded-3xl font-black uppercase tracking-widest bg-[var(--bg-input)] text-[var(--text-dim)] transition-all hover:opacity-80"
          >
            Anuluj
          </button>
          <button
            onClick={handleSave}
            disabled={overLimit}
            className={`flex-[2] py-5 rounded-3xl font-black uppercase tracking-widest shadow-2xl transition-all text-white ${overLimit ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-90'}`}
            style={!overLimit ? { background: ACCENT } : { background: 'var(--bg-input)', color: 'var(--text-dim)' }}
          >
            <Save className="inline mr-2" size={18} /> Zapisz Recepturę
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecipeModal;
