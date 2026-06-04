'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AlunoHome() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [nome, setNome] = useState('')

  useEffect(() => {
    async function checkSession() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/auth/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('nome')
        .eq('id', session.user.id)
        .single()

      setNome(profile?.nome?.split(' ')[0] ?? 'Aluno')
      setLoading(false)
    }

    checkSession()
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-navy flex items-center justify-center">
      <p className="text-white font-condensed tracking-widest">Carregando...</p>
    </div>
  )

  return (
    <div>
      <div className="bg-navy px-5 pt-5 pb-7">
        <p className="font-condensed text-xs uppercase tracking-widest text-teal font-semibold mb-1">
          Olá, {nome} 👋
        </p>
        <h1 className="font-serif text-2xl font-semibold text-white mb-1">Bom estudo hoje!</h1>
      </div>
      <div className="px-5 py-5">
        <p className="text-gray-500 text-sm">Suas revisões aparecerão aqui.</p>
      </div>
    </div>
  )
}
