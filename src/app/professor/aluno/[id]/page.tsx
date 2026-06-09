'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { formatarDataCurta } from '@/lib/utils'
import { CheckCircle2, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react'

export default function AlunoDetalhe({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [conteudos, setConteudos] = useState<any[]>([])
  const [comentarios, setComentarios] = useState<Record<string, string>>({})
  const [salvando, setSalvando] = useState<Record<string, boolean>>({})
  const [expandido, setExpandido] = useState<Record<string, boolean>>({})

  async function loadData() {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth/login'); return }

    const { data: p } = await supabase
      .from('profiles').select('*').eq('id', params.id).single()

    const { data: c } = await supabase
      .from('conteudos')
      .select('*, revisoes(*)')
      .eq('aluno_id', params.id)
      .order('data_estudo', { ascending: false })

    setProfile(p)
    setConteudos(c ?? [])

    // Pré-carregar comentários existentes
    const comentariosIniciais: Record<string, string> = {}
    c?.forEach(conteudo => {
      conteudo.revisoes?.forEach((r: any) => {
        if (r.teacher_comment) comentariosIniciais[r.id] = r.teacher_comment
      })
    })
    setComentarios(comentariosIniciais)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  async function salvarComentario(revisaoId: string) {
    setSalvando(s => ({ ...s, [revisaoId]: true }))
    const supabase = createClient()
    const { error } = await supabase.from('revisoes')
      .update({ teacher_comment: comentarios[revisaoId] ?? '' })
      .eq('id', revisaoId)
    if (error) alert('Erro: ' + error.message)
    else alert('Salvo com sucesso!')
    setSalvando(s => ({ ...s, [revisaoId]: false }))
  }

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
              {/* Header do conteúdo */}
              <button
                onClick={() => setExpandido(e => ({ ...e, [c.id]: !e[c.id] }))}
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

              {/* Revisões expandidas */}
              {aberto && (
                <div className="border-t border-gray-100 p-4 flex flex-col gap-4">
                  {(c.revisoes ?? []).map((r: any) => (
                    <div key={r.id} className={`rounded-xl p-4 border ${r.status === 'completed' ? 'bg-teal-light border-teal/20' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-condensed text-xs font-bold text-navy uppercase">
                            Revisão {r.tipo}
                          </span>
                          {r.status === 'completed' && (
                            <CheckCircle2 size={14} className="text-teal" />
                          )}
                        </div>
                        <span className="text-xs text-gray-400">{formatarDataCurta(r.data_revisao)}</span>
                      </div>

                      {/* Status */}
                      <p className={`text-xs font-semibold mb-3 ${
                        r.status === 'completed' ? 'text-teal' :
                        r.status === 'rescheduled' ? 'text-yellow-600' :
                        'text-gray-400'
                      }`}>
                        {r.status === 'completed' ? '✓ Concluída pelo aluno' :
                         r.status === 'rescheduled' ? '↻ Remarcada' :
                         '○ Pendente'}
                      </p>

                      {/* Comentário do professor */}
                      <div>
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-navy mb-2">
                          <MessageSquare size={12} /> Comentário do professor
                        </label>
                        <textarea
                          value={comentarios[r.id] ?? ''}
                          onChange={e => setComentarios(c => ({ ...c, [r.id]: e.target.value }))}
                          placeholder="Adicione um comentário ou orientação para o aluno..."
                          rows={2}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-navy text-xs outline-none focus:border-teal resize-none transition-all"
                        />
                        <button
                          onClick={() => salvarComentario(r.id)}
                          disabled={salvando[r.id]}
                          className="mt-2 px-4 py-1.5 bg-gradient-to-r from-navy to-teal text-white text-xs font-semibold rounded-lg disabled:opacity-60"
                        >
                          {salvando[r.id] ? 'Salvando...' : 'Salvar comentário'}
                        </button>
                      </div>
                    </div>
                  ))}
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
