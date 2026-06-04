'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
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
    console.log('Login result:', data, authError)

    if (authError) {
      setError('E-mail ou senha inválidos.')
      setLoading(false)
      return
    }

  window.location.href = '/aluno'
  }

  return (
    <div className="min-h-screen flex flex-col bg-navy">
      {/* Hero com logo */}
      <div className="flex flex-col items-center justify-center px-8 pt-14 pb-10">
        {/* Logo real vai aqui — coloque o arquivo em /public/images/logo.png */}
        <img
          src="/images/logo.png"
          alt="Instituto Dom Bosco"
          className="h-32 w-auto mb-6 object-contain"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        {/* Fallback tipográfico enquanto a logo não está no projeto */}
        <div className="text-center" id="logo-text">
          <p className="font-condensed text-xs tracking-widest text-teal uppercase mb-1">Instituto</p>
          <h1 className="font-serif text-5xl font-bold text-white leading-none">Dom</h1>
          <h1 className="font-serif text-5xl font-normal text-teal leading-none">Bosco</h1>
          <p className="font-condensed text-xs tracking-widest text-white/40 uppercase mt-2">
            Psicologia e Aprendizagem
          </p>
        </div>
      </div>

      {/* Formulário */}
      <div className="flex-1 bg-white rounded-t-3xl px-7 pt-8 pb-10">
        <h2 className="font-serif text-2xl text-navy mb-1">Bem-vindo</h2>
        <p className="text-sm text-navy/50 mb-7">Acesse sua conta para continuar</p>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-navy/50 uppercase tracking-wider mb-2">
              E-mail
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-navy text-base outline-none focus:border-teal transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy/50 uppercase tracking-wider mb-2">
              Senha
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-navy text-base outline-none focus:border-teal transition-colors"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-4 rounded-full bg-navy text-white font-condensed font-semibold text-sm uppercase tracking-widest disabled:opacity-60 transition-opacity"
          >
            {loading ? 'Entrando...' : 'Entrar →'}
          </button>
        </form>
      </div>
    </div>
  )
}
