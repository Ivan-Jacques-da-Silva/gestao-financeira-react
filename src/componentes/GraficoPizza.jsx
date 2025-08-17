import React, { useEffect, useRef } from 'react'

export default function GraficoPizza({ dados = [] }){
  const canvasRef = useRef(null)

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
      ctx.fillStyle = ['#16a085','#10b981','#14b8a6','#0ea5e9','#ef4444'][i%5]
      ctx.fill()
      ang += fatia
    })
  },[dados])

  return <canvas ref={canvasRef} width="300" height="220" />
}
