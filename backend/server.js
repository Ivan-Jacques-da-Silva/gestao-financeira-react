import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "net";
import gastosRoutes from "./routes/gastos.js";
import gastosFixosRoutes from "./routes/gastosFixos.js";

dotenv.config();

const app = express();
let PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Rotas
app.use("/api/gastos", gastosRoutes);
app.use("/api/gastos-fixos", gastosFixosRoutes);

// Rota de teste
app.get("/api/health", (req, res) => {
  res.json({ message: "API está funcionando!" });
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
      });
    } else {
      // Se a porta estiver ocupada, encontra uma disponível
      console.log(`⚠️ Porta ${PORT} ocupada, procurando porta disponível...`);
      PORT = await findAvailablePort(parseInt(PORT));
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`🚀 Servidor rodando na porta ${PORT}`);
        console.log(`📡 API disponível em: http://localhost:${PORT}`);
      });
    }
  } catch (error) {
    console.error("❌ Erro ao iniciar servidor:", error.message);
    process.exit(1);
  }
}

startServer();
