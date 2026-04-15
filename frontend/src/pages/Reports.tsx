import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useToast } from '@/ui/components/toast/ToastProvider'
import { LoadingSpinner } from '@/ui/components/LoadingSpinner'
import { FileUpload } from '@/ui/components/FileUpload'
import { Paperclip } from 'lucide-react'
import { useLanguage } from '@/i18n/LanguageProvider'

interface ClassOption { id: string; name: string }
interface StudentOption { id: string; first_name: string; last_name: string }
interface MediaItem { url: string; name: string; mime: string }
interface Report {
  id: string
  term_label: string
  summary: string | null
  metrics: Record<string, string> | null
  created_at: string
  student_name: string
}

type Role = 'teacher' | 'parent' | 'school_admin'

const CATEGORIES = ['Reading', 'Writing', 'Math', 'Social Skills', 'Behavior']
const LEVELS = ['Excellent', 'Good', 'Developing', 'Needs Support']

const levelColor = (level: string) => {
  switch (level) {
    case 'Excellent': return { color: '#166534', background: '#dcfce7', borderColor: '#bbf7d0' }
    case 'Good': return { color: '#1e40af', background: '#dbeafe', borderColor: '#bfdbfe' }
    case 'Developing': return { color: '#92400e', background: '#fef3c7', borderColor: '#fde68a' }
    case 'Needs Support': return { color: '#991b1b', background: '#fef2f2', borderColor: '#fecaca' }
    default: return {}
  }
}

export default function Reports() {
  const { show } = useToast()
  const { t } = useLanguage()
  const [role, setRole] = useState<Role | null>(null)
  const [schoolId, setSchoolId] = useState<string | null>(null)
  const [teacherId, setTeacherId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Teacher: class + student selectors
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [selectedClass, setSelectedClass] = useState('')
  const [students, setStudents] = useState<StudentOption[]>([])
  const [selectedStudent, setSelectedStudent] = useState('')

  // Reports list
  const [reports, setReports] = useState<Report[]>([])
  const [loadingReports, setLoadingReports] = useState(false)

  // Create form
  const [showCreate, setShowCreate] = useState(false)
  const [formTerm, setFormTerm] = useState('')
  const [formSummary, setFormSummary] = useState('')
  const [formMetrics, setFormMetrics] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  // File upload + media
  const [userId, setUserId] = useState<string | null>(null)
  const [lastReportId, setLastReportId] = useState<string | null>(null)
  const [mediaMap, setMediaMap] = useState<Record<string, MediaItem[]>>({})

  const loadMediaForReports = async (reportIds: string[]) => {
    if (reportIds.length === 0) { setMediaMap({}); return }
    const { data: media } = await supabase
      .from('media_assets')
      .select('progress_report_id, object_path, mime_type')
      .in('progress_report_id', reportIds)
      .is('deleted_at', null)

    const map: Record<string, MediaItem[]> = {}
    for (const m of media ?? []) {
      const { data: signed } = await supabase.storage.from('media').createSignedUrl(m.object_path, 3600)
      if (signed && m.progress_report_id) {
        if (!map[m.progress_report_id]) map[m.progress_report_id] = []
        map[m.progress_report_id].push({
          url: signed.signedUrl,
          name: m.object_path.split('/').pop() || 'Attachment',
          mime: m.mime_type || '',
        })
      }
    }
    setMediaMap(map)
  }

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setUserId(user.id)

      const { data: me } = await supabase.from('users').select('role_key, school_id').eq('id', user.id).maybeSingle()
      const r = (me?.role_key ?? null) as Role | null
      setRole(r)
      setSchoolId(me?.school_id ?? null)

      if (r === 'teacher') {
        const { data: t } = await supabase.from('teachers').select('id').eq('user_id', user.id).maybeSingle()
        setTeacherId(t?.id ?? null)
        if (t?.id) {
          const { data: cls } = await supabase.from('classes').select('id, name').eq('teacher_id', t.id).is('deleted_at', null).order('name')
          setClasses(cls ?? [])
        }
      } else if (r === 'parent') {
        const { data: p } = await supabase.from('parents').select('id').eq('user_id', user.id).maybeSingle()
        if (p?.id) {
          // Get children's reports
          const { data: ps } = await supabase
            .from('parent_students')
            .select('student_id')
            .eq('parent_id', p.id)
          const childIds = (ps ?? []).map(r => r.student_id)

          if (childIds.length > 0) {
            const { data: rpts } = await supabase
              .from('progress_reports')
              .select('id, term_label, summary, metrics, created_at, students(first_name, last_name)')
              .in('student_id', childIds)
              .is('deleted_at', null)
              .order('created_at', { ascending: false })

            const mapped = (rpts ?? []).map((r: any) => ({
              id: r.id,
              term_label: r.term_label,
              summary: r.summary,
              metrics: r.metrics,
              created_at: r.created_at,
              student_name: r.students ? `${r.students.first_name} ${r.students.last_name}` : '',
            }))
            setReports(mapped)
            loadMediaForReports(mapped.map(r => r.id))
          }
        }
      } else if (r === 'school_admin') {
        // Admin sees all school reports
        const { data: rpts } = await supabase
          .from('progress_reports')
          .select('id, term_label, summary, metrics, created_at, students(first_name, last_name)')
          .is('deleted_at', null)
          .order('created_at', { ascending: false })

        const mapped = (rpts ?? []).map((r: any) => ({
          id: r.id,
          term_label: r.term_label,
          summary: r.summary,
          metrics: r.metrics,
          created_at: r.created_at,
          student_name: r.students ? `${r.students.first_name} ${r.students.last_name}` : '',
        }))
        setReports(mapped)
        loadMediaForReports(mapped.map(r => r.id))
      }

      setLoading(false)
    }
    init()
  }, [])

  // Teacher: load students when class selected
  useEffect(() => {
    if (!selectedClass) { setStudents([]); setSelectedStudent(''); return }
    const loadStudents = async () => {
      const { data: enrolls } = await supabase.from('enrollments').select('student_id').eq('class_id', selectedClass).is('deleted_at', null)
      const ids = (enrolls ?? []).map(e => e.student_id)
      if (ids.length === 0) { setStudents([]); return }
      const { data } = await supabase.from('students').select('id, first_name, last_name').in('id', ids).is('deleted_at', null).order('first_name')
      setStudents(data ?? [])
    }
    loadStudents()
  }, [selectedClass])

  // Teacher: load reports for selected student
  useEffect(() => {
    if (!selectedStudent || role !== 'teacher') return
    const loadReports = async () => {
      setLoadingReports(true)
      const { data } = await supabase
        .from('progress_reports')
        .select('id, term_label, summary, metrics, created_at, students(first_name, last_name)')
        .eq('student_id', selectedStudent)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      const mapped = (data ?? []).map((r: any) => ({
        id: r.id,
        term_label: r.term_label,
        summary: r.summary,
        metrics: r.metrics,
        created_at: r.created_at,
        student_name: r.students ? `${r.students.first_name} ${r.students.last_name}` : '',
      }))
      setReports(mapped)
      loadMediaForReports(mapped.map(r => r.id))
      setLoadingReports(false)
    }
    loadReports()
  }, [selectedStudent])

  const handleCreate = async () => {
    if (!formTerm.trim() || !selectedStudent || !teacherId || !schoolId) return
    setSaving(true)
    const { data: newReport, error } = await supabase.from('progress_reports').insert({
      school_id: schoolId,
      student_id: selectedStudent,
      teacher_id: teacherId,
      term_label: formTerm.trim(),
      summary: formSummary.trim() || null,
      metrics: Object.keys(formMetrics).length > 0 ? formMetrics : null,
    }).select('id').single()
    if (error) { show(error.message, 'error') }
    else {
      show(t('reports.reportCreated'), 'success')
      setFormTerm(''); setFormSummary(''); setFormMetrics({}); setShowCreate(false)
      if (newReport) setLastReportId(newReport.id)
      // Reload
      const { data } = await supabase
        .from('progress_reports')
        .select('id, term_label, summary, metrics, created_at, students(first_name, last_name)')
        .eq('student_id', selectedStudent)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
      const mapped = (data ?? []).map((r: any) => ({
        id: r.id, term_label: r.term_label, summary: r.summary, metrics: r.metrics,
        created_at: r.created_at,
        student_name: r.students ? `${r.students.first_name} ${r.students.last_name}` : '',
      }))
      setReports(mapped)
      loadMediaForReports(mapped.map(r => r.id))
    }
    setSaving(false)
  }

  if (loading) return (
    <div className="card">
      <div className="skeleton" style={{ height: 16, width: 200, borderRadius: 8 }} />
      <div className="skeleton" style={{ height: 60, width: '100%', borderRadius: 8, marginTop: 12 }} />
    </div>
  )

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>{t('reports.title')}</h2>

        {/* Teacher selectors */}
        {role === 'teacher' && (
          <div className="grid cols-2" style={{ gap: 12, marginBottom: 16 }}>
            <div>
              <label className="helper">{t('reports.selectClass')}</label>
              <select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setSelectedStudent('') }}>
                <option value="">{t('attendance.selectClass')}</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="helper">{t('reports.selectStudent')}</label>
              <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} disabled={!selectedClass}>
                <option value="">{t('reports.selectStudent')}</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Create button */}
        {role === 'teacher' && selectedStudent && !showCreate && (
          <button className="btn btn-primary" style={{ marginBottom: 16 }} onClick={() => setShowCreate(true)}>
            {t('reports.createReport')}
          </button>
        )}

        {/* Create form */}
        {showCreate && role === 'teacher' && (
          <div className="card" style={{ marginBottom: 16, background: 'var(--bg)' }}>
            <h4 style={{ margin: '0 0 12px 0' }}>{t('reports.newReport')}</h4>
            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label className="helper">{t('reports.term')}</label>
                <input value={formTerm} onChange={e => setFormTerm(e.target.value)} placeholder={t('reports.termPlaceholder')} />
              </div>
              <div>
                <label className="helper">{t('reports.summary')}</label>
                <textarea value={formSummary} onChange={e => setFormSummary(e.target.value)} rows={3} placeholder={t('reports.summaryPlaceholder')} />
              </div>
              <div>
                <label className="helper">{t('reports.metrics')}</label>
                <div style={{ display: 'grid', gap: 8, marginTop: 4 }}>
                  {CATEGORIES.map(cat => (
                    <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ width: 120, fontSize: 14 }}>{cat}</span>
                      <select
                        value={formMetrics[cat] ?? ''}
                        onChange={e => setFormMetrics(prev => ({ ...prev, [cat]: e.target.value }))}
                        style={{ flex: 1, padding: '6px 8px' }}
                      >
                        <option value="">{t('reports.notRated')}</option>
                        {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn btn-primary" onClick={handleCreate} disabled={saving || !formTerm.trim()}>
                {saving ? <><LoadingSpinner size="sm" /> Saving...</> : t('reports.create')}
              </button>
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>{t('common.cancel')}</button>
            </div>
          </div>
        )}

        {/* File upload after report creation */}
        {lastReportId && schoolId && userId && (
          <div className="card" style={{ marginBottom: 16, background: 'var(--bg)', padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Paperclip size={16} />
              <strong style={{ fontSize: 14 }}>{t('reports.attachFiles')}</strong>
            </div>
            <FileUpload
              schoolId={schoolId}
              uploadedBy={userId}
              folder="reports"
              associationField="progress_report_id"
              associationId={lastReportId}
              onUploadComplete={() => {
                show(t('reports.fileAttached'), 'success')
                loadMediaForReports(reports.map(r => r.id))
              }}
              onError={(msg: string) => show(msg, 'error')}
              compact
            />
            <button
              className="btn btn-secondary"
              style={{ marginTop: 8, fontSize: 13 }}
              onClick={() => setLastReportId(null)}
            >
              {t('reports.doneAttaching')}
            </button>
          </div>
        )}

        {/* Reports list */}
        {loadingReports ? (
          <div className="skeleton" style={{ height: 80, borderRadius: 10 }} />
        ) : reports.length === 0 ? (
          <div className="empty">
            {role === 'teacher' && !selectedStudent
              ? t('reports.selectPrompt')
              : t('reports.noReports')
            }
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {reports.map(r => (
              <div key={r.id} className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: 0 }}>{r.term_label}</h4>
                    <div className="helper" style={{ marginTop: 2 }}>
                      {r.student_name} &middot; {new Date(r.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                {r.summary && <p style={{ margin: '8px 0', fontSize: 14 }}>{r.summary}</p>}
                {r.metrics && Object.keys(r.metrics).length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {Object.entries(r.metrics).map(([cat, level]) => (
                      <span key={cat} className="badge" style={{ ...levelColor(level), fontSize: 12 }}>
                        {cat}: {level}
                      </span>
                    ))}
                  </div>
                )}
                {mediaMap[r.id] && mediaMap[r.id].length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                    {mediaMap[r.id].map((m, i) => (
                      m.mime.startsWith('image/') ? (
                        <img
                          key={i}
                          src={m.url}
                          alt={m.name}
                          style={{ maxWidth: 180, maxHeight: 140, borderRadius: 8, cursor: 'pointer', objectFit: 'cover' }}
                          onClick={() => window.open(m.url, '_blank')}
                        />
                      ) : (
                        <a
                          key={i}
                          href={m.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="badge"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12 }}
                        >
                          <Paperclip size={12} /> {m.name}
                        </a>
                      )
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
