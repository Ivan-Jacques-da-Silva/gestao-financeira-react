import React, { useEffect, useRef } from 'react'

export default function GraficoLinha({ series = [] }){
  const canvasRef = useRef(null)

  useEffect(()=>{
    const cv = canvasRef.current
    const ctx = cv.getContext('2d')
    const w = cv.width, h = cv.height
    ctx.clearRect(0,0,w,h)
    ctx.strokeStyle = '#e5e7eb'
    // grid
    for(let i=0;i<=5;i++){
      const y = 20 + i*((h-40)/5)
      ctx.beginPath(); ctx.moveTo(30,y); ctx.lineTo(w-10,y); ctx.stroke()
    }
    const max = Math.max(...series, 10)
    const stepX = (w-50)/(series.length-1 || 1)
    ctx.beginPath()
    ctx.strokeStyle = '#16a085'
    ctx.lineWidth = 2
    series.forEach((v,i)=>{
      const x = 30 + i*stepX
      const y = h-20 - (v/max)*(h-40)
      if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y)
    })
    ctx.stroke()
  },[series])

  return <canvas ref={canvasRef} width="500" height="220" />
}
