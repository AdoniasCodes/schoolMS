import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface ClassRow { id: string; name: string; grade_level: string | null }

type Role = 'teacher' | 'parent' | 'school_admin'

export default function Classes() {
  const [role, setRole] = useState<Role | null>(null)
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }
      const { data: me } = await supabase.from('users').select('role_key').eq('id', user.id).maybeSingle()
      const r = (me?.role_key ?? null) as Role | null
      setRole(r)

      if (r === 'teacher') {
        const { data: t } = await supabase.from('teachers').select('id').eq('user_id', user.id).maybeSingle()
        if (t?.id) {
          const { data } = await supabase.from('classes').select('id, name, grade_level').eq('teacher_id', t.id).order('name')
          setClasses(data ?? [])
        }
      } else if (r === 'parent') {
        // parent -> their children's classes
        const { data } = await supabase
          .from('classes')
          .select('id, name, grade_level')
          .order('name')
        setClasses(data ?? [])
      } else if (r === 'school_admin') {
        const { data } = await supabase
          .from('classes')
          .select('id, name, grade_level')
          .order('name')
        setClasses(data ?? [])
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="card"><div className="skeleton" style={{ height: 16, width: 160, borderRadius: 8 }}/></div>

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Classes</h2>
        {classes.length === 0 ? (
          <div className="empty">No classes yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              {classes.map(c => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.grade_level ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
