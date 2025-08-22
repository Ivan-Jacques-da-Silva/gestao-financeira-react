import React, { useState, useEffect } from "react";
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

  const API_BASE_URL = "https://api.vision.dev.br"

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

    // Ordenar por dia de vencimento (mais próximo primeiro no mês atual)
    const hoje = new Date();
    const diaAtual = hoje.getDate();

    resultado.sort((a, b) => {
      // Calcular distância até o próximo vencimento
      const calcularDistancia = (diaVencimento) => {
        if (diaVencimento >= diaAtual) {
          return diaVencimento - diaAtual; // Vencimento ainda neste mês
        } else {
          return 30 - diaAtual + diaVencimento; // Vencimento no próximo mês
        }
      };

      const distanciaA = calcularDistancia(a.diaVencimento);
      const distanciaB = calcularDistancia(b.diaVencimento);

      return distanciaA - distanciaB;
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

  const getBadgeTipo = (tipo) => {
    const tipoNormalizado = tipo
      .toLowerCase()
      .replace(/ã/g, "a")
      .replace(/é/g, "e")
      .replace(/\s+/g, "-");
    return `badge-tipo ${tipoNormalizado}`;
  };

  const getStatusLabel = (status) => {
    const labels = {
      pago: "Pago",
      atrasado: "Atrasado",
      a_vencer: "A Vencer",
      futuro: "Futuro",
    };
    return labels[status] || "A Vencer";
  };

  const alterarStatus = async (gastoFixo, novoStatus) => {
    try {
      const usuarioAuth = JSON.parse(localStorage.getItem("usuario"));
      if (!usuarioAuth || !usuarioAuth.token) {
        console.error("Token não encontrado");
        return;
      }

      const response = await fetch(
        // `http://localhost:5000/api/gastos-fixos/${gastoFixo.id}`,
        `${API_BASE_URL}/gastos-fixos/api/${gastoFixo.id}`,
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
                      <td>{gastoFixo.descricao}</td>
                      <td className="valor-celula">
                        {formatarValor(gastoFixo.valor)}
                      </td>
                      <td>
                        <span className={getBadgeTipo(gastoFixo.tipo)}>
                          {gastoFixo.tipo}
                        </span>
                      </td>
                      <td>
                        {new Date(gastoFixo.dataVencimento).toLocaleDateString(
                          "pt-BR",
                        )}
                      </td>
                      <td>{gastoFixo.categoria || "-"}</td>
                      <td>
                        <div className="status-container">
                          <span className={`badge-status badge-${status}`}>
                            {getStatusLabel(status)}
                          </span>
                          <button
                            className={`btn-pagar ${status === "pago" ? "pago" : ""}`}
                            onClick={() => status !== "pago" ? alterarStatus(gastoFixo, "pago") : null}
                            title={status === "pago" ? "Já está pago" : "Marcar como pago"}
                            disabled={status === "pago"}
                          >
                            <i className={`fas ${status === "pago" ? "fa-check" : "fa-check"}`}></i>
                          </button>
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
                            onClick={() => onExcluir(gastoFixo.id)}
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
                      <h3 className="card-titulo">{gastoFixo.descricao}</h3>
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
                            {gastoFixo.tipo}
                          </span>
                        </span>
                      </div>
                      <div className="card-detalhe">
                        <span className="card-detalhe-label">Categoria</span>
                        <span className="card-detalhe-valor">
                          {gastoFixo.categoria || "-"}
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
                      <button
                        className={`btn-pagar-card ${status === "pago" ? "pago" : ""}`}
                        onClick={() => status !== "pago" ? alterarStatus(gastoFixo, "pago") : null}
                        title={status === "pago" ? "Já está pago" : "Marcar como pago"}
                        disabled={status === "pago"}
                      >
                        <i className={`fas ${status === "pago" ? "fa-check" : "fa-check"}`}></i>
                        {status === "pago" ? " Pago" : " Marcar"}
                      </button>
                      <button
                        className="btn-acao"
                        onClick={() => onEditar(gastoFixo)}
                      >
                        <IconeEditar />
                      </button>
                      <button
                        className="btn-acao btn-excluir"
                        onClick={() => onExcluir(gastoFixo.id)}
                      >
                        <IconeExcluir />
                      </button>
                    </div>
                  </div>
                );
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
