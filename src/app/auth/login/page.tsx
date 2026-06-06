'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, GraduationCap, Mail, Lock } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<'aluno' | 'professor'>('aluno')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError || !data.user) {
      setError('E-mail ou senha inválidos.')
      setLoading(false)
      return
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profileData?.role === 'professor') {
      window.location.href = '/professor'
    } else {
      window.location.href = '/aluno'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl overflow-hidden flex">

        {/* Painel esquerdo */}
        <div className="hidden md:flex flex-col justify-between w-1/2 bg-gradient-to-br from-navy to-teal p-10 text-white">
          <div>
            {/* Logo */}
            <div className="flex items-center gap-3 mb-12">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <img
                  src="/images/logo.png"
                  alt="Logo"
                  className="w-8 h-8 object-contain"
                  onError={e => (e.currentTarget.style.display = 'none')}
                />
                <BookOpen size={22} className="text-white" />
              </div>
              <div>
                <p className="font-serif text-lg font-semibold leading-tight">Instituto Dom Bosco</p>
                <p className="font-condensed text-white/60 text-xs uppercase tracking-widest">Psicologia e Aprendizagem</p>
              </div>
            </div>

            {/* Headline */}
            <h1 className="font-serif text-4xl font-bold leading-tight mb-4">
              Estude melhor,<br />não apenas mais.
            </h1>
            <p className="text-white/70 text-sm leading-relaxed mb-10">
              Plataforma de revisão espaçada nos intervalos <strong>D+1, D+7 e D+30</strong>. Registre o que estudou hoje e receba lembretes automáticos para relembrar o conteúdo quando mais importa.
            </p>

            {/* Cards D1/D7/D30 */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'D+1', sub: '1 dia' },
                { label: 'D+7', sub: '1 semana' },
                { label: 'D+30', sub: '1 mês' },
              ].map(({ label, sub }) => (
                <div key={label} className="bg-white/15 rounded-2xl p-4 text-center border border-white/20">
                  <p className="font-serif text-2xl font-bold">{label}</p>
                  <p className="text-white/60 text-xs mt-1">{sub}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-white/40 text-xs">© 2026 Instituto Dom Bosco · Todos os direitos reservados</p>
        </div>

        {/* Painel direito — formulário */}
        <div className="flex-1 p-8 md:p-10 flex flex-col justify-center">
          {/* Logo mobile */}
          <div className="md:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy to-teal flex items-center justify-center">
              <BookOpen size={18} className="text-white" />
            </div>
            <div>
              <p className="font-serif text-base font-semibold text-navy">Instituto Dom Bosco</p>
              <p className="font-condensed text-xs text-gray-400 uppercase tracking-widest">Psicologia e Aprendizagem</p>
            </div>
          </div>

          <h2 className="font-serif text-2xl font-bold text-navy mb-1">Acessar conta</h2>
          <p className="text-sm text-gray-400 mb-6">Selecione seu perfil e entre com suas credenciais.</p>

          {/* Seletor de perfil */}
          <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setPerfil('aluno')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                perfil === 'aluno' ? 'bg-white text-navy shadow-sm' : 'text-gray-400 hover:text-navy'
              }`}
            >
              <BookOpen size={16} /> Aluno
            </button>
            <button
              type="button"
              onClick={() => setPerfil('professor')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                perfil === 'professor' ? 'bg-white text-navy shadow-sm' : 'text-gray-400 hover:text-navy'
              }`}
            >
              <GraduationCap size={16} /> Professor
            </button>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold text-navy mb-2">E-mail</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-navy text-sm outline-none focus:border-teal focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-navy mb-2">Senha</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-navy text-sm outline-none focus:border-teal focus:bg-white transition-all"
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-500 text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-navy to-teal text-white font-semibold text-sm disabled:opacity-60 transition-opacity mt-2"
            >
              {loading ? 'Entrando...' : `Entrar como ${perfil === 'aluno' ? 'aluno' : 'professor'}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
