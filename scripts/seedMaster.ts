// scripts/seedMaster.ts
import { PrismaClient } from "@prisma/client";

// Removed invalid import of NodeJS types
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // create default admin if not exists
  const adminEmail = "admin@easytomanage.xyz";
  const existing = await prisma.adminUser.findFirst({ where: { email: adminEmail }});
  if (!existing) {
    const hash = await bcrypt.hash("admin123", 10);
    await prisma.adminUser.create({
      data: {
        email: adminEmail,
        password: hash,
        name: "EasyToManage Admin",
        role: "superadmin"
      }
    });
    console.log("Created default admin:", adminEmail);
  } else {
    console.log("Admin already exists:", adminEmail);
  }

  // create default plans if missing
  const plans = [
    { slug: "starter", name: "Starter", monthlyPrice: 0, description: "Free starter plan", currency: "INR", active: true },
    { slug: "pro", name: "Pro", monthlyPrice: 499, description: "Business plan", currency: "INR", active: true },
    { slug: "enterprise", name: "Enterprise", monthlyPrice: 1999, description: "Enterprise plan", currency: "INR", active: true },
  ];

  for (const p of plans) {
    const found = await prisma.plan.findFirst({ where: { name: p.name }});
    if (!found) {
      await prisma.plan.create({
        data: {
          name: p.name,
          monthlyPrice: p.monthlyPrice,
          description: p.description,
          currency: p.currency,
          active: p.active,
        }
      });
      console.log("Created plan:", p.name);
    } else {
      console.log("Plan exists:", p.name);
    }
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
