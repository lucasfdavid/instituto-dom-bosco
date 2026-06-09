'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Mail, Send } from 'lucide-react'
import Link from 'next/link'

export default function ConvidarProfessor() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState('')

  async function handleConvidar(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    const response = await fetch(
      `https://wttnzuqfnjxgswntbegs.supabase.co/functions/v1/convidar-professor`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ email }),
      }
    )

    const data = await response.json()

    if (!response.ok || data.error) {
      setErro(data.error ?? 'Erro ao enviar convite.')
      setLoading(false)
      return
    }

    setSucesso(true)
    setLoading(false)
    setEmail('')
  }

  return (
    <div className="p-6 max-w-xl">
      <Link href="/professor/configuracoes" className="text-sm text-gray-400 hover:text-navy flex items-center gap-1 mb-6">
        ← Voltar para configurações
      </Link>

      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-navy">Convidar professor</h1>
        <p className="text-gray-400 mt-1">O convidado receberá um e-mail para criar sua conta como professor</p>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        {sucesso && (
          <div className="bg-teal-light border border-teal/20 rounded-xl p-4 text-center mb-5">
            <p className="text-teal font-semibold">✅ Convite enviado com sucesso!</p>
            <p className="text-sm text-gray-400 mt-1">O professor receberá um e-mail com o link de acesso.</p>
          </div>
        )}

        <form onSubmit={handleConvidar} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold text-navy mb-2">E-mail do professor</label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="professor@email.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-navy text-sm outline-none focus:border-teal focus:bg-white transition-all"
              />
            </div>
          </div>

          {erro && <p className="text-sm text-red-500 text-center">{erro}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-navy to-teal text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Send size={16} />
            {loading ? 'Enviando...' : 'Enviar convite'}
          </button>
        </form>
      </div>
    </div>
  )
}
