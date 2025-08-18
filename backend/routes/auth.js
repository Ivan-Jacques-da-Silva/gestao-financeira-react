
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

export default router
