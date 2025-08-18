
import React from 'react'

export default function Header({ usuario, onLogout }) {
  return (
    <header className="header">
      <div className="header-titulo">
        <i className="fas fa-wallet"></i>
        <h1>Gestão Financeira</h1>
      </div>
      <div className="header-usuario">
        <div className="usuario-info">
          <i className="fas fa-user"></i>
          <span className="usuario-nome">Olá, <strong>{usuario.usuario}!</strong></span>
        </div>
        <button onClick={onLogout} className="botao-logout">
          <i className="fas fa-sign-out-alt"></i>
          Sair
        </button>
      </div>
    </header>
  )
}
