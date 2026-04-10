import { redirect } from 'next/navigation'
import { createSSRClient } from '@/lib/supabase/server'
import Sidebar from '@/components/admin/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSSRClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userEmail={user.email ?? 'admin'} />
      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  )
}
