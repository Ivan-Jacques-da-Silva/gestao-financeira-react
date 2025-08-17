import React from 'react'
import { IconeEditar, IconeExcluir } from './Icones.jsx'

export default function ListaGastos({ gastos = [], onEditar, onExcluir }) {
  const formatarValor = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const formatarData = (data) => {
    return new Date(data).toLocaleDateString('pt-BR')
  }

  return (
    <div className="card">
      <h4>Lista de Gastos ({gastos.length})</h4>
      {gastos.length === 0 ? (
        <div className="lista-vazia">
          <div className="sub">Nenhum gasto cadastrado ainda.</div>
        </div>
      ) : (
        <div className="lista">
          {gastos.map(gasto => (
            <div key={gasto.id} className="item-lista">
              <div className="item-info">
                <div className="item-titulo">{gasto.descricao}</div>
                <div className="item-detalhes">
                  <span className="valor">{formatarValor(gasto.valor)}</span>
                  <span className="tipo">{gasto.tipo}</span>
                  <span className="data">{formatarData(gasto.data)}</span>
                  {gasto.parcelas > 1 && (
                    <span className="parcelas">{gasto.parcelas}x</span>
                  )}
                  {gasto.categoria && (
                    <span className="categoria">{gasto.categoria}</span>
                  )}
                </div>
              </div>
              <div className="item-acoes">
                <button className="btn-acao" onClick={() => onEditar(gasto)}>
                  <IconeEditar />
                </button>
                <button className="btn-acao btn-excluir" onClick={() => onExcluir(gasto.id)}>
                  <IconeExcluir />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}