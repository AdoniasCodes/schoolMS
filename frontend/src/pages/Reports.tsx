import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function Reports() {
  const [info, setInfo] = useState<string>('')
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setInfo(user ? 'Progress Reports coming soon.' : 'Please sign in')
    }
    load()
  }, [])
  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Progress Reports</h2>
        <p style={{ color: '#8aa0b6' }}>{info}</p>
        <p style={{ color: '#8aa0b6' }}>MVP will allow teachers to upload structured reports; parents view history.</p>
      </div>
    </div>
  )
}
