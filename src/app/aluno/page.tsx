import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/ui/Topbar'
import { RevCard } from '@/components/tasks/RevCard'
import { hoje, formatarData } from '@/lib/utils'
import { parseISO, isAfter } from 'date-fns'

export default async function AlunoHome() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('nome')
    .eq('id', user!.id)
    .single()

  const dataHoje = hoje()

  const { data: revisoesHoje } = await supabase
    .from('revisoes')
    .select('*, conteudo:conteudos(*)')
    .eq('aluno_id', user!.id)
    .eq('data_revisao', dataHoje)
    .order('tipo')

  const { data: proximasRevisoes } = await supabase
    .from('revisoes')
    .select('*, conteudo:conteudos(*)')
    .eq('aluno_id', user!.id)
    .eq('concluida', false)
    .gt('data_revisao', dataHoje)
    .order('data_revisao')
    .limit(5)

  const nome = profile?.nome?.split(' ')[0] ?? 'Aluno'
  const initials = profile?.nome?.split(' ').map((n: string) => n[0]).slice(0, 2).join('') ?? 'AL'

  const pendentesHoje = revisoesHoje?.filter(r => !r.concluida).length ?? 0
  const totalHoje = revisoesHoje?.length ?? 0
  const concluidasHoje = totalHoje - pendentesHoje

  return (
    <div>
      <Topbar subtitulo="Painel do Aluno" initials={initials} />

      {/* Hero */}
      <div className="bg-navy px-5 pt-5 pb-7">
        <p className="font-condensed text-xs uppercase tracking-widest text-teal font-semibold mb-1">
          Olá, {nome} 👋
        </p>
        <h1 className="font-serif text-2xl font-semibold text-white mb-1">Bom estudo hoje!</h1>
        <p className="text-sm text-white/40">{formatarData(dataHoje)}</p>
        <div className="flex gap-2 mt-4">
          <span className="bg-teal/15 border border-teal/30 rounded-full px-3.5 py-1.5 font-condensed text-xs text-teal font-semibold">
            {pendentesHoje} revisões hoje
          </span>
          {totalHoje > 0 && (
            <span className="bg-teal/15 border border-teal/30 rounded-full px-3.5 py-1.5 font-condensed text-xs text-teal font-semibold">
              {Math.round((concluidasHoje / totalHoje) * 100)}% concluído
            </span>
          )}
        </div>
      </div>

      <div className="px-5 pb-6">
        {/* Revisões de hoje */}
        <p className="font-condensed text-[11px] font-semibold uppercase tracking-widest text-gray-400 pt-5 pb-3">
          Revisões de hoje
        </p>
        {revisoesHoje && revisoesHoje.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {revisoesHoje.map(r => (
              <RevCard key={r.id} revisao={r} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 border border-gray-200 text-center">
            <p className="text-2xl mb-2">🎉</p>
            <p className="text-sm text-gray-500">Nenhuma revisão para hoje!</p>
          </div>
        )}

        {/* Próximas */}
        {proximasRevisoes && proximasRevisoes.length > 0 && (
          <>
            <p className="font-condensed text-[11px] font-semibold uppercase tracking-widest text-gray-400 pt-5 pb-3">
              Próximas revisões
            </p>
            <div className="flex flex-col gap-2.5">
              {proximasRevisoes.map(r => (
                <div key={r.id} className="opacity-60">
                  <RevCard revisao={r} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
