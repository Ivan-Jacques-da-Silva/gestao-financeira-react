
import React, { useState, useEffect } from 'react'
import { IconeEditar, IconeExcluir } from './Icones.jsx'

export default function ListaGastos({ gastos = [], onEditar, onExcluir }) {
  const [itensPorPagina, setItensPorPagina] = useState(10)
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [dataInicial, setDataInicial] = useState('')
  const [dataFinal, setDataFinal] = useState('')
  const [gastosFiltrados, setGastosFiltrados] = useState([])

  // Aplicar filtros quando gastos ou filtros mudarem
  useEffect(() => {
    let resultado = [...gastos]

    // Filtro por data
    if (dataInicial || dataFinal) {
      resultado = resultado.filter(gasto => {
        const dataGasto = new Date(gasto.data)
        const inicial = dataInicial ? new Date(dataInicial) : null
        const final = dataFinal ? new Date(dataFinal) : null

        if (inicial && dataGasto < inicial) return false
        if (final && dataGasto > final) return false
        return true
      })
    }

    setGastosFiltrados(resultado)
    setPaginaAtual(1) // Reset para primeira página ao filtrar
  }, [gastos, dataInicial, dataFinal])

  // Calcular paginação
  const totalPaginas = Math.ceil(gastosFiltrados.length / itensPorPagina)
  const indiceInicial = (paginaAtual - 1) * itensPorPagina
  const indiceFinal = indiceInicial + itensPorPagina
  const gastosExibidos = gastosFiltrados.slice(indiceInicial, indiceFinal)

  const formatarValor = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const formatarData = (data) => {
    return new Date(data).toLocaleDateString('pt-BR')
  }

  const calcularStatus = (gasto) => {
    const hoje = new Date()
    const dataVencimento = new Date(gasto.data)
    const diasParaVencimento = Math.ceil((dataVencimento - hoje) / (1000 * 60 * 60 * 24))

    if (gasto.status === 'pago') return 'pago'
    if (diasParaVencimento < 0) return 'vencido'
    if (diasParaVencimento <= 10) return 'a_vencer'
    return 'a_vencer'
  }

  const getBadgeTipo = (tipo) => {
    const tipoNormalizado = tipo.toLowerCase()
      .replace(/ã/g, 'a')
      .replace(/é/g, 'e')
      .replace(/\s+/g, '-')
    return `badge-tipo ${tipoNormalizado}`
  }

  const getStatusLabel = (status) => {
    const labels = {
      'pago': 'Pago',
      'vencido': 'Vencido',
      'a_vencer': 'A Vencer'
    }
    return labels[status] || 'A Vencer'
  }

  const alterarStatus = async (gasto, novoStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/api/gastos/${gasto.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...gasto,
          status: novoStatus
        }),
      })
      if (response.ok) {
        window.dispatchEvent(new CustomEvent('atualizarGastos'))
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
    }
  }

  const limparFiltros = () => {
    setDataInicial('')
    setDataFinal('')
  }

  const irParaPagina = (pagina) => {
    if (pagina >= 1 && pagina <= totalPaginas) {
      setPaginaAtual(pagina)
    }
  }

  return (
    <div className="card">
      <h4>Lista de Gastos ({gastosFiltrados.length})</h4>
      
      {/* Controles de filtro e paginação */}
      <div className="filtros-container">
        <div className="filtros-data">
          <div className="campo-filtro">
            <label>Data Inicial</label>
            <input
              type="date"
              value={dataInicial}
              onChange={(e) => setDataInicial(e.target.value)}
              className="input-filtro"
            />
          </div>
          <div className="campo-filtro">
            <label>Data Final</label>
            <input
              type="date"
              value={dataFinal}
              onChange={(e) => setDataFinal(e.target.value)}
              className="input-filtro"
            />
          </div>
          <button className="btn-limpar-filtros" onClick={limparFiltros}>
            Limpar Filtros
          </button>
        </div>
        
        <div className="controles-paginacao">
          <div className="campo-filtro">
            <label>Itens por página</label>
            <select
              value={itensPorPagina}
              onChange={(e) => {
                setItensPorPagina(parseInt(e.target.value))
                setPaginaAtual(1)
              }}
              className="select-itens"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
            </select>
          </div>
        </div>
      </div>

      {gastosFiltrados.length === 0 ? (
        <div className="lista-vazia">
          <div className="sub">
            {gastos.length === 0 ? 
              'Nenhum gasto cadastrado ainda.' : 
              'Nenhum gasto encontrado para o filtro aplicado.'
            }
          </div>
        </div>
      ) : (
        <>
          <div className="tabela-container">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Valor</th>
                  <th>Tipo</th>
                  <th>Data</th>
                  <th>Parcelas</th>
                  <th>Categoria</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {gastosExibidos.map(gasto => {
                  const status = calcularStatus(gasto)
                  return (
                    <tr key={gasto.id} className={`linha-tabela status-${status}`}>
                      <td>{gasto.descricao}</td>
                      <td className="valor-celula">{formatarValor(gasto.valor)}</td>
                      <td>
                        <span className={getBadgeTipo(gasto.tipo)}>
                          {gasto.tipo}
                        </span>
                      </td>
                      <td>{formatarData(gasto.data)}</td>
                      <td>{gasto.parcelas > 1 ? `${gasto.parcelas}x` : '1x'}</td>
                      <td>{gasto.categoria || '-'}</td>
                      <td>
                        <div className="status-container">
                          <span className={`badge-status badge-${status}`}>
                            {getStatusLabel(status)}
                          </span>
                          {status !== 'pago' && (
                            <button 
                              className="btn-pagar"
                              onClick={() => alterarStatus(gasto, 'pago')}
                              title="Marcar como pago"
                            >
                              ✓
                            </button>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="acoes-celula">
                          <button className="btn-acao" onClick={() => onEditar(gasto)}>
                            <IconeEditar />
                          </button>
                          <button className="btn-acao btn-excluir" onClick={() => onExcluir(gasto.id)}>
                            <IconeExcluir />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="paginacao">
              <button 
                className="btn-pagina"
                onClick={() => irParaPagina(paginaAtual - 1)}
                disabled={paginaAtual === 1}
              >
                Anterior
              </button>
              
              <div className="numeros-pagina">
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(pagina => (
                  <button
                    key={pagina}
                    className={`btn-numero-pagina ${paginaAtual === pagina ? 'ativo' : ''}`}
                    onClick={() => irParaPagina(pagina)}
                  >
                    {pagina}
                  </button>
                ))}
              </div>
              
              <button 
                className="btn-pagina"
                onClick={() => irParaPagina(paginaAtual + 1)}
                disabled={paginaAtual === totalPaginas}
              >
                Próxima
              </button>
            </div>
          )}

          <div className="info-paginacao">
            Mostrando {indiceInicial + 1} a {Math.min(indiceFinal, gastosFiltrados.length)} de {gastosFiltrados.length} itens
          </div>
        </>
      )}
    </div>
  )
}
