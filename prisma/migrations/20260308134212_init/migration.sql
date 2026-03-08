-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'COMPETITOR');

-- CreateEnum
CREATE TYPE "Belt" AS ENUM ('BRANCA', 'AZUL', 'ROXA', 'MARROM', 'PRETA');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MASCULINO', 'FEMININO', 'MISTO');

-- CreateEnum
CREATE TYPE "CompetitionStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "AgeDivisionCode" AS ENUM ('PRE_MIRIM', 'MIRIM_1', 'MIRIM_2', 'INFANTIL_1', 'INFANTIL_2', 'INFANTO_JUVENIL_1', 'INFANTO_JUVENIL_2', 'INFANTO_JUVENIL_3', 'JUVENIL_FEMININO', 'JUVENIL_MASCULINO', 'ADULTO_FEMININO', 'ADULTO_MASCULINO', 'MASTER_FEMININO', 'MASTER_MASCULINO');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'COMPETITOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitor_profiles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "belt" "Belt" NOT NULL,
    "birthDate" DATE NOT NULL,
    "gender" "Gender" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "competitor_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitions" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "location" TEXT NOT NULL,
    "status" "CompetitionStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "competitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "age_divisions" (
    "id" UUID NOT NULL,
    "code" "AgeDivisionCode" NOT NULL,
    "minAge" INTEGER NOT NULL,
    "maxAge" INTEGER NOT NULL,

    CONSTRAINT "age_divisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weight_classes" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "minWeight" DOUBLE PRECISION NOT NULL,
    "maxWeight" DOUBLE PRECISION NOT NULL,
    "gender" "Gender" NOT NULL,
    "ageDivisionId" UUID NOT NULL,

    CONSTRAINT "weight_classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registrations" (
    "id" UUID NOT NULL,
    "competitionId" UUID NOT NULL,
    "competitorId" UUID NOT NULL,
    "belt" "Belt" NOT NULL,
    "ageDivisionId" UUID NOT NULL,
    "weightClassId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "competitor_profiles_userId_key" ON "competitor_profiles"("userId");

-- CreateIndex
CREATE INDEX "competitor_profiles_userId_idx" ON "competitor_profiles"("userId");

-- CreateIndex
CREATE INDEX "competitions_status_idx" ON "competitions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "age_divisions_code_key" ON "age_divisions"("code");

-- CreateIndex
CREATE INDEX "weight_classes_ageDivisionId_idx" ON "weight_classes"("ageDivisionId");

-- CreateIndex
CREATE INDEX "weight_classes_gender_ageDivisionId_idx" ON "weight_classes"("gender", "ageDivisionId");

-- CreateIndex
CREATE UNIQUE INDEX "weight_classes_name_gender_ageDivisionId_key" ON "weight_classes"("name", "gender", "ageDivisionId");

-- CreateIndex
CREATE INDEX "registrations_competitionId_idx" ON "registrations"("competitionId");

-- CreateIndex
CREATE INDEX "registrations_competitorId_idx" ON "registrations"("competitorId");

-- CreateIndex
CREATE INDEX "registrations_ageDivisionId_idx" ON "registrations"("ageDivisionId");

-- CreateIndex
CREATE INDEX "registrations_weightClassId_idx" ON "registrations"("weightClassId");

-- CreateIndex
CREATE UNIQUE INDEX "registrations_competitionId_competitorId_key" ON "registrations"("competitionId", "competitorId");

-- AddForeignKey
ALTER TABLE "competitor_profiles" ADD CONSTRAINT "competitor_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weight_classes" ADD CONSTRAINT "weight_classes_ageDivisionId_fkey" FOREIGN KEY ("ageDivisionId") REFERENCES "age_divisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "competitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "competitor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_ageDivisionId_fkey" FOREIGN KEY ("ageDivisionId") REFERENCES "age_divisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_weightClassId_fkey" FOREIGN KEY ("weightClassId") REFERENCES "weight_classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
