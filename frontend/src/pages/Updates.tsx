import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useToast } from '@/ui/components/toast/ToastProvider'

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
  const [file, setFile] = useState<File | null>(null)
  const [page, setPage] = useState(0)
  const pageSize = 10
  const { show } = useToast()
  const [uploading, setUploading] = useState(false)
  const [mediaMap, setMediaMap] = useState<Record<string, string | null>>({})

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

  useEffect(() => {
    // reload when filter or page changes
    loadFeed()
  }, [selectedClass, page])

  const loadFeed = async () => {
    setLoadingFeed(true)
    let query = supabase
      .from('daily_updates')
      .select('id, class_id, teacher_id, text_content, created_at')
      .order('created_at', { ascending: false })
      .range(page * pageSize, page * pageSize + pageSize - 1)
    if (selectedClass) query = query.eq('class_id', selectedClass)
    const { data, error } = await query
    if (!error) setFeed(data ?? [])
    setLoadingFeed(false)
    if (!error) {
      // load media previews best-effort
      await loadMediaPreviews(data ?? [])
    }
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
      show(error.message, 'error')
      return
    }
    setText('')
    await loadFeed()
    show('Update posted', 'success')
  }

  const uploadMedia = async () => {
    if (!file) return
    if (!schoolId || !teacherId) { show('Missing teacher/school context', 'error'); return }
    const path = `${schoolId}/updates/${teacherId}/${Date.now()}_${file.name}`
    setUploading(true)
    const { error: upErr } = await supabase.storage.from('media').upload(path, file, { upsert: false })
    setUploading(false)
    if (upErr) { show(upErr.message, 'error'); return }
    await supabase.from('media_assets').insert({ bucket: 'media', object_path: path, school_id: schoolId }).catch(() => {})
    show('Media uploaded', 'success')
    setFile(null)
  }

  const loadMediaPreviews = async (items: UpdateRow[]) => {
    if (!schoolId) return
    const next: Record<string, string | null> = {}
    for (const u of items) {
      try {
        // Heuristic: list objects under teacher folder and pick closest by time
        const prefix = `${schoolId}/updates/${u.teacher_id}`
        const { data: list } = await supabase.storage.from('media').list(prefix, { limit: 100, offset: 0 })
        if (!list || list.length === 0) { next[u.id] = null; continue }
        // pick the last object (rough heuristic)
        const obj = list[list.length - 1]
        const fullPath = `${prefix}/${obj.name}`
        const { data: signed } = await supabase.storage.from('media').createSignedUrl(fullPath, 60 * 60)
        next[u.id] = signed?.signedUrl ?? null
      } catch {
        next[u.id] = null
      }
    }
    setMediaMap(next)
  }

  return (
    <div>
      <h2>Daily Updates</h2>

      {canPost && (
        <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8, marginBottom: 16 }}>
          <h3>Create Update</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <label htmlFor="classSel" className="helper">Class</label>
            <select id="classSel" aria-label="Select class for update" value={selectedClass} onChange={(e) => { setSelectedClass(e.target.value); setPage(0) }}>
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
          <div style={{ marginTop: 8, display:'flex', gap:8, alignItems:'center' }}>
            <input type="file" aria-label="Attach media" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <button className="btn btn-secondary" onClick={uploadMedia} disabled={!file || uploading}>{uploading ? 'Uploading…' : 'Upload Media'}</button>
            <button className="btn btn-primary" onClick={post} disabled={posting || !selectedClass || !text.trim()}>{posting ? 'Posting…' : 'Post'}</button>
          </div>
        </div>
      )}

      <div>
        <h3>Feed</h3>
        {loadingFeed ? (
          <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 8 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="card" style={{ padding: 12 }}>
                <div className="skeleton" style={{ width: 160, height: 12 }} />
                <div className="skeleton" style={{ width: '100%', height: 10, marginTop: 8 }} />
                <div className="skeleton" style={{ width: '90%', height: 10, marginTop: 6 }} />
              </li>
            ))}
          </ul>
        ) : feed.length === 0 ? (
          <p>No updates for this class.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 8 }}>
            {feed.map((u) => (
              <li key={u.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 12, color: '#666' }}>{new Date(u.created_at).toLocaleString()}</div>
                <div style={{ marginTop: 8 }}>{u.text_content}</div>
                {mediaMap[u.id] && (
                  <div style={{ marginTop: 8 }}>
                    <img src={mediaMap[u.id] as string} alt="Update media" style={{ maxWidth: '100%', height: 'auto', borderRadius: 8 }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                    {!mediaMap[u.id] && <a href={mediaMap[u.id] as string} target="_blank" rel="noreferrer">View media</a>}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        <div style={{ display:'flex', gap:8, marginTop:8 }}>
          <button className="btn btn-secondary" onClick={() => setPage(p => Math.max(0, p-1))} disabled={page===0} aria-label="Previous page">Prev</button>
          <button className="btn btn-secondary" onClick={() => setPage(p => p+1)} aria-label="Next page">Next</button>
        </div>
      </div>
    </div>
  )
}
