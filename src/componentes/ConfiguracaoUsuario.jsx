
import React, { useState } from 'react'

export default function ConfiguracaoUsuario({ usuario, onSalvar, onCancelar }) {
  const [abaAtiva, setAbaAtiva] = useState('perfil')
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

  const renderConteudoAba = () => {
    switch (abaAtiva) {
      case 'perfil':
        return renderFormularioPerfil()
      case 'whatsapp':
        return renderIntegracaoWhatsApp()
      case 'planos':
        return renderPlanos()
      default:
        return renderFormularioPerfil()
    }
  }

  const renderFormularioPerfil = () => (
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
  )

  const renderIntegracaoWhatsApp = () => (
    <div className="whatsapp-container">
      <div className="whatsapp-header">
        <div className="whatsapp-icon">
          <i className="fab fa-whatsapp"></i>
        </div>
        <div>
          <h3>Integração WhatsApp</h3>
          <p>Conecte seu WhatsApp para análise automática de gastos com IA</p>
        </div>
      </div>

      <div className="whatsapp-status">
        <div className="status-badge desconectado">
          <i className="fas fa-times-circle"></i>
          Desconectado
        </div>
      </div>

      <div className="whatsapp-features">
        <h4>Recursos disponíveis:</h4>
        <div className="features-list">
          <div className="feature-item">
            <i className="fas fa-robot"></i>
            <div>
              <strong>Análise automática com IA</strong>
              <p>Nossa IA analisa suas mensagens e identifica gastos automaticamente</p>
            </div>
          </div>
          <div className="feature-item">
            <i className="fas fa-chart-line"></i>
            <div>
              <strong>Categorização inteligente</strong>
              <p>Gastos são categorizados automaticamente baseado no contexto</p>
            </div>
          </div>
          <div className="feature-item">
            <i className="fas fa-clock"></i>
            <div>
              <strong>Registro em tempo real</strong>
              <p>Cadastro instantâneo de gastos enviados pelo WhatsApp</p>
            </div>
          </div>
        </div>
      </div>

      <div className="whatsapp-upgrade">
        <div className="upgrade-card">
          <i className="fas fa-crown"></i>
          <h4>Recurso Premium</h4>
          <p>A integração com WhatsApp está disponível apenas no plano Professional. Faça upgrade para desbloquear este recurso.</p>
          <button className="btn-upgrade" onClick={() => setAbaAtiva('planos')}>
            Ver Planos
          </button>
        </div>
      </div>
    </div>
  )

  const renderPlanos = () => (
    <div className="planos-container">
      <div className="planos-header">
        <h3>Escolha seu Plano</h3>
        <p>Selecione o plano que melhor atende às suas necessidades</p>
      </div>

      <div className="plano-atual">
        <div className="plano-card demo">
          <div className="plano-badge">Plano Atual</div>
          <h4>Demo Gratuito</h4>
          <div className="plano-preco">
            <span className="preco">Grátis</span>
            <span className="periodo">30 dias</span>
          </div>
          <ul className="plano-recursos">
            <li><i className="fas fa-check"></i> Recursos básicos de gestão</li>
            <li><i className="fas fa-check"></i> Relatórios limitados</li>
            <li><i className="fas fa-times"></i> Sem integração WhatsApp</li>
            <li><i className="fas fa-times"></i> Sem análise com IA</li>
          </ul>
          <div className="tempo-restante">
            <i className="fas fa-clock"></i>
            15 dias restantes
          </div>
        </div>
      </div>

      <div className="planos-grid">
        <div className="plano-card essencial">
          <h4>Essencial</h4>
          <div className="plano-preco">
            <span className="preco">R$ 19,90</span>
            <span className="periodo">/mês</span>
          </div>
          <ul className="plano-recursos">
            <li><i className="fas fa-check"></i> Gestão completa de gastos</li>
            <li><i className="fas fa-check"></i> Relatórios avançados</li>
            <li><i className="fas fa-check"></i> Gráficos e análises</li>
            <li><i className="fas fa-check"></i> Backup automático</li>
            <li><i className="fas fa-times"></i> Sem integração WhatsApp</li>
            <li><i className="fas fa-times"></i> Sem análise com IA</li>
          </ul>
          <button className="btn-plano">
            Escolher Essencial
          </button>
        </div>

        <div className="plano-card professional popular">
          <div className="popular-badge">Mais Popular</div>
          <h4>Professional</h4>
          <div className="plano-preco">
            <span className="preco">R$ 39,90</span>
            <span className="periodo">/mês</span>
          </div>
          <ul className="plano-recursos">
            <li><i className="fas fa-check"></i> Todos os recursos do Essencial</li>
            <li><i className="fas fa-check"></i> Integração WhatsApp</li>
            <li><i className="fas fa-check"></i> Análise automática com IA</li>
            <li><i className="fas fa-check"></i> Categorização inteligente</li>
            <li><i className="fas fa-check"></i> Suporte prioritário</li>
            <li><i className="fas fa-check"></i> Relatórios personalizados</li>
          </ul>
          <button className="btn-plano destaque">
            Escolher Professional
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="configuracao-container">
      <div className="configuracao-header">
        <h2>Configurações</h2>
        <button className="btn-fechar" onClick={onCancelar}>
          <i className="fas fa-times"></i>
        </button>
      </div>

      <div className="configuracao-tabs">
        <button 
          className={`tab-btn ${abaAtiva === 'perfil' ? 'ativo' : ''}`}
          onClick={() => setAbaAtiva('perfil')}
        >
          <i className="fas fa-user"></i>
          Perfil
        </button>
        <button 
          className={`tab-btn ${abaAtiva === 'whatsapp' ? 'ativo' : ''}`}
          onClick={() => setAbaAtiva('whatsapp')}
        >
          <i className="fab fa-whatsapp"></i>
          WhatsApp
        </button>
        <button 
          className={`tab-btn ${abaAtiva === 'planos' ? 'ativo' : ''}`}
          onClick={() => setAbaAtiva('planos')}
        >
          <i className="fas fa-crown"></i>
          Planos
        </button>
      </div>

      {erro && (
        <div className="erro-mensagem">
          <i className="fas fa-exclamation-triangle"></i>
          {erro}
        </div>
      )}

      <div className="configuracao-conteudo">
        {renderConteudoAba()}
      </div>
    </div>
  )
}
