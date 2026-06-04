'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Topbar } from '@/components/ui/Topbar'
import { BottomNav } from '@/components/ui/BottomNav'
import { formatarDataCurta, cn } from '@/lib/utils'

export default function AlunoHistorico() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [conteudos, setConteudos] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth/login'); return }
      const { data } = await supabase
        .from('conteudos')
        .select('*, revisoes(*)')
        .eq('aluno_id', session.user.id)
        .order('data_estudo', { ascending: false })
      setConteudos(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-navy flex items-center justify-center">
      <p className="text-white font-condensed tracking-widest">Carregando...</p>
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar subtitulo="Historico" />
      <div className="flex-1 overflow-y-auto px-5 py-5">
        <p className="font-condensed text-xs font-semibold uppercase tracking-widest text-gray-400 pb-3">
          {conteudos.length} conteudos registrados
        </p>
        <div className="flex flex-col gap-2.5">
          {conteudos.map(c => {
            const revs: any[] = c.revisoes ?? []
            return (
              <div key={c.id} className="bg-white rounded-2xl p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-condensed text-xs font-bold px-2.5 py-1 rounded-full bg-teal text-white uppercase tracking-wide">
                    {c.materia}
                  </span>
                  <span className="text-xs text-gray-400">{formatarDataCurta(c.data_estudo)}</span>
                </div>
                <p className="font-serif text-base font-semibold text-navy mb-2.5">{c.assunto}</p>
                <div className="flex gap-1.5 flex-wrap">
                  {(['D1', 'D7', 'D30'] as const).map(tipo => {
                    const r = revs.find((rv: any) => rv.tipo === tipo)
                    const done = r?.concluida
                    return (
                      <span key={tipo} className={cn(
                        'font-condensed text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide',
                        done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      )}>
                        {tipo} {done ? 'feito' : r ? formatarDataCurta(r.data_revisao) : ''}
                      </span>
                    )
                  })}
                </div>
              </div>
            )
          })}
          {conteudos.length === 0 && (
            <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center">
              <p className="text-3xl mb-3">📚</p>
              <p className="text-sm text-gray-400">Nenhum conteudo registrado ainda.</p>
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
