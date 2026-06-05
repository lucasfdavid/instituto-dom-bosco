'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, CheckCircle2, Clock, TrendingUp } from 'lucide-react'

export default function IndicadoresPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalEstudos: 0,
    revisoesConcluidadas: 0,
    revisoesPendentes: 0,
    taxaAdesao: 0,
  })
  const [porCategoria, setPorCategoria] = useState<{ materia: string; total: number }[]>([])
  const [porIntervalo, setPorIntervalo] = useState<{ tipo: string; concluidas: number; pendentes: number }[]>([])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth/login'); return }

      const { data: conteudos } = await supabase
        .from('conteudos')
        .select('*, revisoes(*)')
        .eq('aluno_id', session.user.id)

      const { data: revisoes } = await supabase
        .from('revisoes')
        .select('*')
        .eq('aluno_id', session.user.id)

      const total = conteudos?.length ?? 0
      const concluidas = revisoes?.filter(r => r.status === 'completed').length ?? 0
      const pendentes = revisoes?.filter(r => r.status !== 'completed').length ?? 0
      const taxa = revisoes?.length ? Math.round((concluidas / revisoes.length) * 100) : 0

      setStats({ totalEstudos: total, revisoesConcluidadas: concluidas, revisoesPendentes: pendentes, taxaAdesao: taxa })

      // Por categoria
      const catMap: Record<string, number> = {}
      conteudos?.forEach(c => { catMap[c.materia] = (catMap[c.materia] ?? 0) + 1 })
      setPorCategoria(Object.entries(catMap).map(([materia, total]) => ({ materia, total })).sort((a, b) => b.total - a.total))

      // Por intervalo
      const intervalos = ['D1', 'D7', 'D30'].map(tipo => ({
        tipo,
        concluidas: revisoes?.filter(r => r.tipo === tipo && r.status === 'completed').length ?? 0,
        pendentes: revisoes?.filter(r => r.tipo === tipo && r.status !== 'completed').length ?? 0,
      }))
      setPorIntervalo(intervalos)

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
    { icon: BookOpen, label: 'Total de estudos', value: stats.totalEstudos, color: 'bg-gradient-to-br from-navy to-navy-light', text: 'text-white' },
    { icon: CheckCircle2, label: 'Revisões concluídas', value: stats.revisoesConcluidadas, color: 'bg-gradient-to-br from-teal to-teal-mid', text: 'text-white' },
    { icon: Clock, label: 'Revisões pendentes', value: stats.revisoesPendentes, color: 'bg-gradient-to-br from-orange-400 to-orange-500', text: 'text-white' },
    { icon: TrendingUp, label: 'Taxa de adesão', value: `${stats.taxaAdesao}%`, color: 'bg-gradient-to-br from-purple-500 to-purple-600', text: 'text-white' },
  ]

  const maxCat = Math.max(...porCategoria.map(c => c.total), 1)

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-navy">Indicadores</h1>
        <p className="text-gray-400 mt-1">Acompanhe seu progresso de estudos</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {statCards.map(({ icon: Icon, label, value, color, text }) => (
          <div key={label} className={`${color} rounded-2xl p-4 shadow-sm`}>
            <Icon size={20} className={`${text} opacity-80 mb-2`} />
            <p className={`font-bold text-2xl ${text}`}>{value}</p>
            <p className={`text-xs ${text} opacity-70 mt-0.5`}>{label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        {/* Por categoria */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
          <h2 className="font-serif text-lg font-semibold text-navy mb-4">Estudos por categoria</h2>
          {porCategoria.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Nenhum estudo registrado ainda.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {porCategoria.map(({ materia, total }) => (
                <div key={materia}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-navy">{materia}</span>
                    <span className="text-gray-400">{total}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-navy to-teal rounded-full transition-all"
                      style={{ width: `${(total / maxCat) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Por intervalo */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
          <h2 className="font-serif text-lg font-semibold text-navy mb-4">Progresso por intervalo</h2>
          <div className="flex flex-col gap-4">
            {porIntervalo.map(({ tipo, concluidas, pendentes }) => {
              const total = concluidas + pendentes
              const pct = total > 0 ? Math.round((concluidas / total) * 100) : 0
              return (
                <div key={tipo}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-navy">Revisão {tipo}</span>
                    <span className="text-gray-400">{concluidas}/{total} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal to-navy rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
