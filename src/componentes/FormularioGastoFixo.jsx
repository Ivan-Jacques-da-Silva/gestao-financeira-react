
import React, { useState, useEffect } from 'react'

export default function FormularioGastoFixo({ gastoFixo, onSalvar, onCancelar }) {
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    tipo: 'Débito Automático',
    diaVencimento: '1',
    categoria: ''
  })

  useEffect(() => {
    if (gastoFixo) {
      setFormData(gastoFixo)
    }
  }, [gastoFixo])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (formData.descricao && formData.valor && formData.diaVencimento) {
      const dadosParaSalvar = {
        ...formData,
        valor: parseFloat(formData.valor),
        diaVencimento: parseInt(formData.diaVencimento)
      }
      if (gastoFixo) {
        dadosParaSalvar.id = gastoFixo.id
      }
      onSalvar(dadosParaSalvar)
      if (!gastoFixo) {
        setFormData({
          descricao: '',
          valor: '',
          tipo: 'Débito Automático',
          diaVencimento: '1',
          categoria: ''
        })
      }
    }
  }

  return (
    <div className="card">
      <h4>{gastoFixo ? 'Editar Gasto Fixo' : 'Novo Gasto Fixo'}</h4>
      <form onSubmit={handleSubmit} className="formulario">
        <div className="campo">
          <label>Descrição</label>
          <input
            type="text"
            value={formData.descricao}
            onChange={(e) => setFormData({...formData, descricao: e.target.value})}
            required
          />
        </div>
        
        <div className="campo">
          <label>Valor Mensal</label>
          <input
            type="number"
            step="0.01"
            value={formData.valor}
            onChange={(e) => setFormData({...formData, valor: e.target.value})}
            required
          />
        </div>
        
        <div className="campo">
          <label>Tipo de Pagamento</label>
          <select
            value={formData.tipo}
            onChange={(e) => setFormData({...formData, tipo: e.target.value})}
          >
            <option value="Débito Automático">Débito Automático</option>
            <option value="Boleto">Boleto</option>
            <option value="Pix">Pix</option>
            <option value="Cartão de Crédito">Cartão de Crédito</option>
          </select>
        </div>
        
        <div className="campo">
          <label>Dia do Vencimento</label>
          <select
            value={formData.diaVencimento}
            onChange={(e) => setFormData({...formData, diaVencimento: e.target.value})}
          >
            {Array.from({length: 31}, (_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}</option>
            ))}
          </select>
        </div>
        
        <div className="campo">
          <label>Categoria</label>
          <input
            type="text"
            value={formData.categoria}
            onChange={(e) => setFormData({...formData, categoria: e.target.value})}
            placeholder="Ex: Moradia, Assinaturas, etc."
          />
        </div>
        
        <div className="botoes">
          <button type="submit" className="btn-salvar">
            {gastoFixo ? 'Atualizar' : 'Salvar'}
          </button>
          {gastoFixo && (
            <button type="button" className="btn-cancelar" onClick={onCancelar}>
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
