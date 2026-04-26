import React, { useState, useMemo } from 'react';
import { collection, doc, addDoc, deleteDoc, updateDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import {
  Plus, Trash2, Megaphone, Power, ChevronDown, ChevronRight, Eye, Lock, Unlock, X,
  Users, CreditCard, BookOpen, UserPlus, Download, FileText, Upload, ExternalLink,
  Edit2, Archive, RotateCcw, Image as ImageIcon, Calendar, TrendingUp, Save,
} from 'lucide-react';
import { auth, db, SUPER_ROOT, MYDEVIL_URL, MYDEVIL_PDF_URL } from '../firebase';

const ACCENT = '#c8860a';

const parseTs = (v) => {
  if (!v) return null;
  if (v.seconds) return v.seconds * 1000;
  if (v instanceof Date) return v.getTime();
  const n = Number(v);
  if (!isNaN(n) && n > 0) return n;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d.getTime();
};

const formatDate = (ts) => {
  if (!ts) return '';
  if (ts.toDate) return ts.toDate().toLocaleDateString('pl-PL');
  if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleDateString('pl-PL');
  return '';
};

const tsToInputDate = (ts) => {
  if (!ts) return '';
  const ms = ts.seconds ? ts.seconds * 1000 : null;
  if (!ms) return '';
  return new Date(ms).toISOString().split('T')[0];
};

const inputDateToDate = (str) => (str ? new Date(str) : null);

const CALC_OPTIONS = [
  { value: 'masarz',    label: 'Masarski Master' },
  { value: 'piekarz',   label: 'Piekarski Master' },
  { value: 'browarnik', label: 'Browarnik' },
  { value: 'nalewki',   label: 'Nalewki' },
];

const PLAN_OPTIONS = ['free', 'mini', 'midi', 'maxi', 'vip'];

const StatCard = ({ icon: Icon, label, value, accent }) => (
  <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 flex flex-col gap-3">
    <div className="flex items-center gap-2">
      <Icon size={16} style={accent ? { color: ACCENT } : {}} className={accent ? '' : 'text-[var(--text-dim)]'} />
      <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-dim)]">{label}</span>
    </div>
    <span className="text-4xl font-black text-[var(--text)]">{value}</span>
  </div>
);

const EMPTY_AD = { title: '', imageUrl: '', targetUrl: '', startDate: '', endDate: '', active: true, calculators: [] };

const AdminPanel = ({ allUsers, categories, ads, allRecipes = [], updatePlayerPlan, toggleAdmin, deleteUserAccount, onAddRecipe }) => {
  const [adminSubTab, setAdminSubTab]       = useState('dashboard');
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [userRecipesMap, setUserRecipesMap] = useState({});
  const [previewRecipe, setPreviewRecipe]   = useState(null);
  const [userCalcState, setUserCalcState]   = useState({});

  const [catsState, setCatsState]   = useState([]);
  const [newCatName, setNewCatName] = useState('');
  const [catsLoading, setCatsLoading] = useState(false);

  const [adSubTab, setAdSubTab]     = useState('active');
  const [showAdForm, setShowAdForm] = useState(false);
  const [editAdId, setEditAdId]     = useState(null);
  const [adForm, setAdForm]         = useState(EMPTY_AD);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  const userEmailMap = useMemo(() => {
    const m = {};
    allUsers.forEach(u => { m[u.id] = u.email; });
    return m;
  }, [allUsers]);

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  const stats = useMemo(() => ({
    totalUsers: allUsers.length,
    activeSubscriptions: allUsers.filter(u => u.plan && u.plan !== 'free').length,
    totalRecipes: allRecipes.length,
    newUsersWeek: allUsers.filter(u => {
      const ts = parseTs(u.createdAt);
      return ts !== null && ts >= sevenDaysAgo;
    }).length,
    newSubscriptionsWeek: allUsers.filter(u => {
      if (!u.plan || u.plan === 'free') return false;
      if (!u.planExpiry) return false;
      const ts = parseTs(u.createdAt);
      return ts !== null && ts >= sevenDaysAgo;
    }).length,
  }), [allUsers, allRecipes]);

  const recentUsers = useMemo(() =>
    [...allUsers]
      .filter(u => u.createdAt)
      .sort((a, b) => (parseTs(b.createdAt) ?? 0) - (parseTs(a.createdAt) ?? 0))
      .slice(0, 10),
    [allUsers]
  );

  const pendingRecipes = useMemo(() =>
    allRecipes.filter(r => r.ownerId !== 'ADMIN' && !r.blocked),
    [allRecipes]
  );

  const activeAdsDashboard = useMemo(() => ads.filter(ad => ad.active), [ads]);

  const activeAdsList = useMemo(() => ads.filter(ad => {
    if (ad.archived) return false;
    const end = ad.endDate?.seconds ? ad.endDate.seconds * 1000 : null;
    return !end || end >= now;
  }), [ads, now]);

  const archiveAdsList = useMemo(() => ads.filter(ad => {
    if (ad.archived) return true;
    const end = ad.endDate?.seconds ? ad.endDate.seconds * 1000 : null;
    return end && end < now;
  }), [ads, now]);

  const toggleAdCalc = (val) => {
    setAdForm(f => {
      const calcs = f.calculators || [];
      return {
        ...f,
        calculators: calcs.includes(val) ? calcs.filter(c => c !== val) : [...calcs, val],
      };
    });
  };

  const openNewAdForm = () => { setAdForm(EMPTY_AD); setEditAdId(null); setShowAdForm(true); };

  const openEditAdForm = (ad) => {
    setAdForm({
      title:       ad.title || ad.content || '',
      imageUrl:    ad.imageUrl || '',
      targetUrl:   ad.targetUrl || '',
      startDate:   tsToInputDate(ad.startDate),
      endDate:     tsToInputDate(ad.endDate),
      active:      ad.active ?? true,
      calculators: ad.calculators || [],
    });
    setEditAdId(ad.id);
    setShowAdForm(true);
  };

  const closeAdForm = () => { setShowAdForm(false); setEditAdId(null); setAdForm(EMPTY_AD); };

  const handleSaveAd = async () => {
    if (!adForm.title.trim()) return alert('Podaj tytuł reklamy.');
    const payload = {
      title:       adForm.title.trim(),
      imageUrl:    adForm.imageUrl,
      targetUrl:   adForm.targetUrl,
      startDate:   inputDateToDate(adForm.startDate),
      endDate:     inputDateToDate(adForm.endDate),
      active:      adForm.active,
      archived:    false,
      calculators: adForm.calculators || [],
    };
    if (editAdId) {
      await updateDoc(doc(db, 'ads', editAdId), payload);
    } else {
      await addDoc(collection(db, 'ads'), { ...payload, createdAt: serverTimestamp() });
    }
    closeAdForm();
  };

  const handleUploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return alert('Dozwolone: JPG, PNG, WEBP.');
    if (file.size > 5 * 1024 * 1024) return alert('Maks. rozmiar: 5 MB.');
    setUploadingImg(true);
    const fd = new FormData(); fd.append('file', file);
    try {
      const res  = await fetch(MYDEVIL_URL, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) setAdForm(f => ({ ...f, imageUrl: data.url }));
    } catch { alert('Błąd uploadu zdjęcia.'); } finally { setUploadingImg(false); }
  };

  const handleUploadPdf = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') return alert('Dozwolone tylko pliki PDF.');
    if (file.size > 20 * 1024 * 1024) return alert('Maks. rozmiar PDF: 20 MB.');
    setUploadingPdf(true);
    const fd = new FormData(); fd.append('file', file);
    try {
      const res  = await fetch(MYDEVIL_PDF_URL, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) setAdForm(f => ({ ...f, targetUrl: data.url }));
    } catch { alert('Błąd uploadu PDF.'); } finally { setUploadingPdf(false); }
  };

  const loadUserRecipes = async (userId) => {
    if (userRecipesMap[userId]) return;
    const snap = await getDocs(query(collection(db, 'piekarz_recipes'), where('ownerId', '==', userId)));
    setUserRecipesMap(prev => ({ ...prev, [userId]: snap.docs.map(d => ({ ...d.data(), id: d.id })) }));
  };

  const handleToggleUser = (userId) => {
    const next = expandedUserId === userId ? null : userId;
    setExpandedUserId(next);
    if (next) loadUserRecipes(next);
  };

  const handleSaveCalculatorPlan = async (userId, calc, plan) => {
    await updateDoc(doc(db, 'users', userId), {
      [`calculatorPlans.${calc}.plan`]: plan,
    });
  };

  const handleBlockRecipe = async (recipeId, block) => {
    await updateDoc(doc(db, 'piekarz_recipes', recipeId), { blocked: block });
    setUserRecipesMap(prev => {
      const updated = { ...prev };
      for (const uid in updated)
        updated[uid] = updated[uid].map(r => r.id === recipeId ? { ...r, blocked: block } : r);
      return updated;
    });
    if (previewRecipe?.id === recipeId) setPreviewRecipe(p => ({ ...p, blocked: block }));
  };

  const DEFAULT_CATS = ['Chleby mieszane', 'Na zakwasie', 'Na drożdżach', 'Orkiszowy'];

  const loadCategories = async () => {
    setCatsLoading(true);
    const snap = await getDocs(collection(db, 'piekarz_categories'));
    setCatsState(snap.docs.map(d => ({ id: d.id, name: d.data().name })).sort((a, b) => a.name.localeCompare(b.name, 'pl')));
    setCatsLoading(false);
  };

  const addCategory = async () => {
    const name = newCatName.trim();
    if (!name) return;
    if (catsState.some(c => c.name.toLowerCase() === name.toLowerCase())) return alert('Kategoria już istnieje.');
    await addDoc(collection(db, 'piekarz_categories'), { name });
    setNewCatName('');
    await loadCategories();
  };

  const deleteCategory = async (id) => {
    if (!window.confirm('Usuń kategorię?')) return;
    await deleteDoc(doc(db, 'piekarz_categories', id));
    await loadCategories();
  };

  const seedDefaultCats = async () => {
    const existing = catsState.map(c => c.name.toLowerCase());
    const toAdd = DEFAULT_CATS.filter(c => !existing.includes(c.toLowerCase()));
    if (toAdd.length === 0) return alert('Wszystkie kategorie już istnieją.');
    for (const name of toAdd) {
      await addDoc(collection(db, 'piekarz_categories'), { name });
    }
    await loadCategories();
  };

  const exportUsersCSV = () => {
    const header = 'email,plan,createdAt';
    const rows = allUsers.map(u => `${u.email},${u.plan || 'free'},${formatDate(u.createdAt)}`);
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'uzytkownicy.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const inputCls = "w-full p-3 border border-[var(--border)] rounded-xl font-bold bg-[var(--bg)] text-[var(--text)] placeholder-[var(--text-dim)] outline-none text-sm";

  const tabs = [
    { id: 'dashboard',  label: 'Dashboard' },
    { id: 'users',      label: 'Użytkownicy' },
    { id: 'categories', label: 'Kategorie' },
    { id: 'ads',        label: 'Reklamy' },
  ];

  return (
    <main className="max-w-7xl mx-auto p-4 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">

      <div className="flex justify-between items-center mb-12 flex-wrap gap-4">
        <div className="flex bg-[var(--bg)] border border-[var(--border)] p-1.5 rounded-3xl w-fit">
          {tabs.map(t => (
            <button key={t.id} onClick={() => { setAdminSubTab(t.id); if (t.id === 'categories') loadCategories(); }}
              className={`px-8 py-3 rounded-2xl text-xs font-black uppercase transition-all ${adminSubTab === t.id ? 'bg-[var(--bg-card)] shadow' : 'text-[var(--text-dim)]'}`}
              style={adminSubTab === t.id ? { color: ACCENT } : {}}>
              {t.label}
            </button>
          ))}
        </div>
        <button onClick={() => signOut(auth)} className="flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase text-xs transition-all border"
          style={{ background: 'rgba(200,134,10,0.1)', color: ACCENT, borderColor: 'rgba(200,134,10,0.3)' }}
          onMouseEnter={e => { e.currentTarget.style.background = ACCENT; e.currentTarget.style.color = 'white'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(200,134,10,0.1)'; e.currentTarget.style.color = ACCENT; }}>
          <Power size={18} /> Wyloguj
        </button>
      </div>

      {/* DASHBOARD */}
      {adminSubTab === 'dashboard' && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard icon={Users}       label="Wszyscy użytkownicy"    value={stats.totalUsers} />
            <StatCard icon={CreditCard}  label="Aktywne subskrypcje"    value={stats.activeSubscriptions} accent />
            <StatCard icon={BookOpen}    label="Receptury w systemie"   value={stats.totalRecipes} />
            <StatCard icon={UserPlus}    label="Nowi (ostatnie 7 dni)"  value={stats.newUsersWeek} />
            <StatCard icon={TrendingUp}  label="Nowe subskrypcje (7 dni)" value={stats.newSubscriptionsWeek} accent />
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-dim)] mb-4">Ostatnio zarejestrowani (10)</p>
            <div className="divide-y divide-[var(--border)]">
              {recentUsers.length === 0 && <p className="text-xs text-[var(--text-dim)] py-4 text-center">Brak danych</p>}
              {recentUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between py-3">
                  <span className="text-sm font-bold text-[var(--text)] truncate flex-1 pr-4">{u.email}</span>
                  <span className="text-[10px] text-[var(--text-dim)] font-bold shrink-0 mr-4">{formatDate(u.createdAt)}</span>
                  <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full shrink-0 ${u.plan && u.plan !== 'free' ? 'bg-[var(--bg-input)]' : 'bg-[var(--bg-input)] text-[var(--text-dim)]'}`}
                    style={u.plan && u.plan !== 'free' ? { color: ACCENT } : {}}>
                    {u.plan || 'free'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-dim)] mb-4">Receptury do moderacji ({pendingRecipes.length})</p>
              {pendingRecipes.length === 0 ? (
                <p className="text-xs text-[var(--text-dim)] py-4 text-center font-bold uppercase">Brak receptur</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {pendingRecipes.map(r => (
                    <div key={r.id} className="flex items-center justify-between p-3 bg-[var(--bg)] border border-[var(--border)] rounded-2xl">
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="font-bold text-sm text-[var(--text)] truncate">{r.name}</p>
                        <p className="text-[10px] text-[var(--text-dim)]">{userEmailMap[r.ownerId] || r.ownerId}</p>
                      </div>
                      <button onClick={() => handleBlockRecipe(r.id, true)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-900/20 text-red-400 rounded-xl text-[9px] font-black uppercase hover:bg-red-600 hover:text-white transition-all shrink-0">
                        <Lock size={10} /> Zablokuj
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-dim)] mb-4">Aktywne reklamy ({activeAdsDashboard.length})</p>
              {activeAdsDashboard.length === 0 ? (
                <p className="text-xs text-[var(--text-dim)] py-4 text-center font-bold uppercase">Brak aktywnych reklam</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {activeAdsDashboard.map(ad => (
                    <div key={ad.id} className="flex items-center gap-3 p-3 bg-[var(--bg)] border border-[var(--border)] rounded-2xl">
                      {ad.imageUrl && <img src={ad.imageUrl} alt="" className="w-10 h-10 object-cover rounded-xl shrink-0" />}
                      <p className="text-sm text-[var(--text)] flex-1 truncate">{ad.title || ad.content}</p>
                      <button onClick={() => updateDoc(doc(db, 'ads', ad.id), { active: false })}
                        className="flex items-center gap-1 px-3 py-1.5 bg-[var(--bg-input)] text-[var(--text-dim)] rounded-xl text-[9px] font-black uppercase hover:opacity-70 transition-all shrink-0">
                        <Megaphone size={10} /> Wyłącz
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-dim)] mb-4">Szybkie akcje</p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => onAddRecipe?.()}
                className="flex items-center gap-2 px-5 py-3 text-white rounded-2xl text-xs font-black uppercase transition-all"
                style={{ background: ACCENT }}>
                <Plus size={14} /> Dodaj recepturę wzorcową
              </button>
              <button onClick={() => { setAdminSubTab('ads'); openNewAdForm(); }}
                className="flex items-center gap-2 px-5 py-3 bg-[var(--bg-input)] text-[var(--text-dim)] rounded-2xl text-xs font-black uppercase hover:opacity-70 hover:text-[var(--text)] transition-all">
                <Megaphone size={14} /> Dodaj reklamę
              </button>
              <button onClick={exportUsersCSV}
                className="flex items-center gap-2 px-5 py-3 bg-[var(--bg-input)] text-[var(--text-dim)] rounded-2xl text-xs font-black uppercase hover:opacity-70 hover:text-[var(--text)] transition-all">
                <Download size={14} /> Eksportuj użytkowników
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UŻYTKOWNICY */}
      {adminSubTab === 'users' && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[3rem] p-6 md:p-10 shadow-xl">
          <div className="divide-y divide-[var(--border)]">
            {allUsers.map(u => {
              const calcState = userCalcState[u.id] || { calc: 'piekarz', plan: 'free' };
              const calcPlans = u.calculatorPlans || {};
              return (
                <React.Fragment key={u.id}>
                  <div className="flex items-center justify-between py-5 cursor-pointer hover:bg-[var(--bg)] px-2 -mx-2 rounded-2xl transition-colors"
                    onClick={() => handleToggleUser(u.id)}>
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {expandedUserId === u.id
                        ? <ChevronDown size={14} className="text-[var(--text-dim)] shrink-0" />
                        : <ChevronRight size={14} className="text-[var(--text-dim)] shrink-0" />}
                      <span className="font-bold text-[var(--text)] text-sm truncate">{u.email}</span>
                      {u.isAdmin && <span className="text-[8px] font-black px-2 py-0.5 rounded-full uppercase shrink-0" style={{ background: 'rgba(200,134,10,0.2)', color: ACCENT }}>Admin</span>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-4" onClick={e => e.stopPropagation()}>
                      <select value={u.plan || 'free'} onChange={e => updatePlayerPlan(u.id, e.target.value)}
                        className="bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] p-2 rounded-xl text-[10px] font-black uppercase outline-none">
                        <option value="free">Free</option>
                        <option value="mini">Mini</option>
                        <option value="midi">Midi</option>
                        <option value="maxi">Maxi</option>
                        <option value="vip">VIP</option>
                        {u.plan === 'max' && <option value="max">Max (legacy)</option>}
                      </select>
                      {u.email !== SUPER_ROOT ? (
                        <>
                          <button onClick={() => toggleAdmin(u.id, u.isAdmin)}
                            className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase`}
                            style={u.isAdmin ? { background: 'rgba(200,134,10,0.2)', color: ACCENT } : { background: 'var(--bg-input)', color: 'var(--text-dim)' }}>
                            {u.isAdmin ? 'Odbierz' : 'Admin'}
                          </button>
                          <button onClick={() => deleteUserAccount(u.id, u.email)}
                            className="p-2 bg-red-900/20 text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-colors" title="Usuń użytkownika">
                            <Trash2 size={15} />
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] font-black uppercase px-3" style={{ color: ACCENT }}>Właściciel</span>
                      )}
                    </div>
                  </div>

                  {expandedUserId === u.id && (
                    <>
                      <div className="bg-[var(--bg)] border border-[var(--border)] rounded-2xl p-4 mt-1 mb-2 mx-1">
                        <p className="text-[9px] font-black text-[var(--text-dim)] uppercase tracking-widest mb-3">Kalkulatory</p>
                        {CALC_OPTIONS.some(c => calcPlans[c.value]?.plan) && (
                          <div className="space-y-1.5 mb-4">
                            {CALC_OPTIONS.map(c => {
                              const cp = calcPlans[c.value];
                              if (!cp?.plan) return null;
                              return (
                                <div key={c.value} className="flex items-center justify-between text-[10px] px-3 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl">
                                  <span className="text-[var(--text-dim)] font-bold">{c.label}</span>
                                  <span className={`font-black uppercase px-2 py-0.5 rounded-full text-[9px]`}
                                    style={cp.plan !== 'free' ? { background: 'rgba(200,134,10,0.2)', color: ACCENT } : { background: 'var(--bg-input)', color: 'var(--text-dim)' }}>
                                    {cp.plan}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <select value={calcState.calc}
                            onChange={e => setUserCalcState(prev => ({ ...prev, [u.id]: { ...calcState, calc: e.target.value } }))}
                            className="flex-1 bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text)] p-2 rounded-xl text-[10px] font-black uppercase outline-none">
                            {CALC_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                          </select>
                          <select value={calcState.plan}
                            onChange={e => setUserCalcState(prev => ({ ...prev, [u.id]: { ...calcState, plan: e.target.value } }))}
                            className="flex-1 bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text)] p-2 rounded-xl text-[10px] font-black uppercase outline-none">
                            {PLAN_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                          <button onClick={() => handleSaveCalculatorPlan(u.id, calcState.calc, calcState.plan)}
                            className="flex items-center gap-1.5 px-3 py-2 text-white rounded-xl text-[10px] font-black uppercase transition-all shrink-0"
                            style={{ background: ACCENT }}>
                            <Save size={11} /> Zapisz
                          </button>
                        </div>
                      </div>

                      <div className="bg-[var(--bg)] border border-[var(--border)] rounded-2xl p-4 mb-3 mx-1">
                        <p className="text-[9px] font-black text-[var(--text-dim)] uppercase tracking-widest mb-3">Receptury użytkownika</p>
                        {!userRecipesMap[u.id] ? (
                          <p className="text-xs text-[var(--text-dim)] py-4 text-center">Ładowanie…</p>
                        ) : userRecipesMap[u.id].length === 0 ? (
                          <p className="text-xs text-[var(--text-dim)] py-4 text-center font-bold uppercase">Brak receptur</p>
                        ) : (
                          <div className="space-y-2">
                            {userRecipesMap[u.id].map(r => (
                              <div key={r.id} className={`flex items-center justify-between p-3 rounded-xl border ${r.blocked ? 'bg-red-900/20 border-red-900/30' : 'bg-[var(--bg-card)] border-[var(--border)]'}`}>
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-sm text-[var(--text)] truncate">{r.name}</p>
                                  {r.blocked && <span className="text-[8px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full uppercase">Zablokowana</span>}
                                  <p className="text-[10px] text-[var(--text-dim)] font-bold uppercase tracking-wider mt-0.5">{r.category}</p>
                                </div>
                                <div className="flex items-center gap-2 ml-3 shrink-0">
                                  <button onClick={() => setPreviewRecipe(r)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-input)] text-[var(--text-dim)] rounded-xl text-[10px] font-black uppercase hover:opacity-70 transition-all">
                                    <Eye size={11} /> Podgląd
                                  </button>
                                  {r.blocked ? (
                                    <button onClick={() => handleBlockRecipe(r.id, false)}
                                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-900/30 text-green-400 rounded-xl text-[10px] font-black uppercase hover:bg-green-700 hover:text-white transition-all">
                                      <Unlock size={11} /> Odblokuj
                                    </button>
                                  ) : (
                                    <button onClick={() => handleBlockRecipe(r.id, true)}
                                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/20 text-red-400 rounded-xl text-[10px] font-black uppercase hover:bg-red-600 hover:text-white transition-all">
                                      <Lock size={11} /> Zablokuj
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* KATEGORIE */}
      {adminSubTab === 'categories' && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-dim)]">
              Kategorie receptur ({catsState.length})
            </p>
            <button
              onClick={seedDefaultCats}
              className="flex items-center gap-2 px-5 py-3 text-white rounded-2xl text-xs font-black uppercase transition-all shadow"
              style={{ background: ACCENT }}
            >
              <Plus size={14} /> Dodaj domyślne
            </button>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[2.5rem] p-6 space-y-3">
            <div className="flex gap-2">
              <input
                className={inputCls}
                placeholder="Nowa kategoria..."
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCategory()}
              />
              <button
                onClick={addCategory}
                className="flex items-center gap-1.5 px-5 py-3 text-white rounded-xl text-xs font-black uppercase shrink-0 transition-all"
                style={{ background: ACCENT }}
              >
                <Plus size={14} /> Dodaj
              </button>
            </div>

            {catsLoading ? (
              <p className="text-xs text-[var(--text-dim)] py-4 text-center font-bold uppercase">Ładowanie…</p>
            ) : catsState.length === 0 ? (
              <p className="text-xs text-[var(--text-dim)] py-4 text-center font-bold uppercase">Brak kategorii</p>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {catsState.map(cat => (
                  <div key={cat.id} className="flex items-center justify-between py-3 px-1">
                    <span className="font-bold text-sm text-[var(--text)]">{cat.name}</span>
                    <button
                      onClick={() => deleteCategory(cat.id)}
                      className="p-2 bg-red-900/20 text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                      title="Usuń kategorię"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* REKLAMY */}
      {adminSubTab === 'ads' && (
        <div className="space-y-6">
          {showAdForm && (
            <div className="bg-[var(--bg-card)] border rounded-[2.5rem] p-8 shadow-xl" style={{ borderColor: `${ACCENT}66` }}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black uppercase text-[var(--text)]">
                  {editAdId ? 'Edytuj reklamę' : 'Nowa reklama'}
                </h3>
                <button onClick={closeAdForm} className="p-2 bg-[var(--bg-input)] text-[var(--text-dim)] rounded-xl hover:text-[var(--text)] transition-colors"><X size={16} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-dim)] mb-1">Tytuł reklamy *</label>
                  <input className={inputCls} placeholder="Wpisz tytuł..." value={adForm.title}
                    onChange={e => setAdForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-dim)] mb-1">Zdjęcie banera</label>
                  <div className="flex gap-2">
                    <input className={inputCls} placeholder="https://... lub wgraj plik →" value={adForm.imageUrl}
                      onChange={e => setAdForm(f => ({ ...f, imageUrl: e.target.value }))} />
                    <label className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-xs font-black uppercase cursor-pointer shrink-0 transition-all bg-[var(--bg-input)] text-[var(--text-dim)] hover:opacity-70">
                      <ImageIcon size={13} />
                      {uploadingImg ? 'Wgrywam…' : 'Wgraj'}
                      <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleUploadImage} disabled={uploadingImg} />
                    </label>
                  </div>
                  {adForm.imageUrl && (
                    <img src={adForm.imageUrl} alt="Podgląd" className="mt-2 h-20 object-cover rounded-xl border border-[var(--border)]" />
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-dim)] mb-1">Link docelowy lub PDF</label>
                  <div className="flex gap-2">
                    <input className={inputCls} placeholder="https://... lub wgraj PDF →" value={adForm.targetUrl}
                      onChange={e => setAdForm(f => ({ ...f, targetUrl: e.target.value }))} />
                    <label className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-xs font-black uppercase cursor-pointer shrink-0 transition-all bg-[var(--bg-input)] text-[var(--text-dim)] hover:opacity-70">
                      <FileText size={13} />
                      {uploadingPdf ? 'Wgrywam…' : 'PDF'}
                      <input type="file" accept="application/pdf" className="hidden" onChange={handleUploadPdf} disabled={uploadingPdf} />
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-dim)] mb-1">Data rozpoczęcia</label>
                    <input type="date" className={inputCls} value={adForm.startDate}
                      onChange={e => setAdForm(f => ({ ...f, startDate: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-dim)] mb-1">Data zakończenia</label>
                    <input type="date" className={inputCls} value={adForm.endDate}
                      onChange={e => setAdForm(f => ({ ...f, endDate: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-dim)] mb-2">Kalkulatory</label>
                  <div className="flex flex-wrap gap-5">
                    {CALC_OPTIONS.map(c => (
                      <label key={c.value} className="flex items-center gap-2 cursor-pointer select-none">
                        <input type="checkbox" checked={(adForm.calculators || []).includes(c.value)}
                          onChange={() => toggleAdCalc(c.value)} className="w-4 h-4" style={{ accentColor: ACCENT }} />
                        <span className="text-sm font-bold text-[var(--text)]">{c.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <button onClick={() => setAdForm(f => ({ ...f, active: !f.active }))}
                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase transition-all border ${adForm.active ? 'bg-green-900/20 text-green-400 border-green-900/30' : 'bg-[var(--bg-input)] text-[var(--text-dim)] border-[var(--border)]'}`}>
                    <div className={`w-3 h-3 rounded-full ${adForm.active ? 'bg-green-400' : 'bg-[var(--text-dim)]'}`} />
                    {adForm.active ? 'Aktywna' : 'Nieaktywna'}
                  </button>
                  <div className="flex gap-2">
                    <button onClick={closeAdForm} className="px-6 py-3 bg-[var(--bg-input)] text-[var(--text-dim)] rounded-2xl text-xs font-black uppercase hover:opacity-70 transition-all">
                      Anuluj
                    </button>
                    <button onClick={handleSaveAd} className="px-6 py-3 text-white rounded-2xl text-xs font-black uppercase transition-all" style={{ background: ACCENT }}>
                      {editAdId ? 'Zapisz zmiany' : 'Dodaj reklamę'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex bg-[var(--bg)] border border-[var(--border)] p-1 rounded-2xl">
              <button onClick={() => setAdSubTab('active')}
                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${adSubTab === 'active' ? 'bg-[var(--bg-card)] shadow' : 'text-[var(--text-dim)]'}`}
                style={adSubTab === 'active' ? { color: ACCENT } : {}}>
                Aktywne ({activeAdsList.length})
              </button>
              <button onClick={() => setAdSubTab('archive')}
                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${adSubTab === 'archive' ? 'bg-[var(--bg-card)] shadow' : 'text-[var(--text-dim)]'}`}
                style={adSubTab === 'archive' ? { color: ACCENT } : {}}>
                Archiwum ({archiveAdsList.length})
              </button>
            </div>
            {!showAdForm && (
              <button onClick={openNewAdForm}
                className="flex items-center gap-2 px-5 py-3 text-white rounded-2xl text-xs font-black uppercase transition-all shadow-lg"
                style={{ background: ACCENT }}>
                <Plus size={14} /> Nowa reklama
              </button>
            )}
          </div>

          {(adSubTab === 'active' ? activeAdsList : archiveAdsList).length === 0 ? (
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-10 text-center">
              <p className="text-xs text-[var(--text-dim)] font-bold uppercase">
                {adSubTab === 'active' ? 'Brak aktywnych reklam' : 'Archiwum jest puste'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {(adSubTab === 'active' ? activeAdsList : archiveAdsList).map(ad => {
                const endMs   = ad.endDate?.seconds  ? ad.endDate.seconds * 1000  : null;
                const startMs = ad.startDate?.seconds ? ad.startDate.seconds * 1000 : null;
                const isExpired  = endMs && endMs < now;
                const isUpcoming = startMs && startMs > now;
                const isPdf = ad.targetUrl?.toLowerCase().endsWith('.pdf');
                const adCalcs = ad.calculators || [];

                return (
                  <div key={ad.id} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-5 transition-all">
                    <div className="flex items-start gap-4">
                      {ad.imageUrl ? (
                        <img src={ad.imageUrl} alt="" className="w-16 h-16 object-cover rounded-2xl shrink-0 border border-[var(--border)]" />
                      ) : (
                        <div className="w-16 h-16 bg-[var(--bg)] rounded-2xl shrink-0 border border-[var(--border)] flex items-center justify-center">
                          <ImageIcon size={20} className="text-[var(--text-dim)]" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-black text-[var(--text)] text-sm truncate">{ad.title || ad.content || '—'}</p>
                          {isExpired ? (
                            <span className="text-[8px] font-black bg-[var(--bg-input)] text-[var(--text-dim)] px-2 py-0.5 rounded-full uppercase shrink-0">Wygasła</span>
                          ) : isUpcoming ? (
                            <span className="text-[8px] font-black bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded-full uppercase shrink-0">Zaplanowana</span>
                          ) : ad.active ? (
                            <span className="text-[8px] font-black bg-green-900/30 text-green-400 px-2 py-0.5 rounded-full uppercase shrink-0">Aktywna</span>
                          ) : (
                            <span className="text-[8px] font-black bg-[var(--bg-input)] text-[var(--text-dim)] px-2 py-0.5 rounded-full uppercase shrink-0">Wyłączona</span>
                          )}
                        </div>
                        {adCalcs.length > 0 && (
                          <div className="flex gap-1 flex-wrap mt-1">
                            {adCalcs.map(c => {
                              const label = CALC_OPTIONS.find(o => o.value === c)?.label || c;
                              return (
                                <span key={c} className="text-[8px] font-black bg-[var(--bg-input)] text-[var(--text-dim)] px-2 py-0.5 rounded-full uppercase">{label}</span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {adSubTab === 'archive' ? (
                          <button onClick={() => updateDoc(doc(db, 'ads', ad.id), { archived: false, active: true, endDate: null })}
                            className="flex items-center gap-1.5 px-3 py-2 bg-green-900/20 text-green-400 rounded-xl text-[9px] font-black uppercase hover:bg-green-700 hover:text-white transition-all">
                            <RotateCcw size={10} /> Przywróć
                          </button>
                        ) : (
                          <>
                            <button onClick={() => openEditAdForm(ad)}
                              className="p-2.5 bg-[var(--bg-input)] text-[var(--text-dim)] rounded-xl hover:opacity-70 hover:text-[var(--text)] transition-all">
                              <Edit2 size={13} />
                            </button>
                            <button onClick={() => updateDoc(doc(db, 'ads', ad.id), { active: !ad.active })}
                              className={`p-2.5 rounded-xl transition-all ${ad.active ? 'bg-green-900/20 text-green-400 hover:bg-green-700 hover:text-white' : 'bg-[var(--bg-input)] text-[var(--text-dim)] hover:opacity-70'}`}>
                              <Megaphone size={13} />
                            </button>
                            <button onClick={() => updateDoc(doc(db, 'ads', ad.id), { archived: true, active: false })}
                              className="p-2.5 bg-[var(--bg-input)] text-[var(--text-dim)] rounded-xl hover:bg-orange-700 hover:text-white transition-all">
                              <Archive size={13} />
                            </button>
                            <button onClick={() => deleteDoc(doc(db, 'ads', ad.id))}
                              className="p-2.5 bg-red-900/20 text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-all">
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL PODGLĄDU RECEPTURY */}
      {previewRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          style={{ background: 'var(--bg-overlay-soft)' }}
          onClick={() => setPreviewRecipe(null)}>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[2.5rem] w-full max-w-lg max-h-[85vh] overflow-y-auto p-8 relative"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-5">
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="text-xl font-black text-[var(--text)]">{previewRecipe.name}</h3>
                  {previewRecipe.blocked && <span className="text-[8px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full uppercase">Zablokowana</span>}
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: ACCENT }}>{previewRecipe.category}</p>
              </div>
              <button onClick={() => setPreviewRecipe(null)} className="p-2 bg-[var(--bg-input)] text-[var(--text-dim)] hover:text-[var(--text)] rounded-xl shrink-0 transition-colors">
                <X size={16} />
              </button>
            </div>

            {previewRecipe.imageUrl && <img src={previewRecipe.imageUrl} className="w-full h-40 object-cover rounded-2xl mb-5" alt="" />}

            {previewRecipe.flours?.length > 0 && (
              <div className="mb-5">
                <p className="text-[9px] font-black text-[var(--text-dim)] uppercase tracking-widest mb-3">Mąka</p>
                <div className="space-y-2">
                  {previewRecipe.flours.map((f, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl">
                      <p className="font-bold text-sm text-[var(--text)]">{f.name}</p>
                      <span className="font-black text-[var(--text)] text-sm">{f.percent}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {previewRecipe.ingredients?.length > 0 && (
              <div className="mb-5">
                <p className="text-[9px] font-black text-[var(--text-dim)] uppercase tracking-widest mb-3">Składniki</p>
                <div className="space-y-2">
                  {previewRecipe.ingredients.map((ing, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl">
                      <p className="font-bold text-sm text-[var(--text)]">{ing.name}</p>
                      <span className="font-black text-[var(--text)] text-sm">{ing.percent}% / {ing.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-5 border-t border-[var(--border)]">
              {previewRecipe.blocked ? (
                <button onClick={() => handleBlockRecipe(previewRecipe.id, false)}
                  className="w-full py-3 bg-green-600 text-white rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 hover:bg-green-700 transition-all">
                  <Unlock size={14} /> Odblokuj recepturę
                </button>
              ) : (
                <button onClick={() => handleBlockRecipe(previewRecipe.id, true)}
                  className="w-full py-3 bg-red-600 text-white rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 hover:bg-red-700 transition-all">
                  <Lock size={14} /> Zablokuj recepturę
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </main>
  );
};

export default AdminPanel;
