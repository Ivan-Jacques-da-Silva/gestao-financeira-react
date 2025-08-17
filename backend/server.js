
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import gastosRoutes from './routes/gastos.js'
import gastosFixosRoutes from './routes/gastosFixos.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`)
})
