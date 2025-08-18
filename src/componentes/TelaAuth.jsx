import React, { useState } from 'react'
import { IconeOlhoAberto, IconeOlhoFechado } from './Icones'

export default function TelaAuth({ onLogin }) {
  const [modo, setModo] = useState('login') // 'login' ou 'registro'
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  
  // Estados para controlar visibilidade das senhas
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [mostrarSenhaRegistro, setMostrarSenhaRegistro] = useState(false)
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false)

  // Estados para login
  const [loginEmail, setLoginEmail] = useState('')
  const [senha, setSenha] = useState('')

  // Estados para registro
  const [dadosRegistro, setDadosRegistro] = useState({
    usuario: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    cpf: '',
    telefone: '',
    sexo: ''
  })

  const handleLogin = async (e) => {
    e.preventDefault()
    setCarregando(true)
    setErro('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          loginEmail,
          senha
        })
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('usuario', JSON.stringify({
          ...data.usuario,
          token: data.token
        }))
        onLogin({
          ...data.usuario,
          token: data.token
        })
      } else {
        const errorData = await response.json()
        setErro(errorData.erro || 'Erro ao fazer login')
      }
    } catch (error) {
      setErro('Erro de conexão')
    } finally {
      setCarregando(false)
    }
  }

  const handleRegistro = async (e) => {
    e.preventDefault()
    setCarregando(true)
    setErro('')

    // Validar se as senhas coincidem
    if (dadosRegistro.senha !== dadosRegistro.confirmarSenha) {
      setErro('As senhas não coincidem')
      setCarregando(false)
      return
    }

    try {
      // Remover máscaras antes de enviar
      const dadosEnvio = {
        ...dadosRegistro,
        cpf: removerMascara(dadosRegistro.cpf),
        telefone: removerMascara(dadosRegistro.telefone)
      }
      
      // Remover confirmação de senha antes de enviar
      delete dadosEnvio.confirmarSenha

      const response = await fetch('/api/auth/registro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dadosEnvio)
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('usuario', JSON.stringify({
          ...data.usuario,
          token: data.token
        }))
        onLogin({
          ...data.usuario,
          token: data.token
        })
      } else {
        const errorData = await response.json()
        setErro(errorData.erro || 'Erro ao registrar usuário')
      }
    } catch (error) {
      setErro('Erro de conexão')
    } finally {
      setCarregando(false)
    }
  }

  // Função para aplicar máscara de CPF
  const aplicarMascaraCPF = (valor) => {
    return valor
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1')
  }

  // Função para aplicar máscara de telefone
  const aplicarMascaraTelefone = (valor) => {
    return valor
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(\d{4})-(\d)(\d{4})/, '$1$2-$3')
      .replace(/(-\d{4})\d+?$/, '$1')
  }

  // Função para remover máscara
  const removerMascara = (valor) => {
    return valor.replace(/\D/g, '')
  }

  const alterarDadosRegistro = (campo, valor) => {
    let valorProcessado = valor

    if (campo === 'cpf') {
      valorProcessado = aplicarMascaraCPF(valor)
    } else if (campo === 'telefone') {
      valorProcessado = aplicarMascaraTelefone(valor)
    }

    setDadosRegistro(prev => ({
      ...prev,
      [campo]: valorProcessado
    }))
  }

  return (
    <div className="tela-auth">
      <div className="auth-container">
        <div className="auth-header">
          <i className="fas fa-wallet auth-icone"></i>
          <h1>Gestão Financeira</h1>
          <p>Controle suas finanças de forma simples</p>
        </div>

        <div className="auth-tabs">
          <button 
            className={`auth-tab ${modo === 'login' ? 'ativo' : ''}`}
            onClick={() => setModo('login')}
          >
            Login
          </button>
          <button 
            className={`auth-tab ${modo === 'registro' ? 'ativo' : ''}`}
            onClick={() => setModo('registro')}
          >
            Registrar
          </button>
        </div>

        {erro && (
          <div className="auth-erro">
            <i className="fas fa-exclamation-triangle"></i>
            {erro}
          </div>
        )}

        {modo === 'login' ? (
          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-grupo">
              <label>Usuário ou Email</label>
              <input
                type="text"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="Digite seu usuário ou email"
                required
              />
            </div>

            <div className="form-grupo campo-senha">
              <label>Senha</label>
              <div className="input-senha-container">
                <input
                  type={mostrarSenha ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Digite sua senha"
                  className="input-senha"
                  required
                />
                <button
                  type="button"
                  className="botao-mostrar-senha"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                >
                  {mostrarSenha ? <IconeOlhoFechado /> : <IconeOlhoAberto />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="auth-botao"
              disabled={carregando}
            >
              {carregando ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Entrando...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt"></i>
                  Entrar
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegistro} className="auth-form">
            <div className="form-row">
              <div className="form-grupo">
                <label>Nome de Usuário</label>
                <input
                  type="text"
                  value={dadosRegistro.usuario}
                  onChange={(e) => alterarDadosRegistro('usuario', e.target.value)}
                  placeholder="Digite um nome de usuário"
                  required
                />
              </div>

              <div className="form-grupo">
                <label>Email</label>
                <input
                  type="email"
                  value={dadosRegistro.email}
                  onChange={(e) => alterarDadosRegistro('email', e.target.value)}
                  placeholder="Digite seu email"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-grupo campo-senha">
                <label>Senha</label>
                <div className="input-senha-container">
                  <input
                    type={mostrarSenhaRegistro ? "text" : "password"}
                    value={dadosRegistro.senha}
                    onChange={(e) => alterarDadosRegistro('senha', e.target.value)}
                    placeholder="Digite uma senha"
                    className="input-senha"
                    required
                  />
                  <button
                    type="button"
                    className="botao-mostrar-senha"
                    onClick={() => setMostrarSenhaRegistro(!mostrarSenhaRegistro)}
                    aria-label={mostrarSenhaRegistro ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {mostrarSenhaRegistro ? <IconeOlhoFechado /> : <IconeOlhoAberto />}
                  </button>
                </div>
              </div>

              <div className="form-grupo campo-senha">
                <label>Confirmar Senha</label>
                <div className="input-senha-container">
                  <input
                    type={mostrarConfirmarSenha ? "text" : "password"}
                    value={dadosRegistro.confirmarSenha}
                    onChange={(e) => alterarDadosRegistro('confirmarSenha', e.target.value)}
                    placeholder="Confirme sua senha"
                    className="input-senha"
                    required
                  />
                  <button
                    type="button"
                    className="botao-mostrar-senha"
                    onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
                    aria-label={mostrarConfirmarSenha ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {mostrarConfirmarSenha ? <IconeOlhoFechado /> : <IconeOlhoAberto />}
                  </button>
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-grupo">
                <label>CPF</label>
                <input
                  type="text"
                  value={dadosRegistro.cpf}
                  onChange={(e) => alterarDadosRegistro('cpf', e.target.value)}
                  placeholder="000.000.000-00"
                  required
                />
              </div>

              <div className="form-grupo">
                <label>Telefone</label>
                <input
                  type="tel"
                  value={dadosRegistro.telefone}
                  onChange={(e) => alterarDadosRegistro('telefone', e.target.value)}
                  placeholder="(00) 00000-0000"
                  required
                />
              </div>
            </div>

            <div className="form-grupo">
              <label>Sexo</label>
              <select
                value={dadosRegistro.sexo}
                onChange={(e) => alterarDadosRegistro('sexo', e.target.value)}
                required
              >
                <option value="">Selecione</option>
                <option value="masculino">Masculino</option>
                <option value="feminino">Feminino</option>
                <option value="outro">Prefiro não falar</option>
              </select>
            </div>

            <button 
              type="submit" 
              className="auth-botao"
              disabled={carregando}
            >
              {carregando ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Registrando...
                </>
              ) : (
                <>
                  <i className="fas fa-user-plus"></i>
                  Registrar
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}