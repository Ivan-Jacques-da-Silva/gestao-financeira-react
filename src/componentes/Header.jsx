
import React from 'react'

export default function Header({ usuario, onLogout, onConfiguracoes, temaDark, onToggleTema }) {
  return (
    <header className="header">
      <div className="header-titulo">
        <i className="fas fa-wallet"></i>
        <h1>Gestão Financeira</h1>
      </div>
      <div className="header-usuario">
        <div className="usuario-info" onClick={onConfiguracoes}>
          <i className="fas fa-user"></i>
          <span className="usuario-nome">Olá, <strong>{usuario.usuario}!</strong></span>
        </div>
        <button onClick={onToggleTema} className="botao-tema" title={temaDark ? 'Modo Claro' : 'Modo Escuro'}>
          <i className={`fas ${temaDark ? 'fa-sun' : 'fa-moon'}`}></i>
        </button>
        <button onClick={onLogout} className="botao-logout">
          <i className="fas fa-sign-out-alt"></i>
          Sair
        </button>
      </div>
    </header>
  )
}
