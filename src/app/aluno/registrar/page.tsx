'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { calcularRevisoes, formatarDataCurta } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PlusCircle, Bell } from 'lucide-react'

const CATEGORIAS = [
  'Matemática', 'Português', 'Física', 'Química',
  'Biologia', 'História', 'Geografia', 'Inglês',
  'Redação', 'Filosofia', 'Sociologia', 'Outros',
]

export default function RegistrarPage() {
  const router = useRouter()
  const [categoria, setCategoria] = useState('Matemática')
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [dataEstudo, setDataEstudo] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [loading, setLoading] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  const revisoes = dataEstudo ? calcularRevisoes(dataEstudo) : null

  function fmtPreview(iso: string) {
    return format(parseISO(iso), 'dd/MM/yyyy', { locale: ptBR })
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    if (!titulo.trim()) return
    setLoading(true)

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth/login'); return }

    const { data: conteudo, error } = await supabase
      .from('conteudos')
      .insert({ aluno_id: session.user.id, materia: categoria, assunto: titulo, descricao, data_estudo: dataEstudo })
      .select().single()

    if (error || !conteudo) { setLoading(false); return }

    const datas = calcularRevisoes(dataEstudo)
    await supabase.from('revisoes').insert([
      { conteudo_id: conteudo.id, aluno_id: session.user.id, tipo: 'D1', data_revisao: datas.D1, status: 'pending' },
      { conteudo_id: conteudo.id, aluno_id: session.user.id, tipo: 'D7', data_revisao: datas.D7, status: 'pending' },
      { conteudo_id: conteudo.id, aluno_id: session.user.id, tipo: 'D30', data_revisao: datas.D30, status: 'pending' },
    ])

    setSucesso(true)
    setLoading(false)
    setTimeout(() => router.push('/aluno'), 1500)
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-navy">Registrar estudo de hoje</h1>
        <p className="text-gray-400 mt-1">
          Preencha o que você estudou. O sistema gerará automaticamente revisões em <strong>D+1</strong>, <strong>D+7</strong> e <strong>D+30</strong>.
        </p>
      </div>

      {sucesso && (
        <div className="bg-teal-light border border-teal/20 rounded-2xl p-4 text-center mb-6">
          <p className="text-teal font-semibold">✅ Estudo registrado! Revisões agendadas.</p>
        </div>
      )}

      <form onSubmit={handleSalvar} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col gap-5">

        {/* Categoria */}
        <div>
          <label className="block text-sm font-semibold text-navy mb-3">Categoria</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {CATEGORIAS.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoria(cat)}
                className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all border ${
                  categoria === cat
                    ? 'bg-gradient-to-r from-navy to-teal text-white border-transparent shadow-sm'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-teal hover:text-teal'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Título */}
        <div>
          <label className="block text-sm font-semibold text-navy mb-2">Título</label>
          <input
            type="text"
            required
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
            placeholder="Ex: Integrais definidas - Cap. 7"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-navy text-sm outline-none focus:border-teal focus:bg-white transition-all"
          />
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-sm font-semibold text-navy mb-2">Descrição <span className="text-gray-400 font-normal">(opcional)</span></label>
          <textarea
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
            placeholder="Descreva o conteúdo estudado, exercícios feitos, páginas lidas..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-navy text-sm outline-none focus:border-teal focus:bg-white transition-all resize-none"
          />
        </div>

        {/* Data */}
        <div>
          <label className="block text-sm font-semibold text-navy mb-2">Data do estudo</label>
          <input
            type="date"
            value={dataEstudo}
            onChange={e => setDataEstudo(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-navy text-sm outline-none focus:border-teal focus:bg-white transition-all"
          />
        </div>

        {/* Preview revisões */}
        {revisoes && (
          <div className="bg-gradient-to-r from-navy/5 to-teal/10 border border-teal/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Bell size={16} className="text-teal" />
              <span className="text-sm font-semibold text-navy">Você será lembrado em:</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[
                { label: `${fmtPreview(revisoes.D1)} (D+1)`, },
                { label: `${fmtPreview(revisoes.D7)} (D+7)`, },
                { label: `${fmtPreview(revisoes.D30)} (D+30)`, },
              ].map(({ label }) => (
                <span key={label} className="bg-white border border-teal/30 text-navy text-xs font-medium px-3 py-1.5 rounded-lg">
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || sucesso}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-navy to-teal text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-opacity"
        >
          <PlusCircle size={18} />
          {loading ? 'Salvando...' : 'Registrar estudo'}
        </button>
      </form>
    </div>
  )
}
