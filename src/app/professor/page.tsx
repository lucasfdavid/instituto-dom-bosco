'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { hoje } from '@/lib/utils'
import { Search, Bell, X, Cake } from 'lucide-react'
import { format } from 'date-fns'

export default function ProfessorPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [nome, setNome] = useState('')
  const [alunos, setAlunos] = useState<any[]>([])
  const [busca, setBusca] = useState('')
  const [notificacoes, setNotificacoes] = useState<any[]>([])
  const [painelNotif, setPainelNotif] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth/login'); return }

    const { data: profile } = await supabase
      .from('profiles')
      .select('nome, role')
      .eq('id', session.user.id)
      .single()
    if (!['professor', 'administrador'].includes(profile?.role ?? '')) { router.push('/aluno'); return }
    setNome(profile?.nome?.split(' ')[0] ?? '')

    const { data: alunosPerfis } = await supabase
      .from('profiles')
      .select('id, nome, email, course, phone, birth_date')
      .eq('role', 'aluno')
      .order('nome')

    const alunosBase = alunosPerfis ?? []

    const alunosComStats = await Promise.all(
      alunosBase.map(async (aluno: any) => {
        const { data: revisoes } = await supabase
          .from('revisoes')
          .select('concluida, data_revisao, status')
          .eq('aluno_id', aluno.id)

        const total = revisoes?.length ?? 0
        const concluidas = revisoes?.filter(r => r.status === 'completed').length ?? 0
        const hojeCount = revisoes?.filter(r => r.data_revisao === hoje() && r.status !== 'completed').length ?? 0
        const atrasadas = revisoes?.filter(r => r.data_revisao < hoje() && r.status !== 'completed').length ?? 0
        const pct = total > 0 ? Math.round((concluidas / total) * 100) : 0

        const { data: conteudos } = await supabase
          .from('conteudos').select('id').eq('aluno_id', aluno.id)

        return { ...aluno, total, concluidas, hojeCount, atrasadas, pct, nConteudos: conteudos?.length ?? 0 }
      })
    )

    setAlunos(alunosComStats)

    // Carrega notificações do professor
    const { data: notifs } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('user_id', session.user.id)
      .order('criado_em', { ascending: false })
      .limit(30)
    setNotificacoes(notifs ?? [])

    // Verifica aniversariantes do dia
    const dataHoje = hoje()
    const [, mesHoje, diaHoje] = dataHoje.split('-').map(Number)

    const aniversariantes = alunosBase.filter(a => {
      if (!a.birth_date) return false
      const [, mes, dia] = a.birth_date.split('-').map(Number)
      return mes === mesHoje && dia === diaHoje
    })

    for (const aluno of aniversariantes) {
      const chave = `aniversario_notif_${dataHoje}_${aluno.id}_${session.user.id}`
      if (!localStorage.getItem(chave)) {
        const jaExiste = await supabase
          .from('notificacoes')
          .select('id')
          .eq('user_id', session.user.id)
          .eq('tipo', 'aniversario')
          .eq('mensagem', `🎂 Hoje é aniversário de ${aluno.nome}!`)
          .gte('criado_em', `${dataHoje}T00:00:00`)
          .limit(1)

        if (!jaExiste.data || jaExiste.data.length === 0) {
          await supabase.from('notificacoes').insert({
            user_id: session.user.id,
            tipo: 'aniversario',
            mensagem: `🎂 Hoje é aniversário de ${aluno.nome}!`,
          })
          localStorage.setItem(chave, '1')
        } else {
          localStorage.setItem(chave, '1')
        }
      }
    }

    // Notificações de revisões do dia por aluno
    let inseriu = aniversariantes.length > 0
    for (const aluno of alunosComStats) {
      if (aluno.hojeCount > 0) {
        const chaveRev = `revisao_prof_notif_${dataHoje}_${aluno.id}_${session.user.id}`
        if (!localStorage.getItem(chaveRev)) {
          const qtd = aluno.hojeCount
          const msg = `📚 ${aluno.nome} tem ${qtd} revisão${qtd > 1 ? 'ões' : ''} para hoje.`
          const { data: jaExiste } = await supabase
            .from('notificacoes')
            .select('id')
            .eq('user_id', session.user.id)
            .eq('tipo', 'revisao_hoje_aluno')
            .eq('mensagem', msg)
            .gte('criado_em', `${dataHoje}T00:00:00`)
            .limit(1)
          if (!jaExiste || jaExiste.length === 0) {
            await supabase.from('notificacoes').insert({
              user_id: session.user.id,
              tipo: 'revisao_hoje_aluno',
              mensagem: msg,
            })
            inseriu = true
          }
          localStorage.setItem(chaveRev, '1')
        }
      }
    }

    // Recarrega notificações após inserir novas
    if (inseriu) {
      const { data: notifsAtualizadas } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('user_id', session.user.id)
        .order('criado_em', { ascending: false })
        .limit(30)
      setNotificacoes(notifsAtualizadas ?? [])
    }

    setLoading(false)
  }

  async function abrirNotificacoes() {
    setPainelNotif(p => !p)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await supabase.from('notificacoes').update({ lida: true }).eq('user_id', session.user.id).eq('lida', false)
    setNotificacoes(n => n.map(x => ({ ...x, lida: true })))
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400 font-condensed tracking-widest">Carregando...</p>
    </div>
  )

  const naoLidas = notificacoes.filter(n => !n.lida).length
  const alunosFiltrados = alunos.filter(a =>
    a.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    a.email?.toLowerCase().includes(busca.toLowerCase()) ||
    a.course?.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-navy">Meus alunos</h1>
          <p className="text-gray-400 mt-1">{alunos.length} aluno{alunos.length !== 1 ? 's' : ''} vinculado{alunos.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={abrirNotificacoes}
          className="relative p-2.5 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all"
        >
          <Bell size={20} className="text-navy" />
          {naoLidas > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {naoLidas > 9 ? '9+' : naoLidas}
            </span>
          )}
        </button>
      </div>

      {/* Busca */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar aluno por nome, e-mail ou turma..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-navy text-sm outline-none focus:border-teal transition-all"
        />
      </div>

      {/* Lista de alunos */}
      <div className="flex flex-col gap-3">
        {alunosFiltrados.map(aluno => (
          <Link key={aluno.id} href={`/professor/aluno/${aluno.id}`}>
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-navy to-teal flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-semibold">
                    {aluno.nome?.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-navy text-base">{aluno.nome}</p>
                    {(() => {
                      if (!aluno.birth_date) return null
                      const [, mes, dia] = aluno.birth_date.split('-').map(Number)
                      const [, mesHoje, diaHoje] = hoje().split('-').map(Number)
                      if (mes === mesHoje && dia === diaHoje) {
                        return <span title="Aniversário hoje!"><Cake size={14} className="text-pink-400 flex-shrink-0" /></span>
                      }
                      return null
                    })()}
                  </div>
                  <p className="text-sm text-gray-400 truncate">{aluno.course ?? aluno.email}</p>
                </div>
                <span className={`font-condensed text-sm font-bold px-3 py-1.5 rounded-full ${
                  aluno.pct >= 70 ? 'bg-green-100 text-green-700' :
                  aluno.pct >= 40 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {aluno.pct}%
                </span>
              </div>

              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-4">
                <div className="h-full bg-gradient-to-r from-navy to-teal rounded-full transition-all" style={{ width: `${aluno.pct}%` }} />
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[
                  { num: aluno.nConteudos, label: 'Conteúdos', color: 'text-navy' },
                  { num: aluno.hojeCount, label: 'Hoje', color: 'text-teal' },
                  { num: aluno.concluidas, label: 'Concluídas', color: 'text-green-600' },
                  { num: aluno.atrasadas, label: 'Atrasadas', color: 'text-red-500' },
                ].map(({ num, label, color }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-2.5 text-center">
                    <p className={`font-condensed text-lg font-bold ${color}`}>{num}</p>
                    <p className="font-condensed text-[10px] uppercase tracking-wide text-gray-400">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </Link>
        ))}

        {alunosFiltrados.length === 0 && (
          <div className="bg-white rounded-2xl p-10 border border-gray-200 text-center">
            <p className="text-3xl mb-3">👥</p>
            <p className="text-sm text-gray-400">
              {busca ? 'Nenhum aluno encontrado.' : 'Nenhum aluno vinculado ainda.'}
            </p>
          </div>
        )}
      </div>

      {/* Painel de notificações */}
      {painelNotif && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setPainelNotif(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-serif text-lg font-semibold text-navy">Notificações</h3>
              <button onClick={() => setPainelNotif(false)} className="p-1 rounded-lg text-gray-400 hover:text-navy">
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              {notificacoes.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-10">Nenhuma notificação.</p>
              ) : (
                notificacoes.map(n => (
                  <div key={n.id} className={`px-5 py-4 border-b border-gray-50 ${!n.lida ? 'bg-teal-light/40' : ''}`}>
                    <p className="text-sm text-navy leading-relaxed">{n.mensagem}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {format(new Date(n.criado_em), "dd/MM 'às' HH:mm")}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
