/*
  Warnings:

  - You are about to drop the column `ativo` on the `gastos_fixos` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "gastos_fixos" DROP COLUMN "ativo";

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "mostrarValores" BOOLEAN NOT NULL DEFAULT false;
