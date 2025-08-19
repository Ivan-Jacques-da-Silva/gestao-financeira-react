
// seed.js
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ===== CONFIG =====
const usuarioId = 1
const ANO = 2025
const MES_REF = 7 // agosto (0=jan)

// ===== FIXOS (somente valor de agosto) =====
const fixosAgosto = [
  { descricao: 'Internet',       valor: 99.90,  tipo: 'Débito',            dataVencimento: new Date(ANO, MES_REF, 10), categoria: 'Telecomunicações' },
  { descricao: 'Luz',            valor: 363.00, tipo: 'Débito',            dataVencimento: new Date(ANO, MES_REF, 25), categoria: 'Utilidades' },
  { descricao: 'Água',           valor: 132.00, tipo: 'Débito',            dataVencimento: new Date(ANO, MES_REF, 18), categoria: 'Utilidades' },
  { descricao: 'Unimed',         valor: 639.80, tipo: 'Débito',            dataVencimento: new Date(ANO, MES_REF, 12), categoria: 'Saúde' },
  { descricao: 'Gasolina',       valor: 500.00, tipo: 'Pix',               dataVencimento: new Date(ANO, MES_REF, 1),  categoria: 'Transporte' },
  { descricao: 'Limite Banri',   valor: 117.00, tipo: 'Cartão de Crédito', dataVencimento: new Date(ANO, MES_REF, 30), categoria: 'Financeiro' },
  { descricao: 'Curso Teologia', valor: 200.00, tipo: 'Cartão de Crédito', dataVencimento: new Date(ANO, MES_REF, 5),  categoria: 'Educação' },
  { descricao: 'Curso Inglês',   valor: 250.00, tipo: 'Cartão de Crédito', dataVencimento: new Date(ANO, MES_REF, 8),  categoria: 'Educação' },
  { descricao: 'Napoleon Host',  valor: 16.99,  tipo: 'Cartão de Crédito', dataVencimento: new Date(ANO, MES_REF, 15), categoria: 'Tecnologia' },
  { descricao: 'MEI RF (Fev)',   valor: 80.90,  tipo: 'Dinheiro',          dataVencimento: new Date(ANO, MES_REF, 20), categoria: 'Impostos' },
]

// ===== PARCELAS (JAN..AGO da planilha) =====
const parcelasPlanilha = {
  'Cartão de credito S': [824.00, 487.16, 824.00, 924.00, 924.00, 1150.00, 1150.00, 1150.00],
  'Cartão de credito B': [390.00, 118.00, 420.00, 951.70, 713.24, 1240.00, 574.00, 574.00],
  'Pompeia':             [137.93, 137.93, 279.39, 279.39, 423.98, 423.98, 423.98, 423.98],
  'MEI Parcela':         [ 55.00,  55.00,  55.00,  55.00,  55.00,  55.00,  55.00,  55.00],
  'Monjua':              [207.85, 207.85, 207.85, 207.85, 239.47, 239.47, 239.47, 239.47],
}

const metaParcelas = {
  'Cartão de credito S': { tipo: 'Cartão de Crédito', categoria: 'Financeiro' },
  'Cartão de credito B': { tipo: 'Cartão de Crédito', categoria: 'Financeiro' },
  'Pompeia':             { tipo: 'Cartão de Crédito', categoria: 'Compras' },
  'MEI Parcela':         { tipo: 'Débito',            categoria: 'Impostos' },
  'Monjua':              { tipo: 'Cartão de Crédito', categoria: 'Compras' },
}

function montarVariaveisDaPlanilha() {
  const itens = []
  for (const [desc, valores] of Object.entries(parcelasPlanilha)) {
    const { tipo, categoria } = metaParcelas[desc]
    const totalParcelas = valores.filter(v => v != null).length
    let idx = 0
    for (let mes = 0; mes < valores.length; mes++) {
      const v = valores[mes]
      if (v == null) continue
      idx++
      itens.push({
        descricao: `${desc} - Parcela ${idx}/${totalParcelas}`,
        valor: Number(v),
        tipo,
        data: new Date(ANO, mes, 1),
        parcelas: idx, // Número da parcela atual
        totalParcelas: totalParcelas, // Total de parcelas
        categoria,
        status: mes < MES_REF ? 'pago' : 'a_vencer',
      })
    }
  }
  return itens
}

async function seed() {
  console.log('🌱 Seed manual 2025...')
  try {
    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } })
    if (!usuario) {
      console.log('❌ Usuário não encontrado.')
      return
    }

    await prisma.$transaction([
      prisma.gastoFixo.deleteMany({ where: { usuarioId } }),
      prisma.gasto.deleteMany({ where: { usuarioId } }),
    ])

    // FIXOS (mês de referência)
    const fixos = fixosAgosto.map(g => ({
      ...g,
      status: 'a_vencer',
      usuarioId,
    }))
    if (fixos.length) await prisma.gastoFixo.createMany({ data: fixos })

    // VARIÁVEIS (parcelas jan..ago)
    const variaveis = montarVariaveisDaPlanilha().map(g => ({ ...g, usuarioId }))
    if (variaveis.length) await prisma.gasto.createMany({ data: variaveis })

    const somaFixos = fixos.reduce((s,g)=>s+g.valor,0)
    const somaVars = variaveis.reduce((s,g)=>s+g.valor,0)
    console.log('📊 === RESUMO ===')
    console.log(`Fixos (ago/${ANO}): ${fixos.length} | R$ ${somaFixos.toFixed(2)}`)
    console.log(`Variáveis/Parcelas (jan..ago/${ANO}): ${variaveis.length} | R$ ${somaVars.toFixed(2)}`)
    console.log('✅ Seed completo!')
  } catch (e) {
    console.error('❌ Erro no seed:', e)
  } finally {
    await prisma.$disconnect()
  }
}

seed()
