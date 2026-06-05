'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Save } from 'lucide-react'

export default function PerfilPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [initials, setInitials] = useState('')
  const [form, setForm] = useState({
    nome: '',
    email: '',
    phone: '',
    course: '',
    enroll_date: '',
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profile) {
        setForm({
          nome: profile.nome ?? '',
          email: profile.email ?? '',
          phone: profile.phone ?? '',
          course: profile.course ?? '',
          enroll_date: profile.enroll_date ?? '',
        })
        setInitials((profile.nome ?? '').split(' ').map((x: string) => x[0]).slice(0, 2).join(''))
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    await supabase.from('profiles').update({
      nome: form.nome,
      phone: form.phone,
      course: form.course,
      enroll_date: form.enroll_date || null,
    }).eq('id', session.user.id)

    setSucesso(true)
    setSaving(false)
    setTimeout(() => setSucesso(false), 3000)
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
            <p className="text-sm text-gray-400">Aluno · {form.enroll_date ? `Matriculado em ${form.enroll_date}` : 'Sem data de matrícula'}</p>
          </div>
        </div>

        {sucesso && (
          <div className="bg-teal-light border border-teal/20 rounded-xl p-3 text-center mb-4">
            <p className="text-teal text-sm font-semibold">✅ Perfil atualizado com sucesso!</p>
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
            <label className="block text-sm font-semibold text-navy mb-2">Curso / Turma</label>
            <input
              type="text"
              value={form.course}
              onChange={e => setForm({ ...form, course: e.target.value })}
              placeholder="Ex: Pré-Vestibular 2026"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-navy text-sm outline-none focus:border-teal focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Data de matrícula</label>
            <input
              type="date"
              value={form.enroll_date}
              onChange={e => setForm({ ...form, enroll_date: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-navy text-sm outline-none focus:border-teal focus:bg-white transition-all"
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
