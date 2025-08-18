import React, { useEffect, useRef } from 'react'

export default function GraficoLinha({ series = [] }){
  const canvasRef = useRef(null)

  useEffect(()=>{
    const cv = canvasRef.current
    const ctx = cv.getContext('2d')
    const w = cv.width, h = cv.height
    ctx.clearRect(0,0,w,h)
    
    // Grid
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1
    for(let i=0;i<=5;i++){
      const y = 30 + i*((h-60)/5)
      ctx.beginPath(); ctx.moveTo(40,y); ctx.lineTo(w-20,y); ctx.stroke()
    }
    
    if (series.length === 0) return
    
    const max = Math.max(...series, 100)
    const stepX = (w-70)/(series.length-1 || 1)
    
    // Área sob a curva
    ctx.beginPath()
    ctx.moveTo(40, h-30)
    series.forEach((v,i)=>{
      const x = 40 + i*stepX
      const y = 30 + (h-60) - (v/max)*(h-60)
      ctx.lineTo(x,y)
    })
    ctx.lineTo(40 + (series.length-1)*stepX, h-30)
    ctx.closePath()
    ctx.fillStyle = 'rgba(22, 160, 133, 0.1)'
    ctx.fill()
    
    // Linha principal
    ctx.beginPath()
    ctx.strokeStyle = '#16a085'
    ctx.lineWidth = 3
    series.forEach((v,i)=>{
      const x = 40 + i*stepX
      const y = 30 + (h-60) - (v/max)*(h-60)
      if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y)
    })
    ctx.stroke()
    
    // Pontos
    ctx.fillStyle = '#16a085'
    series.forEach((v,i)=>{
      const x = 40 + i*stepX
      const y = 30 + (h-60) - (v/max)*(h-60)
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI*2)
      ctx.fill()
    })
    
    // Labels dos meses
    ctx.fillStyle = '#6b7280'
    ctx.font = '11px Inter'
    ctx.textAlign = 'center'
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    const hoje = new Date()
    series.forEach((v,i)=>{
      const x = 40 + i*stepX
      const mesIndex = (hoje.getMonth() - series.length + 1 + i + 12) % 12
      ctx.fillText(meses[mesIndex], x, h-10)
    })
    
    // Valores no eixo Y
    ctx.textAlign = 'right'
    for(let i=0;i<=5;i++){
      const y = 30 + i*((h-60)/5)
      const valor = max - (i/5)*max
      if (valor >= 1000) {
        ctx.fillText(`R$ ${(valor/1000).toFixed(1)}k`, 35, y+4)
      } else {
        ctx.fillText(`R$ ${valor.toFixed(0)}`, 35, y+4)
      }
    }
  },[series])

  return <canvas ref={canvasRef} width="500" height="220" />
}
