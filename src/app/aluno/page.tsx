'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { RevCard } from '@/components/tasks/RevCard'
import { BottomNav } from '@/components/ui/BottomNav'
import { Topbar } from '@/components/ui/Topbar'
import { hoje, formatarData } from '@/lib/utils'

export default function AlunoHome() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [nome, setNome] = useState('')
  const [initials, setInitials] = useState('')
  const [revisoesHoje, setRevisoesHoje] = useState<any[]>([])
  const [proximasRevisoes, setProximasRevisoes] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('nome')
        .eq('id', session.user.id)
        .single()

      const n = profile?.nome ?? 'Aluno'
      setNome(n.split(' ')[0])
      setInitials(n.split(' ').map((x: string) => x[0]).slice(0, 2).join(''))

      const dataHoje = hoje()

      const { data: rHoje } = await supabase
        .from('revisoes')
        .select('*, conteudo:conteudos(*)')
        .eq('aluno_id', session.user.id)
        .eq('data_revisao', dataHoje)
        .order('tipo')

      const { data: rProximas } = await supabase
        .from('revisoes')
        .select('*, conteudo:conteudos(*)')
        .eq('aluno_id', session.user.id)
        .eq('concluida', false)
        .gt('data_revisao', dataHoje)
        .order('data_revisao')
        .limit(5)

      setRevisoesHoje(rHoje ?? [])
      setProximasRevisoes(rProximas ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-navy flex items-center justify-center">
      <p className="text-white font-condensed tracking-widest">Carregando...</p>
    </div>
  )

  const pendentes = revisoesHoje.filter(r => !r.concluida).length
  const total = revisoesHoje.length
  const pct = total > 0 ? Math.round(((total - pendentes) / total) * 100) : 0

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar subtitulo="Painel do Aluno" initials={initials} />
      <div className="flex-1 overflow-y-auto">
        <div className="bg-navy px-5 pt-5 pb-7">
          <p className="font-condensed text-xs uppercase tracking-widest text-teal font-semibold mb-1">Olá, {nome} 👋</p>
          <h1 className="font-serif text-2xl font-semibold text-white mb-1">Bom estudo hoje!</h1>
          <p className="text-sm text-white/40">{formatarData(hoje())}</p>
          <div className="flex gap-2 mt-4">
            <span className="bg-teal/15 border border-teal/30 rounded-full px-3.5 py-1.5 font-condensed text-xs text-teal font-semibold">{pendentes} revisões hoje</span>
            {total > 0 && <span className="bg-teal/15 border border-teal/30 rounded-full px-3.5 py-1.5 font-condensed text-xs text-teal font-semibold">{pct}% concluído</span>}
          </div>
        </div>

        <div className="px-5 pb-6">
          <p className="font-condensed text-[11px] font-semibold uppercase tracking-widest text-gray-400 pt-5 pb-3">Revisões de hoje</p>
          {revisoesHoje.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              {revisoesHoje.map(r => <RevCard key={r.id} revisao={r} />)}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 border border-gray-200 text-center">
              <p className="text-2xl mb-2">🎉</p>
              <p className="text-sm text-gray-500">Nenhuma revisão para hoje!</p>
            </div>
          )}

          {proximasRevisoes.length > 0 && (
            <>
              <p className="font-condensed text-[11px] font-semibold uppercase tracking-widest text-gray-400 pt-5 pb-3">Próximas revisões</p>
              <div className="flex flex-col gap-2.5 opacity-60">
                {proximasRevisoes.map(r => <RevCard key={r.id} revisao={r} />)}
              </div>
            </>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
