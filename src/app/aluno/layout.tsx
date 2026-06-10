'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Home, PlusCircle, CalendarDays, BarChart2, User, LogOut, BookOpen, Bell } from 'lucide-react'

const navItems = [
  { href: '/aluno', icon: Home, label: 'Início' },
  { href: '/aluno/registrar', icon: PlusCircle, label: 'Adicionar estudo' },
  { href: '/aluno/calendario', icon: CalendarDays, label: 'Calendário' },
  { href: '/aluno/indicadores', icon: BarChart2, label: 'Indicadores' },
  { href: '/aluno/perfil', icon: User, label: 'Meu perfil' },
]

export default function AlunoLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [initials, setInitials] = useState('')
  const [naoLidas, setNaoLidas] = useState(0)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth/login'); return }
      const { data: profile } = await supabase
        .from('profiles')
        .select('nome, email, role')
        .eq('id', session.user.id)
        .single()
      if (profile?.role === 'professor') { 
        window.location.href = '/professor'
        return 
      }
      setNome(profile?.nome ?? '')
      setEmail(profile?.email ?? '')
      setInitials((profile?.nome ?? '').split(' ').map((x: string) => x[0]).slice(0, 2).join(''))

      const { count } = await supabase
        .from('notificacoes')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .eq('lida', false)
      setNaoLidas(count ?? 0)
    }
    load()
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <div className="flex min-h-screen bg-gray-50 w-full overflow-x-hidden">

      {/* SIDEBAR — desktop */}
      <aside className="hidden md:flex flex-col w-64 min-h-screen bg-gradient-to-b from-navy to-teal fixed left-0 top-0 z-20">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <BookOpen size={20} className="text-white" />
            </div>
            <div>
              <p className="font-serif text-white font-semibold text-base leading-tight">Instituto</p>
              <p className="font-condensed text-white/60 text-[10px] uppercase tracking-widest">Dom Bosco</p>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href
            return (
              <Link key={href} href={href} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                active
                  ? 'bg-white text-navy shadow-sm'
                  : 'text-white/80 hover:bg-white/10'
              }`}>
                <Icon size={18} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Notificações desktop */}
        <div className="px-3 pb-2">
          <Link href="/aluno/notificacoes" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium relative ${
            pathname === '/aluno/notificacoes' ? 'bg-white text-navy shadow-sm' : 'text-white/80 hover:bg-white/10'
          }`}>
            <Bell size={18} />
            Notificações
            {naoLidas > 0 && (
              <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {naoLidas > 9 ? '9+' : naoLidas}
              </span>
            )}
          </Link>
        </div>

        {/* User + logout */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-white text-xs font-semibold">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{nome}</p>
              <p className="text-white/50 text-xs truncate">{email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors w-full">
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 min-w-0 md:ml-64 flex flex-col min-h-screen w-full overflow-x-hidden">
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </div>
      </main>

      {/* BOTTOM NAV — mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-20 pb-safe">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href} className="flex-1 flex flex-col items-center gap-1 py-2.5">
              <Icon size={20} className={active ? 'text-teal' : 'text-gray-400'} />
              <span className={`font-condensed text-[9px] uppercase tracking-wide ${active ? 'text-teal font-semibold' : 'text-gray-400'}`}>
                {label === 'Adicionar estudo' ? 'Registrar' : label}
              </span>
            </Link>
          )
        })}
        <Link href="/aluno/notificacoes" className="flex-1 flex flex-col items-center gap-1 py-2.5 relative">
          <div className="relative">
            <Bell size={20} className={pathname === '/aluno/notificacoes' ? 'text-teal' : 'text-gray-400'} />
            {naoLidas > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5">
                {naoLidas > 9 ? '9+' : naoLidas}
              </span>
            )}
          </div>
          <span className={`font-condensed text-[9px] uppercase tracking-wide ${pathname === '/aluno/notificacoes' ? 'text-teal font-semibold' : 'text-gray-400'}`}>Avisos</span>
        </Link>
        <button onClick={handleLogout} className="flex-1 flex flex-col items-center gap-1 py-2.5">
          <LogOut size={20} className="text-gray-400" />
          <span className="font-condensed text-[9px] uppercase tracking-wide text-gray-400">Sair</span>
        </button>
      </nav>
    </div>
  )
}
