'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface TopbarProps {
  nome?: string
  subtitulo?: string
  initials?: string
}

export function Topbar({ nome, subtitulo, initials }: TopbarProps) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <header className="flex items-center justify-between px-5 py-4 bg-white border-b border-gray-200">
      <div>
        <p className="font-serif text-lg font-semibold text-navy leading-tight">
          Dom <span className="text-teal">Bosco</span>
        </p>
        {subtitulo && (
          <p className="font-condensed text-[10px] uppercase tracking-wider text-teal">{subtitulo}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {initials && (
          <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center">
            <span className="text-white text-xs font-semibold">{initials}</span>
          </div>
        )}
        <button onClick={handleLogout} className="text-gray-400 hover:text-navy transition-colors">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
