import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function TeacherDashboard() {
  const [summary, setSummary] = useState<{ classes: number; updates: number } | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: t } = await supabase.from('teachers').select('id').eq('user_id', user.id).maybeSingle()
      if (!t?.id) return
      const { count: classes } = await supabase.from('classes').select('*', { count: 'exact', head: true }).eq('teacher_id', t.id)
      const { count: updates } = await supabase.from('daily_updates').select('*', { count: 'exact', head: true }).eq('teacher_id', t.id)
      setSummary({ classes: classes ?? 0, updates: updates ?? 0 })
    }
    load()
  }, [])

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Teacher Dashboard</h2>
        {!summary ? (
          <div className="skeleton" style={{ height: 18, width: 220, borderRadius: 8 }} />
        ) : (
          <div className="grid cols-2">
            <div className="card"><strong>My Classes</strong><div className="helper">{summary.classes}</div></div>
            <div className="card"><strong>Updates Posted</strong><div className="helper">{summary.updates}</div></div>
          </div>
        )}
      </div>
    </div>
  )
}
