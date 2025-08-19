
-- AlterTable
ALTER TABLE "Gasto" ADD COLUMN "totalParcelas" INTEGER NOT NULL DEFAULT 1;

-- Update existing records to set totalParcelas = 1 for single parcelas
UPDATE "Gasto" SET "totalParcelas" = 1 WHERE "totalParcelas" IS NULL;
