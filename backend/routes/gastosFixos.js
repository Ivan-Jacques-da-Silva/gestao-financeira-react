
import express from 'express'
import prisma from '../prisma/client.js'
import { verificarToken } from '../middleware/auth.js'

const router = express.Router()

// Aplicar middleware de autenticação a todas as rotas
router.use(verificarToken)

// GET - Listar gastos fixos do usuário
router.get('/', async (req, res) => {
  try {
    const gastosFixos = await prisma.gastoFixo.findMany({
      where: { usuarioId: req.usuario.id },
      orderBy: { createdAt: 'desc' }
    })
    res.json(gastosFixos)
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar gastos fixos' })
  }
})

// GET - Buscar gasto fixo por ID do usuário
router.get('/:id', async (req, res) => {
  try {
    const gastoFixo = await prisma.gastoFixo.findFirst({
      where: { 
        id: parseInt(req.params.id),
        usuarioId: req.usuario.id
      }
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
    const { descricao, valor, tipo, diaVencimento, categoria, status } = req.body
    
    const gastoFixo = await prisma.gastoFixo.create({
      data: {
        descricao,
        valor: parseFloat(valor),
        tipo,
        diaVencimento: parseInt(diaVencimento),
        categoria,
        status: status || 'a_vencer',
        usuarioId: req.usuario.id
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
    const { descricao, valor, tipo, diaVencimento, categoria, status } = req.body
    
    // Verificar se o gasto fixo pertence ao usuário
    const gastoFixoExistente = await prisma.gastoFixo.findFirst({
      where: { 
        id: parseInt(req.params.id),
        usuarioId: req.usuario.id
      }
    })
    
    if (!gastoFixoExistente) {
      return res.status(404).json({ error: 'Gasto fixo não encontrado' })
    }
    
    const gastoFixo = await prisma.gastoFixo.update({
      where: { id: parseInt(req.params.id) },
      data: {
        descricao,
        valor: parseFloat(valor),
        tipo,
        diaVencimento: parseInt(diaVencimento),
        categoria,
        status: status || 'a_vencer'
      }
    })
    
    res.json(gastoFixo)
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar gasto fixo' })
  }
})

// DELETE - Excluir gasto fixo
router.delete('/:id', async (req, res) => {
  try {
    // Verificar se o gasto fixo pertence ao usuário
    const gastoFixoExistente = await prisma.gastoFixo.findFirst({
      where: { 
        id: parseInt(req.params.id),
        usuarioId: req.usuario.id
      }
    })
    
    if (!gastoFixoExistente) {
      return res.status(404).json({ error: 'Gasto fixo não encontrado' })
    }
    
    await prisma.gastoFixo.delete({
      where: { id: parseInt(req.params.id) }
    })
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir gasto fixo' })
  }
})

export default router
