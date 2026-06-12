'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Save, CheckCircle2, User, Mail, Phone, GraduationCap, Calendar, Trash2 } from 'lucide-react'

const CATEGORIAS = [
  { value: 'fundamental', label: 'Ensino Fundamental' },
  { value: 'medio', label: 'Ensino Médio' },
  { value: 'graduacao', label: 'Graduação' },
]

export default function AdminAlunoDetalhe({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [erro, setErro] = useState('')
  const [cursos, setCursos] = useState<any[]>([])

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [course, setCourse] = useState('')
  const [enrollDate, setEnrollDate] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth/login'); return }

      const [{ data: profile }, { data: cursosData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', params.id).single(),
        supabase.from('cursos').select('*').eq('ativo', true).order('categoria').order('nome'),
      ])

      if (!profile) { router.push('/admin/alunos'); return }

      setNome(profile.nome ?? '')
      setEmail(profile.email ?? '')
      setPhone(profile.phone ?? '')
      setCourse(profile.course ?? '')
      setEnrollDate(profile.enroll_date ?? '')
      setCursos(cursosData ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleExcluir() {
    if (!confirm('Excluir este aluno? Todos os conteúdos e revisões serão removidos. Esta ação não pode ser desfeita.')) return
    const supabase = createClient()
    const { error } = await supabase.from('profiles').delete().eq('id', params.id)
    if (error) {
      alert('Erro ao excluir: ' + error.message)
    } else {
      router.push('/admin/alunos')
    }
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setErro('')
    setSalvo(false)

    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({
        nome: nome.trim(),
        email: email.trim(),
        phone: phone.trim(),
        course: course || null,
        enroll_date: enrollDate || null,
      })
      .eq('id', params.id)

    if (error) {
      setErro(error.message)
    } else {
      setSalvo(true)
      setTimeout(() => setSalvo(false), 2500)
    }
    setSalvando(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400 font-condensed tracking-widest">Carregando...</p>
    </div>
  )

  const cursosPorCategoria = {
    fundamental: cursos.filter(c => c.categoria === 'fundamental'),
    medio: cursos.filter(c => c.categoria === 'medio'),
    graduacao: cursos.filter(c => c.categoria === 'graduacao'),
  }

  const categoriaLabel: Record<string, string> = {
    fundamental: 'Ensino Fundamental',
    medio: 'Ensino Médio',
    graduacao: 'Graduação',
  }

  return (
    <div className="p-6 max-w-xl">
      <div className="flex items-center justify-between mb-6">
        <Link href="/admin/alunos" className="text-sm text-gray-400 hover:text-navy flex items-center gap-1">
          ← Voltar para alunos
        </Link>
        <button
          onClick={handleExcluir}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-red-500 hover:bg-red-50 text-sm font-medium transition-colors"
        >
          <Trash2 size={15} /> Excluir aluno
        </button>
      </div>

      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-navy">Editar aluno</h1>
        <p className="text-gray-400 mt-1">Dados administrativos do aluno</p>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <form onSubmit={handleSalvar} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Nome completo</label>
            <div className="relative">
              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                required
                value={nome}
                onChange={e => setNome(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-navy text-sm outline-none focus:border-teal focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy mb-2">E-mail</label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-navy text-sm outline-none focus:border-teal focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Telefone</label>
            <div className="relative">
              <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="(62) 99999-9999"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-navy text-sm outline-none focus:border-teal focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Curso / Turma</label>
            <div className="relative">
              <GraduationCap size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={course}
                onChange={e => setCourse(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-navy text-sm outline-none focus:border-teal focus:bg-white transition-all appearance-none"
              >
                <option value="">Sem curso selecionado</option>
                {Object.entries(cursosPorCategoria).map(([cat, lista]) =>
                  lista.length > 0 && (
                    <optgroup key={cat} label={categoriaLabel[cat]}>
                      {lista.map(c => (
                        <option key={c.id} value={c.nome}>{c.nome}</option>
                      ))}
                    </optgroup>
                  )
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Data de matrícula</label>
            <div className="relative">
              <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={enrollDate}
                onChange={e => setEnrollDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-navy text-sm outline-none focus:border-teal focus:bg-white transition-all"
              />
            </div>
          </div>

          {erro && <p className="text-sm text-red-500 text-center">{erro}</p>}

          <button
            type="submit"
            disabled={salvando}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-navy to-teal text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
          >
            {salvo
              ? <><CheckCircle2 size={16} /> Salvo com sucesso!</>
              : <><Save size={16} /> {salvando ? 'Salvando...' : 'Salvar alterações'}</>
            }
          </button>
        </form>
      </div>
    </div>
  )
}
