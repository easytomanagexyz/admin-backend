import dotenv from "dotenv";
dotenv.config();

import { createApp } from "./app";

const PORT = process.env.PORT ?? 4000;

(async function main() {
  try {
    const app = await createApp();
    app.listen(PORT, () => {
      console.log(`Admin backend running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start app", err);
    process.exit(1);
  }
})();
