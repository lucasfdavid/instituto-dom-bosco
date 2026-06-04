'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Topbar } from '@/components/ui/Topbar'
import Link from 'next/link'
import { hoje } from '@/lib/utils'

export default function ProfessorPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [nome, setNome] = useState('')
  const [initials, setInitials] = useState('')
  const [alunos, setAlunos] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('nome, role')
        .eq('id', session.user.id)
        .single()

      if (profile?.role !== 'professor') { router.push('/aluno'); return }

      const n = profile?.nome ?? 'Professor'
      setNome(n.split(' ')[0])
      setInitials(n.split(' ').map((x: string) => x[0]).slice(0, 2).join(''))

      const { data: vinculos } = await supabase
        .from('professor_aluno')
        .select('aluno:profiles!aluno_id(id, nome, email)')
        .eq('professor_id', session.user.id)

      const alunosBase = vinculos?.map((v: any) => v.aluno) ?? []

      const alunosComStats = await Promise.all(
        alunosBase.map(async (aluno: any) => {
          const { data: revisoes } = await supabase
            .from('revisoes')
            .select('concluida, data_revisao')
            .eq('aluno_id', aluno.id)

          const total = revisoes?.length ?? 0
          const concluidas = revisoes?.filter(r => r.concluida).length ?? 0
          const hojeCount = revisoes?.filter(r => r.data_revisao === hoje() && !r.concluida).length ?? 0
          const pct = total > 0 ? Math.round((concluidas / total) * 100) : 0

          const { data: conteudos } = await supabase
            .from('conteudos')
            .select('id')
            .eq('aluno_id', aluno.id)

          return { ...aluno, total, concluidas, hojeCount, pct, nConteudos: conteudos?.length ?? 0 }
        })
      )

      setAlunos(alunosComStats)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-navy flex items-center justify-center">
      <p className="text-white font-condensed tracking-widest">Carregando...</p>
    </div>
  )

  const totalHoje = alunos.reduce((s, a) => s + a.hojeCount, 0)
  const taxaMedia = alunos.length ? Math.round(alunos.reduce((s, a) => s + a.pct, 0) / alunos.length) : 0
  const emAtraso = alunos.filter(a => a.pct < 50).length

  return (
    <div className="min-h-screen">
      <Topbar subtitulo="Painel do Professor" initials={initials} />

      <div className="bg-navy px-5 pt-5 pb-6">
        <p className="font-condensed text-xs uppercase tracking-widest text-teal font-semibold mb-1">Olá, {nome} 👋</p>
        <h1 className="font-serif text-2xl font-semibold text-white mb-4">Seus alunos</h1>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { num: alunos.length, label: 'Alunos ativos', color: 'text-white' },
            { num: totalHoje, label: 'Revisoes hoje', color: 'text-teal' },
            { num: taxaMedia + '%', label: 'Taxa de conclusao', color: 'text-teal' },
            { num: emAtraso, label: 'Em atraso', color: 'text-red-400' },
          ].map(({ num, label, color }) => (
            <div key={label} className="bg-white/10 border border-white/10 rounded-xl p-3.5">
              <p className={`font-condensed text-2xl font-bold leading-none ${color}`}>{num}</p>
              <p className="font-condensed text-xs uppercase tracking-wide text-white/40 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 py-5">
        <p className="font-condensed text-xs font-semibold uppercase tracking-widest text-gray-400 pb-3">
          Meus alunos
        </p>
        <div className="flex flex-col gap-2.5">
          {alunos.map(aluno => (
            <Link key={aluno.id} href={`/professor/aluno/${aluno.id}`}>
              <div className="bg-white rounded-2xl p-4 border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-navy flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">
                      {aluno.nome?.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-navy text-sm">{aluno.nome}</p>
                    <p className="text-xs text-gray-400">{aluno.nConteudos} conteudos</p>
                  </div>
                  <span className={`font-condensed text-xs font-bold px-2.5 py-1 rounded-full ${aluno.pct >= 70 ? 'bg-green-100 text-green-700' : aluno.pct >= 40 ? 'bg-purple-100 text-purple-700' : 'bg-red-100 text-red-700'}`}>
                    {aluno.pct}%
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2.5">
                  <div className="h-full bg-teal rounded-full" style={{ width: `${aluno.pct}%` }} />
                </div>
                <div className="flex gap-2">
                  {[
                    { num: aluno.nConteudos, label: 'Conteudos', color: 'text-navy' },
                    { num: aluno.hojeCount, label: 'Hoje', color: 'text-teal' },
                    { num: aluno.concluidas, label: 'Concluidas', color: 'text-green-600' },
                  ].map(({ num, label, color }) => (
                    <div key={label} className="flex-1 bg-gray-50 rounded-lg p-2 text-center">
                      <p className={`font-condensed text-lg font-bold ${color}`}>{num}</p>
                      <p className="font-condensed text-xs uppercase tracking-wide text-gray-400">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Link>
          ))}
          {alunos.length === 0 && (
            <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center">
              <p className="text-3xl mb-3">👥</p>
              <p className="text-sm text-gray-400">Nenhum aluno vinculado ainda.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
