
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

// Listar gastos do usuário autenticado
router.get('/', async (req, res) => {
  try {
    const gastos = await prisma.gasto.findMany({
      where: {
        usuarioId: req.user.id
      },
      orderBy: {
        data: 'desc'
      }
    })
    
    res.json(gastos)
  } catch (error) {
    console.error('Erro ao buscar gastos:', error)
    res.status(500).json({
      erro: 'Erro interno do servidor'
    })
  }
})

// Criar novo gasto
router.post('/', async (req, res) => {
  try {
    const { descricao, valor, tipo, data, numParcelas, observacoes } = req.body

    if (!descricao || !valor || !tipo || !data) {
      return res.status(400).json({
        erro: 'Dados obrigatórios: descrição, valor, tipo e data'
      })
    }

    const valorNumerico = parseFloat(valor)
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      return res.status(400).json({
        erro: 'Valor deve ser um número positivo'
      })
    }

    const dataGasto = new Date(data)
    if (isNaN(dataGasto.getTime())) {
      return res.status(400).json({
        erro: 'Data inválida'
      })
    }

    // Se tem parcelas, criar múltiplos gastos
    if (numParcelas && numParcelas > 1) {
      const gastosCriados = []
      const valorParcela = valorNumerico / numParcelas

      for (let i = 0; i < numParcelas; i++) {
        const dataParcelaAtual = new Date(dataGasto)
        dataParcelaAtual.setMonth(dataParcelaAtual.getMonth() + i)

        const gasto = await prisma.gasto.create({
          data: {
            descricao: `${descricao} (${i + 1}/${numParcelas})`,
            valor: valorParcela,
            tipo,
            data: dataParcelaAtual,
            observacoes: observacoes || '',
            status: 'pendente',
            parcelaAtual: i + 1,
            totalParcelas: numParcelas,
            usuarioId: req.user.id
          }
        })

        gastosCriados.push(gasto)
      }

      res.status(201).json(gastosCriados)
    } else {
      // Criar gasto único
      const novoGasto = await prisma.gasto.create({
        data: {
          descricao,
          valor: valorNumerico,
          tipo,
          data: dataGasto,
          observacoes: observacoes || '',
          status: 'pendente',
          parcelaAtual: null,
          totalParcelas: null,
          usuarioId: req.user.id
        }
      })

      res.status(201).json(novoGasto)
    }
  } catch (error) {
    console.error('Erro ao criar gasto:', error)
    res.status(500).json({
      erro: 'Erro interno do servidor'
    })
  }
})

// Atualizar gasto específico
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { descricao, valor, tipo, data, observacoes, status } = req.body

    // Verificar se o gasto pertence ao usuário
    const gastoExistente = await prisma.gasto.findFirst({
      where: {
        id: parseInt(id),
        usuarioId: req.user.id
      }
    })

    if (!gastoExistente) {
      return res.status(404).json({
        erro: 'Gasto não encontrado'
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
    if (data !== undefined) {
      const dataGasto = new Date(data)
      if (isNaN(dataGasto.getTime())) {
        return res.status(400).json({
          erro: 'Data inválida'
        })
      }
      dadosAtualizacao.data = dataGasto
    }
    if (observacoes !== undefined) dadosAtualizacao.observacoes = observacoes
    if (status !== undefined) dadosAtualizacao.status = status

    const gastoAtualizado = await prisma.gasto.update({
      where: { id: parseInt(id) },
      data: dadosAtualizacao
    })

    res.json(gastoAtualizado)
  } catch (error) {
    console.error('Erro ao atualizar gasto:', error)
    res.status(500).json({
      erro: 'Erro interno do servidor'
    })
  }
})

// Excluir gasto específico
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Verificar se o gasto pertence ao usuário
    const gastoExistente = await prisma.gasto.findFirst({
      where: {
        id: parseInt(id),
        usuarioId: req.user.id
      }
    })

    if (!gastoExistente) {
      return res.status(404).json({
        erro: 'Gasto não encontrado'
      })
    }

    await prisma.gasto.delete({
      where: { id: parseInt(id) }
    })

    res.json({ mensagem: 'Gasto excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir gasto:', error)
    res.status(500).json({
      erro: 'Erro interno do servidor'
    })
  }
})

export default router
