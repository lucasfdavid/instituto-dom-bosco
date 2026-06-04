import { clsx, type ClassValue } from 'clsx'
import { addDays, format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function calcularRevisoes(dataEstudo: string) {
  const base = parseISO(dataEstudo)
  return {
    D1: format(addDays(base, 1), 'yyyy-MM-dd'),
    D7: format(addDays(base, 7), 'yyyy-MM-dd'),
    D30: format(addDays(base, 30), 'yyyy-MM-dd'),
  }
}

export function formatarData(iso: string) {
  return format(parseISO(iso), "dd 'de' MMMM", { locale: ptBR })
}

export function formatarDataCurta(iso: string) {
  return format(parseISO(iso), 'dd/MM', { locale: ptBR })
}

export function hoje() {
  return format(new Date(), 'yyyy-MM-dd')
}
