'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { PlusCircle, Trash2, BookOpen } from 'lucide-react'

const CATEGORIAS = [
  { value: 'fundamental', label: 'Ensino Fundamental' },
  { value: 'medio', label: 'Ensino Médio' },
  { value: 'graduacao', label: 'Graduação' },
]

export default function AdminCursos() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [cursos, setCursos] = useState<any[]>([])
  const [nome, setNome] = useState('')
  const [categoria, setCategoria] = useState('fundamental')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  async function loadCursos() {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth/login'); return }
    const { data } = await supabase.from('cursos').select('*').order('categoria').order('nome')
    setCursos(data ?? [])
    setLoading(false)
  }

  useEffect(() => { loadCursos() }, [])

  async function handleAdicionar(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return
    setSalvando(true)
    setErro('')
    const supabase = createClient()
    const { error } = await supabase.from('cursos').insert({ nome: nome.trim(), categoria, ativo: true })
    if (error) { setErro('Erro ao adicionar curso.') } else { setNome(''); await loadCursos() }
    setSalvando(false)
  }

  async function toggleAtivo(id: string, ativo: boolean) {
    const supabase = createClient()
    await supabase.from('cursos').update({ ativo: !ativo }).eq('id', id)
    await loadCursos()
  }

  async function handleExcluir(id: string) {
    if (!confirm('Tem certeza que deseja excluir este curso?')) return
    const supabase = createClient()
    await supabase.from('cursos').delete().eq('id', id)
    await loadCursos()
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400 font-condensed tracking-widest">Carregando...</p>
    </div>
  )

  const cursosPorCategoria = CATEGORIAS.map(cat => ({
    ...cat,
    lista: cursos.filter(c => c.categoria === cat.value),
  }))

  return (
    <div className="p-6 max-w-3xl">
      <Link href="/professor/admin" className="text-sm text-gray-400 hover:text-navy flex items-center gap-1 mb-6">
        ← Voltar
      </Link>

      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-navy">Gerenciar cursos</h1>
        <p className="text-gray-400 mt-1">Adicione ou remova cursos disponíveis para os alunos</p>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm mb-6">
        <h2 className="font-serif text-lg font-semibold text-navy mb-4">Adicionar novo curso</h2>
        <form onSubmit={handleAdicionar} className="flex flex-col gap-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-navy mb-2">Nome do curso</label>
              <input type="text" value={nome} onChange={e => setNome(e.target.value)}
                placeholder="Ex: Cursinho Intensivo 2026"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-navy text-sm outline-none focus:border-teal focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy mb-2">Categoria</label>
              <select value={categoria} onChange={e => setCategoria(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-navy text-sm outline-none focus:border-teal focus:bg-white transition-all">
                {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          {erro && <p className="text-sm text-red-500">{erro}</p>}
          <button type="submit" disabled={salvando || !nome.trim()}
            className="flex items-center justify-center gap-2 w-full md:w-auto md:self-end px-6 py-3 rounded-xl bg-gradient-to-r from-navy to-teal text-white font-semibold text-sm disabled:opacity-60">
            <PlusCircle size={16} />
            {salvando ? 'Adicionando...' : 'Adicionar curso'}
          </button>
        </form>
      </div>

      <div className="flex flex-col gap-4">
        {cursosPorCategoria.map(({ value, label, lista }) => (
          <div key={value} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50">
              <BookOpen size={16} className="text-teal" />
              <h3 className="font-serif text-base font-semibold text-navy">{label}</h3>
              <span className="ml-auto font-condensed text-xs text-gray-400">{lista.length} curso{lista.length !== 1 ? 's' : ''}</span>
            </div>
            {lista.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Nenhum curso nesta categoria.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {lista.map((curso: any) => (
                  <div key={curso.id} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${curso.ativo ? 'bg-teal' : 'bg-gray-300'}`} />
                      <span className={`text-sm font-medium ${curso.ativo ? 'text-navy' : 'text-gray-400 line-through'}`}>{curso.nome}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleAtivo(curso.id, curso.ativo)}
                        className={`font-condensed text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${curso.ativo ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' : 'bg-teal-light text-teal hover:bg-teal/20'}`}>
                        {curso.ativo ? 'Desativar' : 'Ativar'}
                      </button>
                      <button onClick={() => handleExcluir(curso.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
