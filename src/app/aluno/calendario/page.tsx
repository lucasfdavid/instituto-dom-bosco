'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Calendar } from '@/components/calendar/Calendar'
import { RevCard } from '@/components/tasks/RevCard'
import { Topbar } from '@/components/ui/Topbar'
import { BottomNav } from '@/components/ui/BottomNav'
import { hoje } from '@/lib/utils'

export default function AlunoCalendario() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [revisoes, setRevisoes] = useState<any[]>([])
  const [revisoesHoje, setRevisoesHoje] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth/login'); return }

      const { data } = await supabase
        .from('revisoes')
        .select('*, conteudo:conteudos(*)')
        .eq('aluno_id', session.user.id)
        .order('data_revisao')

      setRevisoes(data ?? [])
      setRevisoesHoje((data ?? []).filter((r: any) => r.data_revisao === hoje()))
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-navy flex items-center justify-center">
      <p className="text-white font-condensed tracking-widest">Carregando...</p>
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar subtitulo="Calendário" />
      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4">
        <Calendar revisoes={revisoes} />
        <p className="font-condensed text-[11px] font-semibold uppercase tracking-widest text-gray-400 pt-2 pb-1">
          Revisões de hoje
        </p>
        {revisoesHoje.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {revisoesHoje.map(r => <RevCard key={r.id} revisao={r} />)}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-5 border border-gray-200 text-center">
            <p className="text-sm text-gray-400">Sem revisões para hoje</p>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
