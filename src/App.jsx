import React, { useState } from 'react'
import CardKPI from './componentes/CardKPI.jsx'
import GraficoPizza from './componentes/GraficoPizza.jsx'
import GraficoLinha from './componentes/GraficoLinha.jsx'
import FormularioGasto from './componentes/FormularioGasto.jsx'
import ListaGastos from './componentes/ListaGastos.jsx'
import FormularioGastoFixo from './componentes/FormularioGastoFixo.jsx'
import ListaGastosFixos from './componentes/ListaGastosFixos.jsx'
import { IconeCartao, IconeGrafico, IconeSeta, IconeAlerta, IconeOlho } from './componentes/Icones.jsx'

export default function App(){
  const [aba,setAba] = useState('dashboard')
  const [mostrar,setMostrar] = useState(false)
  
  // Estados para gastos e parcelas
  const [gastos, setGastos] = useState([])
  const [gastoEdicao, setGastoEdicao] = useState(null)
  
  // Estados para gastos fixos
  const [gastosFixos, setGastosFixos] = useState([])
  const [gastoFixoEdicao, setGastoFixoEdicao] = useState(null)

  const dadosPizza = [
    { rotulo: 'Cartão de Crédito', valor: 1200 },
    { rotulo: 'Pix', valor: 800 },
    { rotulo: 'Boleto', valor: 420 },
    { rotulo: 'Débito', valor: 300 }
  ]
  const dadosLinha = [300, 520, 410, 760, 640, 880]

  // Funções para gastos
  const salvarGasto = (gasto) => {
    if (gastoEdicao) {
      setGastos(gastos.map(g => g.id === gasto.id ? gasto : g))
      setGastoEdicao(null)
    } else {
      setGastos([...gastos, gasto])
    }
  }

  const editarGasto = (gasto) => {
    setGastoEdicao(gasto)
  }

  const excluirGasto = (id) => {
    if (confirm('Deseja realmente excluir este gasto?')) {
      setGastos(gastos.filter(g => g.id !== id))
    }
  }

  const cancelarEdicaoGasto = () => {
    setGastoEdicao(null)
  }

  // Funções para gastos fixos
  const salvarGastoFixo = (gastoFixo) => {
    if (gastoFixoEdicao) {
      setGastosFixos(gastosFixos.map(g => g.id === gastoFixo.id ? gastoFixo : g))
      setGastoFixoEdicao(null)
    } else {
      setGastosFixos([...gastosFixos, gastoFixo])
    }
  }

  const editarGastoFixo = (gastoFixo) => {
    setGastoFixoEdicao(gastoFixo)
  }

  const excluirGastoFixo = (id) => {
    if (confirm('Deseja realmente excluir este gasto fixo?')) {
      setGastosFixos(gastosFixos.filter(g => g.id !== id))
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
