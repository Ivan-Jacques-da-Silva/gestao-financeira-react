
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

// Carrega variáveis de ambiente
dotenv.config()

const DATABASE_URL = process.env.DATABASE_URL
const DB_NAME = process.env.DB_NAME || 'gestao_financeira'
const DB_PASSWORD = process.env.DB_PASSWORD || 'FinanceApp2024!'

async function setupBackend() {
  console.log('🚀 Iniciando configuração do ambiente backend...')
  
  try {
    // 1. Instala dependências primeiro
    await installDependencies()
    
    // 2. Verifica se PostgreSQL está disponível
    await checkPostgreSQL()
    
    // 3. Importa o cliente pg DEPOIS de instalar
    const { Client } = await import('pg')
    
    // 4. Verifica se o banco existe e limpa tudo
    await cleanDatabase(Client)
    
    // 5. Gera o cliente Prisma
    await generatePrismaClient()
    
    // 6. Aplica o schema ao banco
    await pushPrismaSchema()
    
    console.log('✅ Ambiente backend configurado com sucesso!')
    console.log('📝 Tabelas criadas: gastos, gastos_fixos')
    console.log('🔄 Para iniciar o servidor: npm run dev')
    
  } catch (error) {
    console.error('❌ Erro na configuração:', error.message)
    process.exit(1)
  }
}

async function checkPostgreSQL() {
  console.log('🔍 Verificando PostgreSQL...')
  
  try {
    execSync('psql --version', { stdio: 'pipe' })
    console.log('✅ PostgreSQL encontrado')
  } catch (error) {
    console.log('⚠️ PostgreSQL não encontrado no PATH')
    console.log('💡 Opções:')
    console.log('1. Instalar PostgreSQL: https://www.postgresql.org/download/')
    console.log('2. Usar Docker: docker run --name postgres-local -e POSTGRES_PASSWORD=FinanceApp2024! -p 5432:5432 -d postgres')
    console.log('3. Usar PostgreSQL no pgAdmin (se já instalado)')
    throw new Error('PostgreSQL não está disponível')
  }
}

async function installDependencies() {
  console.log('📦 Instalando dependências...')
  
  try {
    // Verifica se node_modules existe
    if (!fs.existsSync('node_modules')) {
      console.log('⬇️ Instalando pacotes pela primeira vez...')
    } else {
      console.log('⬇️ Atualizando dependências...')
    }
    
    execSync('npm install', { stdio: 'inherit' })
    console.log('✅ Dependências instaladas')
  } catch (error) {
    throw new Error(`Erro ao instalar dependências: ${error.message}`)
  }
}

async function cleanDatabase(Client) {
  console.log('🧹 Configurando banco de dados PostgreSQL...')
  
  // Lista de senhas para tentar
  const possiblePasswords = [
    DB_PASSWORD,
    'postgres',
    'admin',
    '123456',
    ''
  ]
  
  let adminClient = null
  let connected = false
  
  for (const password of possiblePasswords) {
    try {
      console.log(`🔑 Tentando conectar com senha...`)
      const adminUrl = `postgresql://postgres:${password}@localhost:5432/postgres`
      adminClient = new Client({ connectionString: adminUrl })
      
      await adminClient.connect()
      console.log('✅ Conectado ao PostgreSQL')
      connected = true
      
      // Atualiza o .env com a senha que funcionou
      if (password !== DB_PASSWORD) {
        await updateEnvPassword(password)
        console.log(`🔧 Senha atualizada no .env: ${password}`)
        
        // Atualiza as variáveis de ambiente em tempo de execução
        process.env.DB_PASSWORD = password
        process.env.DATABASE_URL = `postgresql://postgres:${password}@localhost:5432/gestao_financeira?schema=public`
        console.log('🔄 Variáveis de ambiente atualizadas em tempo de execução')
      }
      
      break
    } catch (error) {
      if (adminClient) {
        try { await adminClient.end() } catch {}
      }
      console.log(`❌ Senha não funcionou`)
    }
  }
  
  if (!connected) {
    console.log('⚠️ Não foi possível conectar com nenhuma senha comum')
    console.log('💡 Soluções:')
    console.log('')
    console.log('🔧 Opção 1 - Resetar senha via pgAdmin:')
    console.log('1. Abra o pgAdmin (senha: admin)')
    console.log('2. Login/Group Roles → postgres → Definition')
    console.log('3. Altere para: FinanceApp2024!')
    console.log('')
    console.log('🔧 Opção 2 - Via linha de comando:')
    console.log('1. Abra prompt como administrador')
    console.log('2. Execute: psql -U postgres')
    console.log('3. Digite: ALTER USER postgres PASSWORD \'FinanceApp2024!\';')
    console.log('')
    console.log('🔧 Opção 3 - Reinstalar PostgreSQL:')
    console.log('1. Use senha: FinanceApp2024! durante a instalação')
    console.log('')
    throw new Error('Falha na autenticação PostgreSQL')
  }
  
  try {
    
    // Garante que o usuário postgres tem todas as permissões
    try {
      await adminClient.query(`
        ALTER USER postgres WITH SUPERUSER CREATEDB CREATEROLE REPLICATION;
      `)
      console.log('✅ Permissões do usuário postgres configuradas')
    } catch (permError) {
      console.log('⚠️ Aviso: Não foi possível alterar permissões (pode já estar configurado)')
    }
    
    // Verifica se o banco existe
    const dbExists = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [DB_NAME]
    )
    
    if (dbExists.rows.length > 0) {
      console.log(`📊 Banco ${DB_NAME} encontrado, limpando...`)
      
      try {
        // Encerra conexões ativas
        await adminClient.query(`
          SELECT pg_terminate_backend(pid)
          FROM pg_stat_activity
          WHERE datname = $1 AND pid <> pg_backend_pid()
        `, [DB_NAME])
        
        // Remove o banco
        await adminClient.query(`DROP DATABASE IF EXISTS ${DB_NAME}`)
        console.log(`🗑️ Banco ${DB_NAME} removido`)
      } catch (dropError) {
        console.log('⚠️ Erro ao remover banco (continuando):', dropError.message)
      }
    }
    
    // Cria o banco novamente
    await adminClient.query(`CREATE DATABASE ${DB_NAME} OWNER postgres`)
    console.log(`📊 Banco ${DB_NAME} criado com owner postgres`)
    
    await adminClient.end()
    
  } catch (error) {
    console.log('⚠️ Erro ao configurar banco:', error.message)
    console.log('💡 Para resolver o problema de autenticação:')
    console.log('')
    console.log('1. Abra o psql como administrador:')
    console.log('   psql -U postgres -h localhost')
    console.log('')
    console.log('2. Se pedir senha, use a senha que você configurou na instalação')
    console.log('')
    console.log('3. Execute o comando para alterar a senha:')
    console.log(`   ALTER USER postgres PASSWORD '${DB_PASSWORD}';`)
    console.log('')
    console.log('4. Se não conseguir entrar, tente:')
    console.log('   - Windows: Procure "pgAdmin" no menu iniciar')
    console.log('   - Senha do pgAdmin: admin (como você mencionou)')
    console.log('   - Dentro do pgAdmin, altere a senha do usuário postgres')
    console.log('')
    console.log('5. Depois execute novamente: node setup.js')
    throw error
  }
}

async function generatePrismaClient() {
  console.log('🔄 Gerando cliente Prisma...')
  
  try {
    // Garante que o Prisma use as variáveis de ambiente atualizadas
    const env = { ...process.env }
    execSync('npx prisma generate', { stdio: 'inherit', env })
    console.log('✅ Cliente Prisma gerado')
  } catch (error) {
    throw new Error(`Erro ao gerar cliente Prisma: ${error.message}`)
  }
}

async function pushPrismaSchema() {
  console.log('📋 Aplicando schema ao banco de dados...')
  
  try {
    // Garante que o Prisma use as variáveis de ambiente atualizadas
    const env = { ...process.env }
    execSync('npx prisma db push --force-reset', { stdio: 'inherit', env })
    console.log('✅ Schema aplicado ao banco')
  } catch (error) {
    throw new Error(`Erro ao aplicar schema: ${error.message}`)
  }
}

async function updateEnvPassword(newPassword) {
  try {
    const envPath = '.env'
    let envContent = fs.readFileSync(envPath, 'utf8')
    
    // Atualiza as linhas de senha de forma mais robusta
    envContent = envContent.replace(
      /^DB_PASSWORD=.*$/m,
      `DB_PASSWORD=${newPassword}`
    )
    envContent = envContent.replace(
      /^DATABASE_URL=.*$/m,
      `DATABASE_URL="postgresql://postgres:${newPassword}@localhost:5432/gestao_financeira?schema=public"`
    )
    
    fs.writeFileSync(envPath, envContent)
    console.log('💾 Arquivo .env atualizado com sucesso')
  } catch (error) {
    console.log('⚠️ Não foi possível atualizar .env:', error.message)
    throw error
  }
}

// Executa o setup
setupBackend()
