import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { IconeEditar, IconeExcluir } from "./Icones.jsx";

export default function ListaGastosFixos({
  gastosFixos = [],
  onEditar,
  onExcluir,
  setGastosFixos,
}) {
  const [itensPorPagina, setItensPorPagina] = useState(10);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("");
  const [termoPesquisa, setTermoPesquisa] = useState("");
  const [gastosFixosFiltrados, setGastosFixosFiltrados] = useState([]);
  const [filtrosVisiveis, setFiltrosVisiveis] = useState(false);
  const [modal, setModal] = useState({ aberto: false, titulo: '', mensagem: '', onConfirmar: null });

  const API_BASE_URL = "https://api.vision.dev.br"

  const abrirModal = ({ titulo, mensagem, onConfirmar }) =>
    setModal({ aberto: true, titulo, mensagem, onConfirmar });

  const fecharModal = () => setModal({ aberto: false, titulo: '', mensagem: '', onConfirmar: null });

  // 3) TRAVAR SCROLL DO BODY QUANDO MODAL ABRIR
  // Adicione isso dentro do componente:
  useEffect(() => {
    document.body.style.overflow = modal.aberto ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [modal.aberto])


  const confirmarPagar = (item) => {
    abrirModal({
      titulo: 'Marcar como pago',
      mensagem: `Confirmar pagamento de "${item.descricao}"?`,
      onConfirmar: async () => { await alterarStatus(item, 'pago'); fecharModal(); }
    });
  };

  const confirmarExcluir = (item, isFixo = false) => {
    abrirModal({
      titulo: 'Excluir',
      mensagem: `Tem certeza que deseja excluir "${item.descricao}"?`,
      onConfirmar: async () => { onExcluir(item.id); fecharModal(); }
    });
  };



  // Aplicar filtros quando gastosFixos ou filtros mudarem
  useEffect(() => {
    let resultado = [...gastosFixos];

    // Filtro por pesquisa de descrição
    if (termoPesquisa) {
      resultado = resultado.filter((gastoFixo) =>
        gastoFixo.descricao.toLowerCase().includes(termoPesquisa.toLowerCase()),
      );
    }

    // Para gastos fixos, vamos filtrar pela data de criação ou próximo vencimento
    if (dataInicial || dataFinal) {
      resultado = resultado.filter((gastoFixo) => {
        // Calcular próximo vencimento com base no dia do vencimento
        const hoje = new Date();
        const proximoVencimento = new Date(
          hoje.getFullYear(),
          hoje.getMonth(),
          gastoFixo.diaVencimento,
        );

        // Se o dia já passou este mês, considerar o próximo mês
        if (proximoVencimento < hoje) {
          proximoVencimento.setMonth(proximoVencimento.getMonth() + 1);
        }

        const inicial = dataInicial ? new Date(dataInicial) : null;
        const final = dataFinal ? new Date(dataFinal) : null;

        if (inicial && proximoVencimento < inicial) return false;
        if (final && proximoVencimento > final) return false;
        return true;
      });
    }

    // Filtro por status
    if (statusFiltro) {
      resultado = resultado.filter((gastoFixo) => {
        const status = calcularStatus(gastoFixo);
        return status === statusFiltro;
      });
    }

    // Ordenar por prioridade de status: atrasado > a_vencer > pago > futuro
    const prioridadeStatus = {
      atrasado: 1,
      a_vencer: 2,
      pago: 3,
      futuro: 4,
    };

    resultado.sort((a, b) => {
      const statusA = calcularStatus(a);
      const statusB = calcularStatus(b);

      // Primeiro, ordenar por status
      const prioridadeA = prioridadeStatus[statusA] || 99;
      const prioridadeB = prioridadeStatus[statusB] || 99;
      if (prioridadeA !== prioridadeB) {
        return prioridadeA - prioridadeB;
      }

      // Se tiverem o mesmo status, ordenar por data de vencimento
      const dataA = new Date(a.dataVencimento);
      const dataB = new Date(b.dataVencimento);
      return dataA - dataB;
    });


    setGastosFixosFiltrados(resultado);
    setPaginaAtual(1); // Reset para primeira página ao filtrar
  }, [gastosFixos, dataInicial, dataFinal, statusFiltro, termoPesquisa]);

  // Calcular paginação
  const totalPaginas = Math.ceil(gastosFixosFiltrados.length / itensPorPagina);
  const indiceInicial = (paginaAtual - 1) * itensPorPagina;
  const indiceFinal = indiceInicial + itensPorPagina;
  const gastosFixosExibidos = gastosFixosFiltrados.slice(
    indiceInicial,
    indiceFinal,
  );

  const formatarValor = (valor) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const calcularStatus = (gastoFixo) => {
    if (gastoFixo.status === "pago") return "pago";

    const hoje = new Date();
    const diaAtual = hoje.getDate();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();

    // Extrair o dia de vencimento da data
    const dataVencimentoOriginal = new Date(gastoFixo.dataVencimento);
    const diaVencimento = dataVencimentoOriginal.getDate();

    // Calcular próximo vencimento
    let proximoVencimento = new Date(anoAtual, mesAtual, diaVencimento);

    // Se o dia já passou este mês, considerar o próximo mês
    if (proximoVencimento < hoje) {
      proximoVencimento = new Date(anoAtual, mesAtual + 1, diaVencimento);
    }

    const diasParaVencimento = Math.ceil(
      (proximoVencimento - hoje) / (1000 * 60 * 60 * 24),
    );

    if (diasParaVencimento < 0) return "atrasado";
    if (diasParaVencimento <= 3) return "a_vencer";
    if (diasParaVencimento <= 10) return "a_vencer";
    return "futuro";
  };

  const getBadgeTipo = (tipo = "") => {
    const normalizado = String(tipo)
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .replace(/\s+/g, "-");

    let classe = normalizado;
    if (normalizado.includes("debito")) classe = "debito";           // "débito" ou "débito-automatico"
    if (normalizado === "debito-automatico") classe = "debito";

    return `badge-tipo ${classe}`;
  };


  const getStatusLabel = (status) => {
    if (!status) return status;
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const padronizarTexto = (texto) => {
    if (!texto) return texto;
    return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
  };

  const alterarStatus = async (gastoFixo, novoStatus) => {
    try {
      const usuarioAuth = JSON.parse(localStorage.getItem("usuario"));
      if (!usuarioAuth || !usuarioAuth.token) {
        console.error("Token não encontrado");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/gastos-fixos/${gastoFixo.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${usuarioAuth.token}`,
          },
          body: JSON.stringify({
            ...gastoFixo,
            status: novoStatus,
          }),
        },
      );
      if (response.ok) {
        // Atualizar o estado no componente pai
        if (setGastosFixos) {
          const gastosFixosAtualizados = gastosFixos.map((gf) =>
            gf.id === gastoFixo.id ? { ...gf, status: novoStatus } : gf,
          );
          setGastosFixos(gastosFixosAtualizados);
        }

        // Disparar evento para atualizar outros componentes
        window.dispatchEvent(new CustomEvent("atualizarGastosFixos"));
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  const limparFiltros = () => {
    setDataInicial("");
    setDataFinal("");
    setStatusFiltro("");
    setTermoPesquisa("");
  };

  const irParaPagina = (pagina) => {
    if (pagina >= 1 && pagina <= totalPaginas) {
      setPaginaAtual(pagina);
    }
  };

  // Função para gerar números de páginas com elipses
  const gerarNumerosPaginas = () => {
    const nums = [];
    const delta = 2; // Quantas páginas mostrar antes e depois da atual

    // Sempre incluir primeira página
    if (totalPaginas > 1) {
      nums.push(1);
    }

    // Calcular início e fim do range central
    let inicio = Math.max(2, paginaAtual - delta);
    let fim = Math.min(totalPaginas - 1, paginaAtual + delta);

    // Adicionar elipse no início se necessário
    if (inicio > 2) {
      nums.push("...");
    }

    // Adicionar páginas do range central
    for (let i = inicio; i <= fim; i++) {
      if (i > 1 && i < totalPaginas) {
        nums.push(i);
      }
    }

    // Adicionar elipse no final se necessário
    if (fim < totalPaginas - 1) {
      nums.push("...");
    }

    // Sempre incluir última página
    if (totalPaginas > 1) {
      nums.push(totalPaginas);
    }

    return nums;
  };

  return (
    <div className="card">
      <h4>Lista de Gastos Fixos ({gastosFixosFiltrados.length})</h4>

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
              <option value="atrasado">🔴 Atrasado</option>
              <option value="futuro">🔵 Futuro</option>
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

      {gastosFixosFiltrados.length === 0 ? (
        <div className="lista-vazia">
          <div className="sub">
            {gastosFixos.length === 0
              ? "Nenhum gasto fixo cadastrado ainda."
              : "Nenhum gasto fixo encontrado para o filtro aplicado."}
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
                  <th>Vencimento</th>
                  <th>Categoria</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {gastosFixosExibidos.map((gastoFixo) => {
                  const status = calcularStatus(gastoFixo);
                  return (
                    <tr
                      key={gastoFixo.id}
                      className={`linha-tabela status-${status}`}
                    >
                      <td>{padronizarTexto(gastoFixo.descricao)}</td>
                      <td className="valor-celula">
                        {formatarValor(gastoFixo.valor)}
                      </td>
                      <td>
                        <span className={getBadgeTipo(gastoFixo.tipo)}>
                          {padronizarTexto(gastoFixo.tipo)}
                        </span>
                      </td>
                      <td>
                        {new Date(gastoFixo.dataVencimento).toLocaleDateString(
                          "pt-BR",
                        )}
                      </td>
                      <td>{gastoFixo.categoria ? padronizarTexto(gastoFixo.categoria) : "-"}</td>
                      <td>
                        <div className="status-container">
                          <span className={`badge-status badge-${status}`}>
                            {getStatusLabel(status)}
                          </span>
                          {status !== "pago" && (
                            <button
                              className="btn-pagar"
                              onClick={() => confirmarPagar(gastoFixo)}
                              title="Marcar como pago"
                            >
                              <i className="fas fa-check"></i>
                            </button>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="acoes-celula">
                          <button
                            className="btn-acao"
                            onClick={() => onEditar(gastoFixo)}
                          >
                            <IconeEditar />
                          </button>
                          <button
                            className="btn-acao btn-excluir"
                            sonClick={() => confirmarExcluir(gastoFixo, true)}
                          >
                            <IconeExcluir />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Cards Mobile */}
            <div className="tabela-cards">
              {gastosFixosExibidos.map((gastoFixo) => {
                const status = calcularStatus(gastoFixo);
                return (
                  <div
                    key={gastoFixo.id}
                    className={`card-item status-${status}`}
                  >
                    <div className="card-header">
                      <h3 className="card-titulo">{padronizarTexto(gastoFixo.descricao)}</h3>
                      <span className="card-valor">
                        {formatarValor(gastoFixo.valor)}
                      </span>
                    </div>

                    <div className="card-detalhes">
                      <div className="card-detalhe">
                        <span className="card-detalhe-label">Vencimento</span>
                        <span className="card-detalhe-valor">
                          {new Date(
                            gastoFixo.dataVencimento,
                          ).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      <div className="card-detalhe">
                        <span className="card-detalhe-label">Tipo</span>
                        <span className="card-detalhe-valor">
                          <span className={getBadgeTipo(gastoFixo.tipo)}>
                            {padronizarTexto(gastoFixo.tipo)}
                          </span>
                        </span>
                      </div>
                      <div className="card-detalhe">
                        <span className="card-detalhe-label">Categoria</span>
                        <span className="card-detalhe-valor">
                          {gastoFixo.categoria ? padronizarTexto(gastoFixo.categoria) : "-"}
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
                    </div>

                    <div className="card-acoes">
                      {status !== "pago" && (
                        <button
                          className="btn-pagar-card"
                          onClick={() => confirmarPagar(gastoFixo)}
                          title="Marcar como pago"
                        >
                          <i className="fas fa-check"></i>
                        </button>
                      )}
                      <button
                        className="btn-acao"
                        onClick={() => onEditar(gastoFixo)}
                      >
                        <IconeEditar />
                      </button>
                      <button
                        className="btn-acao btn-excluir"
                        onClick={() => confirmarExcluir(gastoFixo, true)}
                      >
                        <IconeExcluir />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {modal.aberto && ReactDOM.createPortal(
            <div className="modal-overlay" onClick={fecharModal}>
              <div className="modal-caixa" onClick={(e) => e.stopPropagation()}>
                <div className="modal-topo">
                  <h5>{modal.titulo}</h5>
                  <button className="modal-fechar" onClick={fecharModal} aria-label="Fechar">×</button>
                </div>
                <div className="modal-corpo">
                  <p>{modal.mensagem}</p>
                </div>
                <div className="modal-rodape">
                  <button className="btn-cancelar" onClick={fecharModal}>Cancelar</button>
                  <button className="btn-confirmar" onClick={modal.onConfirmar}>Confirmar</button>
                </div>
              </div>
            </div>,
            document.body
          )}


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
                  item === "..." ? (
                    <span key={index} className="elipse-paginacao">
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      className={`btn-numero-pagina ${paginaAtual === item ? "ativo" : ""}`}
                      onClick={() => irParaPagina(item)}
                    >
                      {item}
                    </button>
                  ),
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
            Mostrando {indiceInicial + 1} a{" "}
            {Math.min(indiceFinal, gastosFixosFiltrados.length)} de{" "}
            {gastosFixosFiltrados.length} itens
          </div>
        </>
      )}
    </div>
  );
}