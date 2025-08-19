
import React, { useState, useEffect } from 'react'

export default function ToastAlert({ mensagem, tipo = 'sucesso', visivel, onFechar, duracao = 3000 }) {
  useEffect(() => {
    if (visivel && duracao > 0) {
      const timer = setTimeout(() => {
        onFechar()
      }, duracao)

      return () => clearTimeout(timer)
    }
  }, [visivel, duracao, onFechar])

  if (!visivel) return null

  const icone = {
    sucesso: 'fas fa-check-circle',
    erro: 'fas fa-exclamation-circle',
    aviso: 'fas fa-exclamation-triangle',
    info: 'fas fa-info-circle'
  }

  return (
    <div className={`toast-alert toast-${tipo}`}>
      <div className="toast-content">
        <i className={icone[tipo]}></i>
        <span className="toast-mensagem">{mensagem}</span>
        <button className="toast-fechar" onClick={onFechar}>
          <i className="fas fa-times"></i>
        </button>
      </div>
    </div>
  )
}
