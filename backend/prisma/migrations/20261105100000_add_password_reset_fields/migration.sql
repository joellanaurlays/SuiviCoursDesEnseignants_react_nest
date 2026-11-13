ALTER TABLE "users"
ADD COLUMN "reset_code" TEXT,
ADD COLUMN "reset_code_expires_at" TIMESTAMP(3);
