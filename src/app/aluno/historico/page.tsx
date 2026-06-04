import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/ui/Topbar'
import { formatarDataCurta } from '@/lib/utils'
import { cn } from '@/lib/utils'

const miniStyle = {
  done: 'bg-done-bg text-done',
  d1: 'bg-d1-bg text-d1',
  d7: 'bg-d7-bg text-d7',
  d30: 'bg-d30-bg text-d30',
}

export default async function AlunoHistorico() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: conteudos } = await supabase
    .from('conteudos')
    .select('*, revisoes(*)')
    .eq('aluno_id', user!.id)
    .order('data_estudo', { ascending: false })

  return (
    <div>
      <Topbar subtitulo="Histórico" />
      <div className="px-5 py-5">
        <p className="font-condensed text-[11px] font-semibold uppercase tracking-widest text-gray-400 pb-3">
          {conteudos?.length ?? 0} conteúdos registrados
        </p>

        <div className="flex flex-col gap-2.5">
          {conteudos?.map(c => {
            const revs: any[] = c.revisoes ?? []
            const getStatus = (tipo: string) => {
              const r = revs.find((r: any) => r.tipo === tipo)
              return r?.concluida ? 'done' : tipo.toLowerCase() as any
            }
            return (
              <div key={c.id} className="bg-white rounded-2xl p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-condensed text-xs font-bold px-2.5 py-1 rounded-full bg-teal-light text-teal uppercase tracking-wide">
                    {c.materia}
                  </span>
                  <span className="text-xs text-gray-400">{formatarDataCurta(c.data_estudo)}</span>
                </div>
                <p className="font-serif text-base font-semibold text-navy mb-2.5">{c.assunto}</p>
                <div className="flex gap-1.5 flex-wrap">
                  {(['D1', 'D7', 'D30'] as const).map(tipo => {
                    const r = revs.find((rv: any) => rv.tipo === tipo)
                    const done = r?.concluida
                    return (
                      <span key={tipo} className={cn(
                        'font-condensed text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide',
                        done ? miniStyle.done : miniStyle[tipo.toLowerCase() as 'd1' | 'd7' | 'd30']
                      )}>
                        {tipo} {done ? '✓' : r ? `— ${formatarDataCurta(r.data_revisao)}` : ''}
                      </span>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {(!conteudos || conteudos.length === 0) && (
            <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center">
              <p className="text-3xl mb-3">📚</p>
              <p className="text-sm text-gray-400">Nenhum conteúdo registrado ainda.</p>
              <p className="text-xs text-gray-300 mt-1">Use a aba Registrar para começar!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
