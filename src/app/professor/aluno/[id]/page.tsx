'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { formatarDataCurta } from '@/lib/utils'
import { CheckCircle2, ChevronDown, ChevronUp, Send, Trash2, CalendarDays } from 'lucide-react'
import { format, parseISO } from 'date-fns'

export default function AlunoDetalhe({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string>('')
  const [profile, setProfile] = useState<any>(null)
  const [conteudos, setConteudos] = useState<any[]>([])
  const [expandido, setExpandido] = useState<Record<string, boolean>>({})
  const [comentariosPorRevisao, setComentariosPorRevisao] = useState<Record<string, any[]>>({})
  const [textoNovo, setTextoNovo] = useState<Record<string, string>>({})
  const [enviando, setEnviando] = useState<string | null>(null)
  const [remarcarDatas, setRemarcarDatas] = useState<Record<string, string>>({})
  const [remarcando, setRemarcando] = useState<string | null>(null)
  const chatRefs = useRef<Record<string, HTMLDivElement | null>>({})

  async function loadData() {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth/login'); return }
    setUserId(session.user.id)

    const { data: p } = await supabase
      .from('profiles').select('*').eq('id', params.id).single()

    const { data: c } = await supabase
      .from('conteudos')
      .select('*, revisoes(*)')
      .eq('aluno_id', params.id)
      .order('data_estudo', { ascending: false })

    setProfile(p)
    setConteudos(c ?? [])
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

  async function toggleExpandirConteudo(conteudoId: string, revisoes: any[]) {
    const novoEstado = !expandido[conteudoId]
    setExpandido(e => ({ ...e, [conteudoId]: novoEstado }))
    if (novoEstado) {
      await Promise.all(revisoes.map((r: any) => loadComentarios(r.id)))
      revisoes.forEach((r: any) => {
        setTimeout(() => {
          const el = chatRefs.current[r.id]
          if (el) el.scrollTop = el.scrollHeight
        }, 100)
      })
    }
  }

  async function remarcarRevisao(revisaoId: string) {
    const novaData = remarcarDatas[revisaoId]
    if (!novaData) return
    setRemarcando(revisaoId)
    const supabase = createClient()
    await supabase.from('revisoes').update({ data_revisao: novaData, status: 'rescheduled' }).eq('id', revisaoId)
    setRemarcando(null)
    setRemarcarDatas(d => ({ ...d, [revisaoId]: '' }))
    await loadData()
  }

  async function excluirRevisao(revisaoId: string) {
    if (!confirm('Excluir esta revisão? Esta ação não pode ser desfeita.')) return
    const supabase = createClient()
    await supabase.from('revisoes').delete().eq('id', revisaoId)
    await loadData()
  }

  async function enviarComentario(revisaoId: string) {
    const texto = textoNovo[revisaoId]?.trim()
    if (!texto) return
    setEnviando(revisaoId)
    const supabase = createClient()
    await supabase.from('comentarios').insert({
      revisao_id: revisaoId,
      autor_id: userId,
      role: 'professor',
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

  useEffect(() => { loadData() }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400 font-condensed tracking-widest">Carregando...</p>
    </div>
  )

  const todasRevisoes = conteudos.flatMap(c => c.revisoes ?? [])
  const total = todasRevisoes.length
  const concluidas = todasRevisoes.filter((r: any) => r.status === 'completed').length
  const pct = total > 0 ? Math.round((concluidas / total) * 100) : 0

  return (
    <div className="p-6 max-w-3xl">
      {/* Voltar */}
      <Link href="/professor" className="text-sm text-gray-400 hover:text-navy flex items-center gap-1 mb-6">
        ← Voltar para alunos
      </Link>

      {/* Header do aluno */}
      <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-navy to-teal flex items-center justify-center">
            <span className="text-white text-lg font-semibold">
              {profile?.nome?.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
            </span>
          </div>
          <div className="flex-1">
            <h1 className="font-serif text-2xl font-bold text-navy">{profile?.nome}</h1>
            <p className="text-sm text-gray-400">{profile?.course ?? profile?.email}</p>
          </div>
        </div>

        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-gradient-to-r from-navy to-teal rounded-full" style={{ width: `${pct}%` }} />
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { num: conteudos.length, label: 'Conteúdos', color: 'text-navy' },
            { num: `${pct}%`, label: 'Revisões ok', color: 'text-teal' },
            { num: todasRevisoes.filter((r: any) => r.status !== 'completed' && r.data_revisao < new Date().toISOString().split('T')[0]).length, label: 'Em atraso', color: 'text-red-500' },
          ].map(({ num, label, color }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
              <p className={`font-condensed text-xl font-bold ${color}`}>{num}</p>
              <p className="font-condensed text-[10px] uppercase tracking-wide text-gray-400">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Conteúdos e revisões */}
      <h2 className="font-serif text-xl font-semibold text-navy mb-4">Conteúdos e revisões</h2>
      <div className="flex flex-col gap-3">
        {conteudos.map(c => {
          const aberto = expandido[c.id]
          return (
            <div key={c.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <button
                onClick={() => toggleExpandirConteudo(c.id, c.revisoes ?? [])}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 text-left">
                  <span className="font-condensed text-xs font-bold px-2.5 py-1 rounded-full bg-teal/10 text-teal uppercase">
                    {c.materia}
                  </span>
                  <div>
                    <p className="font-semibold text-navy text-sm">{c.assunto}</p>
                    <p className="text-xs text-gray-400">{formatarDataCurta(c.data_estudo)}</p>
                  </div>
                </div>
                {aberto ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
              </button>

              {aberto && (
                <div className="border-t border-gray-100 p-4 flex flex-col gap-4">
                  {(c.revisoes ?? []).sort((a: any, b: any) => a.tipo.localeCompare(b.tipo)).map((r: any) => {
                    const comentarios = comentariosPorRevisao[r.id] ?? []
                    return (
                      <div key={r.id} className={`rounded-xl border overflow-hidden ${r.status === 'completed' ? 'bg-teal-light border-teal/20' : 'bg-gray-50 border-gray-200'}`}>
                        {/* Cabeçalho da revisão */}
                        <div className="flex items-center justify-between px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="font-condensed text-xs font-bold text-navy uppercase">Revisão {r.tipo}</span>
                            {r.status === 'completed' && <CheckCircle2 size={13} className="text-teal" />}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-xs font-semibold ${
                              r.status === 'completed' ? 'text-teal' :
                              r.status === 'rescheduled' ? 'text-yellow-600' : 'text-gray-400'
                            }`}>
                              {r.status === 'completed' ? '✓ Concluída' : r.status === 'rescheduled' ? '↻ Remarcada' : '○ Pendente'}
                            </span>
                            <span className="text-xs text-gray-400">{formatarDataCurta(r.data_revisao)}</span>
                            <button
                              onClick={() => excluirRevisao(r.id)}
                              className="p-1 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                              title="Excluir revisão"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Remarcar (professor) */}
                        <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50 flex items-center gap-2">
                          <CalendarDays size={13} className="text-gray-400 shrink-0" />
                          <span className="text-[11px] text-gray-400 shrink-0">Remarcar para:</span>
                          <input
                            type="date"
                            value={remarcarDatas[r.id] ?? ''}
                            onChange={e => setRemarcarDatas(d => ({ ...d, [r.id]: e.target.value }))}
                            className="flex-1 text-xs px-2 py-1.5 rounded-lg border border-gray-200 outline-none focus:border-teal bg-white"
                          />
                          <button
                            onClick={() => remarcarRevisao(r.id)}
                            disabled={!remarcarDatas[r.id] || remarcando === r.id}
                            className="text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r from-navy to-teal text-white font-semibold disabled:opacity-40 shrink-0"
                          >
                            {remarcando === r.id ? '...' : 'Salvar'}
                          </button>
                        </div>

                        {/* Chat */}
                        <div className="border-t border-gray-200 bg-white">
                          <div
                            ref={el => { chatRefs.current[r.id] = el }}
                            className="flex flex-col gap-2 p-3 max-h-48 overflow-y-auto"
                          >
                            {comentarios.length === 0 ? (
                              <p className="text-xs text-gray-400 text-center py-2">Nenhum comentário ainda.</p>
                            ) : (
                              comentarios.map((cm: any) => {
                                const isMe = cm.autor_id === userId
                                return (
                                  <div key={cm.id} className={`flex flex-col max-w-[85%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                                    <span className="text-[10px] text-gray-400 mb-0.5 px-1">
                                      {isMe ? 'Você' : cm.autor?.nome?.split(' ')[0]} · {format(parseISO(cm.criado_em), "dd/MM HH:mm")}
                                    </span>
                                    <div className={`px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                                      isMe
                                        ? 'bg-gradient-to-br from-navy to-teal text-white rounded-tr-sm'
                                        : 'bg-gray-100 text-navy rounded-tl-sm'
                                    }`}>
                                      {cm.texto}
                                    </div>
                                  </div>
                                )
                              })
                            )}
                          </div>
                          <div className="flex gap-2 p-3 border-t border-gray-100">
                            <input
                              type="text"
                              value={textoNovo[r.id] ?? ''}
                              onChange={e => setTextoNovo(prev => ({ ...prev, [r.id]: e.target.value }))}
                              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarComentario(r.id) } }}
                              placeholder="Comentário ou orientação..."
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
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {conteudos.length === 0 && (
          <div className="bg-white rounded-2xl p-10 border border-gray-200 text-center">
            <p className="text-3xl mb-3">📚</p>
            <p className="text-sm text-gray-400">Nenhum conteúdo registrado ainda.</p>
          </div>
        )}
      </div>
    </div>
  )
}
