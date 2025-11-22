import prisma from "../utils/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "changeme_in_prod";
const JWT_EXPIRES = "7d";

export async function createAdmin(email: string, password: string, name?: string) {
  const hashed = await bcrypt.hash(password, 10);
  return prisma.admin.create({
    data: { email, password: hashed, name },
  });
}

export async function authenticateAdmin(email: string, password: string) {
  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin) return null;
  const ok = await bcrypt.compare(password, admin.password);
  if (!ok) return null;
  const token = jwt.sign({ id: admin.id, email: admin.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  return { admin, token };
}
