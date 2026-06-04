'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Topbar } from '@/components/ui/Topbar'
import { calcularRevisoes } from '@/lib/utils'
import { format, addDays, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const MATERIAS = [
  'Matemática', 'Português', 'Redação', 'Biologia', 'Química',
  'Física', 'História', 'Geografia', 'Filosofia', 'Sociologia',
  'Inglês', 'Literatura', 'Outra',
]

export default function RegistrarPage() {
  const router = useRouter()
  const [materia, setMateria] = useState('Matemática')
  const [assunto, setAssunto] = useState('')
  const [dataEstudo, setDataEstudo] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [loading, setLoading] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  const revisoes = dataEstudo ? calcularRevisoes(dataEstudo) : null

  function fmtPreview(iso: string) {
    return format(parseISO(iso), "dd 'de' MMM", { locale: ptBR })
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    if (!assunto.trim()) return
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // 1. Salva conteúdo
    const { data: conteudo, error } = await supabase
      .from('conteudos')
      .insert({ aluno_id: user!.id, materia, assunto, data_estudo: dataEstudo })
      .select()
      .single()

    if (error || !conteudo) { setLoading(false); return }

    // 2. Cria as 3 revisões
    const datas = calcularRevisoes(dataEstudo)
    await supabase.from('revisoes').insert([
      { conteudo_id: conteudo.id, aluno_id: user!.id, tipo: 'D1', data_revisao: datas.D1 },
      { conteudo_id: conteudo.id, aluno_id: user!.id, tipo: 'D7', data_revisao: datas.D7 },
      { conteudo_id: conteudo.id, aluno_id: user!.id, tipo: 'D30', data_revisao: datas.D30 },
    ])

    setSucesso(true)
    setLoading(false)
    setTimeout(() => router.push('/aluno'), 1500)
  }

  return (
    <div>
      <Topbar subtitulo="Registrar estudo" />
      <div className="px-5 py-5">
        {sucesso && (
          <div className="bg-done-bg border border-done/20 rounded-2xl p-4 text-center mb-4">
            <p className="text-done font-semibold">✅ Revisões agendadas!</p>
          </div>
        )}

        <form onSubmit={handleSalvar} className="bg-white rounded-2xl p-5 border border-gray-200 flex flex-col gap-4">
          {/* Matéria */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Matéria
            </label>
            <select
              value={materia}
              onChange={e => setMateria(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-navy text-sm outline-none focus:border-teal"
            >
              {MATERIAS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>

          {/* Assunto */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Assunto estudado
            </label>
            <input
              type="text"
              required
              value={assunto}
              onChange={e => setAssunto(e.target.value)}
              placeholder="Ex: Equações do 2º grau"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-navy text-sm outline-none focus:border-teal"
            />
          </div>

          {/* Data */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Data do estudo
            </label>
            <input
              type="date"
              value={dataEstudo}
              onChange={e => setDataEstudo(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-navy text-sm outline-none focus:border-teal"
            />
          </div>

          {/* Preview das revisões */}
          {revisoes && (
            <div className="bg-navy rounded-xl p-4">
              <p className="font-condensed text-[10px] uppercase tracking-widest text-teal font-bold mb-3">
                Ciclo D1 · D7 · D30
              </p>
              {([
                { tipo: 'D1', label: '🔵 D1 — Revisão ativa', data: revisoes.D1 },
                { tipo: 'D7', label: '🟣 D7 — Exercícios rápidos', data: revisoes.D7 },
                { tipo: 'D30', label: '🔴 D30 — Flashcards', data: revisoes.D30 },
              ]).map(({ label, data }) => (
                <div key={label} className="flex justify-between items-center mb-2 last:mb-0">
                  <span className="text-white/70 text-sm">{label}</span>
                  <span className="font-condensed font-semibold text-teal text-sm">{fmtPreview(data)}</span>
                </div>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || sucesso}
            className="w-full py-4 rounded-full bg-navy text-white font-condensed font-semibold text-sm uppercase tracking-widest disabled:opacity-60"
          >
            {loading ? 'Salvando...' : 'Agendar revisões →'}
          </button>
        </form>
      </div>
    </div>
  )
}
