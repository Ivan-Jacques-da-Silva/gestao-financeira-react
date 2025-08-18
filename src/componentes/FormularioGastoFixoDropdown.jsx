
import React, { useState, useEffect } from 'react'
import FormularioGastoFixo from './FormularioGastoFixo.jsx'

export default function FormularioGastoFixoDropdown({ gastoFixo, onSalvar, onCancelar }) {
  const [aberto, setAberto] = useState(false)

  // Abrir automaticamente quando estiver editando
  useEffect(() => {
    if (gastoFixo) {
      setAberto(true)
    }
  }, [gastoFixo])

  return (
    <div className="formulario-dropdown">
      <div 
        className="formulario-header" 
        onClick={() => setAberto(!aberto)}
      >
        <h4>{gastoFixo ? 'Editar Gasto Fixo' : 'Novo Gasto Fixo'}</h4>
        <i className={`fas fa-chevron-down dropdown-icon ${aberto ? 'aberto' : ''}`}></i>
      </div>
      
      <div className={`formulario-content ${aberto ? 'aberto' : ''}`}>
        <div className="formulario">
          <FormularioGastoFixo 
            gastoFixo={gastoFixo}
            onSalvar={(dados) => {
              onSalvar(dados)
              if (!gastoFixo) setAberto(false) // Fechar após salvar novo gasto
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
