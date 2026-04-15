import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import en from './en'
import am from './am'

type Lang = 'en' | 'am'

const translations: Record<Lang, Record<string, string>> = { en, am }

interface LanguageContextValue {
  language: Lang
  setLanguage: (lang: Lang) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

export const useLanguage = () => {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem('language') as Lang | null
    return saved === 'am' ? 'am' : 'en'
  })

  // On mount, sync with DB preference (if logged in)
  useEffect(() => {
    const syncFromDb = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('users').select('language_preference').eq('id', user.id).maybeSingle()
      if (data?.language_preference === 'am' || data?.language_preference === 'en') {
        setLang(data.language_preference)
        localStorage.setItem('language', data.language_preference)
      }
    }
    syncFromDb()
  }, [])

  const setLanguage = async (lang: Lang) => {
    setLang(lang)
    localStorage.setItem('language', lang)
    // Persist to DB
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('users').update({ language_preference: lang }).eq('id', user.id)
    }
  }

  const t = (key: string): string => {
    return translations[language][key] ?? translations.en[key] ?? key
  }

  const value = useMemo(() => ({ language, setLanguage, t }), [language])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
