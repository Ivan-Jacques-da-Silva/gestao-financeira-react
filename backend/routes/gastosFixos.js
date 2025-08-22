
import express from 'express'
import prisma from '../prisma/client.js'
import jwt from 'jsonwebtoken'

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_muito_segura'

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ erro: 'Token de acesso requerido' })
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ erro: 'Token inválido' })
    }
    req.user = user
    next()
  })
}

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken)

// Listar gastos fixos do usuário autenticado
router.get('/', async (req, res) => {
  try {
    const gastosFixos = await prisma.gastoFixo.findMany({
      where: {
        usuarioId: req.user.id
      },
      orderBy: {
        dataVencimento: 'asc'
      }
    })
    
    res.json(gastosFixos)
  } catch (error) {
    console.error('Erro ao buscar gastos fixos:', error)
    res.status(500).json({
      erro: 'Erro interno do servidor'
    })
  }
})

// Criar novo gasto fixo
router.post('/', async (req, res) => {
  try {
    const { descricao, valor, tipo, dataVencimento, observacoes } = req.body

    if (!descricao || !valor || !tipo || !dataVencimento) {
      return res.status(400).json({
        erro: 'Dados obrigatórios: descrição, valor, tipo e data de vencimento'
      })
    }

    const valorNumerico = parseFloat(valor)
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      return res.status(400).json({
        erro: 'Valor deve ser um número positivo'
      })
    }

    const dataVencimentoGasto = new Date(dataVencimento)
    if (isNaN(dataVencimentoGasto.getTime())) {
      return res.status(400).json({
        erro: 'Data de vencimento inválida'
      })
    }

    const novoGastoFixo = await prisma.gastoFixo.create({
      data: {
        descricao,
        valor: valorNumerico,
        tipo,
        dataVencimento: dataVencimentoGasto,
        observacoes: observacoes || '',
        status: 'pendente',
        usuarioId: req.user.id
      }
    })

    res.status(201).json(novoGastoFixo)
  } catch (error) {
    console.error('Erro ao criar gasto fixo:', error)
    res.status(500).json({
      erro: 'Erro interno do servidor'
    })
  }
})

// Atualizar gasto fixo específico
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { descricao, valor, tipo, dataVencimento, observacoes, status } = req.body

    // Verificar se o gasto fixo pertence ao usuário
    const gastoFixoExistente = await prisma.gastoFixo.findFirst({
      where: {
        id: parseInt(id),
        usuarioId: req.user.id
      }
    })

    if (!gastoFixoExistente) {
      return res.status(404).json({
        erro: 'Gasto fixo não encontrado'
      })
    }

    const dadosAtualizacao = {}

    if (descricao !== undefined) dadosAtualizacao.descricao = descricao
    if (valor !== undefined) {
      const valorNumerico = parseFloat(valor)
      if (isNaN(valorNumerico) || valorNumerico <= 0) {
        return res.status(400).json({
          erro: 'Valor deve ser um número positivo'
        })
      }
      dadosAtualizacao.valor = valorNumerico
    }
    if (tipo !== undefined) dadosAtualizacao.tipo = tipo
    if (dataVencimento !== undefined) {
      const dataVencimentoGasto = new Date(dataVencimento)
      if (isNaN(dataVencimentoGasto.getTime())) {
        return res.status(400).json({
          erro: 'Data de vencimento inválida'
        })
      }
      dadosAtualizacao.dataVencimento = dataVencimentoGasto
    }
    if (observacoes !== undefined) dadosAtualizacao.observacoes = observacoes
    if (status !== undefined) dadosAtualizacao.status = status

    const gastoFixoAtualizado = await prisma.gastoFixo.update({
      where: { id: parseInt(id) },
      data: dadosAtualizacao
    })

    res.json(gastoFixoAtualizado)
  } catch (error) {
    console.error('Erro ao atualizar gasto fixo:', error)
    res.status(500).json({
      erro: 'Erro interno do servidor'
    })
  }
})

// Excluir gasto fixo específico
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Verificar se o gasto fixo pertence ao usuário
    const gastoFixoExistente = await prisma.gastoFixo.findFirst({
      where: {
        id: parseInt(id),
        usuarioId: req.user.id
      }
    })

    if (!gastoFixoExistente) {
      return res.status(404).json({
        erro: 'Gasto fixo não encontrado'
      })
    }

    await prisma.gastoFixo.delete({
      where: { id: parseInt(id) }
    })

    res.json({ mensagem: 'Gasto fixo excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir gasto fixo:', error)
    res.status(500).json({
      erro: 'Erro interno do servidor'
    })
  }
})

export default router
