'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Clock, AlertCircle, Bell, BookOpen, CheckCircle2, RotateCcw } from 'lucide-react'
import { hoje, formatarData, formatarDataCurta } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function AlunoHome() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [nome, setNome] = useState('')
  const [revisoesHoje, setRevisoesHoje] = useState<any[]>([])
  const [revisoesAtrasadas, setRevisoesAtrasadas] = useState<any[]>([])
  const [proximasRevisoes, setProximasRevisoes] = useState<any[]>([])
  const [totalEstudos, setTotalEstudos] = useState(0)

  async function loadData() {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth/login'); return }

    const { data: profile } = await supabase
      .from('profiles').select('nome').eq('id', session.user.id).single()
    setNome(profile?.nome?.split(' ')[0] ?? 'Aluno')

    const dataHoje = hoje()

    const { data: rHoje } = await supabase
      .from('revisoes')
      .select('*, conteudo:conteudos(*)')
      .eq('aluno_id', session.user.id)
      .eq('data_revisao', dataHoje)
      .neq('status', 'completed')
      .order('tipo')

    const { data: rAtrasadas } = await supabase
      .from('revisoes')
      .select('*, conteudo:conteudos(*)')
      .eq('aluno_id', session.user.id)
      .lt('data_revisao', dataHoje)
      .neq('status', 'completed')
      .order('data_revisao')

    const { data: rProximas } = await supabase
      .from('revisoes')
      .select('*, conteudo:conteudos(*)')
      .eq('aluno_id', session.user.id)
      .gt('data_revisao', dataHoje)
      .neq('status', 'completed')
      .order('data_revisao')
      .limit(3)

    const { data: conteudos } = await supabase
      .from('conteudos')
      .select('id')
      .eq('aluno_id', session.user.id)

    setRevisoesHoje(rHoje ?? [])
    setRevisoesAtrasadas(rAtrasadas ?? [])
    setProximasRevisoes(rProximas ?? [])
    setTotalEstudos(conteudos?.length ?? 0)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  async function marcarConcluida(id: string) {
    const supabase = createClient()
    await supabase.from('revisoes').update({ status: 'completed', concluida: true, concluida_em: new Date().toISOString() }).eq('id', id)
    loadData()
  }

  async function remarcar(id: string, dataAtual: string) {
    const supabase = createClient()
    const novaData = format(new Date(), 'yyyy-MM-dd')
    await supabase.from('revisoes').update({ status: 'rescheduled', data_revisao: novaData }).eq('id', id)
    loadData()
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-navy to-teal flex items-center justify-center">
      <p className="text-white font-condensed tracking-widest">Carregando...</p>
    </div>
  )

  const dataHoje = hoje()
  const diaSemana = format(parseISO(dataHoje), "EEEE, dd 'de' MMMM", { locale: ptBR })

  const stats = [
    { icon: Clock, label: 'Para revisar hoje', value: revisoesHoje.length, color: 'text-yellow-500', bg: 'bg-yellow-50' },
    { icon: AlertCircle, label: 'Atrasadas', value: revisoesAtrasadas.length, color: 'text-red-500', bg: 'bg-red-50' },
    { icon: Bell, label: 'Próx. 7 dias', value: proximasRevisoes.length, color: 'text-purple-500', bg: 'bg-purple-50' },
    { icon: BookOpen, label: 'Estudos registrados', value: totalEstudos, color: 'text-teal', bg: 'bg-teal-light' },
  ]

  const badgeLabel: Record<string, string> = { D1: 'Revisão D+1', D7: 'Revisão D+7', D30: 'Revisão D+30' }

  function RevCard({ r, showActions = true }: { r: any, showActions?: boolean }) {
    const atrasada = r.data_revisao < dataHoje
    return (
      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-purple-100 text-purple-700 font-condensed text-xs font-bold px-2.5 py-1 rounded-full uppercase">
              {r.conteudo?.materia}
            </span>
            <span className="bg-blue-100 text-blue-700 font-condensed text-xs font-bold px-2.5 py-1 rounded-full uppercase">
              {badgeLabel[r.tipo]}
            </span>
            {atrasada && (
              <span className="bg-red-100 text-red-600 font-condensed text-xs font-bold px-2.5 py-1 rounded-full uppercase">
                Atrasada
              </span>
            )}
          </div>
          <span className="text-xs text-gray-400">Prevista: {formatarDataCurta(r.data_revisao)}</span>
        </div>
        <p className="font-semibold text-navy text-base mb-1">{r.conteudo?.assunto}</p>
        {r.conteudo?.descricao && <p className="text-sm text-gray-500 mb-3">{r.conteudo.descricao}</p>}
        {showActions && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => marcarConcluida(r.id)}
              className="flex items-center gap-1.5 px-4 py-2 bg-teal text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <CheckCircle2 size={15} /> Marcar concluída
            </button>
            <button
              onClick={() => remarcar(r.id, r.data_revisao)}
              className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              <RotateCcw size={15} /> Remarcar
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-navy">Olá, {nome}! 👋</h1>
        <p className="text-gray-400 mt-1 capitalize">{diaSemana}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {stats.map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={18} className={color} />
            </div>
            <p className="font-bold text-2xl text-navy">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Revisões de hoje */}
      <div className="mb-8">
        <h2 className="font-serif text-xl font-semibold text-navy flex items-center gap-2 mb-4">
          <Clock size={20} className="text-yellow-500" /> Revisões de hoje
        </h2>
        {revisoesHoje.length > 0 ? (
          <div className="flex flex-col gap-3">
            {revisoesHoje.map(r => <RevCard key={r.id} r={r} />)}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 border border-dashed border-gray-200 text-center">
            <CheckCircle2 size={40} className="text-teal mx-auto mb-3" />
            <p className="font-semibold text-navy">Tudo em dia! 🎉</p>
            <p className="text-sm text-gray-400 mt-1">Você não tem revisões para hoje. Continue registrando seus estudos!</p>
          </div>
        )}
      </div>

      {/* Revisões atrasadas */}
      {revisoesAtrasadas.length > 0 && (
        <div className="mb-8">
          <h2 className="font-serif text-xl font-semibold text-navy flex items-center gap-2 mb-4">
            <AlertCircle size={20} className="text-red-500" /> Revisões atrasadas
          </h2>
          <div className="flex flex-col gap-3">
            {revisoesAtrasadas.map(r => <RevCard key={r.id} r={r} />)}
          </div>
        </div>
      )}

      {/* Próximas revisões */}
      {proximasRevisoes.length > 0 && (
        <div>
          <h2 className="font-serif text-xl font-semibold text-navy flex items-center gap-2 mb-4">
            <Bell size={20} className="text-purple-500" /> Próximas revisões
          </h2>
          <div className="flex flex-col gap-3">
            {proximasRevisoes.map(r => <RevCard key={r.id} r={r} showActions={false} />)}
          </div>
        </div>
      )}
    </div>
  )
}
