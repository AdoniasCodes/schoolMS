import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'

export default function RequireAuth({ children }: { children: JSX.Element }) {
  const [loading, setLoading] = useState(true)
  const [isAuthed, setIsAuthed] = useState(false)
  const loc = useLocation()

  useEffect(() => {
    let cancelled = false
    const hasAuthParams = () => {
      const h = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      const q = new URLSearchParams(window.location.search)
      return !!(h.get('access_token') || h.get('refresh_token') || q.get('code'))
    }

    const init = async () => {
      // If we just came from a magic link, wait for Supabase to process tokens
      if (hasAuthParams()) {
        const timer = setTimeout(() => {
          // Failsafe: stop waiting after 5s
          if (!cancelled) setLoading(false)
        }, 5000)
        const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
          if (cancelled) return
          if (session) {
            setIsAuthed(true)
            setLoading(false)
            clearTimeout(timer)
          }
        })
        // Also check current session in case it's already set
        const { data } = await supabase.auth.getSession()
        if (!cancelled && data.session) {
          setIsAuthed(true)
          setLoading(false)
          clearTimeout(timer)
        }
        return () => { sub.subscription.unsubscribe(); clearTimeout(timer); cancelled = true }
      } else {
        const { data } = await supabase.auth.getSession()
        if (!cancelled) {
          setIsAuthed(!!data.session)
          setLoading(false)
        }
      }
    }

    const cleanup = init()
    return () => { cancelled = true }
  }, [])

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>
  if (!isAuthed) return <Navigate to="/login" state={{ from: loc }} replace />
  return children
}
