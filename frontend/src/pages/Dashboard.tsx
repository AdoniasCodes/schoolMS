import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { useLanguage } from '@/i18n/LanguageProvider'

export default function Dashboard() {
  const { t } = useLanguage()
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
        setProfile(data)
      }
    }
    load()
  }, [])

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>{t('nav.dashboard')}</h2>
        {profile ? (
          <div style={{ color: '#8aa0b6' }}>
            <div><strong>Name:</strong> {profile.full_name ?? 'Unknown'}</div>
            <div><strong>Role:</strong> {profile.role_key}</div>
            <div><strong>Language:</strong> {profile.language_preference}</div>
          </div>
        ) : (
          <p style={{ color: '#8aa0b6' }}>{t('common.loading')}</p>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Quick Links</h3>
        <div className="grid cols-3">
          <Link to="/app/attendance" className="link-card card">
            <h4>{t('nav.attendance')}</h4>
            <p>{t('teacher.takeAttendanceDesc')}</p>
          </Link>
          <Link to="/app/updates" className="link-card card">
            <h4>{t('nav.updates')}</h4>
            <p>{t('teacher.postUpdateDesc')}</p>
          </Link>
          <Link to="/app/messages" className="link-card card">
            <h4>{t('nav.messages')}</h4>
            <p>{t('parent.viewMessagesDesc')}</p>
          </Link>
          <Link to="/app/reports" className="link-card card">
            <h4>{t('nav.reports')}</h4>
            <p>{t('parent.viewReportsDesc')}</p>
          </Link>
          <Link to="/app/announcements" className="link-card card">
            <h4>{t('nav.announcements')}</h4>
            <p>{t('admin.announceDesc')}</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
