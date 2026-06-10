'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Save, GraduationCap } from 'lucide-react'
import { DateSelect } from '@/components/DateSelect'

export default function PerfilPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState('')
  const [initials, setInitials] = useState('')
  const [cursos, setCursos] = useState<any[]>([])
  const [form, setForm] = useState({
    nome: '',
    email: '',
    phone: '',
    course: '',
    enroll_date: '',
    birth_date: '',
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth/login'); return }

      const [{ data: profile }, { data: cursosData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', session.user.id).single(),
        supabase.from('cursos').select('*').eq('ativo', true).order('categoria').order('nome'),
      ])

      if (profile) {
        setForm({
          nome: profile.nome ?? '',
          email: profile.email ?? '',
          phone: profile.phone ?? '',
          course: profile.course ?? '',
          enroll_date: profile.enroll_date ?? '',
          birth_date: profile.birth_date ?? '',
        })
        setInitials((profile.nome ?? '').split(' ').map((x: string) => x[0]).slice(0, 2).join(''))
      }
      setCursos(cursosData ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setErro('')
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { error } = await supabase.from('profiles').update({
      nome: form.nome,
      phone: form.phone,
      course: form.course,
      birth_date: form.birth_date || null,
    }).eq('id', session.user.id)

    if (error) {
      setErro('Erro ao salvar: ' + error.message)
    } else {
      setSucesso(true)
      setInitials(form.nome.split(' ').map((x: string) => x[0]).slice(0, 2).join(''))
      setTimeout(() => setSucesso(false), 3000)
    }
    setSaving(false)
  }

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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400 font-condensed tracking-widest">Carregando...</p>
    </div>
  )

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-navy">Meu perfil</h1>
        <p className="text-gray-400 mt-1">Gerencie suas informações pessoais</p>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-navy to-teal flex items-center justify-center">
            <span className="text-white text-xl font-semibold">{initials}</span>
          </div>
          <div>
            <p className="font-serif text-xl font-semibold text-navy">{form.nome}</p>
            <p className="text-sm text-gray-400">
              Aluno · {form.enroll_date ? `Matriculado em ${form.enroll_date}` : 'Sem data de matrícula'}
            </p>
          </div>
        </div>

        {sucesso && (
          <div className="bg-teal-light border border-teal/20 rounded-xl p-3 text-center mb-4">
            <p className="text-teal text-sm font-semibold">✅ Perfil atualizado com sucesso!</p>
          </div>
        )}
        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center mb-4">
            <p className="text-red-600 text-sm font-semibold">{erro}</p>
          </div>
        )}

        <form onSubmit={handleSalvar} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Nome completo</label>
            <input
              type="text"
              value={form.nome}
              onChange={e => setForm({ ...form, nome: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-navy text-sm outline-none focus:border-teal focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy mb-2">E-mail</label>
            <input
              type="email"
              value={form.email}
              disabled
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-400 text-sm cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Telefone</label>
            <input
              type="text"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              placeholder="(62) 99999-9999"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-navy text-sm outline-none focus:border-teal focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Data de nascimento</label>
            <DateSelect
              value={form.birth_date}
              onChange={v => setForm({ ...form, birth_date: v })}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Curso / Turma</label>
            <div className="relative">
              <GraduationCap size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={form.course}
                onChange={e => setForm({ ...form, course: e.target.value })}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-navy text-sm outline-none focus:border-teal focus:bg-white transition-all appearance-none"
              >
                <option value="">Selecione seu curso/turma</option>
                {Object.entries(cursosPorCategoria).map(([cat, lista]) =>
                  lista.length > 0 && (
                    <optgroup key={cat} label={categoriaLabel[cat]}>
                      {lista.map((c: any) => (
                        <option key={c.id} value={c.nome}>{c.nome}</option>
                      ))}
                    </optgroup>
                  )
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy mb-2">
              Data de matrícula
              <span className="ml-2 text-xs font-normal text-gray-400">(definida pelo professor)</span>
            </label>
            <input
              type="text"
              value={form.enroll_date || 'Não informada'}
              disabled
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-400 text-sm cursor-not-allowed"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-navy to-teal text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
          >
            <Save size={18} />
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </form>
      </div>
    </div>
  )
}
