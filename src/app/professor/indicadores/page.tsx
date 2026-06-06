'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Users, CheckCircle2, Clock, TrendingUp } from 'lucide-react'

export default function ProfessorIndicadores() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalAlunos: 0,
    totalRevisoes: 0,
    revisoesConcluidadas: 0,
    taxaMedia: 0,
  })
  const [porAluno, setPorAluno] = useState<any[]>([])
  const [porMateria, setPorMateria] = useState<{ materia: string; total: number }[]>([])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth/login'); return }

      const { data: vinculos } = await supabase
        .from('professor_aluno')
        .select('aluno:profiles!aluno_id(id, nome)')
        .eq('professor_id', session.user.id)

      const alunos = vinculos?.map((v: any) => v.aluno) ?? []

      const alunosComStats = await Promise.all(
        alunos.map(async (aluno: any) => {
          const { data: revisoes } = await supabase
            .from('revisoes')
            .select('status')
            .eq('aluno_id', aluno.id)

          const total = revisoes?.length ?? 0
          const concluidas = revisoes?.filter(r => r.status === 'completed').length ?? 0
          const pct = total > 0 ? Math.round((concluidas / total) * 100) : 0
          return { ...aluno, total, concluidas, pct }
        })
      )

      // Por matéria
      const materiaMap: Record<string, number> = {}
      await Promise.all(
        alunos.map(async (aluno: any) => {
          const { data: conteudos } = await supabase
            .from('conteudos')
            .select('materia')
            .eq('aluno_id', aluno.id)
          conteudos?.forEach(c => {
            materiaMap[c.materia] = (materiaMap[c.materia] ?? 0) + 1
          })
        })
      )

      const totalRevisoes = alunosComStats.reduce((s, a) => s + a.total, 0)
      const totalConcluidas = alunosComStats.reduce((s, a) => s + a.concluidas, 0)
      const taxaMedia = alunosComStats.length
        ? Math.round(alunosComStats.reduce((s, a) => s + a.pct, 0) / alunosComStats.length)
        : 0

      setStats({
        totalAlunos: alunos.length,
        totalRevisoes,
        revisoesConcluidadas: totalConcluidas,
        taxaMedia,
      })
      setPorAluno(alunosComStats)
      setPorMateria(
        Object.entries(materiaMap)
          .map(([materia, total]) => ({ materia, total }))
          .sort((a, b) => b.total - a.total)
      )
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400 font-condensed tracking-widest">Carregando...</p>
    </div>
  )

  const statCards = [
    { icon: Users, label: 'Alunos ativos', value: stats.totalAlunos, color: 'bg-gradient-to-br from-navy to-navy-light' },
    { icon: CheckCircle2, label: 'Revisões concluídas', value: stats.revisoesConcluidadas, color: 'bg-gradient-to-br from-teal to-teal-mid' },
    { icon: Clock, label: 'Total de revisões', value: stats.totalRevisoes, color: 'bg-gradient-to-br from-orange-400 to-orange-500' },
    { icon: TrendingUp, label: 'Taxa média de adesão', value: `${stats.taxaMedia}%`, color: 'bg-gradient-to-br from-purple-500 to-purple-600' },
  ]

  const maxPorAluno = Math.max(...porAluno.map(a => a.total), 1)
  const maxPorMateria = Math.max(...porMateria.map(m => m.total), 1)

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-navy">Indicadores</h1>
        <p className="text-gray-400 mt-1">Visão geral do progresso dos seus alunos</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {statCards.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className={`${color} rounded-2xl p-4 shadow-sm`}>
            <Icon size={20} className="text-white opacity-80 mb-2" />
            <p className="font-bold text-2xl text-white">{value}</p>
            <p className="text-xs text-white/70 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Progresso por aluno */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
          <h2 className="font-serif text-lg font-semibold text-navy mb-4">Progresso por aluno</h2>
          {porAluno.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Nenhum aluno vinculado.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {porAluno.map(aluno => (
                <div key={aluno.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-navy">{aluno.nome}</span>
                    <span className="text-gray-400">{aluno.concluidas}/{aluno.total} ({aluno.pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-navy to-teal rounded-full transition-all"
                      style={{ width: `${aluno.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Conteúdos por matéria */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
          <h2 className="font-serif text-lg font-semibold text-navy mb-4">Conteúdos por matéria</h2>
          {porMateria.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Nenhum conteúdo registrado.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {porMateria.map(({ materia, total }) => (
                <div key={materia}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-navy">{materia}</span>
                    <span className="text-gray-400">{total}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal to-navy rounded-full transition-all"
                      style={{ width: `${(total / maxPorMateria) * 100}%` }}
                    />
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
