import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '@/ui/theme/ThemeProvider'
import { supabase } from '@/lib/supabaseClient'

const NavLink: React.FC<{ to: string; label: string; icon?: React.ReactNode }> = ({ to, label, icon }) => {
  const loc = useLocation()
  const active = loc.pathname === to
  return (
    <Link to={to} className="nav-link" aria-label={label} aria-current={active ? 'page' : undefined} style={{
      textDecoration: 'none',
      color: 'var(--text)',
      padding: '10px 12px',
      borderRadius: 10,
      display: 'flex',
      gap: 10,
      alignItems: 'center',
      background: active ? 'rgba(99,102,241,0.12)' : 'transparent',
      border: active ? '1px solid var(--border)' : '1px solid transparent'
    }}>
      <span aria-hidden>{icon ?? '•'}</span>
      <span>{label}</span>
    </Link>
  )
}

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()

  const signOut = async () => {
    await supabase.auth.signOut()
    navigate('/', { replace: true })
  }
  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">Skip to content</a>
      <aside className="sidebar">
        <div className="brand">
          <img src="/images/logo.webp" alt="Abogida logo" style={{ width: 120, height: 'auto', borderRadius: 12, display:'block', aspectRatio: '500 / 178', maxHeight: 42.72 }} />
        </div>
        <nav className="nav-vertical">
          <NavLink to="/app" label="Dashboard" />
          <NavLink to="/app/classes" label="Classes" />
          <NavLink to="/app/students" label="Students" />
          <NavLink to="/app/attendance" label="Attendance" />
          <NavLink to="/app/updates" label="Daily Updates" />
          <NavLink to="/app/announcements" label="Announcements" />
          <NavLink to="/app/messages" label="Messages" />
          <NavLink to="/app/reports" label="Progress Reports" />
          <NavLink to="/app/settings" label="Settings" />
        </nav>
      </aside>
      <main id="main" className="content" tabIndex={-1}>
        <div className="topbar">
          <div />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={toggle} aria-label={theme === 'light' ? 'Activate dark mode' : 'Activate light mode'}>
              {theme === 'light' ? 'Dark mode' : 'Light mode'}
            </button>
            <button className="btn btn-secondary" onClick={signOut} aria-label="Sign out of Abogida">Sign out</button>
          </div>
        </div>
        {children}
      </main>
    </div>
  )
}
