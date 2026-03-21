import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useToast } from '@/ui/components/toast/ToastProvider'
import { LoadingSpinner } from '@/ui/components/LoadingSpinner'

interface ClassOption { id: string; name: string }
interface Announcement {
  id: string
  title: string
  body: string | null
  class_name: string | null
  author_name: string | null
  created_by: string
  created_at: string
}

type Role = 'teacher' | 'parent' | 'school_admin'

const PAGE_SIZE = 10

export default function Announcements() {
  const { show } = useToast()
  const [role, setRole] = useState<Role | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [schoolId, setSchoolId] = useState<string | null>(null)
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  // Create form
  const [showCreate, setShowCreate] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [formBody, setFormBody] = useState('')
  const [formClass, setFormClass] = useState('')
  const [saving, setSaving] = useState(false)

  const canPost = role === 'school_admin' || role === 'teacher'

  const loadAnnouncements = async (p: number) => {
    const { data, error } = await supabase
      .from('announcements')
      .select('id, title, body, created_by, created_at, classes(name), users(full_name)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(p * PAGE_SIZE, p * PAGE_SIZE + PAGE_SIZE - 1)

    if (error) { show(error.message, 'error'); return }

    const mapped: Announcement[] = (data ?? []).map((a: any) => ({
      id: a.id,
      title: a.title,
      body: a.body,
      class_name: a.classes?.name ?? null,
      author_name: a.users?.full_name ?? null,
      created_by: a.created_by,
      created_at: a.created_at,
    }))
    setAnnouncements(mapped)
    setHasMore(mapped.length === PAGE_SIZE)
  }

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setUserId(user.id)

      const { data: me } = await supabase.from('users').select('role_key, school_id').eq('id', user.id).maybeSingle()
      setRole((me?.role_key ?? null) as Role | null)
      setSchoolId(me?.school_id ?? null)

      // Load classes for form dropdown
      if (me?.role_key === 'school_admin' || me?.role_key === 'teacher') {
        const { data: cls } = await supabase
          .from('classes')
          .select('id, name')
          .is('deleted_at', null)
          .order('name')
        setClasses(cls ?? [])
      }

      await loadAnnouncements(0)
      setLoading(false)
    }
    init()
  }, [])

  const handleCreate = async () => {
    if (!formTitle.trim() || !schoolId || !userId) return
    setSaving(true)
    const { error } = await supabase.from('announcements').insert({
      school_id: schoolId,
      title: formTitle.trim(),
      body: formBody.trim() || null,
      class_id: formClass || null,
      created_by: userId,
    })
    if (error) { show(error.message, 'error') }
    else {
      show('Announcement posted', 'success')
      setFormTitle(''); setFormBody(''); setFormClass('')
      setShowCreate(false)
      setPage(0)
      await loadAnnouncements(0)
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement?')) return
    const { error } = await supabase.from('announcements').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    if (error) { show(error.message, 'error') }
    else {
      show('Announcement deleted', 'success')
      await loadAnnouncements(page)
    }
  }

  const changePage = async (newPage: number) => {
    setPage(newPage)
    await loadAnnouncements(newPage)
  }

  if (loading) return (
    <div className="card">
      <div className="skeleton" style={{ height: 16, width: 200, borderRadius: 8 }} />
      <div className="skeleton" style={{ height: 60, width: '100%', borderRadius: 8, marginTop: 12 }} />
      <div className="skeleton" style={{ height: 60, width: '100%', borderRadius: 8, marginTop: 8 }} />
    </div>
  )

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Announcements</h2>
          {canPost && !showCreate && (
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Announcement</button>
          )}
        </div>

        {/* Create form */}
        {showCreate && canPost && (
          <div className="card" style={{ marginBottom: 16, background: 'var(--bg)' }}>
            <h4 style={{ margin: '0 0 12px 0' }}>Post Announcement</h4>
            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label className="helper">Title *</label>
                <input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Announcement title" />
              </div>
              <div>
                <label className="helper">Body</label>
                <textarea value={formBody} onChange={e => setFormBody(e.target.value)} rows={3} placeholder="Details (optional)" />
              </div>
              <div>
                <label className="helper">Audience</label>
                <select value={formClass} onChange={e => setFormClass(e.target.value)}>
                  <option value="">All School (school-wide)</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn btn-primary" onClick={handleCreate} disabled={saving || !formTitle.trim()}>
                {saving ? <><LoadingSpinner size="sm" /> Posting...</> : 'Post'}
              </button>
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            </div>
          </div>
        )}

        {/* Feed */}
        {announcements.length === 0 ? (
          <div className="empty">No announcements yet.</div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {announcements.map(a => (
              <div key={a.id} className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ margin: 0 }}>{a.title}</h4>
                    <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                      <span className={a.class_name ? 'badge badge-info' : 'badge badge-success'}>
                        {a.class_name ?? 'School-wide'}
                      </span>
                      {a.author_name && <span className="helper">by {a.author_name}</span>}
                      <span className="helper">{new Date(a.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {(a.created_by === userId || role === 'school_admin') && (
                    <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: 13, color: '#dc2626' }} onClick={() => handleDelete(a.id)}>Delete</button>
                  )}
                </div>
                {a.body && <p style={{ margin: '8px 0 0 0', color: 'var(--text)' }}>{a.body}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {(page > 0 || hasMore) && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 16 }}>
            {page > 0 && <button className="btn btn-secondary" onClick={() => changePage(page - 1)}>Previous</button>}
            {hasMore && <button className="btn btn-secondary" onClick={() => changePage(page + 1)}>Next</button>}
          </div>
        )}
      </div>
    </div>
  )
}
