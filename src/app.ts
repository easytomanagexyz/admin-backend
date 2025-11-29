import express from "express";
import cors from "cors";
import adminRoutes from "./routes/admin";
// import tenantsRoutes from "./routes/tenants";
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

  // CORS - allow Vercel frontend and others
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow non-browser / curl / server-to-server
        if (!origin) return callback(null, true);

        const allowedOrigins = [
          "http://localhost:3000",
          "http://localhost:5173",
          "https://eat-with-me-frontend-is7z81mej-abhimaniyus-projects.vercel.app",
          "https://eatwithme.easytomanage.xyz",
          "https://admin.easytomanage.xyz",
        ];

        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        console.warn("❌ Admin CORS blocked:", origin);
        return callback(null, false);
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  // Explicit preflight handler (optional but safe)
  app.options("*", cors());

  app.use(express.json());

  // Mount admin routes under /api
  app.use("/api", adminRoutes);
  // app.use("/api/tenants", tenantsRoutes);

  // Health endpoint
  app.get("/", (req, res) => res.send("Admin API up"));
  app.get("/health", (req, res) => res.json({ status: "ok" }));

  return app;
}
