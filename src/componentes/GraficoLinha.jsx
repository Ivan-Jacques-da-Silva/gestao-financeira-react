
import React, { useEffect, useRef } from 'react'

export default function GraficoLinha({ series = [], esconder = false }){
  const canvasRef = useRef(null)

  useEffect(()=>{
    const cv = canvasRef.current
    const ctx = cv.getContext('2d')
    const w = cv.width
    const h = cv.height
    const padding = { top: 30, right: 30, bottom: 40, left: 60 }
    const chartW = w - padding.left - padding.right
    const chartH = h - padding.top - padding.bottom
    
    ctx.clearRect(0, 0, w, h)
    
    // Fundo do gráfico
    ctx.fillStyle = '#fafbfc'
    ctx.fillRect(padding.left, padding.top, chartW, chartH)
    
    // Grid horizontal mais sutil
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1
    for(let i = 0; i <= 5; i++){
      const y = padding.top + i * (chartH / 5)
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(w - padding.right, y)
      ctx.stroke()
    }
    
    // Grid vertical
    if (series.length > 1) {
      const stepX = chartW / (series.length - 1)
      for(let i = 0; i < series.length; i++){
        const x = padding.left + i * stepX
        ctx.beginPath()
        ctx.moveTo(x, padding.top)
        ctx.lineTo(x, padding.top + chartH)
        ctx.stroke()
      }
    }
    
    if (series.length === 0) {
      ctx.fillStyle = '#9ca3af'
      ctx.font = '14px Inter'
      ctx.textAlign = 'center'
      ctx.fillText('Sem dados disponíveis', w/2, h/2)
      return
    }
    
    const max = Math.max(...series, 100)
    const stepX = series.length > 1 ? chartW / (series.length - 1) : 0
    
    // Gradiente para área
    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH)
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.2)')
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0.02)')
    
    // Área sob a curva com gradiente
    ctx.beginPath()
    ctx.moveTo(padding.left, padding.top + chartH)
    series.forEach((v, i) => {
      const x = padding.left + i * stepX
      const y = padding.top + chartH - (v / max) * chartH
      ctx.lineTo(x, y)
    })
    ctx.lineTo(padding.left + (series.length - 1) * stepX, padding.top + chartH)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()
    
    // Linha principal com sombra
    ctx.save()
    ctx.shadowColor = 'rgba(99, 102, 241, 0.3)'
    ctx.shadowBlur = 4
    ctx.shadowOffsetY = 2
    
    ctx.beginPath()
    ctx.strokeStyle = '#6366f1'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    
    series.forEach((v, i) => {
      const x = padding.left + i * stepX
      const y = padding.top + chartH - (v / max) * chartH
      if(i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()
    ctx.restore()
    
    // Pontos com efeito hover
    series.forEach((v, i) => {
      const x = padding.left + i * stepX
      const y = padding.top + chartH - (v / max) * chartH
      
      // Círculo externo (sombra)
      ctx.beginPath()
      ctx.arc(x, y, 6, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(99, 102, 241, 0.2)'
      ctx.fill()
      
      // Círculo interno
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fillStyle = '#6366f1'
      ctx.fill()
      
      // Ponto central branco
      ctx.beginPath()
      ctx.arc(x, y, 2, 0, Math.PI * 2)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      
      // Valor no ponto (se não estiver escondido)
      if (!esconder) {
        ctx.fillStyle = '#374151'
        ctx.font = '11px Inter'
        ctx.textAlign = 'center'
        const valorFormatado = v >= 1000 
          ? `R$ ${(v/1000).toFixed(1)}k`
          : `R$ ${v.toFixed(0)}`
        ctx.fillText(valorFormatado, x, y - 12)
      }
    })
    
    // Labels dos meses com melhor tipografia
    ctx.fillStyle = '#6b7280'
    ctx.font = '12px Inter'
    ctx.textAlign = 'center'
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    const hoje = new Date()
    
    series.forEach((v, i) => {
      const x = padding.left + i * stepX
      const mesIndex = (hoje.getMonth() - series.length + 1 + i + 12) % 12
      ctx.fillText(meses[mesIndex], x, h - 10)
    })
    
    // Valores no eixo Y
    ctx.textAlign = 'right'
    ctx.fillStyle = '#6b7280'
    ctx.font = '11px Inter'
    
    for(let i = 0; i <= 5; i++){
      const y = padding.top + i * (chartH / 5)
      const valor = max - (i / 5) * max
      
      if (esconder) {
        ctx.fillText('•••', padding.left - 8, y + 4)
      } else {
        if (valor >= 1000) {
          ctx.fillText(`R$ ${(valor/1000).toFixed(1)}k`, padding.left - 8, y + 4)
        } else {
          ctx.fillText(`R$ ${valor.toFixed(0)}`, padding.left - 8, y + 4)
        }
      }
    }
    
    // Título dos eixos
    ctx.save()
    ctx.translate(15, h/2)
    ctx.rotate(-Math.PI/2)
    ctx.fillStyle = '#9ca3af'
    ctx.font = '12px Inter'
    ctx.textAlign = 'center'
    ctx.fillText(esconder ? 'Valores' : 'Valor (R$)', 0, 0)
    ctx.restore()
    
    ctx.fillStyle = '#9ca3af'
    ctx.font = '12px Inter'
    ctx.textAlign = 'center'
    ctx.fillText('Meses', w/2, h - 5)
    
  }, [series, esconder])

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <canvas ref={canvasRef} width="500" height="220" style={{ maxWidth: '100%', height: 'auto' }} />
    </div>
  )
}
