import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { ArrowRight, Mail, Lock, Sparkles } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null)
  const [mode, setMode] = useState<'password' | 'magic'>('password')
  const navigate = useNavigate()
  const location = useLocation() as any

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setMessage({ text: error.message, type: 'error' })
    if (data?.session) {
      const redirectTo = location.state?.from?.pathname || '/app'
      navigate(redirectTo, { replace: true })
    }
    setLoading(false)
  }

  const magicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/app` }
    })
    if (error) setMessage({ text: error.message, type: 'error' })
    else setMessage({ text: 'Check your email for the login link!', type: 'success' })
    setLoading(false)
  }

  return (
    <div className="login-page">
      {/* Left visual panel */}
      <div className="login-visual">
        <div className="login-visual-content">
          <img src="/images/logo.webp" alt="Abogida" style={{ width: 120, borderRadius: 12, marginBottom: 32 }} />
          <h1>Welcome back to Abogida</h1>
          <p>Where every child's journey is seen. Connect with your school community in real time.</p>
          <div className="login-features">
            {[
              'Real-time attendance tracking',
              'Daily classroom photo updates',
              'Direct parent-teacher messaging',
              'Progress reports & analytics',
            ].map((f, i) => (
              <div key={i} className="login-feature-item">
                <div className="login-feature-dot" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="login-visual-footer">
          <Link to="/" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 14 }}>
            &larr; Back to homepage
          </Link>
        </div>
      </div>

      {/* Right form panel */}
      <div className="login-form-panel">
        <div className="login-form-container">
          <div className="login-form-header">
            <h2>Sign in</h2>
            <p>Enter your credentials to access your dashboard</p>
          </div>

          {/* Mode tabs */}
          <div className="login-tabs">
            <button
              className={`login-tab ${mode === 'password' ? 'active' : ''}`}
              onClick={() => setMode('password')}
            >
              <Lock size={14} /> Password
            </button>
            <button
              className={`login-tab ${mode === 'magic' ? 'active' : ''}`}
              onClick={() => setMode('magic')}
            >
              <Sparkles size={14} /> Magic Link
            </button>
          </div>

          <form className="login-form" onSubmit={mode === 'password' ? signIn : magicLink}>
            <div className="login-field">
              <label htmlFor="email">Email address</label>
              <div className="login-input-wrap">
                <Mail size={16} className="login-input-icon" />
                <input
                  id="email"
                  type="email"
                  placeholder="name@school.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {mode === 'password' && (
              <div className="login-field">
                <label htmlFor="password">Password</label>
                <div className="login-input-wrap">
                  <Lock size={16} className="login-input-icon" />
                  <input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>
              </div>
            )}

            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? (
                <span className="login-spinner" />
              ) : (
                <>
                  {mode === 'password' ? 'Sign In' : 'Send Magic Link'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {message && (
            <div className={`login-message ${message.type}`}>
              {message.text}
            </div>
          )}

          <div className="login-footer-text">
            {mode === 'password'
              ? "Don't remember your password? Switch to Magic Link."
              : "We'll email you a secure link to sign in instantly."
            }
          </div>
        </div>
      </div>
    </div>
  )
}
