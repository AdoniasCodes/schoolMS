import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useToast } from '@/ui/components/toast/ToastProvider'
import { LoadingSpinner } from '@/ui/components/LoadingSpinner'

interface TeacherOption { id: string; full_name: string }
interface ClassRow {
  id: string
  name: string
  grade_level: string | null
  teacher_id: string | null
  teacher_name: string | null
}
interface EnrolledStudent { enrollment_id: string; student_id: string; first_name: string; last_name: string }
interface StudentOption { id: string; first_name: string; last_name: string }

type Role = 'teacher' | 'parent' | 'school_admin'

const GRADES = ['KG', '1', '2', '3', '4', '5', '6', '7', '8']

export default function Classes() {
  const { show } = useToast()
  const [role, setRole] = useState<Role | null>(null)
  const [schoolId, setSchoolId] = useState<string | null>(null)
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [teachers, setTeachers] = useState<TeacherOption[]>([])
  const [loading, setLoading] = useState(true)

  // Create form
  const [showCreate, setShowCreate] = useState(false)
  const [formName, setFormName] = useState('')
  const [formGrade, setFormGrade] = useState('')
  const [formTeacher, setFormTeacher] = useState('')
  const [saving, setSaving] = useState(false)

  // Edit
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editGrade, setEditGrade] = useState('')
  const [editTeacher, setEditTeacher] = useState('')

  // Enrollment panel
  const [expandedClass, setExpandedClass] = useState<string | null>(null)
  const [enrolled, setEnrolled] = useState<EnrolledStudent[]>([])
  const [allStudents, setAllStudents] = useState<StudentOption[]>([])
  const [enrollStudentId, setEnrollStudentId] = useState('')
  const [loadingEnroll, setLoadingEnroll] = useState(false)
  const [enrollSaving, setEnrollSaving] = useState(false)

  const loadClasses = async (sid?: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: me } = await supabase.from('users').select('role_key, school_id').eq('id', user.id).maybeSingle()
    const r = (me?.role_key ?? null) as Role | null
    const school = sid ?? me?.school_id
    setRole(r)
    setSchoolId(school)

    if (r === 'teacher') {
      const { data: t } = await supabase.from('teachers').select('id').eq('user_id', user.id).maybeSingle()
      if (t?.id) {
        const { data } = await supabase
          .from('classes')
          .select('id, name, grade_level, teacher_id')
          .eq('teacher_id', t.id)
          .is('deleted_at', null)
          .order('name')
        setClasses((data ?? []).map(c => ({ ...c, teacher_name: null })))
      }
    } else {
      // admin and parent — RLS handles filtering
      const { data } = await supabase
        .from('classes')
        .select('id, name, grade_level, teacher_id, teachers(user_id, users(full_name))')
        .is('deleted_at', null)
        .order('name')
      setClasses((data ?? []).map((c: any) => ({
        id: c.id,
        name: c.name,
        grade_level: c.grade_level,
        teacher_id: c.teacher_id,
        teacher_name: c.teachers?.users?.full_name ?? null,
      })))
    }

    // Load teachers for dropdown (admin only)
    if (r === 'school_admin') {
      const { data: t } = await supabase
        .from('teachers')
        .select('id, users(full_name)')
        .is('deleted_at', null)
      setTeachers((t ?? []).map((row: any) => ({ id: row.id, full_name: row.users?.full_name ?? 'Unknown' })))
    }
  }

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await loadClasses()
      setLoading(false)
    }
    init()
  }, [])

  const handleCreate = async () => {
    if (!formName.trim() || !schoolId) return
    setSaving(true)
    const { error } = await supabase.from('classes').insert({
      school_id: schoolId,
      name: formName.trim(),
      grade_level: formGrade || null,
      teacher_id: formTeacher || null,
    })
    if (error) { show(error.message, 'error') }
    else {
      show('Class created', 'success')
      setFormName(''); setFormGrade(''); setFormTeacher('')
      setShowCreate(false)
      await loadClasses(schoolId)
    }
    setSaving(false)
  }

  const handleEdit = async (id: string) => {
    setSaving(true)
    const { error } = await supabase.from('classes').update({
      name: editName.trim(),
      grade_level: editGrade || null,
      teacher_id: editTeacher || null,
    }).eq('id', id)
    if (error) { show(error.message, 'error') }
    else {
      show('Class updated', 'success')
      setEditId(null)
      await loadClasses(schoolId!)
    }
    setSaving(false)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete class "${name}"?`)) return
    const { error } = await supabase.from('classes').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    if (error) { show(error.message, 'error') }
    else {
      show('Class deleted', 'success')
      if (expandedClass === id) setExpandedClass(null)
      await loadClasses(schoolId!)
    }
  }

  const startEdit = (c: ClassRow) => {
    setEditId(c.id)
    setEditName(c.name)
    setEditGrade(c.grade_level ?? '')
    setEditTeacher(c.teacher_id ?? '')
  }

  // Enrollment management
  const toggleEnrollment = async (classId: string) => {
    if (expandedClass === classId) { setExpandedClass(null); return }
    setExpandedClass(classId)
    setLoadingEnroll(true)

    // Get enrolled students
    const { data: enrollData } = await supabase
      .from('enrollments')
      .select('id, student_id, students(first_name, last_name)')
      .eq('class_id', classId)
      .is('deleted_at', null)
    setEnrolled((enrollData ?? []).map((e: any) => ({
      enrollment_id: e.id,
      student_id: e.student_id,
      first_name: e.students?.first_name ?? '',
      last_name: e.students?.last_name ?? '',
    })))

    // Get all school students for the add dropdown
    const { data: allStuds } = await supabase
      .from('students')
      .select('id, first_name, last_name')
      .is('deleted_at', null)
      .order('first_name')
    setAllStudents(allStuds ?? [])
    setEnrollStudentId('')
    setLoadingEnroll(false)
  }

  const handleEnroll = async () => {
    if (!enrollStudentId || !expandedClass || !schoolId) return
    setEnrollSaving(true)
    const { error } = await supabase.from('enrollments').insert({
      school_id: schoolId,
      class_id: expandedClass,
      student_id: enrollStudentId,
    })
    if (error) { show(error.message, 'error') }
    else {
      show('Student enrolled', 'success')
      await toggleEnrollment(expandedClass)
    }
    setEnrollSaving(false)
  }

  const handleUnenroll = async (enrollmentId: string) => {
    if (!confirm('Remove this student from class?')) return
    const { error } = await supabase.from('enrollments').update({ deleted_at: new Date().toISOString() }).eq('id', enrollmentId)
    if (error) { show(error.message, 'error') }
    else {
      show('Student removed', 'success')
      if (expandedClass) await toggleEnrollment(expandedClass)
    }
  }

  const unenrolledStudents = allStudents.filter(s => !enrolled.some(e => e.student_id === s.id))

  if (loading) return (
    <div className="card">
      <div className="skeleton" style={{ height: 16, width: 160, borderRadius: 8 }} />
      <div className="skeleton" style={{ height: 12, width: '100%', borderRadius: 8, marginTop: 12 }} />
      <div className="skeleton" style={{ height: 12, width: '90%', borderRadius: 8, marginTop: 8 }} />
    </div>
  )

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Classes</h2>
          {role === 'school_admin' && !showCreate && (
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Add Class</button>
          )}
        </div>

        {/* Create form */}
        {showCreate && role === 'school_admin' && (
          <div className="card" style={{ marginBottom: 16, background: 'var(--bg)' }}>
            <h4 style={{ margin: '0 0 12px 0' }}>New Class</h4>
            <div className="grid cols-3" style={{ gap: 12 }}>
              <div>
                <label className="helper">Name *</label>
                <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Grade 1 - A" />
              </div>
              <div>
                <label className="helper">Grade Level</label>
                <select value={formGrade} onChange={e => setFormGrade(e.target.value)}>
                  <option value="">Select grade</option>
                  {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="helper">Assigned Teacher</label>
                <select value={formTeacher} onChange={e => setFormTeacher(e.target.value)}>
                  <option value="">None</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn btn-primary" onClick={handleCreate} disabled={saving || !formName.trim()}>
                {saving ? <><LoadingSpinner size="sm" /> Saving...</> : 'Create'}
              </button>
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            </div>
          </div>
        )}

        {classes.length === 0 ? (
          <div className="empty">No classes yet.{role === 'school_admin' && ' Click "Add Class" to create one.'}</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Grade</th>
                {role !== 'teacher' && <th>Teacher</th>}
                {role === 'school_admin' && <th style={{ width: 180 }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {classes.map(c => (
                editId === c.id && role === 'school_admin' ? (
                  <tr key={c.id}>
                    <td>
                      <input value={editName} onChange={e => setEditName(e.target.value)} style={{ padding: '6px 8px' }} />
                    </td>
                    <td>
                      <select value={editGrade} onChange={e => setEditGrade(e.target.value)} style={{ padding: '6px 8px' }}>
                        <option value="">-</option>
                        {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </td>
                    <td>
                      <select value={editTeacher} onChange={e => setEditTeacher(e.target.value)} style={{ padding: '6px 8px' }}>
                        <option value="">None</option>
                        {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                      </select>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-primary" style={{ padding: '6px 10px', fontSize: 13 }} onClick={() => handleEdit(c.id)} disabled={saving}>
                          {saving ? <LoadingSpinner size="sm" /> : 'Save'}
                        </button>
                        <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: 13 }} onClick={() => setEditId(null)}>Cancel</button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={c.id} style={{ cursor: role === 'school_admin' ? 'pointer' : undefined }} onClick={() => role === 'school_admin' && toggleEnrollment(c.id)}>
                    <td style={{ fontWeight: 500 }}>{c.name}</td>
                    <td>{c.grade_level ?? '-'}</td>
                    {role !== 'teacher' && <td>{c.teacher_name ?? '-'}</td>}
                    {role === 'school_admin' && (
                      <td onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: 13 }} onClick={() => startEdit(c)}>Edit</button>
                          <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: 13, color: '#dc2626' }} onClick={() => handleDelete(c.id, c.name)}>Delete</button>
                        </div>
                      </td>
                    )}
                  </tr>
                )
              ))}
            </tbody>
          </table>
        )}

        {/* Enrollment panel */}
        {expandedClass && role === 'school_admin' && (
          <div className="card" style={{ marginTop: 12, background: 'var(--bg)' }}>
            <h4 style={{ margin: '0 0 8px 0' }}>
              Enrolled Students — {classes.find(c => c.id === expandedClass)?.name}
            </h4>

            {loadingEnroll ? (
              <div className="skeleton" style={{ height: 14, width: 200, borderRadius: 8 }} />
            ) : (
              <>
                {enrolled.length === 0 ? (
                  <p className="helper">No students enrolled yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                    {enrolled.map(e => (
                      <span key={e.enrollment_id} className="badge" style={{ gap: 6 }}>
                        {e.first_name} {e.last_name}
                        <button
                          onClick={() => handleUnenroll(e.enrollment_id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: 0, fontSize: 14, lineHeight: 1 }}
                          title="Remove"
                        >&times;</button>
                      </span>
                    ))}
                  </div>
                )}

                {unenrolledStudents.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <select value={enrollStudentId} onChange={e => setEnrollStudentId(e.target.value)} style={{ maxWidth: 240, padding: '6px 8px' }}>
                      <option value="">Add a student...</option>
                      {unenrolledStudents.map(s => (
                        <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                      ))}
                    </select>
                    <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 13 }} onClick={handleEnroll} disabled={!enrollStudentId || enrollSaving}>
                      {enrollSaving ? <LoadingSpinner size="sm" /> : 'Enroll'}
                    </button>
                  </div>
                )}

                {unenrolledStudents.length === 0 && allStudents.length > 0 && (
                  <p className="helper">All students are enrolled in this class.</p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
