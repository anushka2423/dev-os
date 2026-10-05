import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NavBar from '@/components/layout/nav-bar'
import { ToastProvider } from '@/contexts/toast-context'
import { SWRProvider } from '@/contexts/swr-provider'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/signin')

  return (
    <SWRProvider>
      <ToastProvider>
        <div className="min-h-screen bg-bg-page">
          <NavBar />
          <div className="pt-14">{children}</div>
        </div>
      </ToastProvider>
    </SWRProvider>
  )
}
