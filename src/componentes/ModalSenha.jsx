
import React, { useState } from 'react'
import { IconeOlhoAberto, IconeOlhoFechado } from './Icones'

export default function ModalSenha({ aberto, onFechar, onConfirmar, carregando }) {
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!senha.trim()) {
      setErro('Digite sua senha')
      return
    }
    setErro('')
    onConfirmar(senha)
  }

  const handleFechar = () => {
    setSenha('')
    setMostrarSenha(false)
    setErro('')
    onFechar()
  }

  if (!aberto) return null

  return (
    <div className="modal-overlay" onClick={handleFechar}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Verificação de Segurança</h3>
          <button className="modal-fechar" onClick={handleFechar}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <p>Digite sua senha para alterar a visualização dos valores:</p>
          
          {erro && (
            <div className="erro-mensagem">
              <i className="fas fa-exclamation-triangle"></i>
              {erro}
            </div>
          )}

          <div className="campo-senha">
            <div className="input-senha-container">
              <input
                type={mostrarSenha ? "text" : "password"}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite sua senha"
                className="input-senha"
                disabled={carregando}
                autoFocus
              />
              <button
                type="button"
                className="botao-mostrar-senha"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                disabled={carregando}
              >
                {mostrarSenha ? <IconeOlhoFechado /> : <IconeOlhoAberto />}
              </button>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-secundario"
              onClick={handleFechar}
              disabled={carregando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primario"
              disabled={carregando}
            >
              {carregando ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Verificando...
                </>
              ) : (
                'Confirmar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
