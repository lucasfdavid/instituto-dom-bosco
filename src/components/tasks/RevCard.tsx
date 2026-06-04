'use client'

import { useState } from 'react'
import { cn, formatarDataCurta } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { Revisao } from '@/lib/types'

const badgeStyles = {
  D1: 'bg-d1-bg text-d1',
  D7: 'bg-d7-bg text-d7',
  D30: 'bg-d30-bg text-d30',
}

const badgeLabels = {
  D1: 'D1 · Revisão ativa',
  D7: 'D7 · Exercícios',
  D30: 'D30 · Flashcards',
}

interface RevCardProps {
  revisao: Revisao
  onConcluida?: () => void
}

export function RevCard({ revisao, onConcluida }: RevCardProps) {
  const [concluida, setConcluida] = useState(revisao.concluida)
  const [loading, setLoading] = useState(false)

  async function marcarFeito() {
    setLoading(true)
    const supabase = createClient()
    await supabase
      .from('revisoes')
      .update({ concluida: true, concluida_em: new Date().toISOString() })
      .eq('id', revisao.id)
    setConcluida(true)
    setLoading(false)
    onConcluida?.()
  }

  return (
    <div className={cn(
      'bg-white rounded-2xl p-4 border border-gray-200 transition-all',
      concluida && 'opacity-70'
    )}>
      <div className="flex items-center justify-between mb-2.5">
        <span className={cn(
          'font-condensed text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide',
          concluida ? 'bg-done-bg text-done' : badgeStyles[revisao.tipo]
        )}>
          {concluida ? '✓ Concluído' : badgeLabels[revisao.tipo]}
        </span>
        <span className="text-xs text-gray-400">{revisao.conteudo?.materia}</span>
      </div>

      <p className="font-serif text-base font-semibold text-navy mb-1">
        {revisao.conteudo?.assunto}
      </p>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-400">
          {formatarDataCurta(revisao.data_revisao)}
        </span>
        {concluida ? (
          <span className="font-condensed text-xs font-bold text-done bg-done-bg px-3 py-1.5 rounded-full">
            Feito ✓
          </span>
        ) : (
          <button
            onClick={marcarFeito}
            disabled={loading}
            className="font-condensed text-xs font-bold text-white bg-teal px-4 py-1.5 rounded-full uppercase tracking-wide disabled:opacity-50"
          >
            {loading ? '...' : 'Feito ✓'}
          </button>
        )}
      </div>
    </div>
  )
}
