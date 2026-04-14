import { supabase } from '@/lib/supabaseClient'

interface Props {
  status: 'suspended' | 'cancelled' | 'trial_expired'
}

const messages: Record<Props['status'], { title: string; body: string }> = {
  suspended: {
    title: 'Account Suspended',
    body: 'Your school\'s subscription has been suspended. Please contact your school administrator or reach out to support to restore access.',
  },
  cancelled: {
    title: 'Account Cancelled',
    body: 'Your school\'s subscription has been cancelled. Please contact your school administrator if you believe this is an error.',
  },
  trial_expired: {
    title: 'Free Trial Expired',
    body: 'Your school\'s free trial has ended. Please contact your school administrator to activate a subscription and continue using the platform.',
  },
}

export default function AccountInactive({ status }: Props) {
  const { title, body } = messages[status]

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
          Sign Out
        </button>
      </div>
    </div>
  )
}
