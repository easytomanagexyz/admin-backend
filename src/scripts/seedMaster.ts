// scripts/seedMaster.ts
import { PrismaClient } from "../generated/master";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // create default admin if not exists
  const adminEmail = "admin@easytomanage.xyz";
  const existing = await prisma.adminUser.findUnique({ where: { email: adminEmail }});
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
    { slug: "starter", name: "Starter", monthlyPrice: 0, description: "Free starter plan" },
    { slug: "pro", name: "Pro", monthlyPrice: 499, description: "Business plan" },
    { slug: "enterprise", name: "Enterprise", monthlyPrice: 1999, description: "Enterprise plan" },
  ];

  for (const p of plans) {
    const found = await prisma.plan.findUnique({ where: { slug: p.slug }});
    if (!found) {
      await prisma.plan.create({ data: p });
      console.log("Created plan:", p.slug);
    } else {
      console.log("Plan exists:", p.slug);
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
