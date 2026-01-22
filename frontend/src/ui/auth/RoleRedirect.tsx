import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'

export default function RoleRedirect() {
  const navigate = useNavigate()

  useEffect(() => {
    const run = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/login', { replace: true }); return }
      const { data } = await supabase.from('users').select('role_key').eq('id', user.id).maybeSingle()
      const role = data?.role_key
      if (role === 'school_admin') navigate('/app/admin', { replace: true })
      else if (role === 'teacher') navigate('/app/teacher', { replace: true })
      else if (role === 'parent') navigate('/app/parent', { replace: true })
      else navigate('/app/teacher', { replace: true })
    }
    run()
  }, [navigate])

  return <div style={{ padding: 24 }}>Loading dashboard...</div>
}
