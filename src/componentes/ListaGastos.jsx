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
  const [filtrosVisiveis, setFiltrosVisiveis] = useState(false)

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

    // Ordenar por prioridade: vencido > a_vencer > pago
    const prioridade = { vencido: 1, a_vencer: 2, pago: 3 };
    resultado.sort((a, b) => {
      const sa = calcularStatus(a);
      const sb = calcularStatus(b);
      const pa = prioridade[sa] ?? 99;
      const pb = prioridade[sb] ?? 99;
      if (pa !== pb) return pa - pb;
      // empate: data mais próxima primeiro
      return new Date(a.data) - new Date(b.data);
    });


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

  const getBadgeTipo = (tipo = '') => {
    const normalizado = String(tipo)
      .normalize('NFD')                 // remove acentos
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replace(/\s+/g, '-')

    // aliases e fallback
    let classe = normalizado
    if (normalizado.includes('debito')) classe = 'debito'
    if (normalizado === 'debito-automatico') classe = 'debito'

    return `badge-tipo ${classe}`
  }


  // Padronizar textos de status e tipo de pagamento
  const getStatusLabel = (status) => {
    if (!status) return status;
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const padronizarTexto = (texto) => {
    if (!texto) return texto;
    return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
  };


  const alterarStatus = async (gasto, novoStatus) => {
    try {
      const usuarioAuth = JSON.parse(localStorage.getItem('usuario'));
      if (!usuarioAuth || !usuarioAuth.token) {
        console.error('Token não encontrado')
        return
      }

      const response = await fetch(`${API_BASE_URL}/api/gastos/${gasto.id}`, {

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

      {/* Botão para mostrar/ocultar filtros no mobile */}
      <div className="filtros-toggle-mobile">
        <button
          className="btn-toggle-filtros"
          onClick={() => setFiltrosVisiveis(!filtrosVisiveis)}
        >
          <i className={`fas ${filtrosVisiveis ? 'fa-times' : 'fa-filter'}`}></i>
          {filtrosVisiveis ? 'Ocultar Filtros' : 'Filtros'}
          {(termoPesquisa || dataInicial || dataFinal || statusFiltro) && (
            <span className="filtros-ativos-indicator">●</span>
          )}
        </button>
      </div>

      {/* Controles de filtro e paginação */}
      <div className={`filtros-container ${filtrosVisiveis ? 'filtros-visiveis' : 'filtros-ocultos'}`}>
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
                      <td>{padronizarTexto(gasto.descricao)}</td>
                      <td className="valor-celula">{formatarValor(gasto.valor)}</td>
                      <td>
                        <span className={getBadgeTipo(gasto.tipo)}>
                          {padronizarTexto(gasto.tipo)}
                        </span>
                      </td>
                      <td>{formatarData(gasto.data)}</td>
                      <td>{gasto.totalParcelas > 1 ? `${gasto.parcelas}/${gasto.totalParcelas}` : '1x'}</td>
                      <td>{gasto.categoria ? padronizarTexto(gasto.categoria) : '-'}</td>
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
                              <i className="fas fa-check"></i>
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
                        {padronizarTexto(gasto.descricao)}
                      </h3>
                      <span className="card-valor">{formatarValor(gasto.valor)}</span>
                    </div>

                    <div className="card-detalhes">
                      <div className="card-detalhe">
                        <span className="card-detalhe-label">Descrição</span>
                        <span className="card-detalhe-valor">{padronizarTexto(gasto.descricao)}</span>
                      </div>
                      <div className="card-detalhe">
                        <span className="card-detalhe-label">Valor</span>
                        <span className="card-detalhe-valor">R$ {gasto.valor.toFixed(2)}</span>
                      </div>
                      <div className="card-detalhe">
                        <span className="card-detalhe-label">Tipo</span>
                        <span className="card-detalhe-valor">{padronizarTexto(gasto.tipo)}</span>
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
                          {gasto.categoria ? padronizarTexto(gasto.categoria) : '-'}
                        </span>
                      </div>

                      <div className="card-detalhe">
                        <span className="card-detalhe-label">Ação</span>
                        <span className="card-detalhe-valor">
                          {status !== 'pago' && (
                            <button
                              className="btn-pagar-card"
                              onClick={() => alterarStatus(gasto, 'pago')}
                              title="Marcar como pago"
                            >
                              <i className="fas fa-check"></i>
                            </button>
                          )}
                        </span>
                      </div>
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