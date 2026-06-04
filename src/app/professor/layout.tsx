import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function ProfessorLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'professor') redirect('/aluno')

  return <div className="min-h-screen">{children}</div>
}
