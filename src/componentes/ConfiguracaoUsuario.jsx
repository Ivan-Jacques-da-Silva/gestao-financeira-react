
import React, { useState } from 'react'

export default function ConfiguracaoUsuario({ usuario, onSalvar, onCancelar }) {
  const [dados, setDados] = useState({
    usuario: usuario.usuario || '',
    email: usuario.email || '',
    telefone: usuario.telefone || '',
    cpf: usuario.cpf || '',
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: ''
  })

  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  const formatarTelefone = (valor) => {
    const numeros = valor.replace(/\D/g, '')
    if (numeros.length <= 11) {
      return numeros
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4,5})(\d{4})$/, '$1-$2')
    }
    return valor
  }

  const formatarCPF = (valor) => {
    const numeros = valor.replace(/\D/g, '')
    if (numeros.length <= 11) {
      return numeros
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    }
    return valor
  }

  const alterarDados = (campo, valor) => {
    let valorProcessado = valor

    if (campo === 'telefone') {
      valorProcessado = formatarTelefone(valor)
    } else if (campo === 'cpf') {
      valorProcessado = formatarCPF(valor)
    }

    setDados(prev => ({
      ...prev,
      [campo]: valorProcessado
    }))
  }

  const validarFormulario = () => {
    if (!dados.usuario.trim()) {
      setErro('Nome de usuário é obrigatório')
      return false
    }

    if (!dados.email.trim()) {
      setErro('Email é obrigatório')
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(dados.email)) {
      setErro('Email inválido')
      return false
    }

    if (dados.novaSenha && dados.novaSenha !== dados.confirmarSenha) {
      setErro('As senhas não coincidem')
      return false
    }

    if (dados.novaSenha && dados.novaSenha.length < 6) {
      setErro('A nova senha deve ter pelo menos 6 caracteres')
      return false
    }

    if (dados.novaSenha && !dados.senhaAtual) {
      setErro('Digite sua senha atual para alterar a senha')
      return false
    }

    setErro('')
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validarFormulario()) return

    setCarregando(true)
    setErro('')

    try {
      // Preparar dados para envio (remover máscaras)
      const dadosParaEnvio = {
        usuario: dados.usuario,
        email: dados.email,
        telefone: dados.telefone.replace(/\D/g, ''),
        cpf: dados.cpf.replace(/\D/g, '')
      }

      // Adicionar senhas se foram fornecidas
      if (dados.novaSenha) {
        dadosParaEnvio.senhaAtual = dados.senhaAtual
        dadosParaEnvio.novaSenha = dados.novaSenha
      }

      await onSalvar(dadosParaEnvio)
    } catch (error) {
      setErro(error.message || 'Erro ao salvar configurações')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="configuracao-container">
      <div className="configuracao-header">
        <h2>Configurações do Usuário</h2>
        <button className="btn-fechar" onClick={onCancelar}>
          <i className="fas fa-times"></i>
        </button>
      </div>

      {erro && (
        <div className="erro-mensagem">
          <i className="fas fa-exclamation-triangle"></i>
          {erro}
        </div>
      )}

      <form onSubmit={handleSubmit} className="configuracao-form">
        <div className="form-section">
          <h3>Informações Pessoais</h3>
          
          <div className="form-row">
            <div className="form-grupo">
              <label>Nome de Usuário</label>
              <input
                type="text"
                value={dados.usuario}
                onChange={(e) => alterarDados('usuario', e.target.value)}
                placeholder="Seu nome de usuário"
                required
              />
            </div>

            <div className="form-grupo">
              <label>Email</label>
              <input
                type="email"
                value={dados.email}
                onChange={(e) => alterarDados('email', e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-grupo">
              <label>Telefone</label>
              <input
                type="text"
                value={dados.telefone}
                onChange={(e) => alterarDados('telefone', e.target.value)}
                placeholder="(11) 99999-9999"
                maxLength="15"
              />
            </div>

            <div className="form-grupo">
              <label>CPF</label>
              <input
                type="text"
                value={dados.cpf}
                onChange={(e) => alterarDados('cpf', e.target.value)}
                placeholder="000.000.000-00"
                maxLength="14"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Alterar Senha</h3>
          <p className="form-description">Deixe em branco se não deseja alterar a senha</p>
          
          <div className="form-grupo">
            <label>Senha Atual</label>
            <input
              type="password"
              value={dados.senhaAtual}
              onChange={(e) => alterarDados('senhaAtual', e.target.value)}
              placeholder="Digite sua senha atual"
            />
          </div>

          <div className="form-row">
            <div className="form-grupo">
              <label>Nova Senha</label>
              <input
                type="password"
                value={dados.novaSenha}
                onChange={(e) => alterarDados('novaSenha', e.target.value)}
                placeholder="Digite a nova senha"
                minLength="6"
              />
            </div>

            <div className="form-grupo">
              <label>Confirmar Nova Senha</label>
              <input
                type="password"
                value={dados.confirmarSenha}
                onChange={(e) => alterarDados('confirmarSenha', e.target.value)}
                placeholder="Confirme a nova senha"
                minLength="6"
              />
            </div>
          </div>
        </div>

        <div className="configuracao-acoes">
          <button type="button" onClick={onCancelar} className="btn-cancelar">
            Cancelar
          </button>
          <button type="submit" disabled={carregando} className="btn-salvar">
            {carregando ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  )
}
