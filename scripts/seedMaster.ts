import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // create default admin if not exists
  const adminEmail = "admin@easytomanage.xyz";
  const existing = await prisma.adminUser.findFirst({
    where: { email: adminEmail },
  });

  if (!existing) {
    const hash = await bcrypt.hash("admin123", 10);
    await prisma.adminUser.create({
      data: {
        email: adminEmail,
        password: hash,
        name: "EasyToManage Admin",
        role: "superadmin",
      },
    });
    console.log("Created default admin:", adminEmail);
  } else {
    console.log("Admin already exists:", adminEmail);
  }

  console.log("Seed finished (admin only, no plans).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
