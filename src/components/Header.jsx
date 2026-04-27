import React from 'react';
import { LayoutDashboard, Cog } from 'lucide-react';

const Header = ({ user, userProfile, activeTab, setActiveTab, setIsAuthModalOpen, theme, toggleTheme }) => (
  <header className="no-print bg-[var(--bg-card)] border-b border-[var(--border)] px-4 py-3 flex justify-between items-center sticky top-0 z-40 relative">
    <a
      href="https://www.ebra.pl"
      className="flex items-center gap-2 cursor-pointer select-none no-underline"
      style={{ textDecoration: 'none' }}
    >
      <Cog
        size={26}
        color="#c9a227"
        strokeWidth={1.75}
        style={{ animation: 'ebra-gear-spin 8s linear infinite', flexShrink: 0 }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1, gap: '2px' }}>
        <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: '1.2rem', letterSpacing: '0.06em', color: 'var(--text)' }}>
          EBRA
        </span>
        <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-dim)' }}>
          Kalkulatory
        </span>
      </div>
    </a>

    <img
      src="/logo_piekarz.png"
      alt="Piekarski Master"
      style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', width: 40, height: 40, objectFit: 'contain' }}
    />

    <div className="flex items-center gap-2">
      <button
        onClick={toggleTheme}
        className="p-2 rounded-xl text-[var(--text-dim)] hover:text-[var(--text)] transition-colors text-base leading-none"
        aria-label="Przełącz motyw"
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      {userProfile?.isAdmin && (
        <button
          onClick={() => setActiveTab(activeTab === 'superadmin' ? 'recipes' : 'superadmin')}
          className={`p-2 rounded-xl transition-colors ${
            activeTab === 'superadmin' ? 'text-white' : 'text-[var(--text-dim)] hover:text-[var(--text)]'
          }`}
          style={activeTab === 'superadmin' ? { background: '#c8860a' } : {}}
        >
          <LayoutDashboard size={18} />
        </button>
      )}
      {!user && (
        <button
          onClick={() => setIsAuthModalOpen(true)}
          className="text-white px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wide shadow-lg transition-colors"
          style={{ background: '#c8860a' }}
        >
          Zaloguj
        </button>
      )}
    </div>
  </header>
);

export default Header;
