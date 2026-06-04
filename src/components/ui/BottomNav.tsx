'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, CalendarDays, PlusCircle, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { href: '/aluno', icon: Home, label: 'Início' },
  { href: '/aluno/calendario', icon: CalendarDays, label: 'Calendário' },
  { href: '/aluno/registrar', icon: PlusCircle, label: 'Registrar' },
  { href: '/aluno/historico', icon: BookOpen, label: 'Histórico' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="sticky bottom-0 bg-white border-t border-gray-200 flex pb-5 pt-2 z-10">
      {items.map(({ href, icon: Icon, label }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center gap-1 py-1.5"
          >
            <Icon
              size={22}
              className={cn(active ? 'text-teal' : 'text-gray-400')}
            />
            <span className={cn(
              'font-condensed text-[10px] uppercase tracking-wider',
              active ? 'text-teal font-semibold' : 'text-gray-400'
            )}>
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
