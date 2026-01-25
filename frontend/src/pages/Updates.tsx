import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useToast } from '@/ui/components/toast/ToastProvider'
import { LoadingSpinner } from '@/ui/components/LoadingSpinner'

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
  const [mediaMap, setMediaMap] = useState<Record<string, { url: string; name: string } | null>>({})
  const [feedError, setFeedError] = useState<string | null>(null)

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
    setFeedError(null)
    let query = supabase
      .from('daily_updates')
      .select('id, class_id, teacher_id, text_content, created_at')
      .order('created_at', { ascending: false })
      .range(page * pageSize, page * pageSize + pageSize - 1)
    if (selectedClass) query = query.eq('class_id', selectedClass)
    const { data, error } = await query
    if (!error) setFeed(data ?? [])
    if (error) setFeedError('Failed to load updates.')
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
    
    try {
      // 1. Create the update first
      const { data: update, error: updateError } = await supabase
        .from('daily_updates')
        .insert({
          school_id: schoolId,
          class_id: selectedClass,
          teacher_id: teacherId,
          text_content: text.trim(),
        })
        .select('id')
        .single()
      
      if (updateError) throw updateError
      
      // 2. If there's a file, upload and associate it with this update
      if (file) {
        try {
          await uploadMedia(update.id)
        } catch (err) {
          console.error('Media upload failed, but update was posted', err)
          // Continue even if media upload fails
        }
      }
      
      // 3. Refresh the feed
      setText('')
      setFile(null)
      await loadFeed()
      show('Update posted' + (file ? ' with media' : ''), 'success')
    } catch (error: any) {
      console.error('Post error:', error)
      show(error.message || 'Failed to post update', 'error')
    } finally {
      setPosting(false)
    }
  }

  const uploadMedia = async (updateId?: string) => {
    if (!file) return
    if (!schoolId || !teacherId) { 
      show('Missing teacher/school context', 'error'); 
      return 
    }
    
    const path = `${schoolId}/updates/${teacherId}/${Date.now()}_${file.name.replace(/[^\w.]+/g, '_')}`
    setUploading(true)
    
    try {
      // 1. Upload the file to storage
      const { error: upErr } = await supabase.storage
        .from('media')
        .upload(path, file, { 
          upsert: false,
          contentType: file.type || 'application/octet-stream'
        })
      
      if (upErr) throw upErr
      
      // 2. Create media_asset record with update_id if available
      const { error: dbErr } = await supabase
        .from('media_assets')
        .insert({
          bucket: 'media',
          object_path: path,
          name: file.name,
          school_id: schoolId,
          update_id: updateId || null,
          content_type: file.type || 'application/octet-stream',
          size: file.size,
        })
      
      if (dbErr) throw dbErr
      
      show('Media uploaded', 'success')
      return path
    } catch (error: any) {
      console.error('Upload error:', error)
      show(error.message || 'Failed to upload media', 'error')
      throw error
    } finally {
      setUploading(false)
      setFile(null)
    }
  }

  const loadMediaPreviews = async (items: UpdateRow[]) => {
    if (!schoolId) return
    const next: Record<string, { url: string; name: string } | null> = {}
    
    // Get all media for these updates in one query
    const { data: mediaItems, error } = await supabase
      .from('media_assets')
      .select('id, object_path, name, update_id')
      .in('update_id', items.map(u => u.id))
      .eq('school_id', schoolId)
    
    if (error) {
      console.error('Error loading media previews:', error)
      return
    }
    
    // Create signed URLs for each media item
    for (const item of mediaItems || []) {
      if (!item.update_id) continue
      try {
        const { data: signed } = await supabase.storage
          .from('media')
          .createSignedUrl(item.object_path, 60 * 60) // 1 hour expiry
        
        if (signed) {
          next[item.update_id] = {
            url: signed.signedUrl,
            name: item.name || 'Media'
          }
        }
      } catch (err) {
        console.error('Error creating signed URL:', err)
        next[item.update_id] = null
      }
    }
    
    setMediaMap(prev => ({ ...prev, ...next }))
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
            <input 
              type="file" 
              id="media-upload"
              aria-label="Attach media" 
              onChange={(e) => setFile(e.target.files?.[0] ?? null)} 
              className="visually-hidden"
            />
            <label 
              htmlFor="media-upload" 
              className="btn btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {uploading ? (
                <>
                  <LoadingSpinner size="sm" />
                  Uploading...
                </>
              ) : 'Attach Media'}
            </label>
            <button 
              className="btn btn-primary" 
              onClick={post} 
              disabled={posting || !selectedClass || !text.trim()}
              style={{ minWidth: '100px', display: 'inline-flex', justifyContent: 'center', gap: '0.5rem' }}
            >
              {posting ? (
                <>
                  <LoadingSpinner size="sm" />
                  Posting...
                </>
              ) : 'Post'}
            </button>
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
        ) : feedError ? (
          <p className="helper" role="status" style={{ color: 'var(--danger)' }}>{feedError}</p>
        ) : feed.length === 0 ? (
          <p>No updates for this class.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 8 }}>
            {feed.map((u) => (
              <li key={u.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 12, color: '#666' }}>{new Date(u.created_at).toLocaleString()}</div>
                <div style={{ marginTop: 8 }}>{u.text_content}</div>
                {mediaMap[u.id] && (
                  <div style={{ marginTop: '1rem' }}>
                    <div 
                      style={{
                        position: 'relative',
                        maxWidth: '100%',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '1px solid var(--border)',
                        background: 'var(--panel)'
                      }}
                    >
                      <img 
                        src={mediaMap[u.id]?.url} 
                        alt={mediaMap[u.id]?.name || 'Update media'} 
                        style={{ 
                          display: 'block',
                          maxWidth: '100%', 
                          height: 'auto',
                          margin: '0 auto'
                        }} 
                        onError={(e) => { 
                          const el = e.currentTarget as HTMLImageElement;
                          el.style.display = 'none';
                          // Show fallback link
                          const link = document.createElement('a');
                          link.href = mediaMap[u.id]?.url || '#';
                          link.target = '_blank';
                          link.rel = 'noopener noreferrer';
                          link.textContent = 'View media';
                          link.style.display = 'inline-block';
                          link.style.marginTop = '0.5rem';
                          link.style.color = 'var(--primary)';
                          el.parentNode?.appendChild(link);
                        }} 
                      />
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      {mediaMap[u.id]?.name}
                    </div>
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
