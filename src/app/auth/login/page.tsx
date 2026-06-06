'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, Mail, Lock, User, Phone, GraduationCap } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [modo, setModo] = useState<'login' | 'cadastro'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sucesso, setSucesso] = useState(false)
  const [cursos, setCursos] = useState<any[]>([])

  // Login
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Cadastro
  const [nome, setNome] = useState('')
  const [emailCad, setEmailCad] = useState('')
  const [senhaCad, setSenhaCad] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [telefone, setTelefone] = useState('')
  const [curso, setCurso] = useState('')

  useEffect(() => {
    async function loadCursos() {
      const supabase = createClient()
      const { data } = await supabase
        .from('cursos')
        .select('*')
        .eq('ativo', true)
        .order('categoria')
        .order('nome')
      setCursos(data ?? [])
    }
    loadCursos()
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError || !data.user) {
      setError('E-mail ou senha inválidos.')
      setLoading(false)
      return
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profileData?.role === 'professor') {
      window.location.href = '/professor'
    } else {
      window.location.href = '/aluno'
    }
  }

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (senhaCad !== confirmarSenha) {
      setError('As senhas não coincidem.')
      return
    }
    if (senhaCad.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (!curso) {
      setError('Selecione um curso/turma.')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { data, error: authError } = await supabase.auth.signUp({
      email: emailCad,
      password: senhaCad,
      options: {
        data: { nome, role: 'aluno' }
      }
    })

    if (authError || !data.user) {
      setError(authError?.message ?? 'Erro ao criar conta.')
      setLoading(false)
      return
    }

    // Atualiza perfil com telefone e curso
    await supabase.from('profiles').update({
      nome,
      phone: telefone,
      course: curso,
    }).eq('id', data.user.id)

    setSucesso(true)
    setLoading(false)
  }

  const cursosPorCategoria = {
    fundamental: cursos.filter(c => c.categoria === 'fundamental'),
    medio: cursos.filter(c => c.categoria === 'medio'),
    graduacao: cursos.filter(c => c.categoria === 'graduacao'),
  }

  const categoriaLabel: Record<string, string> = {
    fundamental: 'Ensino Fundamental',
    medio: 'Ensino Médio',
    graduacao: 'Graduação',
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl overflow-hidden flex">

        {/* Painel esquerdo */}
        <div className="hidden md:flex flex-col justify-between w-1/2 bg-gradient-to-br from-navy to-teal p-10 text-white">
          <div>
           <div className="flex items-center gap-4 mb-12">
              <img src="/images/coluna.png" alt="Coluna" className="h-24 w-auto object-contain" />
              <img src="/images/logo-branca.png" alt="Instituto Dom Bosco" className="h-24 w-auto object-contain" />
            </div>
            <h1 className="font-serif text-4xl font-bold leading-tight mb-4">
              Estude melhor,<br />não apenas mais.
            </h1>
            <p className="text-white/70 text-sm leading-relaxed mb-10">
              Plataforma de revisão espaçada nos intervalos <strong>D+1, D+7 e D+30</strong>. Registre o que estudou hoje e receba lembretes automáticos para relembrar o conteúdo quando mais importa.
            </p>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-white/60">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                </svg>
                <p className="text-white text-base font-semibold">(62) 99264-5613</p>
              </div>
              <div className="flex gap-6 mt-1">
                <div className="flex flex-col gap-1 text-white/70 text-sm">
                  <p>Rua 17-A, Nº 671</p>
                  <p>Setor Aeroporto</p>
                </div>
                <div className="w-px bg-white/20" />
                <div className="flex flex-col gap-1 text-white/70 text-sm">
                  <p>@inst.dombosco</p>
                  <p>@sarahpaivafernandes</p>
                </div>
              </div>
            </div>
          </div>
          <p className="text-white/40 text-xs mt-6">© 2026 Instituto Dom Bosco · Todos os direitos reservados</p>
        </div>

        {/* Painel direito */}
        <div className="flex-1 p-8 md:p-10 flex flex-col justify-center overflow-y-auto max-h-screen">

          {/* Logo mobile */}
          <div className="md:hidden flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy to-teal flex items-center justify-center overflow-hidden">
              <img src="/images/coluna.png" alt="Coluna" className="w-7 h-7 object-contain" />
            </div>
            <div>
              <p className="font-serif text-base font-semibold text-navy">Instituto Dom Bosco</p>
              <p className="font-condensed text-xs text-gray-400 uppercase tracking-widest">Psicologia e Aprendizagem</p>
            </div>
          </div>

          {/* Tabs login/cadastro */}
          <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => { setModo('login'); setError(''); setSucesso(false) }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${modo === 'login' ? 'bg-white text-navy shadow-sm' : 'text-gray-400 hover:text-navy'}`}
            >
              Entrar
            </button>
            <button
              onClick={() => { setModo('cadastro'); setError(''); setSucesso(false) }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${modo === 'cadastro' ? 'bg-white text-navy shadow-sm' : 'text-gray-400 hover:text-navy'}`}
            >
              Cadastrar-se
            </button>
          </div>

          {/* LOGIN */}
          {modo === 'login' && (
            <>
              <h2 className="font-serif text-2xl font-bold text-navy mb-1">Bem-vindo de volta</h2>
              <p className="text-sm text-gray-400 mb-6">Entre com suas credenciais para acessar.</p>
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-semibold text-navy mb-2">E-mail</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-navy text-sm outline-none focus:border-teal focus:bg-white transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-navy mb-2">Senha</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-navy text-sm outline-none focus:border-teal focus:bg-white transition-all" />
                  </div>
                </div>
                {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                <button type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-navy to-teal text-white font-semibold text-sm disabled:opacity-60 mt-2">
                  {loading ? 'Entrando...' : 'Entrar'}
                </button>
              </form>
            </>
          )}

          {/* CADASTRO */}
          {modo === 'cadastro' && !sucesso && (
            <>
              <h2 className="font-serif text-2xl font-bold text-navy mb-1">Criar conta</h2>
              <p className="text-sm text-gray-400 mb-6">Preencha seus dados para se cadastrar como aluno.</p>
              <form onSubmit={handleCadastro} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-semibold text-navy mb-2">Nome completo</label>
                  <div className="relative">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" required value={nome} onChange={e => setNome(e.target.value)}
                      placeholder="Seu nome completo"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-navy text-sm outline-none focus:border-teal focus:bg-white transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-navy mb-2">E-mail</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="email" required value={emailCad} onChange={e => setEmailCad(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-navy text-sm outline-none focus:border-teal focus:bg-white transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-navy mb-2">Telefone</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="tel" required value={telefone} onChange={e => setTelefone(e.target.value)}
                      placeholder="(62) 99999-9999"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-navy text-sm outline-none focus:border-teal focus:bg-white transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-navy mb-2">Curso / Turma</label>
                  <div className="relative">
                    <GraduationCap size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select required value={curso} onChange={e => setCurso(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-navy text-sm outline-none focus:border-teal focus:bg-white transition-all appearance-none">
                      <option value="">Selecione seu curso/turma</option>
                      {Object.entries(cursosPorCategoria).map(([cat, lista]) =>
                        lista.length > 0 && (
                          <optgroup key={cat} label={categoriaLabel[cat]}>
                            {lista.map(c => (
                              <option key={c.id} value={c.nome}>{c.nome}</option>
                            ))}
                          </optgroup>
                        )
                      )}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-navy mb-2">Senha</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="password" required value={senhaCad} onChange={e => setSenhaCad(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-navy text-sm outline-none focus:border-teal focus:bg-white transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-navy mb-2">Confirmar senha</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="password" required value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)}
                      placeholder="Repita a senha"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-navy text-sm outline-none focus:border-teal focus:bg-white transition-all" />
                  </div>
                </div>
                {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                <button type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-navy to-teal text-white font-semibold text-sm disabled:opacity-60 mt-2">
                  {loading ? 'Criando conta...' : 'Criar conta'}
                </button>
              </form>
            </>
          )}

          {/* SUCESSO CADASTRO */}
          {modo === 'cadastro' && sucesso && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-teal-light flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎉</span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-navy mb-2">Conta criada!</h2>
              <p className="text-sm text-gray-400 mb-6">
                Sua conta foi criada com sucesso. Verifique seu e-mail para confirmar o cadastro e depois faça login.
              </p>
              <button onClick={() => { setModo('login'); setSucesso(false) }}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-navy to-teal text-white font-semibold text-sm">
                Ir para o login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
