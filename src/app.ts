import express from "express";
import cors from "cors";
import adminRoutes from "./routes/admin";
import { getFullDbUrl, getDbParams, buildPostgresUrl } from "./utils/awsSecrets";
import { PrismaClient } from "@prisma/client";
import { getMasterPrisma } from "./utils/prismaFactory";

export async function createApp() {
  // At startup: populate DATABASE_URL_MASTER from SSM
  // 1) Try full DB URL param
  const FULL_PARAM = process.env.MASTER_DB_SSM_PARAM || "/prod/master-db-url";
  let url = await getFullDbUrl(FULL_PARAM);

  if (!url) {
    // fallback to individual params under /eatwithme
    const p = await getDbParams("/eatwithme");
    if (!p.user || !p.pass || !p.host || !p.port) {
      console.error("Could not resolve master DB connection from SSM. Please set /prod/master-db-url or the /eatwithme/* params.");
      throw new Error("Missing DB config in SSM");
    }
    url = buildPostgresUrl({
      user: p.user,
      pass: p.pass,
      host: p.host,
      port: p.port,
      dbname: p.name ?? "master-db",
    });
  }

  // expose for Prisma to use
  process.env.DATABASE_URL_MASTER = url;

  // Ensure Prisma client is created after env var is set
  // (prismaFactory will create one only when requested)
  getMasterPrisma();

  const app = express();
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());

  // Mount admin routes under /api
  app.use("/api", adminRoutes);

  // Health endpoint
  app.get("/", (req, res) => res.send("Admin API up"));
  app.get("/health", (req, res) => res.json({ status: "ok" }));

  return app;
}
