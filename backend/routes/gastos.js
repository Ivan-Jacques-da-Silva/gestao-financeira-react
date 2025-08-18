
import express from 'express'
import prisma from '../prisma/client.js'
import { verificarToken } from '../middleware/auth.js'

const router = express.Router()

// Aplicar middleware de autenticação a todas as rotas
router.use(verificarToken)

// GET - Listar gastos do usuário
router.get('/', async (req, res) => {
  try {
    const gastos = await prisma.gasto.findMany({
      where: { usuarioId: req.usuario.id },
      orderBy: { createdAt: 'desc' }
    })
    res.json(gastos)
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar gastos' })
  }
})

// GET - Buscar gasto por ID do usuário
router.get('/:id', async (req, res) => {
  try {
    const gasto = await prisma.gasto.findFirst({
      where: { 
        id: parseInt(req.params.id),
        usuarioId: req.usuario.id
      }
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
    const { descricao, valor, tipo, data, parcelas, categoria, status } = req.body
    
    const gasto = await prisma.gasto.create({
      data: {
        descricao,
        valor: parseFloat(valor),
        tipo,
        data: new Date(data),
        parcelas: parseInt(parcelas) || 1,
        categoria,
        status: status || 'a_vencer',
        usuarioId: req.usuario.id
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
    const { descricao, valor, tipo, data, parcelas, categoria, status } = req.body
    
    // Verificar se o gasto pertence ao usuário
    const gastoExistente = await prisma.gasto.findFirst({
      where: { 
        id: parseInt(req.params.id),
        usuarioId: req.usuario.id
      }
    })
    
    if (!gastoExistente) {
      return res.status(404).json({ error: 'Gasto não encontrado' })
    }
    
    const gasto = await prisma.gasto.update({
      where: { id: parseInt(req.params.id) },
      data: {
        descricao,
        valor: parseFloat(valor),
        tipo,
        data: new Date(data),
        parcelas: parseInt(parcelas) || 1,
        categoria,
        status: status || 'a_vencer'
      }
    })
    
    res.json(gasto)
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar gasto' })
  }
})

// DELETE - Excluir gasto
router.delete('/:id', async (req, res) => {
  try {
    // Verificar se o gasto pertence ao usuário
    const gastoExistente = await prisma.gasto.findFirst({
      where: { 
        id: parseInt(req.params.id),
        usuarioId: req.usuario.id
      }
    })
    
    if (!gastoExistente) {
      return res.status(404).json({ error: 'Gasto não encontrado' })
    }
    
    await prisma.gasto.delete({
      where: { id: parseInt(req.params.id) }
    })
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir gasto' })
  }
})

export default router
