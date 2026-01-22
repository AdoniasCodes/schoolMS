import React from 'react'
import { Outlet } from 'react-router-dom'
import RequireAuth from '@/ui/auth/RequireAuth'
import { AppShell } from '@/ui/layout/AppShell'

export default function ProtectedLayout() {
  return (
    <RequireAuth>
      <AppShell>
        <Outlet />
      </AppShell>
    </RequireAuth>
  )
}
