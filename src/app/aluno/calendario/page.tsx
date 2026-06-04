import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/ui/Topbar'
import { Calendar } from '@/components/calendar/Calendar'
import { RevCard } from '@/components/tasks/RevCard'
import { hoje } from '@/lib/utils'

export default async function AlunoCalendario() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: revisoes } = await supabase
    .from('revisoes')
    .select('*, conteudo:conteudos(*)')
    .eq('aluno_id', user!.id)
    .order('data_revisao')

  const revisoesHoje = revisoes?.filter(r => r.data_revisao === hoje()) ?? []

  return (
    <div>
      <Topbar subtitulo="Calendário" />
      <div className="px-5 py-5 flex flex-col gap-4">
        <Calendar revisoes={revisoes ?? []} />

        <p className="font-condensed text-[11px] font-semibold uppercase tracking-widest text-gray-400 pt-2 pb-1">
          Revisões de hoje
        </p>

        {revisoesHoje.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {revisoesHoje.map(r => (
              <RevCard key={r.id} revisao={r} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-5 border border-gray-200 text-center">
            <p className="text-sm text-gray-400">Sem revisões para hoje</p>
          </div>
        )}
      </div>
    </div>
  )
}
