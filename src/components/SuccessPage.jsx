import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { CheckCircle2, Loader2 } from 'lucide-react';
import useTheme from '../hooks/useTheme';

const PLAN_LABELS = { mini: 'Mini', midi: 'Midi', maxi: 'Maxi', vip: 'VIP' };

const SuccessPage = () => {
  useTheme();

  const params  = new URLSearchParams(window.location.search);
  const plan    = params.get('plan') || '';
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      unsub();
      if (!user) { setStatus('noauth'); return; }
      try {
        await updateDoc(doc(db, 'users', user.uid), { plan });
        setStatus('ok');
      } catch {
        setStatus('error');
      }
    });
  }, [plan]);

  const goHome = () => { window.location.href = '/'; };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-6">
      <div className="bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border)] shadow-xl p-8 max-w-sm w-full text-center">
        <img src="/logo.svg" alt="Logo" className="w-16 h-10 object-contain mx-auto mb-6" />

        {status === 'loading' && (
          <>
            <Loader2 size={40} className="mx-auto mb-4 animate-spin" style={{ color: '#c8860a' }} />
            <p className="font-bold text-[var(--text-dim)] text-sm">Aktywuję plan…</p>
          </>
        )}

        {status === 'ok' && (
          <>
            <CheckCircle2 size={48} className="mx-auto mb-4 text-green-500" />
            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-[var(--text)] mb-2">
              Dziękujemy!
            </h2>
            <p className="text-sm text-[var(--text-dim)] font-medium mb-1">
              Plan <span className="font-black" style={{ color: '#c8860a' }}>{PLAN_LABELS[plan] || plan.toUpperCase()}</span> został aktywowany.
            </p>
            <p className="text-xs text-[var(--text-dim)] mb-8">Miłego korzystania z Piekarski Master!</p>
            <button onClick={goHome} className="w-full text-white py-3 rounded-2xl font-black uppercase text-sm transition-all shadow-lg" style={{ background: '#c8860a' }}>
              Przejdź do aplikacji
            </button>
          </>
        )}

        {status === 'noauth' && (
          <>
            <p className="font-bold text-[var(--text)] mb-2 text-sm">Zaloguj się, aby aktywować plan.</p>
            <button onClick={goHome} className="w-full text-white py-3 rounded-2xl font-black uppercase text-sm transition-all" style={{ background: '#c8860a' }}>
              Zaloguj się
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <p className="font-bold text-red-600 mb-2 text-sm">Coś poszło nie tak. Skontaktuj się z obsługą.</p>
            <button onClick={goHome} className="w-full bg-[var(--bg-input)] text-[var(--text)] py-3 rounded-2xl font-black uppercase text-sm hover:opacity-70 transition-all">
              Powrót
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default SuccessPage;
