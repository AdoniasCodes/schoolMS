import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useLanguage } from '@/i18n/LanguageProvider'
import { LoadingSpinner } from '@/ui/components/LoadingSpinner'
import { Search as SearchIcon } from 'lucide-react'

type Role = 'school_admin' | 'teacher' | 'super_admin'
type Tab = 'students' | 'teachers' | 'schools' | 'admins' | 'parents'

interface StudentResult {
  id: string
  first_name: string
  last_name: string
  gender: string | null
  guardian_name: string | null
  guardian_phone: string | null
  class_name: string | null
}

interface TeacherResult {
  id: string
  full_name: string
  email: string | null
  school_name: string | null
}

interface ParentResult {
  id: string
  full_name: string
  email: string | null
  children: string[]
}

interface SchoolResult {
  id: string
  name: string
  address: string | null
  phone: string | null
  subscription_status: string
  subscription_plan: string
}

interface AdminResult {
  id: string
  full_name: string
  email: string | null
  school_name: string | null
}

export default function Search() {
  const { t } = useLanguage()
  const [role, setRole] = useState<Role | null>(null)
  const [schoolId, setSchoolId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('students')

  const [students, setStudents] = useState<StudentResult[]>([])
  const [teachers, setTeachers] = useState<TeacherResult[]>([])
  const [schools, setSchools] = useState<SchoolResult[]>([])
  const [admins, setAdmins] = useState<AdminResult[]>([])
  const [parents, setParents] = useState<ParentResult[]>([])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: me } = await supabase.from('users').select('role_key, school_id').eq('id', user.id).maybeSingle()
      const r = me?.role_key as Role | null
      setRole(r)
      setSchoolId(me?.school_id ?? null)

      if (r === 'teacher') setActiveTab('students')
      else if (r === 'school_admin') setActiveTab('students')
      else if (r === 'super_admin') setActiveTab('schools')

      setLoading(false)
    }
    init()
  }, [])

  const getTabs = (): { key: Tab; label: string }[] => {
    if (role === 'teacher') return [{ key: 'students', label: t('search.students') }]
    if (role === 'school_admin') return [
      { key: 'students', label: t('search.students') },
      { key: 'teachers', label: t('search.teachers') },
    ]
    if (role === 'super_admin') return [
      { key: 'schools', label: t('search.schools') },
      { key: 'admins', label: t('search.admins') },
      { key: 'teachers', label: t('search.teachers') },
      { key: 'parents', label: t('search.parents') },
      { key: 'students', label: t('search.students') },
    ]
    return []
  }

  const doSearch = async (q: string, tab: Tab) => {
    if (!q.trim() || q.trim().length < 2) {
      setStudents([]); setTeachers([]); setSchools([]); setAdmins([]); setParents([])
      return
    }
    setSearching(true)
    const term = `%${q.trim()}%`

    if (tab === 'students') {
      let qb = supabase
        .from('students')
        .select('id, first_name, last_name, gender, guardian_name, guardian_phone, enrollments(classes(name))')
        .is('deleted_at', null)
        .or(`first_name.ilike.${term},last_name.ilike.${term},guardian_name.ilike.${term}`)
        .order('first_name')
        .limit(30)

      if (role === 'teacher') {
        // Teacher: get own class IDs first
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: tch } = await supabase.from('teachers').select('id').eq('user_id', user.id).maybeSingle()
          if (tch) {
            const { data: cls } = await supabase.from('classes').select('id').eq('teacher_id', tch.id).is('deleted_at', null)
            const classIds = (cls ?? []).map(c => c.id)
            if (classIds.length > 0) {
              const { data: enrolls } = await supabase.from('enrollments').select('student_id').in('class_id', classIds).is('deleted_at', null)
              const studentIds = [...new Set((enrolls ?? []).map(e => e.student_id))]
              if (studentIds.length > 0) {
                qb = supabase
                  .from('students')
                  .select('id, first_name, last_name, gender, guardian_name, guardian_phone, enrollments(classes(name))')
                  .is('deleted_at', null)
                  .in('id', studentIds)
                  .or(`first_name.ilike.${term},last_name.ilike.${term},guardian_name.ilike.${term}`)
                  .order('first_name')
                  .limit(30)
              } else {
                setStudents([])
                setSearching(false)
                return
              }
            }
          }
        }
      }

      const { data } = await qb
      setStudents((data ?? []).map((s: any) => ({
        id: s.id,
        first_name: s.first_name,
        last_name: s.last_name,
        gender: s.gender,
        guardian_name: s.guardian_name,
        guardian_phone: s.guardian_phone,
        class_name: s.enrollments?.[0]?.classes?.name ?? null,
      })))
    }

    if (tab === 'teachers') {
      const { data } = await supabase
        .from('teachers')
        .select('id, users(full_name, email), schools(name)')
        .is('deleted_at', null)
        .limit(50)

      const filtered = (data ?? []).filter((row: any) => {
        const name = (row.users?.full_name ?? '').toLowerCase()
        const email = (row.users?.email ?? '').toLowerCase()
        return name.includes(q.trim().toLowerCase()) || email.includes(q.trim().toLowerCase())
      })

      setTeachers(filtered.map((row: any) => ({
        id: row.id,
        full_name: row.users?.full_name ?? '',
        email: row.users?.email ?? null,
        school_name: row.schools?.name ?? null,
      })).slice(0, 30))
    }

    if (tab === 'parents') {
      const { data } = await supabase
        .from('parents')
        .select('id, users(full_name, email), parent_students(students(first_name, last_name))')
        .is('deleted_at', null)
        .limit(50)

      const filtered = (data ?? []).filter((row: any) => {
        const name = (row.users?.full_name ?? '').toLowerCase()
        return name.includes(q.trim().toLowerCase())
      })

      setParents(filtered.map((row: any) => ({
        id: row.id,
        full_name: row.users?.full_name ?? '',
        email: row.users?.email ?? null,
        children: (row.parent_students ?? []).map((ps: any) =>
          ps.students ? `${ps.students.first_name} ${ps.students.last_name}` : ''
        ).filter(Boolean),
      })).slice(0, 30))
    }

    if (tab === 'schools') {
      const { data } = await supabase
        .from('schools')
        .select('id, name, address, phone, subscription_status, subscription_plan')
        .is('deleted_at', null)
        .ilike('name', term)
        .order('name')
        .limit(30)

      setSchools(data ?? [])
    }

    if (tab === 'admins') {
      const { data } = await supabase
        .from('users')
        .select('id, full_name, email, role_key, schools(name)')
        .eq('role_key', 'school_admin')
        .is('deleted_at', null)
        .limit(50)

      const filtered = (data ?? []).filter((row: any) => {
        const name = (row.full_name ?? '').toLowerCase()
        const email = (row.email ?? '').toLowerCase()
        return name.includes(q.trim().toLowerCase()) || email.includes(q.trim().toLowerCase())
      })

      setAdmins(filtered.map((row: any) => ({
        id: row.id,
        full_name: row.full_name ?? '',
        email: row.email ?? null,
        school_name: (row as any).schools?.name ?? null,
      })).slice(0, 30))
    }

    setSearching(false)
  }

  useEffect(() => {
    const timer = setTimeout(() => { doSearch(query, activeTab) }, 300)
    return () => clearTimeout(timer)
  }, [query, activeTab])

  if (loading) return (
    <div className="card">
      <div className="skeleton" style={{ height: 16, width: 200, borderRadius: 8 }} />
      <div className="skeleton" style={{ height: 60, width: '100%', borderRadius: 8, marginTop: 12 }} />
    </div>
  )

  if (!role || !['school_admin', 'teacher', 'super_admin'].includes(role)) {
    return (
      <div className="card">
        <h2 style={{ marginTop: 0 }}>{t('search.title')}</h2>
        <p className="helper">{t('search.noResults')}</p>
      </div>
    )
  }

  const tabs = getTabs()

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>{t('search.title')}</h2>

        {/* Tabs */}
        {tabs.length > 1 && (
          <div className="tabs" style={{ marginBottom: 16 }}>
            {tabs.map(tb => (
              <button
                key={tb.key}
                className={`tab ${activeTab === tb.key ? 'active' : ''}`}
                onClick={() => { setActiveTab(tb.key); setQuery('') }}
              >
                {tb.label}
              </button>
            ))}
          </div>
        )}

        {/* Search input */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <SearchIcon size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('search.placeholder')}
            style={{ paddingLeft: 36, width: '100%' }}
            autoFocus
          />
        </div>

        {/* Results */}
        {searching && <div style={{ textAlign: 'center', padding: 16 }}><LoadingSpinner size="md" /></div>}

        {!searching && query.trim().length < 2 && (
          <div className="empty" style={{ padding: 24 }}>{t('search.typeToSearch')}</div>
        )}

        {/* Students results */}
        {!searching && activeTab === 'students' && query.trim().length >= 2 && (
          students.length === 0 ? (
            <div className="empty">{t('search.noResults')}</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>{t('common.name')}</th>
                    <th>{t('students.gender')}</th>
                    <th>{t('search.class')}</th>
                    <th>{t('search.guardian')}</th>
                    <th>{t('search.phone')}</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 500 }}>{s.first_name} {s.last_name}</td>
                      <td>{s.gender ?? '-'}</td>
                      <td><span className="badge">{s.class_name ?? '-'}</span></td>
                      <td>{s.guardian_name ?? '-'}</td>
                      <td>{s.guardian_phone ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Teachers results */}
        {!searching && activeTab === 'teachers' && query.trim().length >= 2 && (
          teachers.length === 0 ? (
            <div className="empty">{t('search.noResults')}</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>{t('common.name')}</th>
                    <th>{t('search.email')}</th>
                    {role === 'super_admin' && <th>{t('search.school')}</th>}
                  </tr>
                </thead>
                <tbody>
                  {teachers.map(tc => (
                    <tr key={tc.id}>
                      <td style={{ fontWeight: 500 }}>{tc.full_name}</td>
                      <td>{tc.email ?? '-'}</td>
                      {role === 'super_admin' && <td><span className="badge">{tc.school_name ?? '-'}</span></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Schools results (super admin) */}
        {!searching && activeTab === 'schools' && query.trim().length >= 2 && (
          schools.length === 0 ? (
            <div className="empty">{t('search.noResults')}</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>{t('common.name')}</th>
                    <th>{t('super.address')}</th>
                    <th>{t('search.phone')}</th>
                    <th>{t('search.status')}</th>
                    <th>{t('search.plan')}</th>
                  </tr>
                </thead>
                <tbody>
                  {schools.map(sc => (
                    <tr key={sc.id}>
                      <td style={{ fontWeight: 500 }}>{sc.name}</td>
                      <td>{sc.address ?? '-'}</td>
                      <td>{sc.phone ?? '-'}</td>
                      <td><span className="badge">{sc.subscription_status}</span></td>
                      <td><span className="badge">{sc.subscription_plan}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Admins results (super admin) */}
        {!searching && activeTab === 'admins' && query.trim().length >= 2 && (
          admins.length === 0 ? (
            <div className="empty">{t('search.noResults')}</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>{t('common.name')}</th>
                    <th>{t('search.email')}</th>
                    <th>{t('search.school')}</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map(a => (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 500 }}>{a.full_name}</td>
                      <td>{a.email ?? '-'}</td>
                      <td><span className="badge">{a.school_name ?? '-'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Parents results (super admin) */}
        {!searching && activeTab === 'parents' && query.trim().length >= 2 && (
          parents.length === 0 ? (
            <div className="empty">{t('search.noResults')}</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>{t('common.name')}</th>
                    <th>{t('search.email')}</th>
                    <th>{t('admin.children')}</th>
                  </tr>
                </thead>
                <tbody>
                  {parents.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 500 }}>{p.full_name}</td>
                      <td>{p.email ?? '-'}</td>
                      <td>{p.children.length > 0 ? p.children.join(', ') : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  )
}
