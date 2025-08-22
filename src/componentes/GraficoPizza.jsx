import React, { useEffect, useRef } from "react";

export default function GraficoPizza({ dados = [], esconder = false }) {
  const canvasRef = useRef(null);

  // Função para padronizar texto: primeira letra maiúscula, resto minúsculo
  const padronizarTexto = (texto) => {
    if (!texto) return texto;
    return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
  };

  // Cores com melhor contraste e distinção
  const getCor = (rotulo, index) => {
    // Normalizar o rótulo para comparação
    const rotuloNormalizado = rotulo.toLowerCase();
    
    const cores = {
      "cartão de crédito": "#1e40af",
      "débito automático": "#10b981", // Verde mais forte
      "pix": "#92400e",
      "dinheiro": "#7c3aed",
      "transferência": "#be185d",
      "boleto": "#c53030",
    };

    // Cores alternativas caso não encontre o tipo específico
    const coresAlternativas = [
      "#1e40af",
      "#10b981",
      "#92400e",
      "#7c3aed",
      "#be185d",
      "#c53030",
      "#0891b2",
      "#65a30d",
    ];

    return cores[rotuloNormalizado] || coresAlternativas[index % coresAlternativas.length];
  };

  

  useEffect(() => {
    const cv = canvasRef.current;
    const ctx = cv.getContext("2d");
    const w = cv.width;
    const h = cv.height;
    const centerX = w * 0.5;
    const centerY = h * 0.5;
    const radius = Math.min(w, h) * 0.3;

    ctx.clearRect(0, 0, w, h);

    if (dados.length === 0) {
      // Estado vazio mais elegante
      ctx.fillStyle = "#f3f4f6";
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#9ca3af";
      ctx.font = "14px Inter";
      ctx.textAlign = "center";
      ctx.fillText("Sem dados", centerX, centerY);
      return;
    }

    const total = dados.reduce((s, d) => s + d.valor, 0) || 1;
    let ang = -Math.PI / 2;

    // Desenhar fatias com gradiente e sombra
    dados.forEach((d, i) => {
      const fatia = (d.valor / total) * Math.PI * 2;
      const cor = getCor(d.rotulo, i);

      // Sombra suave
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.1)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      // Fatia principal
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, ang, ang + fatia);
      ctx.closePath();
      ctx.fillStyle = cor;
      ctx.fill();

      // Borda sutil
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();

      ang += fatia;
    });

    // Círculo central para efeito donut moderno
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.strokeStyle = "#f3f4f6";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Total no centro (se não estiver escondido)
    if (!esconder) {
      ctx.fillStyle = "#1f2937";
      ctx.font = "bold 14px Inter";
      ctx.textAlign = "center";
      ctx.fillText("Total", centerX, centerY - 8);

      ctx.fillStyle = "#6b7280";
      ctx.font = "12px Inter";
      const totalFormatado = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(total);
      ctx.fillText(totalFormatado, centerX, centerY + 8);
    } else {
      ctx.fillStyle = "#9ca3af";
      ctx.font = "bold 14px Inter";
      ctx.textAlign = "center";
      ctx.fillText("•••••", centerX, centerY);
    }
  }, [dados, esconder]);

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
      }}
    >
      <canvas
        ref={canvasRef}
        width="320"
        height="320"
        style={{ maxWidth: "100%", height: "auto" }}
      />

      {/* Legenda */}
      {dados.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "12px",
            marginTop: "16px",
            maxWidth: "320px",
          }}
        >
          {dados.map((item, index) => {
            const total = dados.reduce((s, d) => s + d.valor, 0) || 1;
            const porcentagem = ((item.valor / total) * 100).toFixed(1);
            
            return (
              <div
                key={item.rotulo}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  color: "#6b7280",
                }}
              >
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "2px",
                    backgroundColor: getCor(item.rotulo, index),
                  }}
                />
                <span>{padronizarTexto(item.rotulo)} ({porcentagem}%)</span>
              </div>
            );
          })}
        </div>
      )}

      
    </div>
  );
}
