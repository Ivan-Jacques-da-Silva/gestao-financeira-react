
import React, { useState, useEffect } from 'react'
import { IconeEditar, IconeExcluir } from './Icones.jsx'

export default function ListaGastosFixos({ gastosFixos = [], onEditar, onExcluir }) {
  const [itensPorPagina, setItensPorPagina] = useState(10)
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [dataInicial, setDataInicial] = useState('')
  const [dataFinal, setDataFinal] = useState('')
  const [gastosFixosFiltrados, setGastosFixosFiltrados] = useState([])

  // Aplicar filtros quando gastosFixos ou filtros mudarem
  useEffect(() => {
    let resultado = [...gastosFixos]

    // Para gastos fixos, vamos filtrar pela data de criação ou próximo vencimento
    if (dataInicial || dataFinal) {
      resultado = resultado.filter(gastoFixo => {
        // Calcular próximo vencimento com base no dia do vencimento
        const hoje = new Date()
        const proximoVencimento = new Date(hoje.getFullYear(), hoje.getMonth(), gastoFixo.diaVencimento)
        
        // Se o dia já passou este mês, considerar o próximo mês
        if (proximoVencimento < hoje) {
          proximoVencimento.setMonth(proximoVencimento.getMonth() + 1)
        }

        const inicial = dataInicial ? new Date(dataInicial) : null
        const final = dataFinal ? new Date(dataFinal) : null

        if (inicial && proximoVencimento < inicial) return false
        if (final && proximoVencimento > final) return false
        return true
      })
    }

    setGastosFixosFiltrados(resultado)
    setPaginaAtual(1) // Reset para primeira página ao filtrar
  }, [gastosFixos, dataInicial, dataFinal])

  // Calcular paginação
  const totalPaginas = Math.ceil(gastosFixosFiltrados.length / itensPorPagina)
  const indiceInicial = (paginaAtual - 1) * itensPorPagina
  const indiceFinal = indiceInicial + itensPorPagina
  const gastosFixosExibidos = gastosFixosFiltrados.slice(indiceInicial, indiceFinal)

  const formatarValor = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const calcularStatus = (gastoFixo) => {
    const hoje = new Date()
    const diaAtual = hoje.getDate()
    const diasParaVencimento = gastoFixo.diaVencimento - diaAtual

    if (gastoFixo.status === 'pago') return 'pago'
    if (diasParaVencimento < 0) return 'vencido'
    if (diasParaVencimento <= 10 && diasParaVencimento >= 0) return 'a_vencer'
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

  const alterarStatus = async (gastoFixo, novoStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/api/gastos-fixos/${gastoFixo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...gastoFixo,
          status: novoStatus
        }),
      })
      if (response.ok) {
        window.dispatchEvent(new CustomEvent('atualizarGastosFixos'))
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
      <h4>Lista de Gastos Fixos ({gastosFixosFiltrados.length})</h4>
      
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

      {gastosFixosFiltrados.length === 0 ? (
        <div className="lista-vazia">
          <div className="sub">
            {gastosFixos.length === 0 ? 
              'Nenhum gasto fixo cadastrado ainda.' : 
              'Nenhum gasto fixo encontrado para o filtro aplicado.'
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
                  <th>Vencimento</th>
                  <th>Categoria</th>
                  <th>Ativo</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {gastosFixosExibidos.map(gastoFixo => {
                  const status = calcularStatus(gastoFixo)
                  return (
                    <tr key={gastoFixo.id} className={`linha-tabela status-${status} ${!gastoFixo.ativo ? 'inativo' : ''}`}>
                      <td>
                        {gastoFixo.descricao}
                        {!gastoFixo.ativo && <span className="badge-inativo">Inativo</span>}
                      </td>
                      <td className="valor-celula">{formatarValor(gastoFixo.valor)}</td>
                      <td>
                        <span className={getBadgeTipo(gastoFixo.tipo)}>
                          {gastoFixo.tipo}
                        </span>
                      </td>
                      <td>Dia {gastoFixo.diaVencimento}</td>
                      <td>{gastoFixo.categoria || '-'}</td>
                      <td>
                        <span className={`badge-ativo ${gastoFixo.ativo ? 'ativo' : 'inativo'}`}>
                          {gastoFixo.ativo ? 'Sim' : 'Não'}
                        </span>
                      </td>
                      <td>
                        <div className="status-container">
                          <span className={`badge-status badge-${status}`}>
                            {getStatusLabel(status)}
                          </span>
                          {status !== 'pago' && gastoFixo.ativo && (
                            <button 
                              className="btn-pagar"
                              onClick={() => alterarStatus(gastoFixo, 'pago')}
                              title="Marcar como pago"
                            >
                              ✓
                            </button>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="acoes-celula">
                          <button className="btn-acao" onClick={() => onEditar(gastoFixo)}>
                            <IconeEditar />
                          </button>
                          <button className="btn-acao btn-excluir" onClick={() => onExcluir(gastoFixo.id)}>
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
            Mostrando {indiceInicial + 1} a {Math.min(indiceFinal, gastosFixosFiltrados.length)} de {gastosFixosFiltrados.length} itens
          </div>
        </>
      )}
    </div>
  )
}
