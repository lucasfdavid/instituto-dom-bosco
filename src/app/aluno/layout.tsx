import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BottomNav } from '@/components/ui/BottomNav'

export default async function AlunoLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'aluno') redirect('/professor')

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 overflow-y-auto scrollbar-hide">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
