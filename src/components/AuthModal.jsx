import React, { useState } from 'react';
import {
  GoogleAuthProvider, FacebookAuthProvider, signInWithPopup,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail
} from 'firebase/auth';
import { X } from 'lucide-react';
import { auth } from '../firebase';

const AuthModal = ({ onClose }) => {
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleGoogleLogin = async () => {
    try { await signInWithPopup(auth, new GoogleAuthProvider()); } catch (e) { alert(e.message); }
  };

  const handleFacebookLogin = async () => {
    try { await signInWithPopup(auth, new FacebookAuthProvider()); } catch (e) { alert(e.message); }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    try {
      if (authMode === 'register') await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (e) { alert(e.message); }
  };

  const handleResetPassword = async () => {
    if (!email) return alert("Wpisz e-mail!");
    try { await sendPasswordResetEmail(auth, email); alert("Link wysłany!"); } catch (e) { alert(e.message); }
  };

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl text-center animate-in fade-in duration-300"
      style={{ background: 'var(--bg-overlay)' }}
    >
      <div
        className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[3rem] p-10 md:p-14 max-w-md w-full relative shadow-2xl border-t-[16px]"
        style={{ borderTopColor: '#c8860a' }}
      >
        <button onClick={onClose} className="absolute top-8 right-8 text-[var(--text-dim)] hover:text-[var(--text)]"><X size={32} /></button>
        <div className="w-20 h-20 mx-auto mb-8 drop-shadow-xl"><img src="/logo.svg" alt="Logo" className="w-full h-full" /></div>
        <h2 className="text-3xl font-black uppercase tracking-tighter mb-4 italic text-[var(--text)] leading-none">Witaj w EBRA</h2>
        <div className="space-y-3">
          <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-4 border-2 border-[var(--border)] p-4 rounded-2xl font-black uppercase text-[10px] text-[var(--text)] hover:bg-[var(--bg)] transition-all">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="G" /> Google
          </button>
          <button onClick={handleFacebookLogin} className="w-full flex items-center justify-center gap-4 bg-[#1877F2] text-white p-4 rounded-2xl font-black uppercase text-[10px] shadow-lg hover:brightness-110 transition-all">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/facebook.svg" className="w-4 h-4" alt="F" /> Facebook
          </button>
        </div>
        <div className="relative my-10 border-t border-[var(--border)] flex justify-center text-center text-[var(--text-dim)] uppercase font-black text-[10px]">
          <span className="bg-[var(--bg-card)] px-4 -mt-2.5 tracking-widest leading-none">Lub E-mail</span>
        </div>
        <form onSubmit={handleEmailAuth} className="space-y-3 text-left text-[var(--text)]">
          <input type="email" required placeholder="E-mail" className="w-full border-2 border-[var(--border)] p-4 rounded-2xl font-bold bg-[var(--bg)] text-[var(--text)] placeholder-[var(--text-dim)] outline-none" style={{ '--tw-ring-color': '#c8860a' }} value={email} onChange={e => setEmail(e.target.value)}
            onFocus={e => e.target.style.borderColor = '#c8860a'} onBlur={e => e.target.style.borderColor = ''} />
          <div className="flex flex-col gap-2">
            <input type="password" required placeholder="Hasło" className="w-full border-2 border-[var(--border)] p-4 rounded-2xl font-bold bg-[var(--bg)] text-[var(--text)] placeholder-[var(--text-dim)] outline-none" value={password} onChange={e => setPassword(e.target.value)}
              onFocus={e => e.target.style.borderColor = '#c8860a'} onBlur={e => e.target.style.borderColor = ''} />
            <button type="button" onClick={handleResetPassword} className="text-left text-[9px] font-bold uppercase px-4 leading-none" style={{ color: '#c8860a' }}>Zapomniałeś hasła?</button>
          </div>
          <button type="submit" className="w-full text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl active:scale-95 transition-all mt-4" style={{ background: '#c8860a' }}>
            {authMode === 'login' ? 'Zaloguj się' : 'Załóż konto'}
          </button>
        </form>
        <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="mt-8 text-[10px] font-bold uppercase underline tracking-widest text-center" style={{ color: '#c8860a' }}>
          {authMode === 'login' ? 'Nie masz konta? Zarejestruj się' : 'Masz już konto? Zaloguj się'}
        </button>
      </div>
    </div>
  );
};

export default AuthModal;
