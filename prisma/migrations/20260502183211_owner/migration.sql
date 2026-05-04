-- CreateTable
CREATE TABLE "Owner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mobileNo" TEXT NOT NULL,
    "isMobileNoVerified" BOOLEAN NOT NULL DEFAULT false,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "gstNumber" TEXT,
    "licenseNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Owner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Owner_email_key" ON "Owner"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Owner_mobileNo_key" ON "Owner"("mobileNo");

-- CreateIndex
CREATE UNIQUE INDEX "Owner_gstNumber_key" ON "Owner"("gstNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Owner_licenseNumber_key" ON "Owner"("licenseNumber");
