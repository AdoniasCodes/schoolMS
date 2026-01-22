import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string | undefined

if (!supabaseUrl || !supabaseAnonKey) {
  const msg = `Supabase environment variables are missing.
Please create a frontend/.env file (based on .env.example) with:
  VITE_SUPABASE_URL=your_project_url
  VITE_SUPABASE_ANON_KEY=your_anon_key
After saving, restart the dev server (npm run dev).`
  // Log a clear message and throw to stop ambiguous errors
  // eslint-disable-next-line no-console
  console.error(msg)
  throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
