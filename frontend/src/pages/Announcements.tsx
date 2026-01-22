import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function Announcements() {
  const [info, setInfo] = useState<string>('')
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setInfo(user ? 'Announcements coming soon.' : 'Please sign in')
    }
    load()
  }, [])
  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Announcements</h2>
        <p style={{ color: '#8aa0b6' }}>{info}</p>
        <p style={{ color: '#8aa0b6' }}>MVP will support school-wide or class-level announcements.</p>
      </div>
    </div>
  )
}
