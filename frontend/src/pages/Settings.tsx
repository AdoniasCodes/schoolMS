import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useTheme } from '@/ui/theme/ThemeProvider'

export default function Settings() {
  const [profile, setProfile] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('users').select('full_name, language_preference, role_key').eq('id', user.id).maybeSingle()
      setProfile(data)
    }
    load()
  }, [])

  const saveLanguage = async (lang: 'en' | 'am') => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setSaving(true)
    await supabase.from('users').update({ language_preference: lang }).eq('id', user.id)
    setProfile((p: any) => ({ ...p, language_preference: lang }))
    setSaving(false)
  }

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Settings</h2>
        {!profile ? (
          <div className="skeleton" style={{ height: 18, width: 220, borderRadius: 8 }} />
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <label>Account</label>
              <div className="badge">{profile.full_name ?? 'User'} — {profile.role_key}</div>
            </div>
            <div>
              <label>Theme</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary" onClick={() => setTheme('light')} disabled={theme==='light'}>Light</button>
                <button className="btn btn-secondary" onClick={() => setTheme('dark')} disabled={theme==='dark'}>Dark</button>
              </div>
            </div>
            <div>
              <label>Language</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary" onClick={() => saveLanguage('en')} disabled={saving || profile?.language_preference==='en'}>English</button>
                <button className="btn btn-secondary" onClick={() => saveLanguage('am')} disabled={saving || profile?.language_preference==='am'}>Amharic</button>
              </div>
              <div className="helper">Current: {profile?.language_preference ?? 'en'}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
