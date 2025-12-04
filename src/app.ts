import express from "express";
import cors from "cors";
import adminRoutes from "./routes/admin";
import tenantsRoutes from "./routes/tenants";
import { getFullDbUrl, getDbParams, buildPostgresUrl } from "./utils/awsSecrets";
import { getMasterPrisma } from "./utils/prismaFactory";

export async function createApp() {
  // LOCAL DEV: use env directly, skip AWS completely
  if (
    process.env.NODE_ENV === "development" &&
    process.env.DATABASE_URL_MASTER
  ) {
    process.env.DATABASE_URL_MASTER = process.env.DATABASE_URL_MASTER;
  } else {
    // PROD/STAGING: resolve from SSM
    const FULL_PARAM = process.env.MASTER_DB_SSM_PARAM || "/prod/master-db-url";
    let url = await getFullDbUrl(FULL_PARAM);

    if (!url) {
      const p = await getDbParams("/eatwithme");
      if (!p.user || !p.pass || !p.host || !p.port) {
        console.error(
          "Could not resolve master DB connection from SSM. Please set /prod/master-db-url or the /eatwithme/* params."
        );
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

    process.env.DATABASE_URL_MASTER = url;
  }

  // Ensure Prisma client is created after env var is set
  getMasterPrisma();

  const app = express();

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);

        const allowedOrigins = [
          "http://localhost:3000",
          "http://localhost:5173",
          "https://eat-with-me-frontend-is7z81mej-abhimaniyus-projects.vercel.app",
          "https://eatwithme.easytomanage.xyz",
          "https://admin.easytomanage.xyz",
          "https://easytomanage.xyz",

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

  app.options("*", cors());
  app.use(express.json());

  app.use("/api", adminRoutes);
  app.use("/api", tenantsRoutes);

  app.get("/", (req, res) => res.send("Admin API up"));
  app.get("/health", (req, res) => res.json({ status: "ok" }));

  return app;
}
