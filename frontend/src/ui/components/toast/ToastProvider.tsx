import React, { createContext, useContext, useMemo, useState } from 'react'

type ToastType = 'success' | 'error' | 'info'
interface Toast { id: number; type: ToastType; message: string }

interface ToastContextValue {
  show: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])
  const show = (message: string, type: ToastType = 'info') => {
    const id = Date.now() + Math.random()
    setToasts(t => [...t, { id, type, message }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }
  const value = useMemo(() => ({ show }), [])
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="true" style={{ position:'fixed', right:16, bottom:16, display:'grid', gap:8 }}>
        {toasts.map(t => (
          <div key={t.id} className="toast" role="status" style={{ borderLeft: `4px solid ${t.type==='success'?'#16a34a':t.type==='error'?'#dc2626':'#2563eb'}` }}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
