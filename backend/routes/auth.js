
import express from 'express'
import prisma from '../prisma/client.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const router = express.Router()

const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_muito_segura'

// Registrar usuário
router.post('/registro', async (req, res) => {
  try {
    const { usuario, email, senha, cpf, telefone, sexo } = req.body

    // Verificar se usuário já existe
    const usuarioExistente = await prisma.usuario.findFirst({
      where: {
        OR: [
          { usuario },
          { email },
          { cpf }
        ]
      }
    })

    if (usuarioExistente) {
      return res.status(400).json({
        erro: 'Usuário, email ou CPF já cadastrado'
      })
    }

    // Criptografar senha
    const senhaCriptografada = await bcrypt.hash(senha, 10)

    // Criar usuário
    const novoUsuario = await prisma.usuario.create({
      data: {
        usuario,
        email,
        senha: senhaCriptografada,
        cpf,
        telefone,
        sexo
      },
      select: {
        id: true,
        usuario: true,
        email: true,
        cpf: true,
        telefone: true,
        sexo: true,
        mostrarValores: true,
        createdAt: true
      }
    })

    // Gerar token JWT
    const token = jwt.sign(
      { 
        id: novoUsuario.id, 
        usuario: novoUsuario.usuario, 
        email: novoUsuario.email 
      }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    )

    res.status(201).json({
      mensagem: 'Usuário registrado com sucesso',
      usuario: novoUsuario,
      token
    })

  } catch (error) {
    console.error('Erro ao registrar usuário:', error)
    res.status(500).json({
      erro: 'Erro interno do servidor'
    })
  }
})

// Login de usuário
router.post('/login', async (req, res) => {
  try {
    const { loginEmail, senha } = req.body

    // Buscar usuário por login ou email
    const usuario = await prisma.usuario.findFirst({
      where: {
        OR: [
          { usuario: loginEmail },
          { email: loginEmail }
        ]
      }
    })

    if (!usuario) {
      return res.status(401).json({
        erro: 'Credenciais inválidas'
      })
    }

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, usuario.senha)

    if (!senhaValida) {
      return res.status(401).json({
        erro: 'Credenciais inválidas'
      })
    }

    // Gerar token JWT
    const token = jwt.sign(
      { 
        id: usuario.id, 
        usuario: usuario.usuario, 
        email: usuario.email 
      }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    )

    // Retornar dados do usuário (sem a senha) e token
    const { senha: _, ...dadosUsuario } = usuario

    res.json({
      mensagem: 'Login realizado com sucesso',
      usuario: dadosUsuario,
      token
    })

  } catch (error) {
    console.error('Erro ao fazer login:', error)
    res.status(500).json({
      erro: 'Erro interno do servidor'
    })
  }
})

// Verificar senha e alterar preferência de mostrar valores
router.post('/verificar-senha', async (req, res) => {
  try {
    const { senha } = req.body
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({ erro: 'Token não fornecido' })
    }

    // Decodificar token para obter ID do usuário
    const decoded = jwt.verify(token, JWT_SECRET)
    
    // Buscar usuário
    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.id }
    })

    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado' })
    }

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, usuario.senha)

    if (!senhaValida) {
      return res.status(401).json({ erro: 'Senha incorreta' })
    }

    // Alterar preferência (toggle)
    const usuarioAtualizado = await prisma.usuario.update({
      where: { id: usuario.id },
      data: { mostrarValores: !usuario.mostrarValores },
      select: {
        id: true,
        usuario: true,
        email: true,
        cpf: true,
        telefone: true,
        sexo: true,
        mostrarValores: true,
        createdAt: true
      }
    })

    res.json({
      mensagem: 'Preferência atualizada com sucesso',
      mostrarValores: usuarioAtualizado.mostrarValores
    })

  } catch (error) {
    console.error('Erro ao verificar senha:', error)
    res.status(500).json({ erro: 'Erro interno do servidor' })
  }
})

// Atualizar perfil do usuário
router.put('/atualizar-perfil', async (req, res) => {
  try {
    const { usuario: nomeUsuario, email, telefone, cpf, senhaAtual, novaSenha } = req.body
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({ erro: 'Token não fornecido' })
    }

    // Decodificar token para obter ID do usuário
    const decoded = jwt.verify(token, JWT_SECRET)
    
    // Buscar usuário atual
    const usuarioAtual = await prisma.usuario.findUnique({
      where: { id: decoded.id }
    })

    if (!usuarioAtual) {
      return res.status(404).json({ erro: 'Usuário não encontrado' })
    }

    // Verificar se email ou usuário já existem (exceto o próprio usuário)
    const usuarioExistente = await prisma.usuario.findFirst({
      where: {
        OR: [
          { usuario: nomeUsuario },
          { email: email }
        ],
        NOT: {
          id: decoded.id
        }
      }
    })

    if (usuarioExistente) {
      if (usuarioExistente.usuario === nomeUsuario) {
        return res.status(400).json({ erro: 'Nome de usuário já está em uso' })
      }
      if (usuarioExistente.email === email) {
        return res.status(400).json({ erro: 'Email já está em uso' })
      }
    }

    // Preparar dados para atualização
    const dadosAtualizacao = {
      usuario: nomeUsuario,
      email,
      telefone,
      cpf
    }

    // Se uma nova senha foi fornecida, verificar a senha atual e atualizar
    if (novaSenha) {
      if (!senhaAtual) {
        return res.status(400).json({ erro: 'Senha atual é obrigatória para alterar a senha' })
      }

      const senhaValida = await bcrypt.compare(senhaAtual, usuarioAtual.senha)
      if (!senhaValida) {
        return res.status(401).json({ erro: 'Senha atual incorreta' })
      }

      // Criptografar nova senha
      dadosAtualizacao.senha = await bcrypt.hash(novaSenha, 10)
    }

    // Atualizar usuário
    const usuarioAtualizado = await prisma.usuario.update({
      where: { id: decoded.id },
      data: dadosAtualizacao,
      select: {
        id: true,
        usuario: true,
        email: true,
        cpf: true,
        telefone: true,
        sexo: true,
        mostrarValores: true,
        createdAt: true
      }
    })

    res.json({
      mensagem: 'Perfil atualizado com sucesso',
      usuario: usuarioAtualizado
    })

  } catch (error) {
    console.error('Erro ao atualizar perfil:', error)
    res.status(500).json({ erro: 'Erro interno do servidor' })
  }
})

export default router
