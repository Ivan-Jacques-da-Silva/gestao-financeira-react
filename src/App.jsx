import React, { useState, useEffect } from 'react'
import './estilos/estilos.css'
import CardKPI from './componentes/CardKPI.jsx'
import GraficoPizza from './componentes/GraficoPizza.jsx'
import GraficoLinha from './componentes/GraficoLinha.jsx'
import FormularioGasto from './componentes/FormularioGasto.jsx'
import FormularioGastoDropdown from './componentes/FormularioGastoDropdown.jsx'
import ListaGastos from './componentes/ListaGastos.jsx'
import FormularioGastoFixo from './componentes/FormularioGastoFixo.jsx'
import FormularioGastoFixoDropdown from './componentes/FormularioGastoFixoDropdown.jsx'
import ListaGastosFixos from './componentes/ListaGastosFixos.jsx'
import { IconeCartao, IconeGrafico, IconeSeta, IconeAlerta, IconeOlho } from './componentes/Icones.jsx'
import TelaAuth from './componentes/TelaAuth'

const API_BASE_URL = 'http://localhost:5000/api'

export default function App(){
  const [aba, setAba] = useState('dashboard')
  const [usuario, setUsuario] = useState(null)
  const [mostrar, setMostrar] = useState(false)

  // Estados para gastos e parcelas
  const [gastos, setGastos] = useState([])
  const [gastoEdicao, setGastoEdicao] = useState(null)

  // Estados para gastos fixos
  const [gastosFixos, setGastosFixos] = useState([])
  const [gastoFixoEdicao, setGastoFixoEdicao] = useState(null)

  // Verificar autenticação no carregamento e adicionar função de logout
  useEffect(() => {
    // Verificar se há usuário logado
    const usuarioSalvo = localStorage.getItem('usuario')
    if (usuarioSalvo) {
      try {
        setUsuario(JSON.parse(usuarioSalvo))
      } catch (error) {
        localStorage.removeItem('usuario')
      }
    }
  }, [])

  useEffect(() => {
    if (usuario) {
      carregarDados()
    }
  }, [usuario])

  const carregarDados = async () => {
    try {
      // Carregar gastos
      const responseGastos = await fetch(`${API_BASE_URL}/gastos`, {
        headers: {
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('usuario')).token}`
        }
      });
      if (responseGastos.ok) {
        const dataGastos = await responseGastos.json();
        setGastos(Array.isArray(dataGastos) ? dataGastos : []);
      } else {
        console.error('Erro ao carregar gastos:', responseGastos.status);
        setGastos([]);
      }

      // Carregar gastos fixos
      const responseGastosFixos = await fetch(`${API_BASE_URL}/gastos-fixos`, {
        headers: {
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('usuario')).token}`
        }
      });
      if (responseGastosFixos.ok) {
        const dataGastosFixos = await responseGastosFixos.json();
        setGastosFixos(Array.isArray(dataGastosFixos) ? dataGastosFixos : []);
      } else {
        console.error('Erro ao carregar gastos fixos:', responseGastosFixos.status);
        setGastosFixos([]);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setGastos([]);
      setGastosFixos([]);
    }
  };

  // Calcular dados do gráfico de pizza por método de pagamento
  const dadosPizza = React.useMemo(() => {
    const todosDados = [...gastos, ...gastosFixos]
    const agrupados = {}

    todosDados.forEach(item => {
      const tipo = item.tipo || 'Outros'
      if (!agrupados[tipo]) {
        agrupados[tipo] = 0
      }
      agrupados[tipo] += Number(item.valor) || 0
    })

    return Object.entries(agrupados).map(([rotulo, valor]) => ({
      rotulo,
      valor
    }))
  }, [gastos, gastosFixos])

  // Calcular dados do gráfico de linha dos últimos 6 meses
  const dadosLinha = React.useMemo(() => {
    const hoje = new Date()
    const meses = []

    // Gerar os últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
      meses.push({
        ano: data.getFullYear(),
        mes: data.getMonth(),
        valor: 0
      })
    }

    // Somar gastos por mês
    const todosDados = [...gastos, ...gastosFixos]
    todosDados.forEach(item => {
      const dataItem = new Date(item.data || hoje)
      const anoItem = dataItem.getFullYear()
      const mesItem = dataItem.getMonth()

      const mesEncontrado = meses.find(m => m.ano === anoItem && m.mes === mesItem)
      if (mesEncontrado) {
        mesEncontrado.valor += Number(item.valor) || 0
      }
    })

    return meses.map(m => m.valor)
  }, [gastos, gastosFixos])

  // Calcular KPIs reais
  const kpis = React.useMemo(() => {
    const hoje = new Date()
    const mesAtual = hoje.getMonth()
    const anoAtual = hoje.getFullYear()

    // Total gastos no cartão de crédito no mês atual
    const totalCartaoMesAtual = gastos
      .filter(g => {
        const dataGasto = new Date(g.data)
        return g.tipo === 'Cartão de Crédito' &&
               dataGasto.getMonth() === mesAtual &&
               dataGasto.getFullYear() === anoAtual
      })
      .reduce((total, g) => total + Number(g.valor), 0)

    // Total gastos fixos mensais ativos
    const totalGastosFixos = gastosFixos
      .filter(gf => gf.ativo)
      .reduce((total, gf) => total + Number(gf.valor), 0)

    // Média mensal dos últimos 3 meses
    const ultimosTresMeses = []
    for (let i = 2; i >= 0; i--) {
      const data = new Date(anoAtual, mesAtual - i, 1)
      ultimosTresMeses.push({
        ano: data.getFullYear(),
        mes: data.getMonth()
      })
    }

    const totalUltimosTresMeses = ultimosTresMeses.reduce((total, periodo) => {
      const gastosDoMes = gastos
        .filter(g => {
          const dataGasto = new Date(g.data)
          return dataGasto.getMonth() === periodo.mes &&
                 dataGasto.getFullYear() === periodo.ano
        })
        .reduce((soma, g) => soma + Number(g.valor), 0)

      const gastosFixosDoMes = gastosFixos
        .filter(gf => gf.ativo)
        .reduce((soma, gf) => soma + Number(gf.valor), 0)

      return total + gastosDoMes + gastosFixosDoMes
    }, 0)

    const mediaMensal = totalUltimosTresMeses / 3

    // Pagamentos atrasados (status vencido)
    const gastosVencidos = gastos.filter(g => g.status === 'vencido')
    const gastosFixosVencidos = gastosFixos.filter(gf => gf.status === 'vencido')
    const totalVencidos = [...gastosVencidos, ...gastosFixosVencidos]
      .reduce((total, item) => total + Number(item.valor), 0)

    return {
      totalCartaoMesAtual,
      totalGastosFixos,
      mediaMensal,
      totalVencidos,
      quantidadeVencidos: gastosVencidos.length + gastosFixosVencidos.length
    }
  }, [gastos, gastosFixos])

  // Funções para gastos
  const salvarGasto = async (gasto) => {
    try {
      if (gastoEdicao) {
        const response = await fetch(`${API_BASE_URL}/gastos/${gasto.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${JSON.parse(localStorage.getItem('usuario')).token}`
          },
          body: JSON.stringify(gasto),
        })
        if (response.ok) {
          const gastoAtualizado = await response.json()
          setGastos(gastos.map(g => g.id === gasto.id ? gastoAtualizado : g))
          setGastoEdicao(null)
        }
      } else {
        const response = await fetch(`${API_BASE_URL}/gastos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${JSON.parse(localStorage.getItem('usuario')).token}`
          },
          body: JSON.stringify(gasto),
        })
        if (response.ok) {
          const novoGasto = await response.json()
          setGastos([...gastos, novoGasto])
        }
      }
    } catch (error) {
      console.error('Erro ao salvar gasto:', error)
    }
  }

  const editarGasto = (gasto) => {
    setGastoEdicao({
      ...gasto,
      data: new Date(gasto.data).toISOString().split('T')[0]
    })
  }

  const excluirGasto = async (id) => {
    if (confirm('Deseja realmente excluir este gasto?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/gastos/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${JSON.parse(localStorage.getItem('usuario')).token}`
          }
        })
        if (response.ok) {
          setGastos(gastos.filter(g => g.id !== id))
        }
      } catch (error) {
        console.error('Erro ao excluir gasto:', error)
      }
    }
  }

  const cancelarEdicaoGasto = () => {
    setGastoEdicao(null)
  }

  // Funções para gastos fixos
  const salvarGastoFixo = async (gastoFixo) => {
    try {
      if (gastoFixoEdicao) {
        const response = await fetch(`${API_BASE_URL}/gastos-fixos/${gastoFixo.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${JSON.parse(localStorage.getItem('usuario')).token}`
          },
          body: JSON.stringify(gastoFixo),
        })
        if (response.ok) {
          const gastoFixoAtualizado = await response.json()
          setGastosFixos(gastosFixos.map(g => g.id === gastoFixo.id ? gastoFixoAtualizado : g))
          setGastoFixoEdicao(null)
        }
      } else {
        const response = await fetch(`${API_BASE_URL}/gastos-fixos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${JSON.parse(localStorage.getItem('usuario')).token}`
          },
          body: JSON.stringify(gastoFixo),
        })
        if (response.ok) {
          const novoGastoFixo = await response.json()
          setGastosFixos([...gastosFixos, novoGastoFixo])
        }
      }
    } catch (error) {
      console.error('Erro ao salvar gasto fixo:', error)
    }
  }

  const editarGastoFixo = (gastoFixo) => {
    setGastoFixoEdicao(gastoFixo)
  }

  const excluirGastoFixo = async (id) => {
    if (confirm('Deseja realmente excluir este gasto fixo?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/gastos-fixos/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${JSON.parse(localStorage.getItem('usuario')).token}`
          }
        })
        if (response.ok) {
          setGastosFixos(gastosFixos.filter(g => g.id !== id))
        }
      } catch (error) {
        console.error('Erro ao excluir gasto fixo:', error)
      }
    }
  }

  const cancelarEdicaoGastoFixo = () => {
    setGastoFixoEdicao(null)
  }

  const formatarValor = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const handleLogin = (dadosUsuario) => {
    setUsuario(dadosUsuario)
    localStorage.setItem('usuario', JSON.stringify(dadosUsuario))
  }

  const handleLogout = () => {
    localStorage.removeItem('usuario')
    setUsuario(null)
    setGastos([])
    setGastosFixos([])
  }

  // Se não há usuário logado, mostrar tela de autenticação
  if (!usuario) {
    return <TelaAuth onLogin={handleLogin} />
  }

  return (
    <div className="app">
      {/* Header Desktop */}
      <header className="header">
        <div className="header-titulo">
          <i className="fas fa-wallet"></i>
          <h1>Gestão Financeira</h1>
        </div>
        <div className="header-usuario">
          <span>Olá, {usuario.usuario}!</span>
          <button onClick={handleLogout} className="botao-logout">
            <i className="fas fa-sign-out-alt"></i>
            Sair
          </button>
        </div>
      </header>

      <div className="container">
        <div className="titulo">Gestão Financeira Pessoal</div>

        <div className="topbar">
          <div className="tabs">
            <div className={['tab', aba==='dashboard'?'ativo':''].join(' ')} onClick={()=>setAba('dashboard')}>Dashboard</div>
            <div className={['tab', aba==='gastos'?'ativo':''].join(' ')} onClick={()=>setAba('gastos')}>Gastos e Parcelas</div>
            <div className={['tab', aba==='fixos'?'ativo':''].join(' ')} onClick={()=>setAba('fixos')}>Gastos Fixos</div>
          </div>

          <button className="btn-mostrar" onClick={()=>setMostrar(v=>!v)}>
            <IconeOlho /> {mostrar ? 'Ocultar Valores' : 'Mostrar Valores'}
          </button>
        </div>

        {/* Menu Mobile Fixo */}
        <div className="menu-mobile">
          <div className="menu-mobile-items">
            <div
              className={['menu-mobile-item', aba==='dashboard'?'ativo':''].join(' ')}
              onClick={()=>setAba('dashboard')}
            >
              <i className="fas fa-tachometer-alt"></i>
              <span>Dashboard</span>
            </div>
            <div
              className={['menu-mobile-item', aba==='gastos'?'ativo':''].join(' ')}
              onClick={()=>setAba('gastos')}
            >
              <i className="fas fa-credit-card"></i>
              <span>Gastos e Parcelas</span>
            </div>
            <div
              className={['menu-mobile-item', aba==='fixos'?'ativo':''].join(' ')}
              onClick={()=>setAba('fixos')}
            >
              <i className="fas fa-calendar-alt"></i>
              <span>Gastos Fixos</span>
            </div>
          </div>
        </div>

        {aba==='dashboard' && (
          <>
            {/* Desktop Layout */}
            <div className="grid" style={{gridTemplateColumns:'repeat(12,1fr)', display: 'none'}}>
              <div style={{gridColumn:'span 3'}}>
                <CardKPI
                  titulo="Cartão de Crédito"
                  valorVisivel={`R$ ${kpis.totalCartaoMesAtual.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`}
                  esconder={!mostrar}
                  subtitulo="Total no mês atual"
                  icone={<IconeCartao />}
                />
              </div>
              <div style={{gridColumn:'span 3'}}>
                <CardKPI
                  titulo="Gastos Fixos"
                  valorVisivel={`R$ ${kpis.totalGastosFixos.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`}
                  esconder={!mostrar}
                  subtitulo="Total mensal"
                  icone={<IconeGrafico />}
                />
              </div>
              <div style={{gridColumn:'span 3'}}>
                <CardKPI
                  titulo="Média Mensal"
                  valorVisivel={`R$ ${kpis.mediaMensal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`}
                  esconder={!mostrar}
                  subtitulo="Últimos 3 meses"
                  icone={<IconeSeta />}
                />
              </div>
              <div style={{gridColumn:'span 3'}}>
                <CardKPI
                  titulo="Pagamentos Atrasados"
                  valorVisivel={<><span>R$ {kpis.totalVencidos.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span><div className='sub'>{kpis.quantidadeVencidos} item(s) atrasado(s)</div></>}
                  esconder={!mostrar}
                  subtitulo=""
                  icone={<IconeAlerta />}
                />
              </div>
            </div>

            {/* Mobile Layout - Cards em coluna */}
            <div className="grid-dashboard-mobile">
              <div className="card-kpi">
                <CardKPI
                  titulo="Cartão de Crédito"
                  valorVisivel={`R$ ${kpis.totalCartaoMesAtual.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`}
                  esconder={!mostrar}
                  subtitulo="Total no mês atual"
                  icone={<IconeCartao />}
                />
              </div>
              <div className="card-kpi">
                <CardKPI
                  titulo="Gastos Fixos"
                  valorVisivel={`R$ ${kpis.totalGastosFixos.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`}
                  esconder={!mostrar}
                  subtitulo="Total mensal"
                  icone={<IconeGrafico />}
                />
              </div>
              <div className="card-kpi">
                <CardKPI
                  titulo="Média Mensal"
                  valorVisivel={`R$ ${kpis.mediaMensal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`}
                  esconder={!mostrar}
                  subtitulo="Últimos 3 meses"
                  icone={<IconeSeta />}
                />
              </div>
              <div className="card-kpi">
                <CardKPI
                  titulo="Pagamentos Atrasados"
                  valorVisivel={<><span>R$ {kpis.totalVencidos.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span><div className='sub'>{kpis.quantidadeVencidos} item(s) atrasado(s)</div></>}
                  esconder={!mostrar}
                  subtitulo=""
                  icone={<IconeAlerta />}
                />
              </div>

              <div className="card">
                <h4>Distribuição por Tipo de Gasto</h4>
                <div className="sub">Proporção de gastos por método de pagamento</div>
                <div className="area-graficos">
                  <GraficoPizza dados={dadosPizza} esconder={!mostrar} />
                </div>
              </div>

              <div className="card">
                <h4>Evolução de Gastos</h4>
                <div className="sub">Total de gastos nos últimos 6 meses</div>
                <div className="area-graficos">
                  <GraficoLinha series={dadosLinha} esconder={!mostrar} />
                </div>
              </div>
            </div>

            {/* Desktop Layout - Gráficos lado a lado */}
            <div className="grid" style={{gridTemplateColumns:'repeat(12,1fr)', display: 'none'}}>
              <div style={{gridColumn:'span 6'}} className="card">
                <h4>Distribuição por Tipo de Gasto</h4>
                <div className="sub">Proporção de gastos por método de pagamento</div>
                <div className="area-graficos">
                  <GraficoPizza dados={dadosPizza} esconder={!mostrar} />
                </div>
              </div>

              <div style={{gridColumn:'span 6'}} className="card">
                <h4>Evolução de Gastos</h4>
                <div className="sub">Total de gastos nos últimos 6 meses</div>
                <div className="area-graficos">
                  <GraficoLinha series={dadosLinha} esconder={!mostrar} />
                </div>
              </div>
            </div>
          </>
        )}

        {aba==='gastos' && (
          <>
            {/* Desktop Layout */}
            <div className="grid" style={{gridTemplateColumns:'repeat(12,1fr)', display: 'none'}}>
              <div style={{gridColumn:'span 5'}}>
                <FormularioGasto
                  gasto={gastoEdicao}
                  onSalvar={salvarGasto}
                  onCancelar={cancelarEdicaoGasto}
                />
              </div>
              <div style={{gridColumn:'span 7'}}>
                <ListaGastos
                  gastos={gastos}
                  onEditar={editarGasto}
                  onExcluir={excluirGasto}
                />
              </div>
            </div>

            {/* Mobile Layout */}
            <div className="grid-mobile-form">
              <div className="form-container-mobile">
                <FormularioGastoDropdown
                  gasto={gastoEdicao}
                  onSalvar={salvarGasto}
                  onCancelar={cancelarEdicaoGasto}
                />
              </div>
              <div className="list-container-mobile">
                <ListaGastos
                  gastos={gastos}
                  onEditar={editarGasto}
                  onExcluir={excluirGasto}
                />
              </div>
            </div>
          </>
        )}

        {aba==='fixos' && (
          <>
            {/* Desktop Layout */}
            <div className="grid" style={{gridTemplateColumns:'repeat(12,1fr)', display: 'none'}}>
              <div style={{gridColumn:'span 5'}}>
                <FormularioGastoFixo
                  gastoFixo={gastoFixoEdicao}
                  onSalvar={salvarGastoFixo}
                  onCancelar={cancelarEdicaoGastoFixo}
                />
              </div>
              <div style={{gridColumn:'span 7'}}>
                <ListaGastosFixos
                  gastosFixos={gastosFixos}
                  onEditar={editarGastoFixo}
                  onExcluir={excluirGastoFixo}
                />
              </div>
            </div>

            {/* Mobile Layout */}
            <div className="grid-mobile-form">
              <div className="form-container-mobile">
                <FormularioGastoFixoDropdown
                  gastoFixo={gastoFixoEdicao}
                  onSalvar={salvarGastoFixo}
                  onCancelar={cancelarEdicaoGastoFixo}
                />
              </div>
              <div className="list-container-mobile">
                <ListaGastosFixos
                  gastosFixos={gastosFixos}
                  onEditar={editarGastoFixo}
                  onExcluir={excluirGastoFixo}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}