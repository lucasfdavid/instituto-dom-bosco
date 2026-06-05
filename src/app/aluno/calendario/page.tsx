'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { hoje } from '@/lib/utils'
import { CheckCircle2, RotateCcw } from 'lucide-react'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, isSameDay, isToday, parseISO, addMonths, subMonths
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

const DOW = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

export default function AlunoCalendario() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [revisoes, setRevisoes] = useState<any[]>([])
  const [current, setCurrent] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())

  async function loadData() {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth/login'); return }
    const { data } = await supabase
      .from('revisoes')
      .select('*, conteudo:conteudos(*)')
      .eq('aluno_id', session.user.id)
      .order('data_revisao')
    setRevisoes(data ?? [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

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
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-navy">Calendário</h1>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
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
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
          <h3 className="font-serif text-base font-semibold text-navy mb-1 capitalize">{selectedLabel}</h3>
          <p className="font-condensed text-[10px] uppercase tracking-widest text-gray-400 mb-4">Revisões</p>
          {revisoesSelected.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhuma revisão prevista.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {revisoesSelected.map(r => (
                <div key={r.id} className={`p-3 rounded-xl border ${r.status === 'completed' ? 'border-teal/20 bg-teal-light' : 'border-gray-200 bg-gray-50'}`}>
                  <p className="font-semibold text-navy text-sm mb-0.5">{r.conteudo?.assunto}</p>
                  <p className="text-xs text-gray-400 mb-2">{r.conteudo?.materia} · {r.tipo}</p>
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
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
