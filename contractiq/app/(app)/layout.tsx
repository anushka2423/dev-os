import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NavBar from '@/components/layout/nav-bar'
import { ToastProvider } from '@/contexts/toast-context'
import { SWRProvider } from '@/contexts/swr-provider'
import { AuthProvider } from '@/contexts/auth-context'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/signin')

  return (
    <AuthProvider>
      <SWRProvider>
        <ToastProvider>
          <div className="min-h-screen bg-bg-page">
            <NavBar />
            <div className="pt-14">{children}</div>
          </div>
        </ToastProvider>
      </SWRProvider>
    </AuthProvider>
  )
}
