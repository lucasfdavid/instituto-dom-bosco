'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ChevronRight, Search } from 'lucide-react'

export default function AdminAlunos() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [alunos, setAlunos] = useState<any[]>([])
  const [busca, setBusca] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth/login'); return }

      const { data } = await supabase
        .from('profiles')
        .select('id, nome, email, course, phone, enroll_date')
        .eq('role', 'aluno')
        .order('nome')

      setAlunos(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400 font-condensed tracking-widest">Carregando...</p>
    </div>
  )

  const alunosFiltrados = busca
    ? alunos.filter(a =>
        a.nome?.toLowerCase().includes(busca.toLowerCase()) ||
        a.email?.toLowerCase().includes(busca.toLowerCase()) ||
        a.course?.toLowerCase().includes(busca.toLowerCase())
      )
    : alunos

  return (
    <div className="p-6 max-w-3xl">
      <Link href="/professor/admin" className="text-sm text-gray-400 hover:text-navy flex items-center gap-1 mb-6">
        ← Voltar
      </Link>

      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-navy">Alunos</h1>
        <p className="text-gray-400 mt-1">
          {alunos.length} aluno{alunos.length !== 1 ? 's' : ''} cadastrado{alunos.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por nome, e-mail ou curso..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-navy text-sm outline-none focus:border-teal transition-all"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {alunosFiltrados.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">Nenhum aluno encontrado.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {alunosFiltrados.map(a => (
              <Link key={a.id} href={`/professor/admin/alunos/${a.id}`}>
                <div className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-navy to-teal flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-semibold">
                        {(a.nome ?? '').split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-navy text-sm">{a.nome}</p>
                      <p className="text-xs text-gray-400">{a.course ?? a.email}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-300" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
