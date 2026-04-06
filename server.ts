import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. API Routes (Add your backend logic here)
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "online", 
      server: "Styn Africa VPS",
      storage: "NVMe",
      nodeVersion: process.version 
    });
  });

  // 2. Vite Integration for Development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware loaded.");
  } else {
    // 3. Static Files for Production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`>>> Styn Africa Server running at http://localhost:${PORT}`);
    console.log(`>>> Domain: ray.styni.com`);
    console.log(`>>> IP: 129.121.73.168`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
