import { useEffect, useState } from 'react'
import { Route, Routes, Navigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Attendance from '@/pages/Attendance'
import Updates from '@/pages/Updates'
import Messages from '@/pages/Messages'
import Reports from '@/pages/Reports'
import Announcements from '@/pages/Announcements'

export default function App() {
  const [loading, setLoading] = useState(true)
  const [isAuthed, setIsAuthed] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession()
      setIsAuthed(!!data.session)
      setLoading(false)
    }
    init()
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(!!session)
    })
    return () => {
      sub.subscription.unsubscribe()
    }
  }, [])

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>

  if (!isAuthed) {
    return <Login />
  }

  return (
    <div className="app-shell">
      <header className="header">
        <div className="brand">
          <div className="brand-logo" aria-hidden="true" />
          <div className="brand-title">ABOGIDA</div>
        </div>
        <nav className="nav">
          <Link to="/">Home</Link>
          <Link to="/attendance">Attendance</Link>
          <Link to="/updates">Updates</Link>
          <Link to="/messages">Messages</Link>
          <Link to="/reports">Reports</Link>
          <Link to="/announcements">Announcements</Link>
          <button onClick={() => supabase.auth.signOut()}>Sign out</button>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/updates" element={<Updates />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
