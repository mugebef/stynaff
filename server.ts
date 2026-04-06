import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

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
  // 3. Static Files for Production
  if (process.env.NODE_ENV === "production") {
    const distPath = path.join(process.cwd(), "dist");
    
    // Check if dist exists to prevent crash
    import("fs").then((fs) => {
      if (!fs.existsSync(distPath)) {
        console.warn("WARNING: 'dist' directory not found. Did you run 'npm run build'?");
      }
    });

    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"), (err) => {
        if (err) {
          res.status(500).send("Server Error: Static files missing. Please run build.");
        }
      });
    });
  }

  app.listen(PORT, "127.0.0.1", () => {
    console.log(`>>> Styn Africa Server running at http://127.0.0.1:${PORT}`);
    console.log(`>>> Domain: ray.styni.com`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
