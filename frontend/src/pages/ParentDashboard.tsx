import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function ParentDashboard() {
  const [summary, setSummary] = useState<{ children: number; announcements: number } | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: p } = await supabase.from('parents').select('id').eq('user_id', user.id).maybeSingle()
      if (!p?.id) return
      const { count: kids } = await supabase.from('parent_students').select('*', { count: 'exact', head: true }).eq('parent_id', p.id)
      const { data: schoolRow } = await supabase.from('users').select('school_id').eq('id', user.id).maybeSingle()
      const { count: ann } = await supabase.from('announcements').select('*', { count: 'exact', head: true }).eq('school_id', schoolRow?.school_id)
      setSummary({ children: kids ?? 0, announcements: ann ?? 0 })
    }
    load()
  }, [])

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Parent Dashboard</h2>
        {!summary ? (
          <div className="skeleton" style={{ height: 18, width: 220, borderRadius: 8 }} />
        ) : (
          <div className="grid cols-2">
            <div className="card"><strong>My Children</strong><div className="helper">{summary.children}</div></div>
            <div className="card"><strong>Announcements</strong><div className="helper">{summary.announcements}</div></div>
          </div>
        )}
      </div>
    </div>
  )
}
