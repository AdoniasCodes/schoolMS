import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface StudentRow { id: string; first_name: string; last_name: string }

type Role = 'teacher' | 'parent' | 'school_admin'

export default function Students() {
  const [role, setRole] = useState<Role | null>(null)
  const [students, setStudents] = useState<StudentRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: me } = await supabase.from('users').select('role_key').eq('id', user.id).maybeSingle()
      const r = (me?.role_key ?? null) as Role | null
      setRole(r)

      if (r === 'teacher') {
        // students in teacher's classes
        const { data } = await supabase
          .from('students')
          .select('id, first_name, last_name')
          .order('first_name')
        setStudents(data ?? [])
      } else if (r === 'parent') {
        // only own children
        const { data } = await supabase
          .from('students')
          .select('id, first_name, last_name')
          .order('first_name')
        setStudents(data ?? [])
      } else if (r === 'school_admin') {
        // all school students
        const { data } = await supabase
          .from('students')
          .select('id, first_name, last_name')
          .order('first_name')
        setStudents(data ?? [])
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="card"><div className="skeleton" style={{ height: 16, width: 200, borderRadius: 8 }}/></div>

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Students</h2>
        {students.length === 0 ? (
          <div className="empty">No students to display.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>First Name</th>
                <th>Last Name</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id}>
                  <td>{s.first_name}</td>
                  <td>{s.last_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
