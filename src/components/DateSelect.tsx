'use client'

import { useMemo } from 'react'

interface DateSelectProps {
  value: string // YYYY-MM-DD or ''
  onChange: (value: string) => void
  className?: string
}

const meses = [
  { v: '01', l: 'Janeiro' }, { v: '02', l: 'Fevereiro' }, { v: '03', l: 'Março' },
  { v: '04', l: 'Abril' }, { v: '05', l: 'Maio' }, { v: '06', l: 'Junho' },
  { v: '07', l: 'Julho' }, { v: '08', l: 'Agosto' }, { v: '09', l: 'Setembro' },
  { v: '10', l: 'Outubro' }, { v: '11', l: 'Novembro' }, { v: '12', l: 'Dezembro' },
]

export function DateSelect({ value, onChange, className = '' }: DateSelectProps) {
  const [ano, mes, dia] = value ? value.split('-') : ['', '', '']

  const anos = useMemo(() => {
    const y = new Date().getFullYear()
    return Array.from({ length: 100 }, (_, i) => y - i)
  }, [])

  const diasNoMes = useMemo(() => {
    if (!mes || !ano) return 31
    return new Date(parseInt(ano), parseInt(mes), 0).getDate()
  }, [mes, ano])

  function update(novoAno: string, novoMes: string, novoDia: string) {
    if (novoAno && novoMes && novoDia) {
      const max = new Date(parseInt(novoAno), parseInt(novoMes), 0).getDate()
      const d = Math.min(parseInt(novoDia), max).toString().padStart(2, '0')
      onChange(`${novoAno}-${novoMes}-${d}`)
    } else {
      onChange('')
    }
  }

  const sel = 'flex-1 px-3 py-3 rounded-xl border border-gray-200 bg-gray-50 text-navy text-sm outline-none focus:border-teal focus:bg-white transition-all appearance-none'

  return (
    <div className={`flex gap-2 ${className}`}>
      <select value={dia} onChange={e => update(ano, mes, e.target.value)} className={sel}>
        <option value="">Dia</option>
        {Array.from({ length: diasNoMes }, (_, i) =>
          (i + 1).toString().padStart(2, '0')
        ).map(d => <option key={d} value={d}>{d}</option>)}
      </select>

      <select value={mes} onChange={e => update(ano, e.target.value, dia)} className={sel}>
        <option value="">Mês</option>
        {meses.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
      </select>

      <select value={ano} onChange={e => update(e.target.value, mes, dia)} className="flex-[2] px-3 py-3 rounded-xl border border-gray-200 bg-gray-50 text-navy text-sm outline-none focus:border-teal focus:bg-white transition-all appearance-none">
        <option value="">Ano</option>
        {anos.map(a => <option key={a} value={String(a)}>{a}</option>)}
      </select>
    </div>
  )
}
