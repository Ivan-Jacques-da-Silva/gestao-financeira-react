
-- AlterTable
ALTER TABLE "gastos_fixos" 
ADD COLUMN "dataVencimento" TIMESTAMP(3);

-- Atualizar registros existentes convertendo diaVencimento para dataVencimento
UPDATE "gastos_fixos" 
SET "dataVencimento" = CURRENT_DATE + INTERVAL '1 day' * ("diaVencimento" - EXTRACT(DAY FROM CURRENT_DATE))
WHERE "dataVencimento" IS NULL;

-- Tornar a coluna obrigatória e remover a antiga
ALTER TABLE "gastos_fixos" 
ALTER COLUMN "dataVencimento" SET NOT NULL,
DROP COLUMN "diaVencimento";
