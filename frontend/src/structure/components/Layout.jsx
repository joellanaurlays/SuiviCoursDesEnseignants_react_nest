import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  // referme le menu mobile quand on change de page
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <div className={`app-shell${menuOpen ? ' menu-open' : ''}`}>
      <header className="topbar">
        <button
          className="menu-btn"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Ouvrir le menu"
          aria-expanded={menuOpen}
        >
          <span />
          <span />
          <span />
        </button>
        <strong>Structure académique</strong>
      </header>
      <Sidebar />
      <div className="scrim" onClick={() => setMenuOpen(false)} />
      <main className="main" id="contenu">
        {children}
      </main>
    </div>
  );
}
