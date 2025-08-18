
import React, { useEffect, useRef, useState } from 'react'

export default function GraficoPizza({ dados = [], esconder = false }){
  const canvasRef = useRef(null)
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, text: '' })

  // Cores modernas e vibrantes
  const getCor = (rotulo, index) => {
    const cores = {
      'Cartão de Crédito': '#6366f1',
      'CARTÃO DE CRÉDITO': '#6366f1',
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
    
    // Cores alternativas caso não encontre o tipo específico
    const coresAlternativas = ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#ef4444', '#06b6d4', '#84cc16']
    
    return cores[rotulo] || coresAlternativas[index % coresAlternativas.length]
  }

  // Função para detectar se o mouse está sobre uma fatia
  const isPointInSlice = (x, y, centerX, centerY, startAngle, endAngle, radius) => {
    const dx = x - centerX
    const dy = y - centerY
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance > radius) return false
    
    let angle = Math.atan2(dy, dx)
    // Normalizar ângulo para 0-2π
    if (angle < 0) angle += Math.PI * 2
    
    // Ajustar para começar do topo (como o gráfico)
    angle = (angle + Math.PI/2) % (Math.PI * 2)
    
    // Normalizar ângulos de início e fim
    let normalizedStart = (startAngle + Math.PI/2) % (Math.PI * 2)
    let normalizedEnd = (endAngle + Math.PI/2) % (Math.PI * 2)
    
    if (normalizedStart > normalizedEnd) {
      return angle >= normalizedStart || angle <= normalizedEnd
    }
    
    return angle >= normalizedStart && angle <= normalizedEnd
  }

  // Manipular movimento do mouse
  const handleMouseMove = (event) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (event.clientX - rect.left) * scaleX
    const y = (event.clientY - rect.top) * scaleY
    
    const centerX = canvas.width * 0.5
    const centerY = canvas.height * 0.5
    const radius = Math.min(canvas.width, canvas.height) * 0.3
    
    if (dados.length === 0) return
    
    const total = dados.reduce((s,d)=>s+d.valor,0) || 1
    let startAngle = -Math.PI/2
    
    for (let i = 0; i < dados.length; i++) {
      const d = dados[i]
      const sliceAngle = (d.valor/total) * Math.PI*2
      const endAngle = startAngle + sliceAngle
      
      if (isPointInSlice(x, y, centerX, centerY, startAngle, endAngle, radius)) {
        const valor = esconder 
          ? '•••••' 
          : new Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'}).format(d.valor)
        
        const porcentagem = ((d.valor/total)*100).toFixed(1) + '%'
        
        setTooltip({
          show: true,
          x: event.clientX,
          y: event.clientY,
          text: `${d.rotulo}: ${valor} (${porcentagem})`
        })
        return
      }
      
      startAngle = endAngle
    }
    
    setTooltip({ show: false, x: 0, y: 0, text: '' })
  }

  const handleMouseLeave = () => {
    setTooltip({ show: false, x: 0, y: 0, text: '' })
  }

  useEffect(()=>{
    const cv = canvasRef.current
    const ctx = cv.getContext('2d')
    const w = cv.width
    const h = cv.height
    const centerX = w * 0.5
    const centerY = h * 0.5
    const radius = Math.min(w, h) * 0.3
    
    ctx.clearRect(0, 0, w, h)
    
    if (dados.length === 0) {
      // Estado vazio mais elegante
      ctx.fillStyle = '#f3f4f6'
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.fillStyle = '#9ca3af'
      ctx.font = '14px Inter'
      ctx.textAlign = 'center'
      ctx.fillText('Sem dados', centerX, centerY)
      return
    }
    
    const total = dados.reduce((s,d)=>s+d.valor,0) || 1
    let ang = -Math.PI/2
    
    // Desenhar fatias com gradiente e sombra
    dados.forEach((d,i)=>{
      const fatia = (d.valor/total) * Math.PI*2
      const cor = getCor(d.rotulo, i)
      
      // Sombra suave
      ctx.save()
      ctx.shadowColor = 'rgba(0,0,0,0.1)'
      ctx.shadowBlur = 8
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2
      
      // Fatia principal
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, ang, ang+fatia)
      ctx.closePath()
      ctx.fillStyle = cor
      ctx.fill()
      
      // Borda sutil
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.stroke()
      
      ctx.restore()
      
      
      
      ang += fatia
    })
    
    // Círculo central para efeito donut moderno
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius * 0.4, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.strokeStyle = '#f3f4f6'
    ctx.lineWidth = 1
    ctx.stroke()
    
    // Total no centro (se não estiver escondido)
    if (!esconder) {
      ctx.fillStyle = '#1f2937'
      ctx.font = 'bold 14px Inter'
      ctx.textAlign = 'center'
      ctx.fillText('Total', centerX, centerY - 8)
      
      ctx.fillStyle = '#6b7280'
      ctx.font = '12px Inter'
      const totalFormatado = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(total)
      ctx.fillText(totalFormatado, centerX, centerY + 8)
    } else {
      ctx.fillStyle = '#9ca3af'
      ctx.font = 'bold 14px Inter'
      ctx.textAlign = 'center'
      ctx.fillText('•••••', centerX, centerY)
    }
  },[dados, esconder])

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', position: 'relative' }}>
      <canvas 
        ref={canvasRef} 
        width="320" 
        height="320" 
        style={{ maxWidth: '100%', height: 'auto', cursor: 'pointer' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      
      {/* Tooltip */}
      {tooltip.show && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.x + 10,
            top: tooltip.y - 10,
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '500',
            pointerEvents: 'none',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  )
}
