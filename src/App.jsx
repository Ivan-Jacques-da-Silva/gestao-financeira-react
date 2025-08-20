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
import Header from './componentes/Header'
import ModalSenha from './componentes/ModalSenha.jsx'
import ConfiguracaoUsuario from './componentes/ConfiguracaoUsuario.jsx'
import ToastAlert from './componentes/ToastAlert'; // Importar o ToastAlert

// const API_BASE_URL = 'http://localhost:5000/api'
const API_BASE_URL = 'https://api.vision.dev.br'


export default function App() {
  const [aba, setAba] = useState('dashboard')
  const [usuario, setUsuario] = useState(null)
  const [mostrar, setMostrar] = useState(false)
  const [modalSenhaAberto, setModalSenhaAberto] = useState(false)
  const [carregandoModal, setCarregandoModal] = useState(false)
  const [mostrarConfiguracoes, setMostrarConfiguracoes] = useState(false)
  const [toast, setToast] = useState({ visivel: false, mensagem: '', tipo: '' }); // Estado para o ToastAlert
  const [periodoGrafico, setPeriodoGrafico] = useState('mesAtual') // 'mesAtual' ou 'ultimoMes'

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
      setMostrar(usuario.mostrarValores || false)
    }
  }, [usuario])

  // Escutar eventos de atualização
  useEffect(() => {
    const handleAtualizarGastos = () => {
      carregarDados()
    }

    const handleAtualizarGastosFixos = () => {
      carregarDados()
    }

    window.addEventListener('atualizarGastos', handleAtualizarGastos)
    window.addEventListener('atualizarGastosFixos', handleAtualizarGastosFixos)

    return () => {
      window.removeEventListener('atualizarGastos', handleAtualizarGastos)
      window.removeEventListener('atualizarGastosFixos', handleAtualizarGastosFixos)
    }
  }, [usuario])

  const carregarDados = async () => {
    try {
      // Carregar gastos
      const usuarioAuth = JSON.parse(localStorage.getItem('usuario'));
      if (!usuarioAuth || !usuarioAuth.token) return;

      const responseGastos = await fetch(`${API_BASE_URL}/gastos`, {
        headers: {
          'Authorization': `Bearer ${usuarioAuth.token}`
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
          'Authorization': `Bearer ${usuarioAuth.token}`
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
    const agora = new Date()
    const mesAtual = agora.getMonth()
    const anoAtual = agora.getFullYear()

    let dadosFiltrados = []

    if (periodoGrafico === 'mesAtual') {
      // Filtrar apenas dados do mês atual
      const gastosDoMes = gastos.filter(gasto => {
        const dataGasto = new Date(gasto.data)
        return dataGasto.getMonth() === mesAtual && dataGasto.getFullYear() === anoAtual
      })

      const gastosFixosDoMes = gastosFixos

      dadosFiltrados = [...gastosDoMes, ...gastosFixosDoMes]
    } else {
      // Filtrar dados dos últimos 6 meses
      const seismesesAtras = new Date(anoAtual, mesAtual - 5, 1)

      const gastosUltimos6Meses = gastos.filter(gasto => {
        const dataGasto = new Date(gasto.data)
        return dataGasto >= seismesesAtras
      })

      const gastosFixosUltimos6Meses = gastosFixos

      dadosFiltrados = [...gastosUltimos6Meses, ...gastosFixosUltimos6Meses]
    }

    const agrupados = {}

    dadosFiltrados.forEach(item => {
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
  }, [gastos, gastosFixos, periodoGrafico])

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

  // Calcular KPIs
  const kpis = React.useMemo(() => {
    const agora = new Date()
    const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate())
    const mesAtual = agora.getMonth()
    const anoAtual = agora.getFullYear()

    // Função para verificar se é cartão de crédito
    const isCartaoCredito = (tipo) => {
      const tipoLower = tipo.toLowerCase()
      return tipoLower.includes('cartão') || 
             tipoLower.includes('cartao') || 
             tipoLower === 'cartão de crédito' ||
             tipoLower === 'cartao de credito'
    }

    // Total cartão de crédito do mês atual (gastos variáveis + fixos)
    const cartaoVariavelMesAtual = gastos
      .filter(g => {
        const dataGasto = new Date(g.data)
        return dataGasto.getMonth() === mesAtual &&
               dataGasto.getFullYear() === anoAtual &&
               isCartaoCredito(g.tipo)
      })
      .reduce((total, g) => total + Number(g.valor), 0)

    const cartaoFixoMesAtual = gastosFixos
      .filter(gf => isCartaoCredito(gf.tipo))
      .reduce((total, gf) => total + Number(gf.valor), 0)

    const totalCartaoMesAtual = cartaoVariavelMesAtual + cartaoFixoMesAtual

    // Total gastos fixos mensais
    const totalGastosFixos = gastosFixos
      .reduce((total, gf) => total + Number(gf.valor), 0)

    // Média mensal dos últimos 3 meses (soma gastos + gastos fixos de cada mês)
    const ultimosTresMeses = []
    for (let i = 2; i >= 0; i--) {
      const data = new Date(anoAtual, mesAtual - i, 1)
      ultimosTresMeses.push({
        ano: data.getFullYear(),
        mes: data.getMonth()
      })
    }

    const totalUltimosTresMeses = ultimosTresMeses.reduce((total, periodo) => {
      // Soma dos gastos variáveis/parcelas do mês
      const gastosDoMes = gastos
        .filter(g => {
          const dataGasto = new Date(g.data)
          return dataGasto.getMonth() === periodo.mes &&
            dataGasto.getFullYear() === periodo.ano
        })
        .reduce((soma, g) => soma + Number(g.valor), 0)

      // Soma dos gastos fixos (considera todos os meses já que são fixos)
      const gastosFixosDoMes = gastosFixos
        .reduce((soma, gf) => soma + Number(gf.valor), 0)

      return total + gastosDoMes + gastosFixosDoMes
    }, 0)

    const mediaMensal = totalUltimosTresMeses / 3

    // Pagamentos atrasados - verificar se passou da data e não foi pago
    const gastosAtrasados = gastos.filter(g => {
      if (g.status === 'pago') return false

      const dataVencimento = new Date(g.data)
      return dataVencimento < hoje
    })

    const gastosFixosAtrasados = gastosFixos.filter(gf => {
      if (gf.status === 'pago') return false

      const dataVencimento = new Date(gf.dataVencimento)
      return dataVencimento < hoje
    })

    const totalVencidos = [...gastosAtrasados, ...gastosFixosAtrasados]
      .reduce((total, item) => total + Number(item.valor), 0)

    return {
      totalCartaoMesAtual,
      totalGastosFixos,
      mediaMensal,
      totalVencidos,
      quantidadeVencidos: gastosAtrasados.length + gastosFixosAtrasados.length
    }
  }, [gastos, gastosFixos])

  // Funções para gastos
  const salvarGasto = async (gasto) => {
    try {
      const usuarioAuth = JSON.parse(localStorage.getItem('usuario'));
      if (!usuarioAuth?.token) {
        setToast({ tipo: 'erro', mensagem: 'Token de autenticação não encontrado' });
        return;
      }

      const config = {
        headers: {
          'Authorization': `Bearer ${usuarioAuth.token}`,
          'Content-Type': 'application/json'
        }
      };

      if (gasto.id) {
        // Editar gasto existente
        const response = await fetch(`http://localhost:5000/api/gastos/${gasto.id}`, {
          method: 'PUT',
          headers: config.headers,
          body: JSON.stringify(gasto)
        });

        if (response.ok) {
          const gastoAtualizado = await response.json();
          setGastos(gastos.map(g => g.id === gasto.id ? gastoAtualizado : g));
          setGastoEdicao(null);
          setToast({ tipo: 'sucesso', mensagem: 'Gasto atualizado com sucesso!' });
        } else {
          throw new Error('Erro ao atualizar gasto');
        }
      } else {
        // Criar novo gasto
        const response = await fetch('http://localhost:5000/api/gastos', {
          method: 'POST',
          headers: config.headers,
          body: JSON.stringify(gasto)
        });

        if (response.ok) {
          const novosGastos = await response.json();
          // novosGastos pode ser um array de gastos (múltiplas parcelas) ou um único gasto
          const gastosParaAdicionar = Array.isArray(novosGastos) ? novosGastos : [novosGastos];
          setGastos([...gastos, ...gastosParaAdicionar]);

          const numParcelas = gastosParaAdicionar.length;
          const mensagem = numParcelas > 1
            ? `${numParcelas} parcelas cadastradas com sucesso!`
            : 'Gasto cadastrado com sucesso!';
          setToast({ tipo: 'sucesso', mensagem });
        } else {
          throw new Error('Erro ao criar gasto');
        }
      }
    } catch (error) {
      console.error('Erro ao salvar gasto:', error);
      setToast({ tipo: 'erro', mensagem: 'Erro ao salvar gasto' });
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
        const usuarioAuth = JSON.parse(localStorage.getItem('usuario'));
        if (!usuarioAuth || !usuarioAuth.token) return;

        const response = await fetch(`${API_BASE_URL}/gastos/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${usuarioAuth.token}`
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
      const usuarioAuth = JSON.parse(localStorage.getItem('usuario'));
      if (!usuarioAuth || !usuarioAuth.token) return;

      if (gastoFixoEdicao) {
        const response = await fetch(`${API_BASE_URL}/gastos-fixos/${gastoFixo.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${usuarioAuth.token}`
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
            'Authorization': `Bearer ${usuarioAuth.token}`
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
        const usuarioAuth = JSON.parse(localStorage.getItem('usuario'));
        if (!usuarioAuth || !usuarioAuth.token) return;

        const response = await fetch(`${API_BASE_URL}/gastos-fixos/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${usuarioAuth.token}`
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

  const handleMostrarValores = () => {
    setModalSenhaAberto(true)
  }

  const handleConfirmarSenha = async (senha) => {
    setCarregandoModal(true)
    try {
      const usuarioAuth = JSON.parse(localStorage.getItem('usuario'));
      if (!usuarioAuth || !usuarioAuth.token) return;

      const response = await fetch(`${API_BASE_URL}/auth/verificar-senha`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${usuarioAuth.token}`
        },
        body: JSON.stringify({ senha }),
      })

      if (response.ok) {
        const data = await response.json()
        setMostrar(data.mostrarValores)

        // Atualizar usuário no localStorage
        const usuarioAtualizado = { ...usuarioAuth, mostrarValores: data.mostrarValores }
        localStorage.setItem('usuario', JSON.stringify(usuarioAtualizado))
        setUsuario(usuarioAtualizado)

        setModalSenhaAberto(false)
      } else {
        const errorData = await response.json()
        alert(errorData.erro || 'Senha incorreta')
      }
    } catch (error) {
      console.error('Erro ao verificar senha:', error)
      alert('Erro ao verificar senha')
    } finally {
      setCarregandoModal(false)
    }
  }

  const handleSalvarConfiguracoes = async (dadosUsuario) => {
    try {
      const usuarioAuth = JSON.parse(localStorage.getItem('usuario'));
      if (!usuarioAuth || !usuarioAuth.token) {
        throw new Error('Token de autenticação não encontrado');
      }

      const response = await fetch(`${API_BASE_URL}/auth/atualizar-perfil`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${usuarioAuth.token}`
        },
        body: JSON.stringify(dadosUsuario)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.erro || 'Erro ao salvar configurações');
      }

      const dados = await response.json();

      // Atualizar dados do usuário no localStorage
      const usuarioAtualizado = {
        ...usuarioAuth,
        usuario: dados.usuario.usuario,
        email: dados.usuario.email,
        telefone: dados.usuario.telefone,
        cpf: dados.usuario.cpf
      };

      localStorage.setItem('usuario', JSON.stringify(usuarioAtualizado));
      setUsuario(usuarioAtualizado);
      setMostrarConfiguracoes(false);

      // Mostrar toast de sucesso
      setToast({
        visivel: true,
        mensagem: 'Configurações salvas com sucesso!',
        tipo: 'sucesso'
      });

    } catch (error) {
      console.error('Erro ao salvar configurações:', error);

      // Mostrar toast de erro
      setToast({
        visivel: true,
        mensagem: error.message || 'Erro ao salvar configurações',
        tipo: 'erro'
      });

      throw error;
    }
  }

  const mostrarToast = (mensagem, tipo) => {
    setToast({ visivel: true, mensagem, tipo });
  };



  const marcarComoPago = async (id) => {
    try {
      const usuarioAuth = JSON.parse(localStorage.getItem('usuario'));
      if (!usuarioAuth || !usuarioAuth.token) {
        mostrarToast('Sessão expirada. Faça login novamente.', 'erro')
        setUsuario(null)
        return
      }

      const gasto = gastos.find(g => g.id === id)
      const response = await fetch(`${API_BASE_URL}/gastos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${usuarioAuth.token}`
        },
        body: JSON.stringify({
          ...gasto,
          status: 'pago'
        })
      })

      if (response.ok) {
        // Atualiza o estado local para refletir a mudança imediatamente
        setGastos(prevGastos =>
          prevGastos.map(g => (g.id === id ? { ...g, status: 'pago' } : g))
        );
        mostrarToast('Gasto marcado como pago!', 'sucesso')
      } else if (response.status === 401) {
        mostrarToast('Sessão expirada. Faça login novamente.', 'erro')
        setUsuario(null)
        localStorage.removeItem('usuario')
      } else {
        mostrarToast('Erro ao marcar como pago', 'erro')
      }
    } catch (error) {
      console.error('Erro ao marcar como pago:', error)
      mostrarToast('Erro ao marcar como pago', 'erro')
    }
  }

  const marcarGastoFixoComoPago = async (id) => {
    try {
      const usuarioAuth = JSON.parse(localStorage.getItem('usuario'));
      if (!usuarioAuth || !usuarioAuth.token) {
        mostrarToast('Sessão expirada. Faça login novamente.', 'erro')
        setUsuario(null)
        return
      }

      const gastoFixo = gastosFixos.find(g => g.id === id)
      const response = await fetch(`${API_BASE_URL}/gastos-fixos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${usuarioAuth.token}`
        },
        body: JSON.stringify({
          ...gastoFixo,
          status: 'pago'
        })
      })

      if (response.ok) {
        // Atualiza o estado local para refletir a mudança imediatamente
        setGastosFixos(prevGastosFixos =>
          prevGastosFixos.map(gf => (gf.id === id ? { ...gf, status: 'pago' } : gf))
        );
        mostrarToast('Gasto fixo marcado como pago!', 'sucesso')
      } else if (response.status === 401) {
        mostrarToast('Sessão expirada. Faça login novamente.', 'erro')
        setUsuario(null)
        localStorage.removeItem('usuario')
      } else {
        mostrarToast('Erro ao marcar gasto fixo como pago', 'erro')
      }
    } catch (error) {
      console.error('Erro ao marcar gasto fixo como pago:', error)
      mostrarToast('Erro ao marcar gasto fixo como pago', 'erro')
    }
  }

  // Se não há usuário logado, mostrar tela de autenticação
  if (!usuario) {
    return <TelaAuth onLogin={handleLogin} />
  }

  return (
    <div className="app">
      <Header
        usuario={usuario}
        onLogout={handleLogout}
        onConfiguracoes={() => setMostrarConfiguracoes(true)}
      />

      <div className="container">

        <div className="topbar">
          <div className="tabs">
            <div className={['tab', aba === 'dashboard' ? 'ativo' : ''].join(' ')} onClick={() => setAba('dashboard')}>Dashboard</div>
            <div className={['tab', aba === 'gastos' ? 'ativo' : ''].join(' ')} onClick={() => setAba('gastos')}>Gastos e Parcelas</div>
            <div className={['tab', aba === 'fixos' ? 'ativo' : ''].join(' ')} onClick={() => setAba('fixos')}>Gastos Fixos</div>
          </div>

          <button className="btn-mostrar" onClick={handleMostrarValores}>
            <IconeOlho /> {mostrar ? 'Ocultar Valores' : 'Mostrar Valores'}
          </button>
        </div>

        {/* Menu Mobile Fixo */}
        <div className="menu-mobile">
          <div className="menu-mobile-items">
            <div
              className={['menu-mobile-item', aba === 'dashboard' ? 'ativo' : ''].join(' ')}
              onClick={() => setAba('dashboard')}
            >
              <i className="fas fa-tachometer-alt"></i>
              <span>Dashboard</span>
            </div>
            <div
              className={['menu-mobile-item', aba === 'gastos' ? 'ativo' : ''].join(' ')}
              onClick={() => setAba('gastos')}
            >
              <i className="fas fa-credit-card"></i>
              <span>Gastos e Parcelas</span>
            </div>
            <div
              className={['menu-mobile-item', aba === 'fixos' ? 'ativo' : ''].join(' ')}
              onClick={() => setAba('fixos')}
            >
              <i className="fas fa-calendar-alt"></i>
              <span>Gastos Fixos</span>
            </div>
          </div>
        </div>

        {aba === 'dashboard' && (
          <>
            {/* Desktop Layout */}
            <div className="grid" style={{ gridTemplateColumns: 'repeat(12,1fr)', display: 'none' }}>
              <div style={{ gridColumn: 'span 3' }}>
                <CardKPI
                  titulo="Cartão de Crédito"
                  valorVisivel={`R$ ${kpis.totalCartaoMesAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  esconder={!mostrar}
                  subtitulo="Total no mês atual"
                  icone={<IconeCartao />}
                />
              </div>
              <div style={{ gridColumn: 'span 3' }}>
                <CardKPI
                  titulo="Gastos Fixos"
                  valorVisivel={`R$ ${kpis.totalGastosFixos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  esconder={!mostrar}
                  subtitulo="Total mensal"
                  icone={<IconeGrafico />}
                />
              </div>
              <div style={{ gridColumn: 'span 3' }}>
                <CardKPI
                  titulo="Média Mensal"
                  valorVisivel={`R$ ${kpis.mediaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  esconder={!mostrar}
                  subtitulo="Últimos 3 meses"
                  icone={<IconeSeta />}
                />
              </div>
              <div style={{ gridColumn: 'span 3' }}>
                <CardKPI
                  titulo="Pagamentos Atrasados"
                  valorVisivel={<><span>R$ {kpis.totalVencidos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span><div className='sub'>{kpis.quantidadeVencidos} item(s) atrasado(s)</div></>}
                  esconder={!mostrar}
                  subtitulo=""
                  icone={<IconeAlerta />}
                />
              </div>
            </div>

            {/* Mobile Layout - Cards em coluna */}
            <div className="grid-dashboard-mobile">
              <CardKPI
                titulo="Cartão de Crédito"
                valorVisivel={`R$ ${kpis.totalCartaoMesAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                esconder={!mostrar}
                subtitulo="Total no mês atual"
                icone={<IconeCartao />}
              />
              <CardKPI
                titulo="Gastos Fixos"
                valorVisivel={`R$ ${kpis.totalGastosFixos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                esconder={!mostrar}
                subtitulo="Total mensal"
                icone={<IconeGrafico />}
              />
              <CardKPI
                titulo="Média Mensal"
                valorVisivel={`R$ ${kpis.mediaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                esconder={!mostrar}
                subtitulo="Últimos 3 meses"
                icone={<IconeSeta />}
              />
              <CardKPI
                titulo="Pagamentos Atrasados"
                valorVisivel={<><span>R$ {kpis.totalVencidos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span><div className='sub'>{kpis.quantidadeVencidos} item(s) atrasado(s)</div></>}
                esconder={!mostrar}
                subtitulo=""
                icone={<IconeAlerta />}
              />

              {/* Gráficos Mobile - um embaixo do outro */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <h4>Distribuição por Tipo de Gasto</h4>
                    <div className="sub">Proporção de gastos por método de pagamento</div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => setPeriodoGrafico('mesAtual')}
                      style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '4px',
                        background: periodoGrafico === 'mesAtual' ? '#6366f1' : '#ffffff',
                        color: periodoGrafico === 'mesAtual' ? '#ffffff' : '#6b7280',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      Mês Atual
                    </button>
                    <button
                      onClick={() => setPeriodoGrafico('ultimoMes')}
                      style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '4px',
                        background: periodoGrafico === 'ultimoMes' ? '#6366f1' : '#ffffff',
                        color: periodoGrafico === 'ultimoMes' ? '#ffffff' : '#6b7280',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      Últimos 6 Meses
                    </button>
                  </div>
                </div>
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
            <div className="grid" style={{ gridTemplateColumns: 'repeat(12,1fr)', display: 'none' }}>
              <div style={{ gridColumn: 'span 6' }} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <h4>Distribuição por Tipo de Gasto</h4>
                    <div className="sub">Proporção de gastos por método de pagamento</div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => setPeriodoGrafico('mesAtual')}
                      style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '4px',
                        background: periodoGrafico === 'mesAtual' ? '#6366f1' : '#ffffff',
                        color: periodoGrafico === 'mesAtual' ? '#ffffff' : '#6b7280',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      Mês Atual
                    </button>
                    <button
                      onClick={() => setPeriodoGrafico('ultimoMes')}
                      style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '4px',
                        background: periodoGrafico === 'ultimoMes' ? '#6366f1' : '#ffffff',
                        color: periodoGrafico === 'ultimoMes' ? '#ffffff' : '#6b7280',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      Últimos 6 Meses
                    </button>
                  </div>
                </div>
                <div className="area-graficos">
                  <GraficoPizza dados={dadosPizza} esconder={!mostrar} />
                </div>
              </div>

              <div style={{ gridColumn: 'span 6' }} className="card">
                <h4>Evolução de Gastos</h4>
                <div className="sub">Total de gastos nos últimos 6 meses</div>
                <div className="area-graficos">
                  <GraficoLinha series={dadosLinha} esconder={!mostrar} />
                </div>
              </div>
            </div>
          </>
        )}

        {aba === 'gastos' && (
          <>
            {/* Desktop Layout */}
            <div className="grid" style={{ gridTemplateColumns: 'repeat(12,1fr)', display: 'none' }}>
              <div style={{ gridColumn: 'span 5' }}>
                <FormularioGasto
                  gasto={gastoEdicao}
                  onSalvar={salvarGasto}
                  onCancelar={cancelarEdicaoGasto}
                />
              </div>
              <div style={{ gridColumn: 'span 7' }}>
                <ListaGastos
                  gastos={gastos}
                  onEditar={editarGasto}
                  onExcluir={excluirGasto}
                  setGastos={setGastos}
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
                  setGastos={setGastos}
                />
              </div>
            </div>
          </>
        )}

        {aba === 'fixos' && (
          <>
            {/* Desktop Layout */}
            <div className="grid" style={{ gridTemplateColumns: 'repeat(12,1fr)', display: 'none' }}>
              <div style={{ gridColumn: 'span 5' }}>
                <FormularioGastoFixo
                  gastoFixo={gastoFixoEdicao}
                  onSalvar={salvarGastoFixo}
                  onCancelar={cancelarEdicaoGastoFixo}
                />
              </div>
              <div style={{ gridColumn: 'span 7' }}>
                <ListaGastosFixos
                  gastosFixos={gastosFixos}
                  onEditar={editarGastoFixo}
                  onExcluir={excluirGastoFixo}
                  setGastosFixos={setGastosFixos}
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
                  setGastosFixos={setGastosFixos}
                />
              </div>
            </div>
          </>
        )}
      </div>

      <ModalSenha
        aberto={modalSenhaAberto}
        onFechar={() => setModalSenhaAberto(false)}
        onConfirmar={handleConfirmarSenha}
        carregando={carregandoModal}
      />

      {mostrarConfiguracoes && (
        <div className="modal-overlay">
          <div className="modal-configuracoes">
            <ConfiguracaoUsuario
              usuario={usuario}
              onSalvar={handleSalvarConfiguracoes}
              onCancelar={() => setMostrarConfiguracoes(false)}
            />
          </div>
        </div>
      )}

      <ToastAlert
        mensagem={toast.mensagem}
        tipo={toast.tipo}
        visivel={toast.visivel}
        onFechar={() => setToast(prev => ({ ...prev, visivel: false }))}
        duracao={4000}
      />
    </div >
  )
}