import React, { useState, useEffect } from 'react'
import CardKPI from './componentes/CardKPI.jsx'
import GraficoPizza from './componentes/GraficoPizza.jsx'
import GraficoLinha from './componentes/GraficoLinha.jsx'
import FormularioGasto from './componentes/FormularioGasto.jsx'
import ListaGastos from './componentes/ListaGastos.jsx'
import FormularioGastoFixo from './componentes/FormularioGastoFixo.jsx'
import ListaGastosFixos from './componentes/ListaGastosFixos.jsx'
import { IconeCartao, IconeGrafico, IconeSeta, IconeAlerta, IconeOlho } from './componentes/Icones.jsx'

const API_BASE_URL = 'http://localhost:5000/api'

export default function App(){
  const [aba,setAba] = useState('dashboard')
  const [mostrar,setMostrar] = useState(false)
  
  // Estados para gastos e parcelas
  const [gastos, setGastos] = useState([])
  const [gastoEdicao, setGastoEdicao] = useState(null)
  
  // Estados para gastos fixos
  const [gastosFixos, setGastosFixos] = useState([])
  const [gastoFixoEdicao, setGastoFixoEdicao] = useState(null)

  // Carregar dados iniciais
  useEffect(() => {
    carregarGastos()
    carregarGastosFixos()
  }, [])

  // Funções para carregar dados da API
  const carregarGastos = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/gastos`)
      if (response.ok) {
        const data = await response.json()
        setGastos(Array.isArray(data) ? data : [])
      } else {
        console.error('Erro ao carregar gastos:', response.status)
        setGastos([])
      }
    } catch (error) {
      console.error('Erro ao carregar gastos:', error)
      setGastos([])
    }
  }

  const carregarGastosFixos = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/gastos-fixos`)
      if (response.ok) {
        const data = await response.json()
        setGastosFixos(Array.isArray(data) ? data : [])
      } else {
        console.error('Erro ao carregar gastos fixos:', response.status)
        setGastosFixos([])
      }
    } catch (error) {
      console.error('Erro ao carregar gastos fixos:', error)
      setGastosFixos([])
    }
  }

  const dadosPizza = [
    { rotulo: 'Cartão de Crédito', valor: 1200 },
    { rotulo: 'Pix', valor: 800 },
    { rotulo: 'Boleto', valor: 420 },
    { rotulo: 'Débito', valor: 300 }
  ]
  const dadosLinha = [300, 520, 410, 760, 640, 880]

  // Funções para gastos
  const salvarGasto = async (gasto) => {
    try {
      if (gastoEdicao) {
        const response = await fetch(`${API_BASE_URL}/gastos/${gasto.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
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

  return (
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

      {aba==='dashboard' && (
        <>
          <div className="grid" style={{gridTemplateColumns:'repeat(12,1fr)'}}>
            <div style={{gridColumn:'span 3'}}>
              <CardKPI
                titulo="Cartão de Crédito"
                valorVisivel="R$ 2.720,00"
                esconder={!mostrar}
                subtitulo="Total no mês atual"
                icone={<IconeCartao />}
              />
            </div>
            <div style={{gridColumn:'span 3'}}>
              <CardKPI
                titulo="Gastos Fixos"
                valorVisivel="R$ 1.560,00"
                esconder={!mostrar}
                subtitulo="Total mensal"
                icone={<IconeGrafico />}
              />
            </div>
            <div style={{gridColumn:'span 3'}}>
              <CardKPI
                titulo="Média Mensal"
                valorVisivel="R$ 2.140,00"
                esconder={!mostrar}
                subtitulo="Últimos 3 meses"
                icone={<IconeSeta />}
              />
            </div>
            <div style={{gridColumn:'span 3'}}>
              <CardKPI
                titulo="Pagamentos Atrasados"
                valorVisivel={<><span>R$ 0,00</span><div className='sub'>0 item(s) atrasado(s)</div></>}
                esconder={!mostrar}
                subtitulo=""
                icone={<IconeAlerta />}
              />
            </div>
          </div>

          <div className="grid" style={{gridTemplateColumns:'repeat(12,1fr)'}}>
            <div style={{gridColumn:'span 6'}} className="card">
              <h4>Distribuição por Tipo de Gasto</h4>
              <div className="sub">Proporção de gastos por método de pagamento</div>
              <div className="area-graficos">
                <GraficoPizza dados={dadosPizza} />
              </div>
            </div>

            <div style={{gridColumn:'span 6'}} className="card">
              <h4>Evolução de Gastos</h4>
              <div className="sub">Total de gastos nos últimos 6 meses</div>
              <div className="area-graficos">
                <GraficoLinha series={dadosLinha} />
              </div>
            </div>
          </div>
        </>
      )}

      {aba==='gastos' && (
        <div className="grid" style={{gridTemplateColumns:'repeat(12,1fr)'}}>
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
      )}

      {aba==='fixos' && (
        <div className="grid" style={{gridTemplateColumns:'repeat(12,1fr)'}}>
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
      )}
    </div>
  )
}
