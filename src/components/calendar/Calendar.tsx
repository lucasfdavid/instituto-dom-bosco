'use client'

import { useState } from 'react'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, isSameDay, isToday, parseISO, addMonths, subMonths
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Revisao } from '@/lib/types'

interface CalendarProps {
  revisoes: Revisao[]
  onDaySelect?: (date: Date) => void
}

const DOW = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function Calendar({ revisoes, onDaySelect }: CalendarProps) {
  const [current, setCurrent] = useState(new Date())
  const [selected, setSelected] = useState<Date | null>(new Date())

  const start = startOfMonth(current)
  const end = endOfMonth(current)
  const days = eachDayOfInterval({ start, end })
  const offset = getDay(start)

  const datesWithRev = revisoes.map(r => r.data_revisao)

  function hasRev(date: Date) {
    return datesWithRev.some(d => isSameDay(parseISO(d), date))
  }

  function handleSelect(date: Date) {
    setSelected(date)
    onDaySelect?.(date)
  }

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrent(subMonths(current, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-navy"
        >
          <ChevronLeft size={16} />
        </button>
        <h2 className="font-serif text-lg font-semibold text-navy capitalize">
          {format(current, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        <button
          onClick={() => setCurrent(addMonths(current, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-navy"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 mb-1">
        {DOW.map(d => (
          <div key={d} className="text-center font-condensed text-[10px] uppercase tracking-wide text-gray-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
        {days.map(date => (
          <button
            key={date.toISOString()}
            onClick={() => handleSelect(date)}
            className={cn(
              'aspect-square flex items-center justify-center rounded-lg text-sm relative transition-all',
              isToday(date) && 'bg-navy text-white font-semibold',
              !isToday(date) && selected && isSameDay(date, selected) && 'bg-teal/20 text-navy font-medium',
              !isToday(date) && !(selected && isSameDay(date, selected)) && 'hover:bg-teal-light text-navy'
            )}
          >
            {format(date, 'd')}
            {hasRev(date) && (
              <span className={cn(
                'absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full',
                isToday(date) ? 'bg-teal' : 'bg-teal'
              )} />
            )}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-4 justify-center mt-3">
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
          <span className="w-2 h-2 rounded-full bg-teal inline-block" /> Revisão
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
          <span className="w-2 h-2 rounded-full bg-navy inline-block" /> Hoje
        </div>
      </div>
    </div>
  )
}
