'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Save, CheckCircle2 } from 'lucide-react'

export default function AlunosConfigPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [alunos, setAlunos] = useState<any[]>([])
  const [enrollDates, setEnrollDates] = useState<Record<string, string>>({})
  const [salvando, setSalvando] = useState<Record<string, boolean>>({})
  const [salvo, setSalvo] = useState<Record<string, boolean>>({})
  const [erros, setErros] = useState<Record<string, string>>({})

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth/login'); return }

      const { data } = await supabase
        .from('profiles')
        .select('id, nome, email, course, enroll_date')
        .eq('role', 'aluno')
        .order('nome')

      setAlunos(data ?? [])
      const datas: Record<string, string> = {}
      ;(data ?? []).forEach((a: any) => { datas[a.id] = a.enroll_date ?? '' })
      setEnrollDates(datas)
      setLoading(false)
    }
    load()
  }, [])

  async function salvarData(alunoId: string) {
    setSalvando(s => ({ ...s, [alunoId]: true }))
    setErros(e => ({ ...e, [alunoId]: '' }))
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ enroll_date: enrollDates[alunoId] || null })
      .eq('id', alunoId)

    if (error) {
      setErros(e => ({ ...e, [alunoId]: error.message }))
    } else {
      setSalvo(s => ({ ...s, [alunoId]: true }))
      setTimeout(() => setSalvo(s => ({ ...s, [alunoId]: false })), 2500)
    }
    setSalvando(s => ({ ...s, [alunoId]: false }))
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400 font-condensed tracking-widest">Carregando...</p>
    </div>
  )

  return (
    <div className="p-6 max-w-2xl">
      <Link href="/professor/configuracoes" className="text-sm text-gray-400 hover:text-navy flex items-center gap-1 mb-6">
        ← Voltar para configurações
      </Link>

      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-navy">Alunos</h1>
        <p className="text-gray-400 mt-1">Edite a data de matrícula de cada aluno</p>
      </div>

      {alunos.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 border border-gray-200 text-center">
          <p className="text-3xl mb-3">👥</p>
          <p className="text-sm text-gray-400">Nenhum aluno cadastrado ainda.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {alunos.map(aluno => (
            <div key={aluno.id} className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-navy to-teal flex items-center justify-center shrink-0">
                  <span className="text-white text-xs font-semibold">
                    {aluno.nome?.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-navy text-sm">{aluno.nome}</p>
                  <p className="text-xs text-gray-400 truncate">{aluno.course || aluno.email}</p>
                </div>
              </div>

              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-navy mb-1.5">Data de matrícula</label>
                  <input
                    type="date"
                    value={enrollDates[aluno.id] ?? ''}
                    onChange={e => setEnrollDates(d => ({ ...d, [aluno.id]: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-navy text-sm outline-none focus:border-teal focus:bg-white transition-all"
                  />
                </div>
                <button
                  onClick={() => salvarData(aluno.id)}
                  disabled={salvando[aluno.id]}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-navy to-teal text-white text-sm font-semibold disabled:opacity-60 shrink-0"
                >
                  {salvo[aluno.id]
                    ? <><CheckCircle2 size={15} /> Salvo!</>
                    : <><Save size={15} /> {salvando[aluno.id] ? 'Salvando...' : 'Salvar'}</>
                  }
                </button>
              </div>
              {erros[aluno.id] && (
                <p className="text-xs text-red-500 mt-1.5">{erros[aluno.id]}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
