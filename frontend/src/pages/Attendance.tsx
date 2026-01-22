import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface ClassRow { id: string; name: string }
interface StudentRow { id: string; first_name: string; last_name: string }

export default function Attendance() {
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [students, setStudents] = useState<StudentRow[]>([])
  const [statusMap, setStatusMap] = useState<Record<string, string>>({})
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(false)
  const [teacherId, setTeacherId] = useState<string>('')
  const [schoolId, setSchoolId] = useState<string>('')

  useEffect(() => {
    const loadClasses = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      // Load teacher id and school id for later use
      const { data: teacher } = await supabase.from('teachers').select('id, school_id').eq('user_id', user.id).maybeSingle()
      if (!teacher) return
      setTeacherId(teacher.id)
      setSchoolId(teacher.school_id)
      const { data: classRows, error } = await supabase.from('classes').select('id, name').eq('teacher_id', teacher.id)
      if (error) console.error(error)
      setClasses(classRows ?? [])
    }
    loadClasses()
  }, [])

  useEffect(() => {
    const loadStudents = async () => {
      if (!selectedClass) return
      const { data: enrolls } = await supabase.from('enrollments').select('student_id').eq('class_id', selectedClass)
      const ids = (enrolls ?? []).map((e) => e.student_id)
      if (ids.length === 0) { setStudents([]); return }
      const { data: studs } = await supabase.from('students').select('id, first_name, last_name').in('id', ids)
      setStudents(studs ?? [])
    }
    loadStudents()
  }, [selectedClass])

  const save = async () => {
    setLoading(true)
    const rows = Object.entries(statusMap).map(([student_id, status]) => ({
      school_id: schoolId,
      class_id: selectedClass,
      student_id,
      status,
      date,
      created_by: teacherId,
    }))
    if (rows.length > 0) {
      const { error } = await supabase.from('attendance').upsert(rows, { onConflict: 'class_id,student_id,date' })
      if (error) alert(error.message)
    }
    setLoading(false)
  }

  const statuses = useMemo(() => ['present','absent','late','excused'], [])

  return (
    <div>
      <h2>Attendance</h2>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
          <option value="">Select class</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <button onClick={save} disabled={!selectedClass || loading}>Save</button>
      </div>

      {students.length === 0 ? (
        <p>No students to display.</p>
      ) : (
        <table width="100%" cellPadding="8" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th align="left">Student</th>
              {statuses.map(s => <th key={s}>{s}</th>)}
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id}>
                <td>{s.first_name} {s.last_name}</td>
                {statuses.map(st => (
                  <td key={st} align="center">
                    <input
                      type="radio"
                      name={`st-${s.id}`}
                      checked={statusMap[s.id] === st}
                      onChange={() => setStatusMap(prev => ({ ...prev, [s.id]: st }))}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
