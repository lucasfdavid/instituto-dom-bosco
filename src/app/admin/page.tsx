'use client'

import Link from 'next/link'
import { ChevronRight, Users, GraduationCap, BookOpen } from 'lucide-react'

const cards = [
  {
    href: '/admin/professores',
    icon: Users,
    titulo: 'Professores',
    descricao: 'Veja, convide e remova professores cadastrados no instituto',
  },
  {
    href: '/admin/alunos',
    icon: GraduationCap,
    titulo: 'Alunos',
    descricao: 'Edite informações administrativas dos alunos',
  },
  {
    href: '/admin/cursos',
    icon: BookOpen,
    titulo: 'Cursos',
    descricao: 'Adicione, edite ou desative cursos e turmas disponíveis',
  },
]

export default function AdminPage() {
  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-navy">Administração</h1>
        <p className="text-gray-400 mt-1">Gerencie professores, alunos e cursos do instituto</p>
      </div>

      <div className="flex flex-col gap-3">
        {cards.map(({ href, icon: Icon, titulo, descricao }) => (
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
