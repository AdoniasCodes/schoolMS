import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'

interface Child {
  student_id: string
  first_name: string
  last_name: string
  class_name: string | null
  attendance_status: string | null
}

interface UpdatePreview { id: string; text_content: string; created_at: string; class_name: string }
interface AnnouncementPreview { id: string; title: string; created_at: string }

export default function ParentDashboard() {
  const [loading, setLoading] = useState(true)
  const [children, setChildren] = useState<Child[]>([])
  const [recentUpdates, setRecentUpdates] = useState<UpdatePreview[]>([])
  const [announcements, setAnnouncements] = useState<AnnouncementPreview[]>([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: p } = await supabase.from('parents').select('id').eq('user_id', user.id).maybeSingle()
      if (!p?.id) { setLoading(false); return }

      const today = new Date().toISOString().split('T')[0]

      // Get children with class info
      const { data: psData } = await supabase
        .from('parent_students')
        .select('students(id, first_name, last_name, enrollments(classes(name)))')
        .eq('parent_id', p.id)

      const childList: Child[] = []
      const childIds: string[] = []
      const classIds: string[] = []

      for (const ps of psData ?? []) {
        const s = (ps as any).students
        if (!s) continue
        childIds.push(s.id)
        const className = s.enrollments?.[0]?.classes?.name ?? null
        if (s.enrollments) {
          for (const e of s.enrollments) {
            if (e.classes?.id) classIds.push(e.classes.id)
          }
        }
        childList.push({
          student_id: s.id,
          first_name: s.first_name,
          last_name: s.last_name,
          class_name: className,
          attendance_status: null,
        })
      }

      // Today's attendance for my children
      if (childIds.length > 0) {
        const { data: attData } = await supabase
          .from('attendance')
          .select('student_id, status')
          .eq('date', today)
          .in('student_id', childIds)

        for (const att of attData ?? []) {
          const child = childList.find(c => c.student_id === att.student_id)
          if (child) child.attendance_status = att.status
        }
      }

      setChildren(childList)

      // Recent updates from children's classes
      if (classIds.length > 0) {
        const { data: updates } = await supabase
          .from('daily_updates')
          .select('id, text_content, created_at, classes(name)')
          .in('class_id', classIds)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(3)

        setRecentUpdates((updates ?? []).map((u: any) => ({
          id: u.id,
          text_content: u.text_content ?? '',
          created_at: u.created_at,
          class_name: u.classes?.name ?? '-',
        })))
      }

      // Recent announcements
      const { data: me } = await supabase.from('users').select('school_id').eq('id', user.id).maybeSingle()
      if (me?.school_id) {
        const { data: annData } = await supabase
          .from('announcements')
          .select('id, title, created_at')
          .eq('school_id', me.school_id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(2)
        setAnnouncements(annData ?? [])
      }

      setLoading(false)
    }
    load()
  }, [])

  const statusBadge = (status: string | null) => {
    if (!status) return <span className="badge">Not recorded</span>
    if (status === 'present') return <span className="badge badge-success">Present</span>
    if (status === 'absent') return <span className="badge" style={{ color: '#dc2626', background: '#fef2f2', borderColor: '#fecaca' }}>Absent</span>
    if (status === 'late') return <span className="badge badge-warning">Late</span>
    return <span className="badge">{status}</span>
  }

  if (loading) return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="card">
        <div className="skeleton" style={{ height: 18, width: 220, borderRadius: 8 }} />
        <div className="grid cols-2" style={{ marginTop: 12 }}>
          {[1, 2].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 10 }} />)}
        </div>
      </div>
    </div>
  )

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Parent Dashboard</h2>
      </div>

      {/* My Children */}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>My Children</h3>
        {children.length === 0 ? (
          <div className="empty" style={{ padding: 16 }}>No children linked to your account.</div>
        ) : (
          <div className="grid cols-2" style={{ gap: 10 }}>
            {children.map(c => (
              <div key={c.student_id} className="card" style={{ padding: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{c.first_name} {c.last_name}</div>
                <div className="helper" style={{ marginTop: 4 }}>{c.class_name ?? 'Not enrolled'}</div>
                <div style={{ marginTop: 8 }}>
                  <span className="helper" style={{ marginRight: 8 }}>Today:</span>
                  {statusBadge(c.attendance_status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid cols-3" style={{ gap: 10 }}>
        <Link to="/app/attendance" className="link-card card" style={{ textAlign: 'center', padding: 20 }}>
          <h4>Attendance</h4>
          <p>View attendance history</p>
        </Link>
        <Link to="/app/messages" className="link-card card" style={{ textAlign: 'center', padding: 20 }}>
          <h4>Messages</h4>
          <p>Chat with teachers</p>
        </Link>
        <Link to="/app/reports" className="link-card card" style={{ textAlign: 'center', padding: 20 }}>
          <h4>Reports</h4>
          <p>View progress reports</p>
        </Link>
      </div>

      {/* Recent Updates */}
      {recentUpdates.length > 0 && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Recent Class Updates</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
            {recentUpdates.map(u => (
              <li key={u.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge" style={{ marginRight: 8 }}>{u.class_name}</span>
                  <span className="helper">{new Date(u.created_at).toLocaleDateString()}</span>
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: 14 }}>
                  {u.text_content.length > 100 ? u.text_content.slice(0, 100) + '...' : u.text_content}
                </p>
              </li>
            ))}
          </ul>
          <div style={{ marginTop: 8 }}>
            <Link to="/app/updates" style={{ color: 'var(--primary)', fontSize: 14 }}>View all updates</Link>
          </div>
        </div>
      )}

      {/* Announcements */}
      {announcements.length > 0 && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Latest Announcements</h3>
          {announcements.map(a => (
            <div key={a.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 500 }}>{a.title}</div>
              <div className="helper">{new Date(a.created_at).toLocaleDateString()}</div>
            </div>
          ))}
          <div style={{ marginTop: 8 }}>
            <Link to="/app/announcements" style={{ color: 'var(--primary)', fontSize: 14 }}>View all announcements</Link>
          </div>
        </div>
      )}
    </div>
  )
}
