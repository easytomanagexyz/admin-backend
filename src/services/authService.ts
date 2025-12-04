import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || "change-this-secret-in-prod";
const JWT_EXPIRES_IN = "7d";

export async function loginAdmin(email: string, password: string) {
  const admin = await prisma.adminUser.findFirst({ where: { email } });
  if (!admin) return null;

  const ok = await bcrypt.compare(password, admin.password);
  if (!ok) return null;

  const token = jwt.sign(
    { id: admin.id, email: admin.email, role: admin.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { lastLogin: new Date() },
  });

  return {
    token,
    admin: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    },
  };
}
