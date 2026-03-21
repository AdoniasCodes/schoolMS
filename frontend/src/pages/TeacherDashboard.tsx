import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'

interface ClassInfo { id: string; name: string; student_count: number; attendance_done: boolean }

export default function TeacherDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ classes: 0, students: 0, updatesThisWeek: 0, attendanceRate: null as number | null })
  const [myClasses, setMyClasses] = useState<ClassInfo[]>([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: t } = await supabase.from('teachers').select('id').eq('user_id', user.id).maybeSingle()
      if (!t?.id) { setLoading(false); return }

      const teacherId = t.id
      const today = new Date().toISOString().split('T')[0]
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()

      // Classes with enrollment counts
      const { data: classData } = await supabase
        .from('classes')
        .select('id, name, enrollments(id)')
        .eq('teacher_id', teacherId)
        .is('deleted_at', null)

      const classIds = (classData ?? []).map(c => c.id)

      // Today's attendance records for my classes
      const { data: attData } = classIds.length > 0
        ? await supabase.from('attendance').select('class_id, status').eq('date', today).in('class_id', classIds)
        : { data: [] }

      const attendedClassIds = new Set((attData ?? []).map(a => a.class_id))
      const totalStudents = (classData ?? []).reduce((sum: number, c: any) => sum + (c.enrollments?.length ?? 0), 0)

      const classInfos: ClassInfo[] = (classData ?? []).map((c: any) => ({
        id: c.id,
        name: c.name,
        student_count: c.enrollments?.length ?? 0,
        attendance_done: attendedClassIds.has(c.id),
      }))

      // Attendance rate today
      let attendanceRate: number | null = null
      if (attData && attData.length > 0) {
        const present = attData.filter(a => a.status === 'present').length
        attendanceRate = Math.round((present / attData.length) * 100)
      }

      // Updates this week
      const { count: weekUpdates } = await supabase
        .from('daily_updates')
        .select('*', { count: 'exact', head: true })
        .eq('teacher_id', teacherId)
        .gte('created_at', weekAgo)

      setStats({
        classes: classInfos.length,
        students: totalStudents,
        updatesThisWeek: weekUpdates ?? 0,
        attendanceRate,
      })
      setMyClasses(classInfos)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="card">
        <div className="skeleton" style={{ height: 18, width: 220, borderRadius: 8 }} />
        <div className="grid cols-2" style={{ marginTop: 12 }}>
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 60, borderRadius: 10 }} />)}
        </div>
      </div>
    </div>
  )

  const unattended = myClasses.filter(c => !c.attendance_done && c.student_count > 0)

  return (
    <div className="grid" style={{ gap: 16 }}>
      {/* Stats */}
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Teacher Dashboard</h2>
        <div className="grid cols-2" style={{ gap: 10 }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--primary)' }}>{stats.classes}</div>
            <div className="helper">My Classes</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--primary)' }}>{stats.students}</div>
            <div className="helper">My Students</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--primary)' }}>{stats.updatesThisWeek}</div>
            <div className="helper">Updates This Week</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: stats.attendanceRate != null ? 'var(--accent)' : 'var(--muted)' }}>
              {stats.attendanceRate != null ? `${stats.attendanceRate}%` : '—'}
            </div>
            <div className="helper">Today's Attendance</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid cols-3" style={{ gap: 10 }}>
        <Link to="/app/attendance" className="link-card card" style={{ textAlign: 'center', padding: 20 }}>
          <h4>Take Attendance</h4>
          <p>Mark today's attendance</p>
        </Link>
        <Link to="/app/updates" className="link-card card" style={{ textAlign: 'center', padding: 20 }}>
          <h4>Post Update</h4>
          <p>Share a daily update with parents</p>
        </Link>
        <Link to="/app/reports" className="link-card card" style={{ textAlign: 'center', padding: 20 }}>
          <h4>Progress Reports</h4>
          <p>Create student reports</p>
        </Link>
      </div>

      {/* Attendance nudge */}
      {unattended.length > 0 && (
        <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#92400e' }}>Attendance Not Taken</h4>
          <p className="helper" style={{ margin: 0 }}>
            {unattended.map(c => c.name).join(', ')} — <Link to="/app/attendance" style={{ color: 'var(--primary)' }}>Take attendance now</Link>
          </p>
        </div>
      )}

      {/* My Classes */}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>My Classes</h3>
        {myClasses.length === 0 ? (
          <div className="empty" style={{ padding: 16 }}>No classes assigned.</div>
        ) : (
          <table>
            <thead><tr><th>Class</th><th>Students</th><th>Attendance Today</th></tr></thead>
            <tbody>
              {myClasses.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500 }}>{c.name}</td>
                  <td>{c.student_count}</td>
                  <td>
                    {c.attendance_done
                      ? <span className="badge badge-success">Done</span>
                      : c.student_count > 0
                        ? <span className="badge badge-warning">Pending</span>
                        : <span className="helper">No students</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
