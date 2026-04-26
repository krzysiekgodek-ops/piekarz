import React, { useState, useEffect } from 'react';
import { signOut, sendPasswordResetEmail } from 'firebase/auth';
import { doc, deleteDoc, updateDoc, increment } from 'firebase/firestore';
import {
  Edit3, ChefHat, Trash2, Power, Heart, Plus, Lock,
  CheckCircle2, LayoutDashboard, Star
} from 'lucide-react';
import { auth, db, SUPER_ROOT } from '../firebase';
import { STRIPE_PLANS } from '../stripe';

const ACCENT = '#c8860a';

const DEFAULT_PLANS = {
  food: {
    free: { name: 'Free',  limit: 2   },
    mini: { name: 'Mini',  limit: 10  },
    midi: { name: 'Midi',  limit: 20  },
    maxi: { name: 'Maxi',  limit: 30  },
    max:  { name: 'Max',   limit: 30  },
    vip:  { name: 'VIP',   limit: 100 },
  },
};

const ClientPanel = ({
  user,
  userProfile,
  myRecipes       = [],
  favoriteRecipes = [],
  favoriteIds     = [],
  plans,
  accountView     = false,
  onSelectRecipe,
  onOpenRecipeModal,
  onToggleFavorite,
  setActiveTab,
}) => {

  const [isDark, setIsDark] = useState(
    () => document.documentElement.getAttribute('data-theme') !== 'light'
  );
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.getAttribute('data-theme') !== 'light');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const effectivePlan = userProfile?.isTrialActive ? 'vip' : (userProfile?.plan || 'free');
  const planSource    = plans?.food ?? DEFAULT_PLANS.food;
  const planData      = planSource[effectivePlan] ?? planSource.free;
  const recipeLimit   = planData.limit;
  const canAdd        = myRecipes.length < recipeLimit;

  const trialDaysLeft = (() => {
    if (!userProfile?.createdAt) return 0;
    const created = new Date(userProfile.createdAt);
    if (isNaN(created.getTime())) return 0;
    return Math.max(0, 21 - Math.floor((new Date() - created) / 86400000));
  })();

  const handleCheckout = (plan) => {
    if (!plan.paymentLink || !user) return;
    const url = new URL(plan.paymentLink);
    url.searchParams.set('client_reference_id', user.uid);
    url.searchParams.set('prefilled_email', user.email);
    window.open(url.toString(), '_blank');
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      alert('Link do resetowania hasła został wysłany na ' + user.email);
    } catch (e) { alert(e.message); }
  };

  const RecipeRow = ({ recipe, showFav = false }) => {
    const isAdminRecipe = recipe.ownerId === 'ADMIN';
    return (
      <div
        className="relative flex items-center justify-between p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-[1.5rem] hover:border-[var(--text-dim)] transition-all cursor-pointer"
        onClick={() => onSelectRecipe?.(recipe)}
      >
        {isAdminRecipe && (
          <span className="absolute -top-2 left-4 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-sm" style={{ background: ACCENT }}>
            <Heart size={8} fill="currentColor" /> Ulubiona
          </span>
        )}

        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center overflow-hidden shrink-0">
            {recipe.imageUrl
              ? <img src={recipe.imageUrl} className="w-full h-full object-cover" alt="" />
              : <ChefHat className="text-[var(--text-dim)]" size={20} />}
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-[var(--text)] truncate text-sm">{recipe.name}</h4>
            <span className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest">{recipe.category}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-2">
          {showFav && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(recipe.id); }}
              className="p-2 rounded-xl transition-all hover:bg-orange-900/20"
              style={{ color: ACCENT }}
              title="Usuń z ulubionych"
            >
              <Heart size={16} fill="currentColor" />
            </button>
          )}
          {recipe.ownerId === user?.uid && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onOpenRecipeModal?.(recipe); }}
                className="p-2 text-[var(--text-dim)] rounded-xl transition-all"
                onMouseEnter={e => e.currentTarget.style.color = ACCENT}
                onMouseLeave={e => e.currentTarget.style.color = ''}
              >
                <Edit3 size={15} />
              </button>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  if (window.confirm('Usunąć recepturę?')) {
                    await deleteDoc(doc(db, 'piekarz_recipes', recipe.id));
                    const countUpdate = { recipeCount: increment(-1) };
                    if (userProfile?.plan === 'vip') countUpdate.vipRecipesCount = increment(-1);
                    await updateDoc(doc(db, 'users', user.uid), countUpdate);
                  }
                }}
                className="p-2 text-[var(--text-dim)] hover:text-red-500 rounded-xl transition-all"
              >
                <Trash2 size={15} />
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  /* WIDOK: MOJE */
  if (!accountView) {
    return (
      <main className="max-w-lg mx-auto p-4 animate-in fade-in duration-300 text-left">

        <div className="mt-4 mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-[var(--text)]">Moje receptury</h2>
            <p className="text-xs text-[var(--text-dim)] mt-1 font-medium">
              {myRecipes.length} / {recipeLimit} receptur
            </p>
          </div>
          {canAdd ? (
            <button
              onClick={() => onOpenRecipeModal?.(null)}
              className="flex items-center gap-2 text-white px-4 py-2.5 rounded-xl font-black text-xs uppercase shadow-lg transition-all"
              style={{ background: ACCENT }}
            >
              <Plus size={14} /> Dodaj
            </button>
          ) : (
            <span className="text-[10px] font-black text-orange-400 uppercase bg-orange-900/20 px-3 py-2 rounded-xl border border-orange-900/30">
              Limit osiągnięty
            </span>
          )}
        </div>

        {myRecipes.length === 0 ? (
          <div className="text-center py-10 bg-[var(--bg-card)] border border-[var(--border)] rounded-[2rem] mb-6">
            <ChefHat size={36} className="mx-auto mb-3 text-[var(--text-dim)]" />
            <p className="font-bold text-sm text-[var(--text-dim)] uppercase">Nie masz jeszcze receptur</p>
            {canAdd && (
              <button
                onClick={() => onOpenRecipeModal?.(null)}
                className="mt-4 font-black text-xs uppercase underline underline-offset-4"
                style={{ color: ACCENT }}
              >
                Dodaj pierwszą
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3 mb-8">
            {myRecipes.map(r => <RecipeRow key={r.id} recipe={r} />)}
          </div>
        )}

        {favoriteRecipes.length > 0 && (
          <>
            <h3 className="text-lg font-black uppercase italic tracking-tighter text-[var(--text)] flex items-center gap-2 mb-4 mt-6">
              <Heart size={16} style={{ color: ACCENT }} fill={ACCENT} /> Ulubione receptury
            </h3>
            <div className="space-y-3">
              {favoriteRecipes.map(r => <RecipeRow key={r.id} recipe={r} showFav />)}
            </div>
          </>
        )}

        {favoriteRecipes.length === 0 && (
          <div className="mt-3 p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-[1.5rem] text-center">
            <Heart size={22} className="mx-auto mb-2 text-[var(--text-dim)]" />
            <p className="text-[11px] font-black text-[var(--text-dim)] uppercase tracking-widest">
              Dodaj ulubione klikając serduszko w zakładce Receptury
            </p>
          </div>
        )}
      </main>
    );
  }

  /* WIDOK: KONTO */
  return (
    <main className="max-w-lg mx-auto p-4 animate-in fade-in duration-300 text-left">
      <div className="space-y-4 mt-4">

        {/* Profil */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[2rem] p-5 flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg rotate-3 shrink-0" style={{ background: ACCENT }}>
            {user?.email?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-[var(--text)] truncate text-sm">{user?.email}</p>
            <p className="text-[10px] font-bold text-[var(--text-dim)] uppercase mt-1 tracking-wider">
              Dołączono: {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString('pl-PL') : '—'}
            </p>
          </div>
        </div>

        {/* Subskrypcja */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[2rem] p-5">
          <p className="text-[10px] font-black uppercase text-[var(--text-dim)] tracking-widest mb-4">Subskrypcja</p>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-[var(--text)]">Aktywny plan</span>
            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase shadow-sm ${
              userProfile?.isTrialActive
                ? 'text-white'
                : userProfile?.plan === 'free'
                  ? 'bg-[var(--bg-input)] text-[var(--text-dim)]'
                  : 'bg-green-600 text-white'
            }`} style={userProfile?.isTrialActive ? { background: ACCENT } : {}}>
              {userProfile?.isTrialActive ? 'Trial MAX' : (planData?.name || 'Free')}
            </span>
          </div>
          {userProfile?.isTrialActive && (
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[var(--text-dim)]">Pozostało w trialu</span>
              <span className="font-black text-orange-400 text-sm">
                {trialDaysLeft} {trialDaysLeft === 1 ? 'dzień' : 'dni'}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-[var(--text-dim)]">Wykorzystane receptury</span>
            <span className="font-black text-[var(--text)] text-sm">
              {myRecipes.length} / {recipeLimit}
            </span>
          </div>
          <div className="bg-[var(--bg)] rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${recipeLimit >= 9999 ? 5 : Math.min(100, (myRecipes.length / Math.max(1, recipeLimit)) * 100)}%`,
                background: myRecipes.length >= recipeLimit ? '#ef4444' : ACCENT,
              }}
            />
          </div>
        </div>

        {/* Kup plan */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[2rem] p-5">
          <p className="text-[10px] font-black uppercase text-[var(--text-dim)] tracking-widest mb-4">Kup plan roczny</p>
          <div className="space-y-3">
            {STRIPE_PLANS.map(plan => {
              const isActive = effectivePlan === plan.id;

              const cardStyle = isActive
                ? { background: ACCENT, borderColor: ACCENT, borderWidth: '2px', color: 'white' }
                : isDark
                  ? { background: '#1e1c18', borderColor: '#c8860a', borderWidth: '1px', borderLeftWidth: '3px', color: 'var(--text)' }
                  : { background: '#ffffff', borderColor: '#dddddd', borderWidth: '1px', color: '#000000' };

              const hoverBg    = isDark ? '#2a2720' : '#f5f5f5';
              const defaultBg  = isDark ? '#1e1c18' : '#ffffff';
              const descColor  = isActive ? 'rgba(255,255,255,0.85)' : isDark ? '#d4c9a8' : '#444444';
              const priceColor = isActive ? 'white' : isDark ? '#e8a020' : '#DC2626';
              const nameStyle  = isActive
                ? { fontWeight: 900, fontSize: '0.875rem' }
                : isDark
                  ? { fontWeight: 900, fontSize: '0.875rem' }
                  : { fontWeight: 800, fontSize: '0.95rem', color: '#000000' };
              const priceStyle = isActive
                ? { color: priceColor, fontWeight: 700, fontSize: '0.875rem' }
                : isDark
                  ? { color: priceColor, fontWeight: 700, fontSize: '0.875rem' }
                  : { color: priceColor, fontWeight: 700, fontSize: '1rem' };

              return (
                <button
                  key={plan.id}
                  onClick={() => handleCheckout(plan)}
                  disabled={!plan.paymentLink}
                  className="w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed"
                  style={cardStyle}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = hoverBg; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = defaultBg; }}
                >
                  <div className="flex items-center gap-3">
                    {plan.id === 'vip' && (
                      <Star size={14} className={isActive ? 'text-yellow-300' : 'text-yellow-500'} fill="currentColor" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="uppercase tracking-wide" style={nameStyle}>
                          {plan.label}
                        </p>
                        {isActive && (
                          <span className="text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border" style={{ color: '#c8860a', borderColor: '#c8860a', background: 'rgba(200,134,10,0.15)' }}>
                            Aktywny
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-bold" style={{ color: descColor }}>
                        {`do ${plan.limit} receptur`}{plan.scope ? ` · ${plan.scope}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={priceStyle}>{plan.price}</span>
                    {isActive && <CheckCircle2 size={15} />}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-[var(--text-dim)] text-center mt-4 leading-relaxed">
            Po opłaceniu subskrypcji plan zostanie aktywowany w ciągu kilku minut.
          </p>
        </div>

        {/* Zakupione kalkulatory */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[2rem] p-5">
          <p className="text-[10px] font-black uppercase text-[var(--text-dim)] tracking-widest mb-4">Zakupione kalkulatory</p>
          <div className="space-y-2">
            {(userProfile?.tools || ['piekarski']).map(tool => (
              <div key={tool} className="flex items-center gap-3 p-4 rounded-2xl border" style={{ background: '#1a2a1a', borderColor: '#2d4a2d' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(74,222,128,0.15)' }}>
                  <ChefHat size={15} style={{ color: '#4ade80' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm" style={{ color: '#ffffff', fontWeight: 600 }}>
                    {tool === 'piekarski' ? 'Piekarski Master' : tool}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#4ade80' }}>Aktywny</p>
                </div>
                <CheckCircle2 size={18} style={{ color: '#4ade80' }} className="shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Ustawienia */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[2rem] p-5">
          <p className="text-[10px] font-black uppercase text-[var(--text-dim)] tracking-widest mb-4">Ustawienia konta</p>
          <button
            onClick={handleResetPassword}
            className="w-full flex items-center justify-between p-4 bg-[var(--bg)] border border-[var(--border)] rounded-2xl font-bold text-[var(--text)] hover:border-[var(--text-dim)] transition-all text-sm group"
          >
            <div className="flex items-center gap-3">
              <Lock size={16} className="text-[var(--text-dim)]" />
              <span>Zmień hasło</span>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-dim)]">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>

        {userProfile?.isAdmin && (
          <button
            onClick={() => setActiveTab?.('superadmin')}
            className="w-full p-4 bg-[var(--bg-input)] text-[var(--text)] rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 hover:opacity-80 transition-all shadow-lg"
          >
            <LayoutDashboard size={16} /> Panel Administratora
          </button>
        )}

        <button
          onClick={() => signOut(auth)}
          className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl border font-black uppercase text-xs transition-all"
          style={{ background: 'rgba(200,134,10,0.1)', color: ACCENT, borderColor: 'rgba(200,134,10,0.3)' }}
          onMouseEnter={e => { e.currentTarget.style.background = ACCENT; e.currentTarget.style.color = 'white'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(200,134,10,0.1)'; e.currentTarget.style.color = ACCENT; }}
        >
          <Power size={16} /> Wyloguj się
        </button>

      </div>
    </main>
  );
};

export default ClientPanel;
