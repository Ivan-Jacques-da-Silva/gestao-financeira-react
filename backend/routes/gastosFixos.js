
import express from 'express'
import prisma from '../prisma/client.js'

const router = express.Router()

// GET - Listar todos os gastos fixos
router.get('/', async (req, res) => {
  try {
    const gastosFixos = await prisma.gastoFixo.findMany({
      orderBy: { createdAt: 'desc' }
    })
    res.json(gastosFixos)
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar gastos fixos' })
  }
})

// GET - Buscar gasto fixo por ID
router.get('/:id', async (req, res) => {
  try {
    const gastoFixo = await prisma.gastoFixo.findUnique({
      where: { id: parseInt(req.params.id) }
    })
    if (!gastoFixo) {
      return res.status(404).json({ error: 'Gasto fixo não encontrado' })
    }
    res.json(gastoFixo)
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar gasto fixo' })
  }
})

// POST - Criar novo gasto fixo
router.post('/', async (req, res) => {
  try {
    const { descricao, valor, tipo, diaVencimento, categoria, ativo } = req.body
    
    const gastoFixo = await prisma.gastoFixo.create({
      data: {
        descricao,
        valor: parseFloat(valor),
        tipo,
        diaVencimento: parseInt(diaVencimento),
        categoria,
        ativo: ativo !== undefined ? ativo : true
      }
    })
    
    res.status(201).json(gastoFixo)
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar gasto fixo' })
  }
})

// PUT - Atualizar gasto fixo
router.put('/:id', async (req, res) => {
  try {
    const { descricao, valor, tipo, diaVencimento, categoria, ativo } = req.body
    
    const gastoFixo = await prisma.gastoFixo.update({
      where: { id: parseInt(req.params.id) },
      data: {
        descricao,
        valor: parseFloat(valor),
        tipo,
        diaVencimento: parseInt(diaVencimento),
        categoria,
        ativo: ativo !== undefined ? ativo : true
      }
    })
    
    res.json(gastoFixo)
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Gasto fixo não encontrado' })
    }
    res.status(500).json({ error: 'Erro ao atualizar gasto fixo' })
  }
})

// DELETE - Excluir gasto fixo
router.delete('/:id', async (req, res) => {
  try {
    await prisma.gastoFixo.delete({
      where: { id: parseInt(req.params.id) }
    })
    res.status(204).send()
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Gasto fixo não encontrado' })
    }
    res.status(500).json({ error: 'Erro ao excluir gasto fixo' })
  }
})

export default router
