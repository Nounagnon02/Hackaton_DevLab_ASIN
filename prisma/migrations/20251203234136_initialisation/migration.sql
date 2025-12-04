-- CreateTable
CREATE TABLE "Pensioner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "monthlyPension" DOUBLE PRECISION NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'NOT_PAID',
    "fspId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "credentialId" TEXT,
    "publicKey" TEXT,
    "counter" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Pensioner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transfer" (
    "id" TEXT NOT NULL,
    "mojaloopId" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "amount" DOUBLE PRECISION NOT NULL,
    "pensionerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transfer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Pensioner_phoneNumber_key" ON "Pensioner"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Pensioner_credentialId_key" ON "Pensioner"("credentialId");

-- CreateIndex
CREATE UNIQUE INDEX "Transfer_mojaloopId_key" ON "Transfer"("mojaloopId");

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_pensionerId_fkey" FOREIGN KEY ("pensionerId") REFERENCES "Pensioner"("id") ON DELETE SET NULL ON UPDATE CASCADE;
