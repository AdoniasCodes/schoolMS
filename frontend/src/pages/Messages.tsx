import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function Messages() {
  const [info, setInfo] = useState<string>('')
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setInfo(user ? 'Messages are coming soon for your account.' : 'Please sign in')
    }
    load()
  }, [])
  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Messages</h2>
        <p style={{ color: '#8aa0b6' }}>{info}</p>
        <p style={{ color: '#8aa0b6' }}>MVP note: 1:1 messaging between parent and teacher will be implemented next.</p>
      </div>
    </div>
  )
}
