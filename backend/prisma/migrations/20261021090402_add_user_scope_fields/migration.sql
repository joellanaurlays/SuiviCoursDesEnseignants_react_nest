-- AlterTable
ALTER TABLE "users" ADD COLUMN     "cycles" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "mention_id" TEXT,
ADD COLUMN     "parcours" TEXT;
