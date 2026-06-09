'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Lock, Mail } from 'lucide-react'

export default function ConfirmarPage() {
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [pronto, setPronto] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    
    // Processa o token da URL
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setEmail(session.user.email ?? '')
        setPronto(true)
      }
    })

    // Verifica sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setEmail(session.user.email ?? '')
        setPronto(true)
      }
    })
  }, [])

  async function handleDefinirSenha(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    if (senha !== confirmar) {
      setErro('As senhas não coincidem.')
      return
    }
    if (senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase.auth.updateUser({ password: senha })

    if (error) {
      setErro(error.message)
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user!.id)
      .single()

    if (profile?.role === 'professor') {
      window.location.href = '/professor'
    } else {
      window.location.href = '/aluno'
    }
  }

  if (!pronto) return (
    <div className="min-h-screen bg-gradient-to-br from-navy to-teal flex items-center justify-center">
      <p className="text-white font-condensed tracking-widest">Verificando convite...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8">
        <div className="mb-6 flex justify-center">
          <img src="/images/logo-azul.png" alt="Instituto Dom Bosco" className="h-16 w-auto object-contain" />
        </div>

        <h2 className="font-serif text-2xl font-bold text-navy mb-1 text-center">Bem-vindo ao Instituto!</h2>
        <p className="text-sm text-gray-400 mb-6 text-center">Defina sua senha para acessar sua conta.</p>

        <form onSubmit={handleDefinirSenha} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold text-navy mb-2">E-mail</label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                disabled
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-400 text-sm cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Criar senha</label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-navy text-sm outline-none focus:border-teal focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Confirmar senha</label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required
                value={confirmar}
                onChange={e => setConfirmar(e.target.value)}
                placeholder="Repita a senha"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-navy text-sm outline-none focus:border-teal focus:bg-white transition-all"
              />
            </div>
          </div>

          {erro && <p className="text-sm text-red-500 text-center">{erro}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-navy to-teal text-white font-semibold text-sm disabled:opacity-60 mt-2"
          >
            {loading ? 'Salvando...' : 'Definir senha e entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
