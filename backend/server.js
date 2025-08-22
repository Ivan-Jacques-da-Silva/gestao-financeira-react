
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "net";
import gastosRoutes from "./routes/gastos.js";
import gastosFixosRoutes from "./routes/gastosFixos.js";
import authRoutes from './routes/auth.js'

dotenv.config();

const app = express();
let PORT = process.env.PORT || 5000;

// Configuração de CORS para produção
const corsOptions = {
  origin: [
    'https://contas.vision.dev.br',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://0.0.0.0:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Middlewares
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Headers de segurança
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Rotas
app.use("/api/gastos", gastosRoutes);
app.use("/api/gastos-fixos", gastosFixosRoutes);
app.use('/api/auth', authRoutes);

// Rota de teste
app.get("/api/health", (req, res) => {
  res.json({ 
    message: "API está funcionando!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({
    erro: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado'
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    erro: 'Rota não encontrada',
    path: req.originalUrl
  });
});

// Função para verificar se a porta está disponível
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.listen(port, "0.0.0.0", () => {
      server.once("close", () => resolve(true));
      server.close();
    });
    server.on("error", () => resolve(false));
  });
}

// Função para encontrar uma porta disponível
async function findAvailablePort(startPort) {
  let port = startPort;
  while (port <= startPort + 10) {
    if (await isPortAvailable(port)) {
      return port;
    }
    port++;
  }
  throw new Error("Nenhuma porta disponível encontrada");
}

// Iniciar servidor com detecção automática de porta
async function startServer() {
  try {
    // Primeiro tenta a porta padrão
    if (await isPortAvailable(PORT)) {
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`🚀 Servidor rodando na porta ${PORT}`);
        console.log(`📡 API disponível em: http://localhost:${PORT}`);
        console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      });
    } else {
      // Se a porta estiver ocupada, encontra uma disponível
      console.log(`⚠️ Porta ${PORT} ocupada, procurando porta disponível...`);
      PORT = await findAvailablePort(parseInt(PORT));
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`🚀 Servidor rodando na porta ${PORT}`);
        console.log(`📡 API disponível em: http://localhost:${PORT}`);
        console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      });
    }
  } catch (error) {
    console.error("❌ Erro ao iniciar servidor:", error.message);
    process.exit(1);
  }
}

startServer();
