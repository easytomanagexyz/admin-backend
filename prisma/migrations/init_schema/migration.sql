-- Create Tenant table
CREATE TABLE IF NOT EXISTS "Tenant" (
    id TEXT NOT NULL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    website TEXT,
    "restaurantId" TEXT UNIQUE,
    "dbName" TEXT,
    "dbUser" TEXT,
    "dbPassword" TEXT,
    "useRedis" BOOLEAN NOT NULL DEFAULT false,
    plan TEXT,
    country TEXT,
    state TEXT,
    city TEXT,
    "posType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Plan table
CREATE TABLE IF NOT EXISTS "Plan" (
    id TEXT NOT NULL PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    currency TEXT NOT NULL DEFAULT 'INR',
    "monthlyPrice" DECIMAL(10,2) NOT NULL,
    "yearlyPrice" DECIMAL(10,2),
    active BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Feature table
CREATE TABLE IF NOT EXISTS "Feature" (
    id TEXT NOT NULL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    "planId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("planId") REFERENCES "Plan"(id) ON DELETE CASCADE
);

-- Create Subscription table
CREATE TABLE IF NOT EXISTS "Subscription" (
    id TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "planId" TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"(id) ON DELETE CASCADE
);

-- Create Transaction table
CREATE TABLE IF NOT EXISTS "Transaction" (
    id TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT,
    "amountCents" INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    description TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"(id) ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "Tenant_email_idx" ON "Tenant"(email);
CREATE INDEX IF NOT EXISTS "Tenant_restaurantId_idx" ON "Tenant"("restaurantId");
CREATE INDEX IF NOT EXISTS "Subscription_tenantId_idx" ON "Subscription"("tenantId");
CREATE INDEX IF NOT EXISTS "Transaction_tenantId_idx" ON "Transaction"("tenantId");
CREATE INDEX IF NOT EXISTS "Feature_planId_idx" ON "Feature"("planId");
