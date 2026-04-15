import { supabase } from '@/lib/supabaseClient'
import { useLanguage } from '@/i18n/LanguageProvider'

interface Props {
  status: 'suspended' | 'cancelled' | 'trial_expired'
}

const titleKeys: Record<Props['status'], string> = {
  suspended: 'inactive.suspended.title',
  cancelled: 'inactive.cancelled.title',
  trial_expired: 'inactive.trialExpired.title',
}

const bodyKeys: Record<Props['status'], string> = {
  suspended: 'inactive.suspended.body',
  cancelled: 'inactive.cancelled.body',
  trial_expired: 'inactive.trialExpired.body',
}

export default function AccountInactive({ status }: Props) {
  const { t } = useLanguage()
  const title = t(titleKeys[status])
  const body = t(bodyKeys[status])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg, #f7f9fc)',
      padding: 24,
    }}>
      <div style={{
        maxWidth: 440,
        background: 'var(--panel, #fff)',
        borderRadius: 12,
        padding: 40,
        textAlign: 'center',
        boxShadow: 'var(--shadow, 0 6px 20px rgba(2,8,23,0.06))',
        border: '1px solid var(--border, #e2e8f0)',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>
          {status === 'trial_expired' ? '\u23F3' : '\u26A0\uFE0F'}
        </div>
        <h1 style={{ fontSize: 22, marginBottom: 8, color: 'var(--text)' }}>{title}</h1>
        <p style={{ color: 'var(--muted)', lineHeight: 1.6, marginBottom: 28 }}>{body}</p>
        <button
          className="btn btn-secondary"
          onClick={handleSignOut}
          style={{ width: '100%' }}
        >
          {t('nav.signOut')}
        </button>
      </div>
    </div>
  )
}
