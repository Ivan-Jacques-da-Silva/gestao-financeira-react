import React, { useState, useEffect } from 'react'
import { IconeEditar, IconeExcluir } from './Icones.jsx'

export default function ListaGastos({ gastos = [], onEditar, onExcluir, setGastos }) {
  const [itensPorPagina, setItensPorPagina] = useState(10)
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [dataInicial, setDataInicial] = useState('')
  const [dataFinal, setDataFinal] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('')
  const [termoPesquisa, setTermoPesquisa] = useState('')
  const [gastosFiltrados, setGastosFiltrados] = useState([])

  const API_BASE_URL = "https://api.vision.dev.br"

  // Aplicar filtros quando gastos ou filtros mudarem
  useEffect(() => {
    let resultado = [...gastos]

    // Filtro por pesquisa de descrição
    if (termoPesquisa) {
      resultado = resultado.filter(gasto =>
        gasto.descricao.toLowerCase().includes(termoPesquisa.toLowerCase())
      )
    }

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

    // Filtro por status
    if (statusFiltro) {
      resultado = resultado.filter(gasto => {
        const status = calcularStatus(gasto)
        return status === statusFiltro
      })
    }

    // Ordenar por data (mais recente primeiro)
    resultado.sort((a, b) => new Date(b.data) - new Date(a.data))

    setGastosFiltrados(resultado)
    setPaginaAtual(1) // Reset para primeira página ao filtrar
  }, [gastos, dataInicial, dataFinal, statusFiltro, termoPesquisa])

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
      const usuarioAuth = JSON.parse(localStorage.getItem('usuario'));
      if (!usuarioAuth || !usuarioAuth.token) {
        console.error('Token não encontrado')
        return
      }

      // const response = await fetch(`http://localhost:5000/api/gastos/${gasto.id}`, {
      const response = await fetch(`${API_BASE_URL}/gastos/${gasto.id}`, {

        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${usuarioAuth.token}`
        },
        body: JSON.stringify({
          ...gasto,
          status: novoStatus
        }),
      })
      if (response.ok) {
        // Atualizar o estado no componente pai
        if (setGastos) {
          const gastosAtualizados = gastos.map(g =>
            g.id === gasto.id ? { ...g, status: novoStatus } : g
          )
          setGastos(gastosAtualizados)
        }

        // Disparar evento para atualizar outros componentes
        window.dispatchEvent(new CustomEvent('atualizarGastos'))
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
    }
  }

  const limparFiltros = () => {
    setDataInicial('')
    setDataFinal('')
    setStatusFiltro('')
    setTermoPesquisa('')
  }

  const irParaPagina = (pagina) => {
    if (pagina >= 1 && pagina <= totalPaginas) {
      setPaginaAtual(pagina)
    }
  }

  // Função para gerar números de páginas com elipses
  const gerarNumerosPaginas = () => {
    const nums = []
    const delta = 2 // Quantas páginas mostrar antes e depois da atual

    // Sempre incluir primeira página
    if (totalPaginas > 1) {
      nums.push(1)
    }

    // Calcular início e fim do range central
    let inicio = Math.max(2, paginaAtual - delta)
    let fim = Math.min(totalPaginas - 1, paginaAtual + delta)

    // Adicionar elipse no início se necessário
    if (inicio > 2) {
      nums.push('...')
    }

    // Adicionar páginas do range central
    for (let i = inicio; i <= fim; i++) {
      if (i > 1 && i < totalPaginas) {
        nums.push(i)
      }
    }

    // Adicionar elipse no final se necessário
    if (fim < totalPaginas - 1) {
      nums.push('...')
    }

    // Sempre incluir última página
    if (totalPaginas > 1) {
      nums.push(totalPaginas)
    }

    return nums
  }

  return (
    <div className="card">
      <h4>Lista de Gastos ({gastosFiltrados.length})</h4>

      {/* Controles de filtro e paginação */}
      <div className="filtros-container">
        <div className="filtros-data">
          <div className="campo-filtro">
            <label>Pesquisar</label>
            <input
              type="text"
              value={termoPesquisa}
              onChange={(e) => setTermoPesquisa(e.target.value)}
              placeholder="Pesquisar por descrição..."
              className="input-filtro"
            />
          </div>
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
          <div className="campo-filtro">
            <label>Status</label>
            <select
              value={statusFiltro}
              onChange={(e) => setStatusFiltro(e.target.value)}
              className="select-filtro"
            >
              <option value="">Todos os Status</option>
              <option value="pago">🟢 Pago</option>
              <option value="a_vencer">🟡 A Vencer</option>
              <option value="vencido">🔴 Vencido</option>
            </select>
          </div>
        </div>

        <div className="controles-linha">
          <button className="btn-limpar-filtros" onClick={limparFiltros}>
            Limpar Filtros
          </button>

          <div className="controles-paginacao">
            <label htmlFor="itensPorPagina">Itens por página:</label>
            <select
              id="itensPorPagina"
              value={itensPorPagina}
              onChange={(e) => setItensPorPagina(Number(e.target.value))}
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
            {/* Tabela Desktop */}
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

            {/* Cards Mobile */}
            <div className="tabela-cards">
              {gastosExibidos.map(gasto => {
                const status = calcularStatus(gasto)
                return (
                  <div key={gasto.id} className={`card-item status-${status}`}>
                    <div className="card-header">
                      <h3 className="card-titulo">
                        {gasto.descricao}
                      </h3>
                      <span className="card-valor">{formatarValor(gasto.valor)}</span>
                    </div>

                    <div className="card-detalhes">
                      <div className="card-detalhe">
                        <span className="card-detalhe-label">Tipo</span>
                        <span className="card-detalhe-valor">
                          <span className={getBadgeTipo(gasto.tipo)}>
                            {gasto.tipo}
                          </span>
                        </span>
                      </div>
                      <div className="card-detalhe">
                        <span className="card-detalhe-label">Data</span>
                        <span className="card-detalhe-valor">
                          {formatarData(gasto.data)}
                        </span>
                      </div>
                      <div className="card-detalhe">
                        <span className="card-detalhe-label">Status</span>
                        <span className="card-detalhe-valor">
                          <span className={`badge-status badge-${status}`}>
                            {getStatusLabel(status)}
                          </span>
                        </span>
                      </div>
                      <div className="card-detalhe">
                        <span className="card-detalhe-label">Parcelas</span>
                        <span className="card-detalhe-valor">{gasto.totalParcelas > 1 ? `${gasto.parcelas}/${gasto.totalParcelas}` : '1x'}</span>
                      </div>
                      <div className="card-detalhe">
                        <span className="card-detalhe-label">Categoria</span>
                        <span className="card-detalhe-valor">
                          {gasto.categoria || '-'}
                        </span>
                      </div>

                      {status !== 'pago' && (
                        <div className="card-detalhe">
                          <span className="card-detalhe-label">Ação</span>
                          <span className="card-detalhe-valor">
                            <button
                              className="btn-pagar"
                              onClick={() => alterarStatus(gasto, 'pago')}
                              title="Marcar como pago"
                            >
                              Marcar como Pago
                            </button>
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="card-acoes">
                      <button className="btn-acao" onClick={() => onEditar(gasto)}>
                        <IconeEditar />
                      </button>
                      <button className="btn-acao btn-excluir" onClick={() => onExcluir(gasto.id)}>
                        <IconeExcluir />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
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
                {gerarNumerosPaginas().map((item, index) =>
                  item === '...' ? (
                    <span key={index} className="elipse-paginacao">...</span>
                  ) : (
                    <button
                      key={item}
                      className={`btn-numero-pagina ${paginaAtual === item ? 'ativo' : ''}`}
                      onClick={() => irParaPagina(item)}
                    >
                      {item}
                    </button>
                  )
                )}
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
    </div >
  )
}