'use client'

import Link from 'next/link'
import { BookOpen, ChevronRight, UserPlus } from 'lucide-react'

const configuracoes = [
  {
    href: '/professor/cursos',
    icon: BookOpen,
    titulo: 'Gerenciar cursos',
    descricao: 'Adicione, edite ou desative cursos e turmas disponíveis para os alunos',
  },
  {
    href: '/professor/convidar',
    icon: UserPlus,
    titulo: 'Convidar professor',
    descricao: 'Envie um convite por e-mail para adicionar um novo professor ao instituto',
  },
]

export default function ConfiguracoesPage() {
  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-navy">Configurações</h1>
        <p className="text-gray-400 mt-1">Gerencie as configurações do instituto</p>
      </div>

      <div className="flex flex-col gap-3">
        {configuracoes.map(({ href, icon: Icon, titulo, descricao }) => (
          <Link key={href} href={href}>
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-navy to-teal flex items-center justify-center flex-shrink-0">
                <Icon size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-navy text-base">{titulo}</p>
                <p className="text-sm text-gray-400 mt-0.5">{descricao}</p>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
