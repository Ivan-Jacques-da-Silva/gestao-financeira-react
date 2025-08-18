
import React, { useState, useEffect } from 'react'
import FormularioGasto from './FormularioGasto.jsx'

export default function FormularioGastoDropdown({ gasto, onSalvar, onCancelar }) {
  const [aberto, setAberto] = useState(false)

  // Abrir automaticamente quando estiver editando
  useEffect(() => {
    if (gasto) {
      setAberto(true)
    }
  }, [gasto])

  return (
    <div className="formulario-dropdown">
      <div 
        className="formulario-header" 
        onClick={() => setAberto(!aberto)}
      >
        <h4>{gasto ? 'Editar Gasto' : 'Novo Gasto'}</h4>
        <i className={`fas fa-chevron-down dropdown-icon ${aberto ? 'aberto' : ''}`}></i>
      </div>
      
      <div className={`formulario-content ${aberto ? 'aberto' : ''}`}>
        <div className="formulario">
          <FormularioGasto 
            gasto={gasto}
            onSalvar={(dados) => {
              onSalvar(dados)
              if (!gasto) setAberto(false) // Fechar após salvar novo gasto
            }}
            onCancelar={() => {
              onCancelar()
              setAberto(false) // Fechar ao cancelar edição
            }}
          />
        </div>
      </div>
    </div>
  )
}
