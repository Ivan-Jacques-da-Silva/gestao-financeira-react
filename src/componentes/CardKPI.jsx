import React from 'react'

export default function CardKPI({ titulo, valorVisivel, esconder, subtitulo, icone }){
  return (
    <div className="card card-kpi">
      <div className="kpi">
        <h4>{titulo}</h4>
        {icone}
      </div>
      <div className="valor">{esconder ? <span className="pontos">•••••</span> : valorVisivel}</div>
      <div className="sub">{subtitulo}</div>
    </div>
  )
}
