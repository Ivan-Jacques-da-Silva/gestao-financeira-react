
import React, { useState } from 'react'

export default function TelaAuth({ onLogin }) {
  const [modo, setModo] = useState('login') // 'login' ou 'registro'
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  // Estados para login
  const [loginEmail, setLoginEmail] = useState('')
  const [senha, setSenha] = useState('')

  // Estados para registro
  const [dadosRegistro, setDadosRegistro] = useState({
    usuario: '',
    email: '',
    senha: '',
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

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('usuario', JSON.stringify(data.usuario))
        onLogin(data.usuario)
      } else {
        setErro(data.erro || 'Erro ao fazer login')
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

    try {
      const response = await fetch('/api/auth/registro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dadosRegistro)
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('usuario', JSON.stringify(data.usuario))
        onLogin(data.usuario)
      } else {
        setErro(data.erro || 'Erro ao fazer registro')
      }
    } catch (error) {
      setErro('Erro de conexão')
    } finally {
      setCarregando(false)
    }
  }

  const alterarDadosRegistro = (campo, valor) => {
    setDadosRegistro(prev => ({
      ...prev,
      [campo]: valor
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

            <div className="form-grupo">
              <label>Senha</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite sua senha"
                required
              />
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

            <div className="form-grupo">
              <label>Senha</label>
              <input
                type="password"
                value={dadosRegistro.senha}
                onChange={(e) => alterarDadosRegistro('senha', e.target.value)}
                placeholder="Digite uma senha"
                required
              />
            </div>

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
                <option value="outro">Outro</option>
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
