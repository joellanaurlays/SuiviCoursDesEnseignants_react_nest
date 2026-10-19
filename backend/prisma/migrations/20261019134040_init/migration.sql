-- CreateEnum
CREATE TYPE "Cycle" AS ENUM ('LICENCE', 'MASTER');

-- CreateEnum
CREATE TYPE "EtatEnseignement" AS ENUM ('NON_COMMENCE', 'EN_COURS', 'TERMINE');

-- CreateEnum
CREATE TYPE "StatutSeance" AS ENUM ('PLANIFIEE', 'REALISEE', 'ANNULEE');

-- CreateEnum
CREATE TYPE "ActionAuditSeance" AS ENUM ('CREATION', 'DECLARATION_REALISEE', 'REALISATION', 'ANNULATION', 'MODIFICATION', 'CORRECTION', 'SUPPRESSION');

-- CreateTable
CREATE TABLE "Enseignement" (
    "id" TEXT NOT NULL,
    "matiereId" TEXT NOT NULL,
    "enseignantId" TEXT NOT NULL,
    "mentionId" TEXT NOT NULL,
    "cycle" "Cycle" NOT NULL,
    "niveauId" TEXT NOT NULL,
    "parcours" TEXT NOT NULL,
    "semestreId" TEXT NOT NULL,
    "anneeUniversitaireId" TEXT NOT NULL,
    "volumePrevu" INTEGER NOT NULL,
    "heuresRealisees" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "progression" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "etat" "EtatEnseignement" NOT NULL DEFAULT 'NON_COMMENCE',
    "clotureAnticipee" BOOLEAN NOT NULL DEFAULT false,
    "motifCloture" TEXT,
    "dateCloture" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Enseignement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Seance" (
    "id" TEXT NOT NULL,
    "enseignementId" TEXT NOT NULL,
    "dateSeance" TIMESTAMP(3) NOT NULL,
    "heureDebut" TEXT NOT NULL,
    "heureFin" TEXT NOT NULL,
    "duree" DOUBLE PRECISION NOT NULL,
    "contenuEnseigne" TEXT,
    "statut" "StatutSeance" NOT NULL DEFAULT 'PLANIFIEE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Seance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalAuditSeance" (
    "id" TEXT NOT NULL,
    "seanceId" TEXT NOT NULL,
    "enseignementId" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "action" "ActionAuditSeance" NOT NULL,
    "motif" TEXT,
    "statutAvant" "StatutSeance",
    "statutApres" "StatutSeance",
    "valeursAvant" JSONB,
    "valeursApres" JSONB,
    "enseignantId" TEXT NOT NULL,
    "mentionId" TEXT NOT NULL,
    "cycle" "Cycle" NOT NULL,
    "parcours" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JournalAuditSeance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Enseignement_enseignantId_idx" ON "Enseignement"("enseignantId");

-- CreateIndex
CREATE INDEX "Enseignement_mentionId_cycle_idx" ON "Enseignement"("mentionId", "cycle");

-- CreateIndex
CREATE INDEX "Enseignement_clotureAnticipee_idx" ON "Enseignement"("clotureAnticipee");

-- CreateIndex
CREATE INDEX "Seance_enseignementId_dateSeance_idx" ON "Seance"("enseignementId", "dateSeance");

-- CreateIndex
CREATE INDEX "JournalAuditSeance_seanceId_idx" ON "JournalAuditSeance"("seanceId");

-- CreateIndex
CREATE INDEX "JournalAuditSeance_enseignementId_idx" ON "JournalAuditSeance"("enseignementId");

-- CreateIndex
CREATE INDEX "JournalAuditSeance_utilisateurId_idx" ON "JournalAuditSeance"("utilisateurId");

-- CreateIndex
CREATE INDEX "JournalAuditSeance_enseignantId_idx" ON "JournalAuditSeance"("enseignantId");

-- CreateIndex
CREATE INDEX "JournalAuditSeance_createdAt_idx" ON "JournalAuditSeance"("createdAt");

-- AddForeignKey
ALTER TABLE "Seance" ADD CONSTRAINT "Seance_enseignementId_fkey" FOREIGN KEY ("enseignementId") REFERENCES "Enseignement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
