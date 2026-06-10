'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Users, CheckCircle2, Clock, TrendingUp, CalendarCheck, CalendarX } from 'lucide-react'

export default function ProfessorIndicadores() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [visao, setVisao] = useState<'geral' | string>('geral')
  const [alunos, setAlunos] = useState<any[]>([])
  const [porMateria, setPorMateria] = useState<Record<string, { materia: string; total: number }[]>>({})

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth/login'); return }

      const { data: alunosPerfis } = await supabase
        .from('profiles')
        .select('id, nome')
        .eq('role', 'aluno')
        .order('nome')

      const alunosBase = alunosPerfis ?? []

      const alunosComStats = await Promise.all(
        alunosBase.map(async (aluno: any) => {
          const { data: revisoes } = await supabase
            .from('revisoes').select('status, tipo, concluida_em, data_original').eq('aluno_id', aluno.id)
          const { data: conteudos } = await supabase
            .from('conteudos').select('materia').eq('aluno_id', aluno.id)

          const total = revisoes?.length ?? 0
          const concluidas = revisoes?.filter(r => r.status === 'completed').length ?? 0
          const pct = total > 0 ? Math.round((concluidas / total) * 100) : 0

          const materiaMap: Record<string, number> = {}
          conteudos?.forEach(c => { materiaMap[c.materia] = (materiaMap[c.materia] ?? 0) + 1 })
          const materias = Object.entries(materiaMap)
            .map(([materia, total]) => ({ materia, total }))
            .sort((a, b) => b.total - a.total)

          const porIntervalo = ['D1', 'D7', 'D30'].map(tipo => ({
            tipo,
            concluidas: revisoes?.filter(r => r.tipo === tipo && r.status === 'completed').length ?? 0,
            pendentes: revisoes?.filter(r => r.tipo === tipo && r.status !== 'completed').length ?? 0,
          }))

          const noPrazo = revisoes?.filter(r =>
            r.status === 'completed' && r.concluida_em && r.data_original &&
            r.concluida_em.slice(0, 10) <= r.data_original
          ).length ?? 0
          const foraDoPrazo = revisoes?.filter(r =>
            r.status === 'completed' && r.concluida_em && r.data_original &&
            r.concluida_em.slice(0, 10) > r.data_original
          ).length ?? 0

          return { ...aluno, total, concluidas, pct, nConteudos: conteudos?.length ?? 0, materias, porIntervalo, noPrazo, foraDoPrazo }
        })
      )

      // Matérias geral
      const materiaGeralMap: Record<string, number> = {}
      alunosComStats.forEach(a => {
        a.materias.forEach(({ materia, total }: any) => {
          materiaGeralMap[materia] = (materiaGeralMap[materia] ?? 0) + total
        })
      })
      const materiasGeral = Object.entries(materiaGeralMap)
        .map(([materia, total]) => ({ materia, total }))
        .sort((a, b) => b.total - a.total)

      const porMateriaMap: Record<string, any[]> = { geral: materiasGeral }
      alunosComStats.forEach(a => { porMateriaMap[a.id] = a.materias })

      setAlunos(alunosComStats)
      setPorMateria(porMateriaMap)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400 font-condensed tracking-widest">Carregando...</p>
    </div>
  )

  const totalRevisoes = alunos.reduce((s, a) => s + a.total, 0)
  const totalConcluidas = alunos.reduce((s, a) => s + a.concluidas, 0)
  const taxaMedia = alunos.length ? Math.round(alunos.reduce((s, a) => s + a.pct, 0) / alunos.length) : 0

  const alunoSelecionado = visao !== 'geral' ? alunos.find(a => a.id === visao) : null

  const statsGeral = [
    { icon: Users, label: 'Alunos ativos', value: alunos.length, color: 'bg-gradient-to-br from-navy to-navy-light' },
    { icon: CheckCircle2, label: 'Revisões concluídas', value: totalConcluidas, color: 'bg-gradient-to-br from-teal to-teal-mid' },
    { icon: Clock, label: 'Total de revisões', value: totalRevisoes, color: 'bg-gradient-to-br from-orange-400 to-orange-500' },
    { icon: TrendingUp, label: 'Taxa média', value: `${taxaMedia}%`, color: 'bg-gradient-to-br from-purple-500 to-purple-600' },
  ]

  const statsAluno = alunoSelecionado ? [
    { icon: CheckCircle2,  label: 'Revisões concluídas',       value: alunoSelecionado.concluidas,  color: 'bg-gradient-to-br from-teal to-teal-mid' },
    { icon: Clock,         label: 'Total de revisões',         value: alunoSelecionado.total,       color: 'bg-gradient-to-br from-orange-400 to-orange-500' },
    { icon: TrendingUp,    label: 'Taxa de adesão',            value: `${alunoSelecionado.pct}%`,   color: 'bg-gradient-to-br from-purple-500 to-purple-600' },
    { icon: Users,         label: 'Conteúdos',                 value: alunoSelecionado.nConteudos,  color: 'bg-gradient-to-br from-navy to-navy-light' },
    { icon: CalendarCheck, label: 'Concluídas no prazo',       value: alunoSelecionado.noPrazo,     color: 'bg-gradient-to-br from-green-500 to-green-600' },
    { icon: CalendarX,     label: 'Concluídas fora do prazo',  value: alunoSelecionado.foraDoPrazo, color: 'bg-gradient-to-br from-red-400 to-red-500' },
  ] : []

  const statsAtivos = visao === 'geral' ? statsGeral : statsAluno
  const materiasAtivas = porMateria[visao] ?? []
  const maxMateria = Math.max(...materiasAtivas.map(m => m.total), 1)

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-navy">Indicadores</h1>
        <p className="text-gray-400 mt-1">Acompanhe o progresso dos seus alunos</p>
      </div>

      {/* Seletor geral / por aluno */}
      <div className="mb-6 max-w-xs">
        <label className="block text-sm font-semibold text-navy mb-2">Visualizar indicadores de</label>
        <select
          value={visao}
          onChange={e => setVisao(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-navy text-sm outline-none focus:border-teal transition-all"
        >
          <option value="geral">Todos os alunos (Geral)</option>
          {alunos.map(aluno => (
            <option key={aluno.id} value={aluno.id}>{aluno.nome}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {statsAtivos.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className={`${color} rounded-2xl p-4 shadow-sm`}>
            <Icon size={20} className="text-white opacity-80 mb-2" />
            <p className="font-bold text-2xl text-white">{value}</p>
            <p className="text-xs text-white/70 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Progresso por aluno (só no geral) */}
        {visao === 'geral' && (
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
            <h2 className="font-serif text-lg font-semibold text-navy mb-4">Progresso por aluno</h2>
            {alunos.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Nenhum aluno vinculado.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {alunos.map(aluno => (
                  <div key={aluno.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-navy">{aluno.nome}</span>
                      <span className="text-gray-400">{aluno.concluidas}/{aluno.total} ({aluno.pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-navy to-teal rounded-full" style={{ width: `${aluno.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Progresso por intervalo (só por aluno) */}
        {visao !== 'geral' && alunoSelecionado && (
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
            <h2 className="font-serif text-lg font-semibold text-navy mb-4">Progresso por intervalo</h2>
            <div className="flex flex-col gap-4">
              {alunoSelecionado.porIntervalo.map(({ tipo, concluidas, pendentes }: any) => {
                const total = concluidas + pendentes
                const pct = total > 0 ? Math.round((concluidas / total) * 100) : 0
                return (
                  <div key={tipo}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-navy">Revisão {tipo}</span>
                      <span className="text-gray-400">{concluidas}/{total} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-teal to-navy rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Conteúdos por matéria */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
          <h2 className="font-serif text-lg font-semibold text-navy mb-4">Conteúdos por matéria</h2>
          {materiasAtivas.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Nenhum conteúdo registrado.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {materiasAtivas.map(({ materia, total }) => (
                <div key={materia}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-navy">{materia}</span>
                    <span className="text-gray-400">{total}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-teal to-navy rounded-full" style={{ width: `${(total / maxMateria) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
