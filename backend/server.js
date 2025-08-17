
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createServer } from 'net'
import gastosRoutes from './routes/gastos.js'
import gastosFixosRoutes from './routes/gastosFixos.js'

dotenv.config()

const app = express()
const PORT = 5000

// Middlewares
app.use(cors())
app.use(express.json())

// Rotas
app.use('/api/gastos', gastosRoutes)
app.use('/api/gastos-fixos', gastosFixosRoutes)

// Rota de teste
app.get('/api/health', (req, res) => {
  res.json({ message: 'API está funcionando!' })
})

// Iniciar servidor na porta 5000
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`)
  console.log(`📡 API disponível em: http://localhost:${PORT}`)
})
