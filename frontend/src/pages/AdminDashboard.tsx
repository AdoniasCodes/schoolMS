import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function AdminDashboard() {
  const [stats, setStats] = useState<{ users: number; classes: number } | null>(null)

  useEffect(() => {
    const load = async () => {
      const { count: users } = await supabase.from('users').select('*', { count: 'exact', head: true })
      const { count: classes } = await supabase.from('classes').select('*', { count: 'exact', head: true })
      setStats({ users: users ?? 0, classes: classes ?? 0 })
    }
    load()
  }, [])

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Admin Overview</h2>
        {!stats ? (
          <div className="skeleton" style={{ height: 18, width: 220, borderRadius: 8 }} />
        ) : (
          <div className="grid cols-2">
            <div className="card"><strong>Users</strong><div className="helper">{stats.users}</div></div>
            <div className="card"><strong>Classes</strong><div className="helper">{stats.classes}</div></div>
          </div>
        )}
      </div>
    </div>
  )
}
