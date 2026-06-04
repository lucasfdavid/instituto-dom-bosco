import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/ui/Topbar'
import Link from 'next/link'
import { hoje } from '@/lib/utils'

export default async function ProfessorPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('nome')
    .eq('id', user!.id)
    .single()

  // Busca alunos vinculados ao professor
  const { data: vinculos } = await supabase
    .from('professor_aluno')
    .select('aluno:profiles!aluno_id(id, nome, email)')
    .eq('professor_id', user!.id)

  const alunos = vinculos?.map(v => v.aluno as any) ?? []

  // Para cada aluno, busca estatísticas
  const alunosComStats = await Promise.all(
    alunos.map(async (aluno: any) => {
      const { data: revisoes } = await supabase
        .from('revisoes')
        .select('concluida, data_revisao')
        .eq('aluno_id', aluno.id)

      const total = revisoes?.length ?? 0
      const concluidas = revisoes?.filter(r => r.concluida).length ?? 0
      const hoje_count = revisoes?.filter(r => r.data_revisao === hoje() && !r.concluida).length ?? 0
      const pct = total > 0 ? Math.round((concluidas / total) * 100) : 0

      const { data: conteudos } = await supabase
        .from('conteudos')
        .select('id', { count: 'exact' })
        .eq('aluno_id', aluno.id)

      return { ...aluno, total, concluidas, hoje_count, pct, n_conteudos: conteudos?.length ?? 0 }
    })
  )

  const nome = profile?.nome?.split(' ')[0] ?? 'Professor'
  const initials = profile?.nome?.split(' ').map((n: string) => n[0]).slice(0, 2).join('') ?? 'PR'

  const totalRevisoesHoje = alunosComStats.reduce((s, a) => s + a.hoje_count, 0)
  const taxaMedia = alunosComStats.length
    ? Math.round(alunosComStats.reduce((s, a) => s + a.pct, 0) / alunosComStats.length)
    : 0
  const emAtraso = alunosComStats.filter(a => a.pct < 50).length

  return (
    <div>
      <Topbar subtitulo="Painel do Professor" initials={initials} />

      {/* Hero */}
      <div className="bg-navy px-5 pt-5 pb-6">
        <p className="font-condensed text-xs uppercase tracking-widest text-teal font-semibold mb-1">
          Olá, {nome} 👋
        </p>
        <h1 className="font-serif text-2xl font-semibold text-white mb-4">Seus alunos</h1>

        <div className="grid grid-cols-2 gap-2.5">
          {[
            { num: alunosComStats.length, label: 'Alunos ativos' },
            { num: totalRevisoesHoje, label: 'Revisões hoje', teal: true },
            { num: `${taxaMedia}%`, label: 'Taxa de conclusão', teal: true },
            { num: emAtraso, label: 'Alunos em atraso', danger: true },
          ].map(({ num, label, teal, danger }) => (
            <div key={label} className="bg-white/8 border border-white/10 rounded-xl p-3.5">
              <p className={`font-condensed text-2xl font-bold leading-none ${teal ? 'text-teal' : danger ? 'text-red-400' : 'text-white'}`}>
                {num}
              </p>
              <p className="font-condensed text-[10px] uppercase tracking-wide text-white/40 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Lista de alunos */}
      <div className="px-5 py-5">
        <p className="font-condensed text-[11px] font-semibold uppercase tracking-widest text-gray-400 pb-3">
          Meus alunos
        </p>

        <div className="flex flex-col gap-2.5">
          {alunosComStats.map(aluno => (
            <Link key={aluno.id} href={`/professor/aluno/${aluno.id}`}>
              <div className="bg-white rounded-2xl p-4 border border-gray-200 transition-all hover:shadow-md">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-navy flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-semibold">
                      {aluno.nome?.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-navy text-sm truncate">{aluno.nome}</p>
                    <p className="text-xs text-gray-400">{aluno.n_conteudos} conteúdos</p>
                  </div>
                  <span className={`font-condensed text-xs font-bold px-2.5 py-1 rounded-full ${
                    aluno.pct >= 70 ? 'bg-done-bg text-done' :
                    aluno.pct >= 40 ? 'bg-d7-bg text-d7' : 'bg-d30-bg text-d30'
                  }`}>
                    {aluno.pct}%
                  </span>
                </div>

                {/* Barra de progresso */}
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2.5">
                  <div
                    className="h-full bg-teal rounded-full transition-all"
                    style={{ width: `${aluno.pct}%` }}
                  />
                </div>

                <div className="flex gap-2">
                  {[
                    { num: aluno.n_conteudos, label: 'Conteúdos' },
                    { num: aluno.hoje_count, label: 'Hoje', color: 'text-teal' },
                    { num: aluno.concluidas, label: 'Concluídas', color: 'text-done' },
                  ].map(({ num, label, color }) => (
                    <div key={label} className="flex-1 bg-gray-50 rounded-lg p-2 text-center">
                      <p className={`font-condensed text-lg font-bold ${color ?? 'text-navy'}`}>{num}</p>
                      <p className="font-condensed text-[10px] uppercase tracking-wide text-gray-400">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Link>
          ))}

          {alunosComStats.length === 0 && (
            <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center">
              <p className="text-3xl mb-3">👥</p>
              <p className="text-sm text-gray-400">Nenhum aluno vinculado ainda.</p>
              <p className="text-xs text-gray-300 mt-1">Peça ao administrador para vincular alunos à sua conta.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
