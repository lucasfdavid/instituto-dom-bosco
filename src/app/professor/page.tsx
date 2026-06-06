'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { hoje } from '@/lib/utils'
import { Search } from 'lucide-react'

export default function ProfessorPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [alunos, setAlunos] = useState<any[]>([])
  const [busca, setBusca] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()
      if (profile?.role !== 'professor') { router.push('/aluno'); return }

      const { data: vinculos } = await supabase
        .from('professor_aluno')
        .select('aluno:profiles!aluno_id(id, nome, email, course, phone)')
        .eq('professor_id', session.user.id)

      const alunosBase = vinculos?.map((v: any) => v.aluno) ?? []

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
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400 font-condensed tracking-widest">Carregando...</p>
    </div>
  )

  const alunosFiltrados = alunos.filter(a =>
    a.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    a.email?.toLowerCase().includes(busca.toLowerCase()) ||
    a.course?.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-navy">Meus alunos</h1>
        <p className="text-gray-400 mt-1">{alunos.length} aluno{alunos.length !== 1 ? 's' : ''} vinculado{alunos.length !== 1 ? 's' : ''}</p>
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
                  <p className="font-semibold text-navy text-base">{aluno.nome}</p>
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

              {/* Barra de progresso */}
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-4">
                <div className="h-full bg-gradient-to-r from-navy to-teal rounded-full transition-all" style={{ width: `${aluno.pct}%` }} />
              </div>

              {/* Stats */}
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
    </div>
  )
}
