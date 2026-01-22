import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
        setProfile(data)
      }
    }
    load()
  }, [])

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Welcome</h2>
        {profile ? (
          <div style={{ color: '#8aa0b6' }}>
            <div><strong>Name:</strong> {profile.full_name ?? 'Unknown'}</div>
            <div><strong>Role:</strong> {profile.role_key}</div>
            <div><strong>Language:</strong> {profile.language_preference}</div>
          </div>
        ) : (
          <p style={{ color: '#8aa0b6' }}>Loading profile...</p>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Quick Links</h3>
        <div className="grid cols-3">
          <Link to="/attendance" className="link-card card">
            <h4>Attendance</h4>
            <p>Mark and review daily attendance</p>
          </Link>
          <Link to="/updates" className="link-card card">
            <h4>Updates Feed</h4>
            <p>Post updates and view class feed</p>
          </Link>
          <Link to="/messages" className="link-card card">
            <h4>Messages</h4>
            <p>1:1 parent-teacher messages</p>
          </Link>
          <Link to="/reports" className="link-card card">
            <h4>Progress Reports</h4>
            <p>Upload and review student reports</p>
          </Link>
          <Link to="/announcements" className="link-card card">
            <h4>Announcements</h4>
            <p>School or class announcements</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
