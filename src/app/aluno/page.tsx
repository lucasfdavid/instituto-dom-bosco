'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Clock, AlertCircle, CalendarDays, BookOpen, CheckCircle2, RotateCcw, X, MessageSquare, HelpCircle, Bell, CalendarCheck } from 'lucide-react'
import { hoje, formatarDataCurta } from '@/lib/utils'
import { format, parseISO, startOfWeek, endOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function AlunoHome() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [nome, setNome] = useState('')
  const [revisoesHoje, setRevisoesHoje] = useState<any[]>([])
  const [revisoesAtrasadas, setRevisoesAtrasadas] = useState<any[]>([])
  const [revisoesSemana, setRevisoesSemana] = useState<any[]>([])
  const [revisoesConcluidas, setRevisoesConcluidas] = useState<any[]>([])
  const [totalEstudos, setTotalEstudos] = useState(0)
  const [revisaoSelecionada, setRevisaoSelecionada] = useState<any>(null)
  const [aba, setAba] = useState<'pendentes' | 'concluidas'>('pendentes')
  const [modalComoRevisar, setModalComoRevisar] = useState(false)
  const [notificacoes, setNotificacoes] = useState<any[]>([])
  const [painelNotif, setPainelNotif] = useState(false)

  async function loadData() {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth/login'); return }

    const { data: profile } = await supabase
      .from('profiles').select('nome').eq('id', session.user.id).single()
    setNome(profile?.nome?.split(' ')[0] ?? 'Aluno')

    const dataHoje = hoje()
    const now = new Date()
    const inicioSemana = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    const fimSemana = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')

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

    const { data: rSemana } = await supabase
      .from('revisoes')
      .select('*, conteudo:conteudos(*)')
      .eq('aluno_id', session.user.id)
      .gte('data_revisao', inicioSemana)
      .lte('data_revisao', fimSemana)
      .order('data_revisao')

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
    setRevisoesSemana(rSemana ?? [])
    setRevisoesConcluidas(rConcluidas ?? [])
    setTotalEstudos(conteudos?.length ?? 0)
    setLoading(false)

    // Carrega notificações para o painel
    const { data: notifs } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('user_id', session.user.id)
      .order('criado_em', { ascending: false })
      .limit(20)
    setNotificacoes(notifs ?? [])

    // Notificações de revisão do dia
    if (rHoje && rHoje.length > 0) {
      const chave = `revisao_notif_${dataHoje}_${session.user.id}`
      if (!localStorage.getItem(chave)) {
        localStorage.setItem(chave, '1')
        const msg = rHoje.length === 1
          ? `Você tem 1 revisão para hoje: ${rHoje[0].conteudo?.assunto ?? ''}`
          : `Você tem ${rHoje.length} revisões para fazer hoje!`

        // Insere na tabela de notificações (sem duplicar no mesmo dia)
        const { data: jaExiste } = await supabase
          .from('notificacoes')
          .select('id')
          .eq('user_id', session.user.id)
          .eq('tipo', 'revisao_hoje')
          .gte('criado_em', `${dataHoje}T00:00:00`)
          .limit(1)
        if (!jaExiste || jaExiste.length === 0) {
          await supabase.from('notificacoes').insert({
            user_id: session.user.id,
            tipo: 'revisao_hoje',
            mensagem: msg,
          })
        }

        // Notificação do browser se permitido
        if ('Notification' in window) {
          if (Notification.permission === 'granted') {
            new Notification('Instituto Dom Bosco', { body: msg, icon: '/apple-touch-icon.png' })
          } else if (Notification.permission === 'default') {
            Notification.requestPermission().then(p => {
              if (p === 'granted') new Notification('Instituto Dom Bosco', { body: msg, icon: '/apple-touch-icon.png' })
            })
          }
        }
      }
    }
  }

  useEffect(() => { loadData() }, [])

  async function abrirNotificacoes() {
    setPainelNotif(p => !p)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await supabase.from('notificacoes').update({ lida: true }).eq('user_id', session.user.id).eq('lida', false)
    setNotificacoes(n => n.map(x => ({ ...x, lida: true })))
  }

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

  const revisoesRestantesSemana = revisoesSemana.filter(r => r.data_revisao > dataHoje && r.status !== 'completed').length

  const stats = [
    { icon: Clock, label: 'Para revisar hoje', value: revisoesHoje.length, color: 'text-yellow-500' },
    { icon: AlertCircle, label: 'Atrasadas', value: revisoesAtrasadas.length, color: 'text-red-500' },
    { icon: CalendarDays, label: 'Rest. esta semana', value: revisoesRestantesSemana, color: 'text-purple-500' },
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
      {/* Modal */}
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

      {/* Modal Como Revisar */}
      {modalComoRevisar && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
              <h2 className="font-serif text-xl font-bold text-navy">Como revisar?</h2>
              <button onClick={() => setModalComoRevisar(false)} className="text-gray-400 hover:text-navy">
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto p-6 flex flex-col gap-6 text-sm text-gray-700">
              {[
                {
                  tipo: 'D+1',
                  subtitulo: '24 horas depois',
                  cor: 'bg-blue-50 border-blue-200',
                  badge: 'bg-blue-100 text-blue-700',
                  intro: 'Faça uma revisão rápida do conteúdo estudado no dia anterior:',
                  items: [
                    'Tente lembrar os conceitos sem consultar o material (recordação ativa).',
                    'Leia seus resumos, mapas mentais ou anotações.',
                    'Resolva algumas questões sobre o tema.',
                    'Identifique os pontos que já esqueceu.',
                  ],
                  rodape: 'Tempo sugerido: 10 a 20 minutos para cada hora de estudo original.',
                },
                {
                  tipo: 'D+7',
                  subtitulo: '7 dias depois',
                  cor: 'bg-purple-50 border-purple-200',
                  badge: 'bg-purple-100 text-purple-700',
                  intro: 'O foco é verificar se o conhecimento permaneceu após uma semana:',
                  items: [
                    'Resolva questões mais desafiadoras.',
                    'Explique o conteúdo com suas próprias palavras.',
                    'Revise apenas os tópicos em que teve dificuldade.',
                    'Atualize resumos ou flashcards se necessário.',
                  ],
                  rodape: 'Nessa etapa, a revisão costuma ser mais curta do que a de D+1.',
                },
                {
                  tipo: 'D+30',
                  subtitulo: '30 dias depois',
                  cor: 'bg-teal-50 border-teal-200',
                  badge: 'bg-teal-100 text-teal-700',
                  intro: 'É a consolidação na memória de longo prazo:',
                  items: [
                    'Faça uma revisão geral dos pontos principais.',
                    'Resolva questões de revisão ou simulados.',
                    'Verifique se consegue recuperar o conteúdo sem consultar materiais.',
                    'Reforce apenas o que ainda apresenta falhas.',
                  ],
                  rodape: 'Se o conteúdo estiver bem dominado, revisar apenas por meio de questões periódicas ou simulados.',
                },
              ].map(({ tipo, subtitulo, cor, badge, intro, items, rodape }) => (
                <div key={tipo} className={`border rounded-xl p-4 ${cor}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`font-condensed text-xs font-bold px-2.5 py-1 rounded-full ${badge}`}>{tipo}</span>
                    <span className="font-semibold text-navy">{subtitulo}</span>
                  </div>
                  <p className="text-gray-600 mb-2">{intro}</p>
                  <ul className="flex flex-col gap-1 mb-3">
                    {items.map((item, i) => (
                      <li key={i} className="flex gap-2 text-gray-600">
                        <span className="text-teal mt-0.5 shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-gray-500 italic">{rodape}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Notificações */}
      {painelNotif && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
              <h2 className="font-serif text-xl font-bold text-navy">Notificações</h2>
              <button onClick={() => setPainelNotif(false)} className="text-gray-400 hover:text-navy">
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto flex flex-col">
              {notificacoes.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <Bell size={32} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">Nenhuma notificação ainda.</p>
                </div>
              ) : (
                notificacoes.map(n => {
                  const revisao = n.revisao_id
                    ? [...revisoesHoje, ...revisoesAtrasadas, ...revisoesSemana, ...revisoesConcluidas].find(r => r.id === n.revisao_id)
                    : null
                  return (
                    <button
                      key={n.id}
                      onClick={() => {
                        setPainelNotif(false)
                        if (n.revisao_id) {
                          router.push(`/aluno/calendario?revisao=${n.revisao_id}`)
                        } else {
                          router.push('/aluno/calendario')
                        }
                      }}
                      className={`flex items-start gap-4 px-6 py-4 border-b border-gray-50 last:border-0 text-left w-full transition-colors cursor-pointer ${
                        !n.lida ? 'bg-teal/5 hover:bg-teal/10' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${n.tipo === 'novo_comentario' ? 'bg-teal/10' : 'bg-navy/10'}`}>
                        {n.tipo === 'novo_comentario'
                          ? <MessageSquare size={16} className="text-teal" />
                          : <CalendarCheck size={16} className="text-navy" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-navy leading-snug">{n.mensagem}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {format(parseISO(n.criado_em), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                        </p>
                        <p className="text-xs text-teal font-semibold mt-1">Toque para ver no calendário →</p>
                      </div>
                      {!n.lida && <div className="w-2.5 h-2.5 rounded-full bg-teal shrink-0 mt-1.5" />}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold text-navy">Olá, {nome}! 👋</h1>
            <p className="text-gray-400 mt-1 capitalize">{diaSemana}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Sino de notificações */}
            <button
              onClick={abrirNotificacoes}
              className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-500 text-xs font-semibold hover:border-teal hover:text-teal transition-colors shadow-sm"
            >
              <Bell size={14} />
              {notificacoes.some(n => !n.lida) && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {notificacoes.filter(n => !n.lida).length > 9 ? '9+' : notificacoes.filter(n => !n.lida).length}
                </span>
              )}
            </button>

            <button
              onClick={() => setModalComoRevisar(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-500 text-xs font-semibold hover:border-teal hover:text-teal transition-colors shadow-sm"
            >
              <HelpCircle size={14} /> Como revisar
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
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

          {/* Esta semana */}
          {revisoesSemana.filter(r => r.data_revisao > dataHoje).length > 0 && (
            <div>
              <h2 className="font-serif text-xl font-semibold text-navy flex items-center gap-2 mb-4">
                <CalendarDays size={20} className="text-purple-500" /> Esta semana
              </h2>
              {(() => {
                const diasUnicos = Array.from(new Set(
                  revisoesSemana
                    .filter(r => r.data_revisao > dataHoje)
                    .map(r => r.data_revisao)
                )).sort()
                return (
                  <div className="flex flex-col gap-6">
                    {diasUnicos.map(dia => {
                      const labelDia = format(parseISO(dia as string), "EEEE, dd/MM", { locale: ptBR })
                      const cardsNoDia = revisoesSemana.filter(r => r.data_revisao === dia)
                      return (
                        <div key={dia as string}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-condensed text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-purple-100 text-purple-700">
                              {labelDia}
                            </span>
                          </div>
                          <div className="flex flex-col gap-3">
                            {cardsNoDia.map(r => <RevCard key={r.id} r={r} showActions={false} />)}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
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
