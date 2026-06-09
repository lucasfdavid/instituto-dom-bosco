'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Clock, AlertCircle, Bell, BookOpen, CheckCircle2, RotateCcw, X, MessageSquare } from 'lucide-react'
import { hoje, formatarDataCurta } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function AlunoHome() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [nome, setNome] = useState('')
  const [revisoesHoje, setRevisoesHoje] = useState<any[]>([])
  const [revisoesAtrasadas, setRevisoesAtrasadas] = useState<any[]>([])
  const [proximasRevisoes, setProximasRevisoes] = useState<any[]>([])
  const [revisoesConcluidas, setRevisoesConcluidas] = useState<any[]>([])
  const [totalEstudos, setTotalEstudos] = useState(0)
  const [revisaoSelecionada, setRevisaoSelecionada] = useState<any>(null)
  const [aba, setAba] = useState<'pendentes' | 'concluidas'>('pendentes')

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

    const { data: rConcluidas } = await supabase
      .from('revisoes')
      .select('*, conteudo:conteudos(*)')
      .eq('aluno_id', session.user.id)
      .eq('status', 'completed')
      .order('concluida_em', { ascending: false })
      .limit(20)

    const { data: conteudos } = await supabase
      .from('conteudos')
      .select('id')
      .eq('aluno_id', session.user.id)

    setRevisoesHoje(rHoje ?? [])
    setRevisoesAtrasadas(rAtrasadas ?? [])
    setProximasRevisoes(rProximas ?? [])
    setRevisoesConcluidas(rConcluidas ?? [])
    setTotalEstudos(conteudos?.length ?? 0)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  async function marcarConcluida(id: string) {
    const supabase = createClient()
    await supabase.from('revisoes').update({ status: 'completed', concluida: true, concluida_em: new Date().toISOString() }).eq('id', id)
    setRevisaoSelecionada(null)
    loadData()
  }

  async function remarcar(id: string) {
    const supabase = createClient()
    const novaData = format(new Date(), 'yyyy-MM-dd')
    await supabase.from('revisoes').update({ status: 'rescheduled', data_revisao: novaData }).eq('id', id)
    setRevisaoSelecionada(null)
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
    { icon: Clock, label: 'Para revisar hoje', value: revisoesHoje.length, color: 'text-yellow-500' },
    { icon: AlertCircle, label: 'Atrasadas', value: revisoesAtrasadas.length, color: 'text-red-500' },
    { icon: Bell, label: 'Próx. 7 dias', value: proximasRevisoes.length, color: 'text-purple-500' },
    { icon: BookOpen, label: 'Estudos registrados', value: totalEstudos, color: 'text-teal' },
  ]

  const badgeLabel: Record<string, string> = { D1: 'Revisão D+1', D7: 'Revisão D+7', D30: 'Revisão D+30' }

  function RevCard({ r, showActions = true }: { r: any, showActions?: boolean }) {
    const atrasada = r.data_revisao < dataHoje && r.status !== 'completed'
    return (
      <div
        className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-all"
        onClick={() => setRevisaoSelecionada(r)}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-purple-100 text-purple-700 font-condensed text-xs font-bold px-2.5 py-1 rounded-full uppercase">
              {r.conteudo?.materia}
            </span>
            <span className="bg-blue-100 text-blue-700 font-condensed text-xs font-bold px-2.5 py-1 rounded-full uppercase">
              {badgeLabel[r.tipo]}
            </span>
            {r.status === 'completed' && (
              <span className="bg-teal-light text-teal font-condensed text-xs font-bold px-2.5 py-1 rounded-full uppercase">
                ✓ Concluída
              </span>
            )}
            {atrasada && (
              <span className="bg-red-100 text-red-600 font-condensed text-xs font-bold px-2.5 py-1 rounded-full uppercase">
                Atrasada
              </span>
            )}
          </div>
          <span className="text-xs text-gray-400">Prevista: {formatarDataCurta(r.data_revisao)}</span>
        </div>
        <p className="font-semibold text-navy text-base mb-1">{r.conteudo?.assunto}</p>
        {r.conteudo?.descricao && <p className="text-sm text-gray-500 mb-1">{r.conteudo.descricao}</p>}
        {r.teacher_comment && (
          <div className="flex items-center gap-1.5 mt-2">
            <MessageSquare size={12} className="text-teal" />
            <p className="text-xs text-teal font-medium">Observação do professor</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl">
      {/* Modal de detalhe da revisão */}
      {revisaoSelecionada && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-purple-100 text-purple-700 font-condensed text-xs font-bold px-2.5 py-1 rounded-full uppercase">
                  {revisaoSelecionada.conteudo?.materia}
                </span>
                <span className="bg-blue-100 text-blue-700 font-condensed text-xs font-bold px-2.5 py-1 rounded-full uppercase">
                  {badgeLabel[revisaoSelecionada.tipo]}
                </span>
              </div>
              <button onClick={() => setRevisaoSelecionada(null)} className="text-gray-400 hover:text-navy">
                <X size={20} />
              </button>
            </div>

            <h3 className="font-serif text-xl font-bold text-navy mb-1">{revisaoSelecionada.conteudo?.assunto}</h3>
            <p className="text-xs text-gray-400 mb-4">Prevista: {formatarDataCurta(revisaoSelecionada.data_revisao)}</p>

            {revisaoSelecionada.conteudo?.descricao && (
              <div className="bg-gray-50 rounded-xl p-3 mb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Descrição</p>
                <p className="text-sm text-navy">{revisaoSelecionada.conteudo.descricao}</p>
              </div>
            )}

            {revisaoSelecionada.teacher_comment && (
              <div className="bg-teal-light border border-teal/20 rounded-xl p-3 mb-4">
                <div className="flex items-center gap-1.5 mb-1">
                  <MessageSquare size={13} className="text-teal" />
                  <p className="text-xs font-semibold text-teal uppercase tracking-wide">Observação do professor</p>
                </div>
                <p className="text-sm text-navy">{revisaoSelecionada.teacher_comment}</p>
              </div>
            )}

            {revisaoSelecionada.status !== 'completed' && (
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => marcarConcluida(revisaoSelecionada.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-teal text-white rounded-xl text-sm font-semibold"
                >
                  <CheckCircle2 size={15} /> Marcar concluída
                </button>
                <button
                  onClick={() => remarcar(revisaoSelecionada.id)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold"
                >
                  <RotateCcw size={15} /> Remarcar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-navy">Olá, {nome}! 👋</h1>
        <p className="text-gray-400 mt-1 capitalize">{diaSemana}</p>
      </div>

      {/* Seletor pendentes/concluídas */}
      <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl">
        <button
          onClick={() => setAba('pendentes')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${aba === 'pendentes' ? 'bg-white text-navy shadow-sm' : 'text-gray-400 hover:text-navy'}`}
        >
          Pendentes
        </button>
        <button
          onClick={() => setAba('concluidas')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${aba === 'concluidas' ? 'bg-white text-navy shadow-sm' : 'text-gray-400 hover:text-navy'}`}
        >
          Concluídas
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {stats.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={18} className={color} />
            </div>
            <p className="font-bold text-2xl text-navy">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {aba === 'pendentes' ? (
        <>
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
                <p className="text-sm text-gray-400 mt-1">Você não tem revisões para hoje.</p>
              </div>
            )}
          </div>

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
        </>
      ) : (
        <div>
          <h2 className="font-serif text-xl font-semibold text-navy flex items-center gap-2 mb-4">
            <CheckCircle2 size={20} className="text-teal" /> Revisões concluídas
          </h2>
          {revisoesConcluidas.length > 0 ? (
            <div className="flex flex-col gap-3">
              {revisoesConcluidas.map(r => <RevCard key={r.id} r={r} showActions={false} />)}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 border border-dashed border-gray-200 text-center">
              <p className="text-2xl mb-2">📚</p>
              <p className="text-sm text-gray-400">Nenhuma revisão concluída ainda.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
