import React, { useState, useMemo } from 'react';
import { X, Plus, Trash2, Save, Upload } from 'lucide-react';
import { MYDEVIL_URL } from '../firebase';
import RichTextEditor from './RichTextEditor';

const ACCENT = '#c8860a';

const INGREDIENT_SUGGESTIONS = [
  'Woda', 'Zakwas', 'Drożdże suche', 'Drożdże świeże',
  'Sól niejodowana', 'Cukier', 'Olej', 'Masło', 'Jajka',
  'Mleko', 'Miód', 'Siemię lniane', 'Słonecznik',
  'Dynia', 'Sezam', 'Mak',
];

const EMPTY_RECIPE = {
  name: '',
  category: '',
  description: '',
  videoUrl: '',
  imageUrl: '',
  flours: [{ name: 'Mąka pszenna T550', kg: 1, unit: 'kg' }],
  ingredients: [],
  stages: [],
  waterTemp: null,
};

// Konwersja ilości (na 1 kg mąki) → procent piekarskie
const amountToPercent = (amount, unit) => {
  const val = Number(amount || 0);
  if (unit === 'g' || unit === 'ml') return parseFloat((val / 10).toFixed(4));
  if (unit === 'kg' || unit === 'l') return parseFloat((val * 100).toFixed(4));
  return val; // szt, %
};

// Procent piekarskie → ilość w danej jednostce (do wyświetlenia)
const percentToAmount = (percent, unit) => {
  const val = Number(percent || 0);
  if (unit === 'g' || unit === 'ml') return parseFloat((val * 10).toFixed(2));
  if (unit === 'kg' || unit === 'l') return parseFloat((val / 100).toFixed(4));
  return val; // szt, %
};

const amountStep = (unit) => {
  if (unit === 'g' || unit === 'ml' || unit === 'szt') return 1;
  if (unit === 'kg' || unit === 'l') return 0.001;
  return 0.1;
};

const initFlours = (flours) => {
  if (!Array.isArray(flours) || flours.length === 0) return EMPTY_RECIPE.flours;
  return flours.map(f => ({
    name: f.name || '',
    kg: (f.kg != null && Number(f.kg) > 0) ? Number(f.kg) : (f.percent != null ? Number(f.percent) / 100 : 1),
    unit: f.unit || 'kg',
  }));
};

// Zwraca wartość do wyświetlenia w inpucie zależnie od wybranej jednostki
const flourDisplayValue = (f) => {
  const kg = Number(f.kg || 0);
  return f.unit === 'g' ? (kg * 1000 || '') : (kg || '');
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
        ? initialRecipe.ingredients.map(ing => ({
            ...ing,
            amount: percentToAmount(ing.percent ?? 0, ing.unit || 'g'),
          }))
        : [],
      stages: Array.isArray(initialRecipe.stages)
        ? initialRecipe.stages.map(s => ({ ...s }))
        : [],
    };
  });

  const [isUploading, setIsUploading] = useState(false);
  const [percentsCalculated, setPercentsCalculated] = useState(!isNew);

  // Suma mąki zawsze w kg (źródło prawdy)
  const totalFlourKg = useMemo(
    () => form.flours.reduce((sum, f) => sum + Number(f.kg || 0), 0),
    [form.flours]
  );

  // Procenty udziału każdej mąki w sumie
  const flourPercents = useMemo(() => {
    if (totalFlourKg <= 0) return form.flours.map(() => 0);
    return form.flours.map(f => (Number(f.kg || 0) / totalFlourKg) * 100);
  }, [form.flours, totalFlourKg]);

  // ── Flour handlers ──

  const addFlour = () => {
    setPercentsCalculated(false);
    setForm(prev => ({ ...prev, flours: [{ name: '', kg: 0, unit: 'kg' }, ...prev.flours] }));
  };

  const updateFlour = (i, field, value) => {
    setPercentsCalculated(false);
    const list = [...form.flours];
    if (field === 'amount') {
      // Konwersja z wybranej jednostki na kg (zawsze zapisujemy kg)
      const raw = value === '' ? 0 : Number(value);
      list[i] = { ...list[i], kg: list[i].unit === 'g' ? raw / 1000 : raw };
    } else {
      list[i] = { ...list[i], [field]: value };
    }
    setForm(prev => ({ ...prev, flours: list }));
  };

  const removeFlour = (i) => {
    if (form.flours.length <= 1) return;
    setPercentsCalculated(false);
    setForm(prev => ({ ...prev, flours: prev.flours.filter((_, idx) => idx !== i) }));
  };

  const recalcPercents = () => {
    const totalG = form.flours.reduce((sum, f) => sum + Number(f.kg || 0) * 1000, 0);
    if (totalG <= 0) return alert('Brak mąki — dodaj mąkę z ilością > 0.');
    setForm(prev => ({
      ...prev,
      flours: prev.flours.map(f => {
        const percent = parseFloat(((Number(f.kg || 0) * 1000 / totalG) * 100).toFixed(2));
        return { ...f, percent, kg: parseFloat((percent / 100).toFixed(4)), unit: 'kg' };
      }),
    }));
    setPercentsCalculated(true);
  };

  // ── Ingredient handlers ──

  const addIngredient = () =>
    setForm(prev => ({ ...prev, ingredients: [{ name: '', amount: 0, unit: 'g', percent: 0 }, ...prev.ingredients] }));

  const updateIngredient = (i, field, value) => {
    const list = [...form.ingredients];
    const ing = { ...list[i] };
    if (field === 'amount') {
      ing.amount = value === '' ? '' : Number(value);
      ing.percent = amountToPercent(ing.amount, ing.unit || 'g');
    } else if (field === 'unit') {
      ing.unit = value;
      ing.amount = percentToAmount(ing.percent ?? 0, value);
    } else {
      ing[field] = value;
    }
    list[i] = ing;
    setForm(prev => ({ ...prev, ingredients: list }));
  };

  const removeIngredient = (i) =>
    setForm(prev => ({ ...prev, ingredients: prev.ingredients.filter((_, idx) => idx !== i) }));

  // ── Stage handlers ──

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

  // ── Upload zdjęcia ──

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

  // ── Zapis ──

  const handleSave = () => {
    if (overLimit) return;
    const missing = [];
    if (!form.name.trim()) missing.push('nazwa receptury');
    if (!form.category) missing.push('kategoria');
    if (!form.description.trim()) missing.push('opis');
    if (!form.flours.some(f => Number(f.kg) > 0)) missing.push('co najmniej jedna mąka z ilością > 0');
    if (missing.length) return alert('Uzupełnij: ' + missing.join(', ') + '.');
    if (!percentsCalculated && Math.abs(totalFlourKg - 1) > 0.001)
      return alert('Kliknij "Przelicz %" przed zapisem, aby przeliczyć procenty piekarskie.');
    const floursToSave = form.flours.map((f, idx) => ({
      name: f.name,
      percent: f.percent ?? parseFloat(flourPercents[idx].toFixed(2)),
      kg: Number(f.kg ?? 0),
    }));
    const ingredientsToSave = form.ingredients.map(({ amount, ...rest }) => rest);
    onSave({ ...form, flours: floursToSave, ingredients: ingredientsToSave, imageUrl: form.imageUrl || '/default-bread.jpg' });
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
              <RichTextEditor
                value={form.description}
                onChange={v => setForm(prev => ({ ...prev, description: v }))}
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
                    onClick={recalcPercents}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg shadow text-[10px] font-black transition-colors ${percentsCalculated ? 'bg-green-600 text-white' : 'bg-amber-500 text-white'}`}
                    title="Normalizuje mąki do bazy 1 kg i zapisuje procenty piekarskie"
                  >
                    Przelicz %
                  </button>
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
                  <input
                    type="number"
                    min="0"
                    step={f.unit === 'g' ? 1 : 0.01}
                    max={f.unit === 'g' ? 10000 : 10}
                    className={`w-24 text-center font-black ${smInputCls}`}
                    value={flourDisplayValue(f)}
                    onChange={e => updateFlour(i, 'amount', e.target.value)}
                  />
                  <select
                    className={`w-16 text-center text-xs ${smInputCls}`}
                    value={f.unit || 'kg'}
                    onChange={e => updateFlour(i, 'unit', e.target.value)}
                  >
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                  </select>
                  <span
                    className="w-14 text-center text-[10px] font-black rounded-xl py-3 shrink-0"
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

            </div>

            {/* ── SEKCJA 3 — Składniki ── */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-dim)]">Sekcja 3 — Składniki</p>
                <button
                  onClick={addIngredient}
                  className="flex items-center gap-1 px-3 py-2 bg-[var(--bg-input)] text-[var(--text)] rounded-lg shadow text-[10px] font-black"
                >
                  <Plus size={13} /> Składnik
                </button>
              </div>
              <p className="text-[9px] text-[var(--text-dim)] mb-3 px-1">
                Podaj ilość <strong>na 1 kg mąki</strong> — np. sól 25 g, woda 670 ml, drożdże 30 g
              </p>
              {form.ingredients.length === 0 && (
                <p className="text-[10px] text-[var(--text-dim)] italic px-2">Brak składników — kliknij + aby dodać</p>
              )}
              {form.ingredients.map((ing, i) => (
                <div key={i} className="flex gap-2 mb-2 items-center">
                  <div className="flex-1 flex flex-col gap-1">
                    <select
                      className={`w-full text-xs ${smInputCls} py-2`}
                      value=""
                      onChange={e => { if (e.target.value) updateIngredient(i, 'name', e.target.value); }}
                    >
                      <option value="">— wybierz lub wpisz własny —</option>
                      {INGREDIENT_SUGGESTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <input
                      placeholder="Składnik"
                      className={`w-full ${smInputCls}`}
                      value={ing.name}
                      onChange={e => updateIngredient(i, 'name', e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col items-center shrink-0">
                    <input
                      type="number" min="0" step={amountStep(ing.unit || 'g')}
                      placeholder="Ilość"
                      className={`w-20 text-center font-black ${smInputCls}`}
                      value={ing.amount || ''}
                      onChange={e => updateIngredient(i, 'amount', e.target.value)}
                    />
                    <span className="text-[9px] font-black mt-0.5 tabular-nums" style={{ color: ACCENT }}>
                      = {parseFloat((Number(ing.percent || 0)).toFixed(2))}% mąki
                    </span>
                  </div>
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
