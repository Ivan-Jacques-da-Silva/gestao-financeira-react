
import React from 'react'
import { IconeEditar, IconeExcluir } from './Icones.jsx'

export default function ListaGastosFixos({ gastosFixos, onEditar, onExcluir }) {
  const formatarValor = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  return (
    <div className="card">
      <h4>Lista de Gastos Fixos ({gastosFixos.length})</h4>
      {gastosFixos.length === 0 ? (
        <div className="lista-vazia">
          <div className="sub">Nenhum gasto fixo cadastrado ainda.</div>
        </div>
      ) : (
        <div className="lista">
          {gastosFixos.map(gastoFixo => (
            <div key={gastoFixo.id} className={`item-lista ${!gastoFixo.ativo ? 'inativo' : ''}`}>
              <div className="item-info">
                <div className="item-titulo">
                  {gastoFixo.descricao}
                  {!gastoFixo.ativo && <span className="badge-inativo">Inativo</span>}
                </div>
                <div className="item-detalhes">
                  <span className="valor">{formatarValor(gastoFixo.valor)}</span>
                  <span className="tipo">{gastoFixo.tipo}</span>
                  <span className="vencimento">Vence dia {gastoFixo.diaVencimento}</span>
                  {gastoFixo.categoria && (
                    <span className="categoria">{gastoFixo.categoria}</span>
                  )}
                </div>
              </div>
              <div className="item-acoes">
                <button className="btn-acao" onClick={() => onEditar(gastoFixo)}>
                  <IconeEditar />
                </button>
                <button className="btn-acao btn-excluir" onClick={() => onExcluir(gastoFixo.id)}>
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
