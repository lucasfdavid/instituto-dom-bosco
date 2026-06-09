'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { hoje } from '@/lib/utils'
import { CheckCircle2, RotateCcw, ChevronDown, ChevronUp, Send } from 'lucide-react'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, isSameDay, isToday, parseISO, addMonths, subMonths
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

const DOW = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

export default function AlunoCalendario() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string>('')
  const [revisoes, setRevisoes] = useState<any[]>([])
  const [current, setCurrent] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [comentariosPorRevisao, setComentariosPorRevisao] = useState<Record<string, any[]>>({})
  const [textoNovo, setTextoNovo] = useState<Record<string, string>>({})
  const [enviando, setEnviando] = useState<string | null>(null)
  const chatRefs = useRef<Record<string, HTMLDivElement | null>>({})

  async function loadData() {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth/login'); return }
    setUserId(session.user.id)

    const { data } = await supabase
      .from('revisoes')
      .select('*, conteudo:conteudos(*)')
      .eq('aluno_id', session.user.id)
      .order('data_revisao')
    setRevisoes(data ?? [])
    setLoading(false)
  }

  async function loadComentarios(revisaoId: string) {
    const supabase = createClient()
    const { data } = await supabase
      .from('comentarios')
      .select('*, autor:profiles(nome, role)')
      .eq('revisao_id', revisaoId)
      .order('criado_em')
    setComentariosPorRevisao(prev => ({ ...prev, [revisaoId]: data ?? [] }))
  }

  async function toggleExpand(revisaoId: string) {
    if (expandedId === revisaoId) {
      setExpandedId(null)
    } else {
      setExpandedId(revisaoId)
      await loadComentarios(revisaoId)
      setTimeout(() => {
        const el = chatRefs.current[revisaoId]
        if (el) el.scrollTop = el.scrollHeight
      }, 100)
    }
  }

  async function enviarComentario(revisaoId: string) {
    const texto = textoNovo[revisaoId]?.trim()
    if (!texto) return
    setEnviando(revisaoId)
    const supabase = createClient()
    await supabase.from('comentarios').insert({
      revisao_id: revisaoId,
      autor_id: userId,
      role: 'aluno',
      texto,
    })
    setTextoNovo(prev => ({ ...prev, [revisaoId]: '' }))
    await loadComentarios(revisaoId)
    setEnviando(null)
    setTimeout(() => {
      const el = chatRefs.current[revisaoId]
      if (el) el.scrollTop = el.scrollHeight
    }, 100)
  }

  async function marcarConcluida(id: string) {
    const supabase = createClient()
    await supabase.from('revisoes').update({ status: 'completed', concluida: true, concluida_em: new Date().toISOString() }).eq('id', id)
    loadData()
  }

  async function remarcar(id: string) {
    const supabase = createClient()
    await supabase.from('revisoes').update({ status: 'rescheduled', data_revisao: format(new Date(), 'yyyy-MM-dd') }).eq('id', id)
    loadData()
  }

  useEffect(() => { loadData() }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400 font-condensed tracking-widest">Carregando...</p>
    </div>
  )

  const start = startOfMonth(current)
  const end = endOfMonth(current)
  const days = eachDayOfInterval({ start, end })
  const offset = (getDay(start) + 6) % 7

  function revisoesNoDia(date: Date) {
    return revisoes.filter(r => isSameDay(parseISO(r.data_revisao), date))
  }

  const revisoesSelected = revisoesNoDia(selectedDate)
  const selectedLabel = format(selectedDate, "dd 'de' MMMM", { locale: ptBR })
  const mesAno = format(current, 'MMMM yyyy', { locale: ptBR })

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-navy">Calendário</h1>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {/* Calendário */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCurrent(subMonths(current, 1))} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-navy hover:bg-gray-50">←</button>
            <div className="flex items-center gap-3">
              <h2 className="font-serif text-base font-semibold text-navy capitalize">{mesAno}</h2>
              <button onClick={() => { setCurrent(new Date()); setSelectedDate(new Date()) }} className="text-xs font-semibold px-3 py-1 rounded-lg bg-gradient-to-r from-navy to-teal text-white">Hoje</button>
            </div>
            <button onClick={() => setCurrent(addMonths(current, 1))} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-navy hover:bg-gray-50">→</button>
          </div>
          <div className="grid grid-cols-7 mb-1">
            {DOW.map(d => (
              <div key={d} className="text-center font-condensed text-[11px] uppercase tracking-wide text-gray-400 py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
            {days.map(date => {
              const revs = revisoesNoDia(date)
              const isSelected = isSameDay(date, selectedDate)
              const isHoje = isToday(date)
              return (
                <button
                  key={date.toISOString()}
                  onClick={() => setSelectedDate(date)}
                  className={`aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition-all ${
                    isSelected ? 'bg-gradient-to-br from-navy to-teal text-white shadow-md' :
                    isHoje ? 'bg-navy text-white' :
                    'hover:bg-gray-50 text-navy'
                  }`}
                >
                  <span>{format(date, 'd')}</span>
                  {revs.length > 0 && (
                    <span className={`text-[9px] font-bold px-1.5 rounded-full ${isSelected ? 'bg-white/30 text-white' : 'bg-teal/20 text-teal'}`}>
                      {revs.length}R
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Revisões do dia */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
          <h3 className="font-serif text-sm font-semibold text-navy mb-1 capitalize whitespace-nowrap">{selectedLabel}</h3>
          <p className="font-condensed text-[10px] uppercase tracking-widest text-gray-400 mb-4">Revisões</p>
          {revisoesSelected.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhuma revisão prevista.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {revisoesSelected.map(r => {
                const isExpanded = expandedId === r.id
                const comentarios = comentariosPorRevisao[r.id] ?? []
                return (
                  <div key={r.id} className={`rounded-xl border overflow-hidden ${r.status === 'completed' ? 'border-teal/20 bg-teal-light' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-navy text-sm mb-0.5">{r.conteudo?.assunto}</p>
                          <p className="text-xs text-gray-400 mb-2">{r.conteudo?.materia} · {r.tipo}</p>
                        </div>
                        <button
                          onClick={() => toggleExpand(r.id)}
                          className="text-gray-400 hover:text-navy shrink-0 mt-0.5"
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                      {r.status !== 'completed' ? (
                        <div className="flex gap-1.5 flex-wrap">
                          <button onClick={() => marcarConcluida(r.id)} className="flex items-center gap-1 px-2.5 py-1.5 bg-teal text-white rounded-lg text-xs font-semibold">
                            <CheckCircle2 size={12} /> Feito
                          </button>
                          <button onClick={() => remarcar(r.id)} className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-200 text-gray-600 rounded-lg text-xs font-semibold">
                            <RotateCcw size={12} /> Remarcar
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-teal font-semibold">Concluída</span>
                      )}
                    </div>

                    {/* Chat */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 bg-white">
                        {/* Histórico */}
                        <div
                          ref={el => { chatRefs.current[r.id] = el }}
                          className="flex flex-col gap-2 p-3 max-h-52 overflow-y-auto"
                        >
                          {comentarios.length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-2">Nenhum comentário ainda. Inicie a conversa!</p>
                          ) : (
                            comentarios.map((c: any) => {
                              const isMe = c.autor_id === userId
                              return (
                                <div key={c.id} className={`flex flex-col max-w-[85%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                                  <span className="text-[10px] text-gray-400 mb-0.5 px-1">
                                    {isMe ? 'Você' : c.autor?.nome?.split(' ')[0]} · {format(parseISO(c.criado_em), "dd/MM HH:mm")}
                                  </span>
                                  <div className={`px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                                    isMe
                                      ? 'bg-gradient-to-br from-navy to-teal text-white rounded-tr-sm'
                                      : 'bg-gray-100 text-navy rounded-tl-sm'
                                  }`}>
                                    {c.texto}
                                  </div>
                                </div>
                              )
                            })
                          )}
                        </div>
                        {/* Input */}
                        <div className="flex gap-2 p-3 border-t border-gray-100">
                          <input
                            type="text"
                            value={textoNovo[r.id] ?? ''}
                            onChange={e => setTextoNovo(prev => ({ ...prev, [r.id]: e.target.value }))}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarComentario(r.id) } }}
                            placeholder="Escreva uma mensagem..."
                            className="flex-1 text-xs px-3 py-2 rounded-xl border border-gray-200 outline-none focus:border-teal"
                          />
                          <button
                            onClick={() => enviarComentario(r.id)}
                            disabled={enviando === r.id || !textoNovo[r.id]?.trim()}
                            className="p-2 bg-gradient-to-br from-navy to-teal text-white rounded-xl disabled:opacity-40"
                          >
                            <Send size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
