import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/ui/Topbar'
import Link from 'next/link'
import { formatarDataCurta } from '@/lib/utils'
import { cn } from '@/lib/utils'

export default async function AlunoDetalhe({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .single()

  const { data: conteudos } = await supabase
    .from('conteudos')
    .select('*, revisoes(*)')
    .eq('aluno_id', params.id)
    .order('data_estudo', { ascending: false })

  const todasRevisoes = conteudos?.flatMap(c => c.revisoes ?? []) ?? []
  const total = todasRevisoes.length
  const concluidas = todasRevisoes.filter((r: any) => r.concluida).length
  const emAtraso = todasRevisoes.filter((r: any) => !r.concluida && r.data_revisao < new Date().toISOString().split('T')[0]).length
  const pct = total > 0 ? Math.round((concluidas / total) * 100) : 0

  const miniStyle: Record<string, string> = {
    D1: 'bg-d1-bg text-d1',
    D7: 'bg-d7-bg text-d7',
    D30: 'bg-d30-bg text-d30',
    done: 'bg-done-bg text-done',
  }

  return (
    <div>
      {/* Hero */}
      <div className="bg-navy px-5 pt-5 pb-6">
        <Link href="/professor" className="text-white/50 text-sm mb-4 block">← Voltar</Link>
        <h1 className="font-serif text-2xl font-semibold text-white mb-1">{profile?.nome}</h1>
        <p className="font-condensed text-xs uppercase tracking-wide text-white/40 mb-4">
          {profile?.email}
        </p>

        <div className="grid grid-cols-3 gap-1 bg-white/10 rounded-xl overflow-hidden">
          {[
            { num: conteudos?.length ?? 0, label: 'Conteúdos' },
            { num: `${pct}%`, label: 'Revisões ok', teal: true },
            { num: emAtraso, label: 'Em atraso', danger: true },
          ].map(({ num, label, teal, danger }) => (
            <div key={label} className="bg-white/5 py-3 text-center">
              <p className={`font-condensed text-xl font-bold ${teal ? 'text-teal' : danger ? 'text-red-400' : 'text-white'}`}>
                {num}
              </p>
              <p className="font-condensed text-[10px] uppercase tracking-wide text-teal mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 py-5">
        <p className="font-condensed text-[11px] font-semibold uppercase tracking-widest text-gray-400 pb-3">
          Conteúdos e revisões
        </p>

        <div className="flex flex-col gap-2.5">
          {conteudos?.map(c => {
            const revs: any[] = c.revisoes ?? []
            return (
              <div key={c.id} className="bg-white rounded-2xl p-4 border border-gray-200">
                <p className="font-serif text-base font-semibold text-navy mb-0.5">{c.assunto}</p>
                <p className="text-xs text-gray-400 mb-2.5">
                  {c.materia} · Estudado em {formatarDataCurta(c.data_estudo)}
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  {(['D1', 'D7', 'D30'] as const).map(tipo => {
                    const r = revs.find((rv: any) => rv.tipo === tipo)
                    const done = r?.concluida
                    return (
                      <span key={tipo} className={cn(
                        'font-condensed text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide',
                        done ? miniStyle.done : miniStyle[tipo]
                      )}>
                        {tipo} {done ? '✓' : r ? `— ${formatarDataCurta(r.data_revisao)}` : 'pendente'}
                      </span>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {(!conteudos || conteudos.length === 0) && (
            <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center">
              <p className="text-sm text-gray-400">Nenhum conteúdo registrado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
