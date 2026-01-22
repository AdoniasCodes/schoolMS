import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface ClassRow { id: string; name: string }
interface UpdateRow { id: string; class_id: string; teacher_id: string; text_content: string | null; created_at: string }

export default function Updates() {
  const [role, setRole] = useState<'teacher' | 'parent' | 'school_admin' | null>(null)
  const [schoolId, setSchoolId] = useState<string>('')
  const [teacherId, setTeacherId] = useState<string>('')
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)
  const [feed, setFeed] = useState<UpdateRow[]>([])
  const [loadingFeed, setLoadingFeed] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: userRow } = await supabase.from('users').select('role_key, school_id').eq('id', user.id).maybeSingle()
      if (userRow) {
        setRole(userRow.role_key)
        setSchoolId(userRow.school_id)
      }
      if (userRow?.role_key === 'teacher') {
        const { data: teacher } = await supabase.from('teachers').select('id').eq('user_id', user.id).maybeSingle()
        if (teacher) {
          setTeacherId(teacher.id)
          const { data: classRows } = await supabase.from('classes').select('id, name').eq('teacher_id', teacher.id)
          setClasses(classRows ?? [])
        }
      }
      await loadFeed()
    }
    init()
  }, [])

  const loadFeed = async () => {
    setLoadingFeed(true)
    const { data, error } = await supabase
      .from('daily_updates')
      .select('id, class_id, teacher_id, text_content, created_at')
      .order('created_at', { ascending: false })
      .limit(50)
    if (!error) setFeed(data ?? [])
    setLoadingFeed(false)
  }

  const canPost = useMemo(() => role === 'teacher', [role])

  const post = async () => {
    if (!canPost || !selectedClass || !text.trim()) return
    setPosting(true)
    const { error } = await supabase.from('daily_updates').insert({
      school_id: schoolId,
      class_id: selectedClass,
      teacher_id: teacherId,
      text_content: text.trim()
    })
    setPosting(false)
    if (error) {
      alert(error.message)
      return
    }
    setText('')
    await loadFeed()
  }

  return (
    <div>
      <h2>Daily Updates</h2>

      {canPost && (
        <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8, marginBottom: 16 }}>
          <h3>Create Update</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
              <option value="">Select class</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <textarea
            placeholder="Share today's update..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            style={{ width: '100%' }}
          />
          <div style={{ marginTop: 8 }}>
            <button onClick={post} disabled={posting || !selectedClass || !text.trim()}>Post</button>
          </div>
        </div>
      )}

      <div>
        <h3>Feed</h3>
        {loadingFeed ? (
          <p>Loading...</p>
        ) : feed.length === 0 ? (
          <p>No updates yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 8 }}>
            {feed.map((u) => (
              <li key={u.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 12, color: '#666' }}>{new Date(u.created_at).toLocaleString()}</div>
                <div style={{ marginTop: 8 }}>{u.text_content}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
