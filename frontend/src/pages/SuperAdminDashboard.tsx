import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useToast } from '@/ui/components/toast/ToastProvider'
import { LoadingSpinner } from '@/ui/components/LoadingSpinner'
import { Building2, Users, GraduationCap, UserCheck } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface SchoolRow {
  id: string
  name: string
  address: string | null
  phone: string | null
  subscription_status: string
  subscription_plan: string
  trial_ends_at: string | null
  student_count: number
  teacher_count: number
}

export default function SuperAdminDashboard() {
  const { show } = useToast()
  const [loading, setLoading] = useState(true)
  const [schools, setSchools] = useState<SchoolRow[]>([])
  const [totalStudents, setTotalStudents] = useState(0)
  const [totalTeachers, setTotalTeachers] = useState(0)
  const [totalParents, setTotalParents] = useState(0)

  // Add school form
  const [showAddSchool, setShowAddSchool] = useState(false)
  const [newName, setNewName] = useState('')
  const [newAddress, setNewAddress] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [saving, setSaving] = useState(false)

  // Expanded school
  const [expandedSchool, setExpandedSchool] = useState<string | null>(null)

  // Status editing
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editStatus, setEditStatus] = useState('')
  const [editPlan, setEditPlan] = useState('')

  const loadData = async () => {
    setLoading(true)

    // Load all schools
    const { data: schoolData } = await supabase
      .from('schools')
      .select('id, name, address, phone, subscription_status, subscription_plan, trial_ends_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    // Count students per school
    const { data: students } = await supabase
      .from('students')
      .select('school_id')
      .is('deleted_at', null)

    // Count teachers per school
    const { data: teachers } = await supabase
      .from('teachers')
      .select('school_id')
      .is('deleted_at', null)

    // Count parents
    const { data: parents } = await supabase
      .from('parents')
      .select('id')
      .is('deleted_at', null)

    const studentsBySchool: Record<string, number> = {}
    const teachersBySchool: Record<string, number> = {}
    for (const s of students ?? []) {
      studentsBySchool[s.school_id] = (studentsBySchool[s.school_id] || 0) + 1
    }
    for (const t of teachers ?? []) {
      teachersBySchool[t.school_id] = (teachersBySchool[t.school_id] || 0) + 1
    }

    const enriched: SchoolRow[] = (schoolData ?? []).map(s => ({
      ...s,
      student_count: studentsBySchool[s.id] || 0,
      teacher_count: teachersBySchool[s.id] || 0,
    }))

    setSchools(enriched)
    setTotalStudents(students?.length ?? 0)
    setTotalTeachers(teachers?.length ?? 0)
    setTotalParents(parents?.length ?? 0)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const addSchool = async () => {
    if (!newName.trim()) return
    setSaving(true)
    const { error } = await supabase.from('schools').insert({
      name: newName.trim(),
      address: newAddress.trim() || null,
      phone: newPhone.trim() || null,
    })
    if (error) { show(error.message, 'error') }
    else {
      show('School created', 'success')
      setNewName(''); setNewAddress(''); setNewPhone('')
      setShowAddSchool(false)
      await loadData()
    }
    setSaving(false)
  }

  const saveSchoolStatus = async (schoolId: string) => {
    const updates: Record<string, unknown> = {
      subscription_status: editStatus,
      subscription_plan: editPlan,
    }
    if (editStatus === 'suspended') {
      updates.suspended_at = new Date().toISOString()
    } else {
      updates.suspended_at = null
    }

    const { error } = await supabase.from('schools').update(updates).eq('id', schoolId)
    if (error) { show(error.message, 'error') }
    else {
      show('School updated', 'success')
      setEditingId(null)
      await loadData()
    }
  }

  const statusColor = (s: string) => {
    switch (s) {
      case 'active': return 'badge-success'
      case 'trial': return 'badge-info'
      case 'suspended': return 'badge-warning'
      case 'cancelled': return 'badge-danger'
      default: return ''
    }
  }

  const activeCount = schools.filter(s => s.subscription_status === 'active').length
  const trialCount = schools.filter(s => s.subscription_status === 'trial').length
  const suspendedCount = schools.filter(s => s.subscription_status === 'suspended' || s.subscription_status === 'cancelled').length

  const statusPie = [
    { name: 'Active', value: activeCount, color: '#22c55e' },
    { name: 'Trial', value: trialCount, color: '#3b82f6' },
    { name: 'Inactive', value: suspendedCount, color: '#ef4444' },
  ].filter(d => d.value > 0)

  if (loading) return (
    <div>
      <div className="dash-header"><div className="skeleton" style={{ height: 22, width: 240 }} /></div>
      <div className="stat-grid cols-4">{[1,2,3,4].map(i => <div key={i} className="stat-card"><div className="skeleton" style={{ height: 48 }} /></div>)}</div>
    </div>
  )

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="dash-header">
        <h2>Platform Overview</h2>
        <p>Manage all schools and monitor platform health</p>
      </div>

      {/* Stats */}
      <div className="stat-grid cols-4">
        {[
          { label: 'Schools', value: schools.length, color: '#3b82f6', icon: <Building2 size={24} /> },
          { label: 'Students', value: totalStudents, color: '#8b5cf6', icon: <Users size={24} /> },
          { label: 'Teachers', value: totalTeachers, color: '#22c55e', icon: <GraduationCap size={24} /> },
          { label: 'Parents', value: totalParents, color: '#f59e0b', icon: <UserCheck size={24} /> },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-card-accent" style={{ background: s.color }} />
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-icon" style={{ color: s.color }}>{s.icon}</div>
          </div>
        ))}
      </div>

      {/* Subscription chart */}
      {statusPie.length > 0 && (
        <div className="chart-card">
          <h3>Subscription Status</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={statusPie} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" strokeWidth={2}>
                  {statusPie.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'grid', gap: 10 }}>
              {statusPie.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 4, background: d.color }} />
                  <span style={{ fontWeight: 700 }}>{d.value}</span>
                  <span style={{ color: 'var(--muted)' }}>{d.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Schools management */}
      <div className="chart-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>Schools</h3>
          <button className="btn btn-primary" onClick={() => setShowAddSchool(!showAddSchool)}>
            {showAddSchool ? 'Cancel' : '+ Add School'}
          </button>
        </div>

        {showAddSchool && (
          <div style={{ display: 'grid', gap: 12, marginBottom: 20, padding: 16, background: 'var(--bg)', borderRadius: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label className="helper">School Name *</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="School name" />
              </div>
              <div>
                <label className="helper">Address</label>
                <input value={newAddress} onChange={e => setNewAddress(e.target.value)} placeholder="Address" />
              </div>
              <div>
                <label className="helper">Phone</label>
                <input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="Phone" />
              </div>
            </div>
            <div>
              <button className="btn btn-primary" onClick={addSchool} disabled={saving || !newName.trim()}>
                {saving ? <><LoadingSpinner size="sm" /> Creating...</> : 'Create School'}
              </button>
            </div>
          </div>
        )}

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '8px 12px' }}>School</th>
                <th style={{ textAlign: 'left', padding: '8px 12px' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '8px 12px' }}>Plan</th>
                <th style={{ textAlign: 'center', padding: '8px 12px' }}>Students</th>
                <th style={{ textAlign: 'center', padding: '8px 12px' }}>Teachers</th>
                <th style={{ textAlign: 'left', padding: '8px 12px' }}>Trial Ends</th>
                <th style={{ textAlign: 'right', padding: '8px 12px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {schools.map(s => (
                <>
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 500 }}>{s.name}</div>
                      {s.address && <div className="helper" style={{ fontSize: 11 }}>{s.address}</div>}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      {editingId === s.id ? (
                        <select value={editStatus} onChange={e => setEditStatus(e.target.value)} style={{ fontSize: 13, padding: '2px 6px' }}>
                          <option value="trial">Trial</option>
                          <option value="active">Active</option>
                          <option value="suspended">Suspended</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      ) : (
                        <span className={`badge ${statusColor(s.subscription_status)}`}>{s.subscription_status}</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      {editingId === s.id ? (
                        <select value={editPlan} onChange={e => setEditPlan(e.target.value)} style={{ fontSize: 13, padding: '2px 6px' }}>
                          <option value="basic">Basic</option>
                          <option value="standard">Standard</option>
                          <option value="premium">Premium</option>
                        </select>
                      ) : (
                        <span style={{ fontSize: 13, textTransform: 'capitalize' }}>{s.subscription_plan}</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>{s.student_count}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>{s.teacher_count}</td>
                    <td style={{ padding: '10px 12px', fontSize: 13 }}>
                      {s.trial_ends_at ? new Date(s.trial_ends_at).toLocaleDateString() : '-'}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      {editingId === s.id ? (
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                          <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => saveSchoolStatus(s.id)}>Save</button>
                          <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setEditingId(null)}>Cancel</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '4px 10px', fontSize: 12 }}
                            onClick={() => { setEditingId(s.id); setEditStatus(s.subscription_status); setEditPlan(s.subscription_plan) }}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-ghost"
                            style={{ padding: '4px 10px', fontSize: 12 }}
                            onClick={() => setExpandedSchool(expandedSchool === s.id ? null : s.id)}
                          >
                            {expandedSchool === s.id ? 'Collapse' : 'Details'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                  {expandedSchool === s.id && (
                    <tr key={`${s.id}-detail`}>
                      <td colSpan={7} style={{ padding: '12px 24px', background: 'var(--bg)' }}>
                        <div className="grid cols-3" style={{ gap: 12 }}>
                          <div>
                            <div className="helper">Phone</div>
                            <div>{s.phone || 'Not set'}</div>
                          </div>
                          <div>
                            <div className="helper">Students</div>
                            <div>{s.student_count}</div>
                          </div>
                          <div>
                            <div className="helper">Teachers</div>
                            <div>{s.teacher_count}</div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {schools.length === 0 && (
          <div className="empty" style={{ padding: 24 }}>No schools yet. Create one to get started.</div>
        )}
      </div>
    </div>
  )
}
