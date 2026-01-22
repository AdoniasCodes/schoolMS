import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation() as any

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setMessage(error.message)
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
    if (error) setMessage(error.message)
    else setMessage('Check your email for the login link')
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 420, margin: '64px auto', padding: 16 }}>
      <h1>Welcome to ABOGIDA</h1>
      <p>Sign in to continue</p>
      <form style={{ display: 'grid', gap: 12 }}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button onClick={signIn} disabled={loading}>Sign in</button>
        <button onClick={magicLink} disabled={loading} type="button">Send magic link</button>
      </form>
      {message && <p style={{ color: 'crimson' }}>{message}</p>}
    </div>
  )
}
