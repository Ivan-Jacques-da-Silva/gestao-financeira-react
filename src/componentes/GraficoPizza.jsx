import React, { useEffect, useRef } from 'react'

export default function GraficoPizza({ dados = [] }){
  const canvasRef = useRef(null)

  // Cores específicas para cada método de pagamento
  const getCor = (rotulo) => {
    const cores = {
      'Cartão de Crédito': '#3b82f6',
      'CARTÃO DE CRÉDITO': '#3b82f6',
      'Débito Automático': '#10b981',
      'DÉBITO AUTOMÁTICO': '#10b981',
      'Pix': '#f59e0b',
      'PIX': '#f59e0b',
      'Dinheiro': '#8b5cf6',
      'DINHEIRO': '#8b5cf6',
      'Transferência': '#ec4899',
      'TRANSFERÊNCIA': '#ec4899',
      'Boleto': '#ef4444',
      'BOLETO': '#ef4444'
    }
    return cores[rotulo] || '#6b7280'
  }

  useEffect(()=>{
    const cv = canvasRef.current
    const ctx = cv.getContext('2d')
    const total = dados.reduce((s,d)=>s+d.valor,0) || 1
    let ang = -Math.PI/2
    ctx.clearRect(0,0,cv.width,cv.height)
    
    dados.forEach((d,i)=>{
      const fatia = (d.valor/total) * Math.PI*2
      ctx.beginPath()
      ctx.moveTo(150,110)
      ctx.arc(150,110,100, ang, ang+fatia)
      ctx.closePath()
      ctx.fillStyle = getCor(d.rotulo)
      ctx.fill()
      ang += fatia
    })

    // Adicionar legenda
    ctx.font = '12px Inter'
    let yPos = 20
    dados.forEach((d,i)=>{
      const porcentagem = ((d.valor/total)*100).toFixed(1)
      ctx.fillStyle = getCor(d.rotulo)
      ctx.fillRect(310, yPos-8, 12, 12)
      ctx.fillStyle = '#374151'
      ctx.fillText(`${d.rotulo} (${porcentagem}%)`, 330, yPos)
      yPos += 20
    })
  },[dados])

  return <canvas ref={canvasRef} width="500" height="220" />
}
