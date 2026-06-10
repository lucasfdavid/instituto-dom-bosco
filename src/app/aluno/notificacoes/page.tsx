'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Bell, Check, CheckCheck, MessageSquare, CalendarCheck } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function NotificacoesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [notifs, setNotifs] = useState<any[]>([])

  async function load() {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth/login'); return }

    const { data } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('user_id', session.user.id)
      .order('criado_em', { ascending: false })
      .limit(50)

    setNotifs(data ?? [])
    setLoading(false)

    // Marca todas como lidas
    await supabase
      .from('notificacoes')
      .update({ lida: true })
      .eq('user_id', session.user.id)
      .eq('lida', false)
  }

  useEffect(() => { load() }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400 font-condensed tracking-widest">Carregando...</p>
    </div>
  )

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-navy">Notificações</h1>
        <p className="text-gray-400 mt-1">Seus avisos e lembretes recentes</p>
      </div>

      {notifs.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 border border-gray-200 text-center">
          <Bell size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Nenhuma notificação ainda.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notifs.map(n => (
            <div
              key={n.id}
              className={`bg-white rounded-2xl p-4 border shadow-sm flex items-start gap-3 transition-all ${
                n.lida ? 'border-gray-200 opacity-70' : 'border-teal/30 bg-teal-light/30'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                n.tipo === 'novo_comentario' ? 'bg-teal/10' : 'bg-navy/10'
              }`}>
                {n.tipo === 'novo_comentario'
                  ? <MessageSquare size={16} className="text-teal" />
                  : <CalendarCheck size={16} className="text-navy" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-navy font-medium leading-snug">{n.mensagem}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {format(parseISO(n.criado_em), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
              {!n.lida && (
                <div className="w-2 h-2 rounded-full bg-teal shrink-0 mt-1.5" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
