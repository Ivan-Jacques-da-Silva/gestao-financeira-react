
import express from 'express'
import prisma from '../prisma/client.js'

const router = express.Router()

// GET - Listar todos os gastos
router.get('/', async (req, res) => {
  try {
    const gastos = await prisma.gasto.findMany({
      orderBy: { createdAt: 'desc' }
    })
    res.json(gastos)
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar gastos' })
  }
})

// GET - Buscar gasto por ID
router.get('/:id', async (req, res) => {
  try {
    const gasto = await prisma.gasto.findUnique({
      where: { id: parseInt(req.params.id) }
    })
    if (!gasto) {
      return res.status(404).json({ error: 'Gasto não encontrado' })
    }
    res.json(gasto)
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar gasto' })
  }
})

// POST - Criar novo gasto
router.post('/', async (req, res) => {
  try {
    const { descricao, valor, tipo, data, parcelas, categoria } = req.body
    
    const gasto = await prisma.gasto.create({
      data: {
        descricao,
        valor: parseFloat(valor),
        tipo,
        data: new Date(data),
        parcelas: parseInt(parcelas) || 1,
        categoria
      }
    })
    
    res.status(201).json(gasto)
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar gasto' })
  }
})

// PUT - Atualizar gasto
router.put('/:id', async (req, res) => {
  try {
    const { descricao, valor, tipo, data, parcelas, categoria } = req.body
    
    const gasto = await prisma.gasto.update({
      where: { id: parseInt(req.params.id) },
      data: {
        descricao,
        valor: parseFloat(valor),
        tipo,
        data: new Date(data),
        parcelas: parseInt(parcelas) || 1,
        categoria
      }
    })
    
    res.json(gasto)
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Gasto não encontrado' })
    }
    res.status(500).json({ error: 'Erro ao atualizar gasto' })
  }
})

// DELETE - Excluir gasto
router.delete('/:id', async (req, res) => {
  try {
    await prisma.gasto.delete({
      where: { id: parseInt(req.params.id) }
    })
    res.status(204).send()
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Gasto não encontrado' })
    }
    res.status(500).json({ error: 'Erro ao excluir gasto' })
  }
})

export default router
