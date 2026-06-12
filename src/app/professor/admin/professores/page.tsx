'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { UserPlus, Trash2 } from 'lucide-react'

export default function AdminProfessores() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [professores, setProfessores] = useState<any[]>([])

  async function loadProfessores() {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth/login'); return }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, nome, email')
      .eq('role', 'professor')
      .order('nome')

    if (error) console.error('Erro ao carregar professores:', error.message)

    setProfessores(data ?? [])
    setLoading(false)
  }

  async function excluirProfessor(id: string, nome: string) {
    if (!confirm(`Excluir o professor "${nome}"? Esta ação não pode ser desfeita.`)) return

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    const response = await fetch('/api/excluir-usuario', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ userId: id }),
    })

    if (response.ok) {
      await loadProfessores()
    } else {
      const data = await response.json()
      alert(data.error ?? 'Erro ao excluir professor.')
    }
  }

  useEffect(() => { loadProfessores() }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400 font-condensed tracking-widest">Carregando...</p>
    </div>
  )

  return (
    <div className="p-6 max-w-3xl">
      <Link href="/professor/admin" className="text-sm text-gray-400 hover:text-navy flex items-center gap-1 mb-6">
        ← Voltar
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-navy">Professores</h1>
          <p className="text-gray-400 mt-1">
            {professores.length} professor{professores.length !== 1 ? 'es' : ''} cadastrado{professores.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/professor/admin/professores/convidar"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-navy to-teal text-white text-sm font-semibold"
        >
          <UserPlus size={16} /> Convidar
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {professores.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">Nenhum professor cadastrado.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {professores.map(p => (
              <div key={p.id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-navy to-teal flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-semibold">
                      {(p.nome ?? '').split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-navy text-sm">{p.nome}</p>
                    <p className="text-xs text-gray-400">{p.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => excluirProfessor(p.id, p.nome)}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                  title="Excluir professor"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
