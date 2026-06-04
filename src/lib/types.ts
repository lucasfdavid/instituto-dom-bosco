export type Role = 'aluno' | 'professor'

export interface Profile {
  id: string
  nome: string
  email: string
  role: Role
  criado_em: string
}

export interface Conteudo {
  id: string
  aluno_id: string
  materia: string
  assunto: string
  data_estudo: string // ISO date
  criado_em: string
}

export interface Revisao {
  id: string
  conteudo_id: string
  aluno_id: string
  tipo: 'D1' | 'D7' | 'D30'
  data_revisao: string // ISO date
  concluida: boolean
  concluida_em: string | null
  conteudo?: Conteudo
}

export interface VinculoProfessorAluno {
  id: string
  professor_id: string
  aluno_id: string
  criado_em: string
  aluno?: Profile
  professor?: Profile
}
