import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useToast } from '@/ui/components/toast/ToastProvider'
import { LoadingSpinner } from '@/ui/components/LoadingSpinner'

interface StudentRow {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string | null
  classes: string[]
}

type Role = 'teacher' | 'parent' | 'school_admin'

export default function Students() {
  const { show } = useToast()
  const [role, setRole] = useState<Role | null>(null)
  const [schoolId, setSchoolId] = useState<string | null>(null)
  const [students, setStudents] = useState<StudentRow[]>([])
  const [loading, setLoading] = useState(true)

  // Create form
  const [showCreate, setShowCreate] = useState(false)
  const [formFirst, setFormFirst] = useState('')
  const [formLast, setFormLast] = useState('')
  const [formDob, setFormDob] = useState('')
  const [saving, setSaving] = useState(false)

  // Edit
  const [editId, setEditId] = useState<string | null>(null)
  const [editFirst, setEditFirst] = useState('')
  const [editLast, setEditLast] = useState('')
  const [editDob, setEditDob] = useState('')

  const loadStudents = async (sid?: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: me } = await supabase.from('users').select('role_key, school_id').eq('id', user.id).maybeSingle()
    const r = (me?.role_key ?? null) as Role | null
    const school = sid ?? me?.school_id
    setRole(r)
    setSchoolId(school)

    // RLS handles filtering per role. We just fetch with enrollment info.
    const { data } = await supabase
      .from('students')
      .select('id, first_name, last_name, date_of_birth, enrollments(classes(name))')
      .is('deleted_at', null)
      .order('first_name')

    setStudents((data ?? []).map((s: any) => ({
      id: s.id,
      first_name: s.first_name,
      last_name: s.last_name,
      date_of_birth: s.date_of_birth,
      classes: (s.enrollments ?? [])
        .map((e: any) => e.classes?.name)
        .filter(Boolean),
    })))
  }

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await loadStudents()
      setLoading(false)
    }
    init()
  }, [])

  const handleCreate = async () => {
    if (!formFirst.trim() || !formLast.trim() || !schoolId) return
    setSaving(true)
    const { error } = await supabase.from('students').insert({
      school_id: schoolId,
      first_name: formFirst.trim(),
      last_name: formLast.trim(),
      date_of_birth: formDob || null,
    })
    if (error) { show(error.message, 'error') }
    else {
      show('Student added', 'success')
      setFormFirst(''); setFormLast(''); setFormDob('')
      setShowCreate(false)
      await loadStudents(schoolId)
    }
    setSaving(false)
  }

  const handleEdit = async (id: string) => {
    setSaving(true)
    const { error } = await supabase.from('students').update({
      first_name: editFirst.trim(),
      last_name: editLast.trim(),
      date_of_birth: editDob || null,
    }).eq('id', id)
    if (error) { show(error.message, 'error') }
    else {
      show('Student updated', 'success')
      setEditId(null)
      await loadStudents(schoolId!)
    }
    setSaving(false)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete student "${name}"?`)) return
    const { error } = await supabase.from('students').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    if (error) { show(error.message, 'error') }
    else {
      show('Student deleted', 'success')
      await loadStudents(schoolId!)
    }
  }

  const startEdit = (s: StudentRow) => {
    setEditId(s.id)
    setEditFirst(s.first_name)
    setEditLast(s.last_name)
    setEditDob(s.date_of_birth ?? '')
  }

  if (loading) return (
    <div className="card">
      <div className="skeleton" style={{ height: 16, width: 200, borderRadius: 8 }} />
      <div className="skeleton" style={{ height: 12, width: '100%', borderRadius: 8, marginTop: 12 }} />
      <div className="skeleton" style={{ height: 12, width: '90%', borderRadius: 8, marginTop: 8 }} />
    </div>
  )

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Students</h2>
          {role === 'school_admin' && !showCreate && (
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Add Student</button>
          )}
        </div>

        {/* Create form */}
        {showCreate && role === 'school_admin' && (
          <div className="card" style={{ marginBottom: 16, background: 'var(--bg)' }}>
            <h4 style={{ margin: '0 0 12px 0' }}>New Student</h4>
            <div className="grid cols-3" style={{ gap: 12 }}>
              <div>
                <label className="helper">First Name *</label>
                <input value={formFirst} onChange={e => setFormFirst(e.target.value)} placeholder="First name" />
              </div>
              <div>
                <label className="helper">Last Name *</label>
                <input value={formLast} onChange={e => setFormLast(e.target.value)} placeholder="Last name" />
              </div>
              <div>
                <label className="helper">Date of Birth</label>
                <input type="date" value={formDob} onChange={e => setFormDob(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn btn-primary" onClick={handleCreate} disabled={saving || !formFirst.trim() || !formLast.trim()}>
                {saving ? <><LoadingSpinner size="sm" /> Saving...</> : 'Add Student'}
              </button>
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            </div>
          </div>
        )}

        {students.length === 0 ? (
          <div className="empty">No students to display.{role === 'school_admin' && ' Click "Add Student" to add one.'}</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Date of Birth</th>
                <th>Classes</th>
                {role === 'school_admin' && <th style={{ width: 160 }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                editId === s.id && role === 'school_admin' ? (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input value={editFirst} onChange={e => setEditFirst(e.target.value)} placeholder="First" style={{ padding: '6px 8px', width: '50%' }} />
                        <input value={editLast} onChange={e => setEditLast(e.target.value)} placeholder="Last" style={{ padding: '6px 8px', width: '50%' }} />
                      </div>
                    </td>
                    <td>
                      <input type="date" value={editDob} onChange={e => setEditDob(e.target.value)} style={{ padding: '6px 8px' }} />
                    </td>
                    <td>{s.classes.map(cn => <span key={cn} className="badge" style={{ marginRight: 4 }}>{cn}</span>)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-primary" style={{ padding: '6px 10px', fontSize: 13 }} onClick={() => handleEdit(s.id)} disabled={saving}>
                          {saving ? <LoadingSpinner size="sm" /> : 'Save'}
                        </button>
                        <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: 13 }} onClick={() => setEditId(null)}>Cancel</button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 500 }}>{s.first_name} {s.last_name}</td>
                    <td>{s.date_of_birth ?? '-'}</td>
                    <td>
                      {s.classes.length === 0
                        ? <span className="helper">Not enrolled</span>
                        : s.classes.map(cn => <span key={cn} className="badge" style={{ marginRight: 4 }}>{cn}</span>)
                      }
                    </td>
                    {role === 'school_admin' && (
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: 13 }} onClick={() => startEdit(s)}>Edit</button>
                          <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: 13, color: '#dc2626' }} onClick={() => handleDelete(s.id, `${s.first_name} ${s.last_name}`)}>Delete</button>
                        </div>
                      </td>
                    )}
                  </tr>
                )
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
