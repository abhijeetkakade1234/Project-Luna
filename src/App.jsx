import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { useStore } from './store/useStore';
import Dashboard from './views/Dashboard';
import Track from './views/Track';
import Journal from './views/Journal';
import Settings from './views/Settings';
import Setup from './views/Setup';
import { deriveCompanionTone, getCycleInfo } from './utils/cycle';
import { useEffect } from 'react';
import { Home, PlusCircle, BookOpen, Settings as SettingsIcon } from 'lucide-react';

function AppShell({ children }) {
  const profile = useStore((state) => state.profile);
  const logs = useStore((state) => state.logs);
  const drafts = useStore((state) => state.drafts);

  const cycle = getCycleInfo(profile);
  const companion = deriveCompanionTone(cycle, logs, drafts, profile);

  useEffect(() => {
    document.documentElement.style.setProperty('--companion-color', companion.color);
  }, [companion.color]);

  return (
    <div className="app-shell">
      <div className="shell-inner">
        <div className="topbar">
          <div className="brand">
            <div className="brand-mark" aria-hidden="true"></div>
            <div className="brand-text">
              <strong>Project Luna</strong>
              <span>Local-first, friendly, and private</span>
            </div>
          </div>
          <div className="status-pill">{profile.anonymousMode ? "Anonymous mode on" : "Logged In"}</div>
        </div>
        {children}
      </div>

      <nav className="tabbar" aria-label="Primary">
        <div className="tabbar-inner">
          <NavLink to="/" className={({ isActive }) => `tab-btn ${isActive ? 'is-active' : ''}`}>
            {({ isActive }) => (
              <>
                <Home size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span>Home</span>
              </>
            )}
          </NavLink>
          <NavLink to="/track" className={({ isActive }) => `tab-btn ${isActive ? 'is-active' : ''}`}>
            {({ isActive }) => (
              <>
                <PlusCircle size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span>Track</span>
              </>
            )}
          </NavLink>
          <NavLink to="/journal" className={({ isActive }) => `tab-btn ${isActive ? 'is-active' : ''}`}>
            {({ isActive }) => (
              <>
                <BookOpen size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span>Journal</span>
              </>
            )}
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => `tab-btn ${isActive ? 'is-active' : ''}`}>
            {({ isActive }) => (
              <>
                <SettingsIcon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span>Settings</span>
              </>
            )}
          </NavLink>
        </div>
      </nav>
    </div>
  );
}

function App() {
  const setupComplete = useStore((state) => state.setupComplete);

  useEffect(() => {
    document.body.dataset.mode = setupComplete ? 'app' : 'setup';
  }, [setupComplete]);

  if (!setupComplete) {
    return <Setup />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell><Dashboard /></AppShell>} />
        <Route path="/track" element={<AppShell><Track /></AppShell>} />
        <Route path="/journal" element={<AppShell><Journal /></AppShell>} />
        <Route path="/settings" element={<AppShell><Settings /></AppShell>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
