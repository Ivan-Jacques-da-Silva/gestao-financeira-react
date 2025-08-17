
import React, { useState, useEffect } from 'react'

export default function FormularioGasto({ gasto, onSalvar, onCancelar }) {
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    tipo: 'Cartão de Crédito',
    data: '',
    parcelas: '1',
    categoria: ''
  })

  useEffect(() => {
    if (gasto) {
      setFormData(gasto)
    }
  }, [gasto])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (formData.descricao && formData.valor && formData.data) {
      onSalvar({
        ...formData,
        id: gasto?.id || Date.now(),
        valor: parseFloat(formData.valor)
      })
      if (!gasto) {
        setFormData({
          descricao: '',
          valor: '',
          tipo: 'Cartão de Crédito',
          data: '',
          parcelas: '1',
          categoria: ''
        })
      }
    }
  }

  return (
    <div className="card">
      <h4>{gasto ? 'Editar Gasto' : 'Novo Gasto'}</h4>
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
          <label>Valor</label>
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
            <option value="Cartão de Crédito">Cartão de Crédito</option>
            <option value="Pix">Pix</option>
            <option value="Boleto">Boleto</option>
            <option value="Débito">Débito</option>
            <option value="Dinheiro">Dinheiro</option>
          </select>
        </div>
        
        <div className="campo">
          <label>Data</label>
          <input
            type="date"
            value={formData.data}
            onChange={(e) => setFormData({...formData, data: e.target.value})}
            required
          />
        </div>
        
        <div className="campo">
          <label>Parcelas</label>
          <input
            type="number"
            min="1"
            value={formData.parcelas}
            onChange={(e) => setFormData({...formData, parcelas: e.target.value})}
          />
        </div>
        
        <div className="campo">
          <label>Categoria</label>
          <input
            type="text"
            value={formData.categoria}
            onChange={(e) => setFormData({...formData, categoria: e.target.value})}
            placeholder="Ex: Alimentação, Transporte, etc."
          />
        </div>
        
        <div className="botoes">
          <button type="submit" className="btn-salvar">
            {gasto ? 'Atualizar' : 'Salvar'}
          </button>
          {gasto && (
            <button type="button" className="btn-cancelar" onClick={onCancelar}>
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
