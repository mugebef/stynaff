import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import fs from "fs";
import sharp from "sharp";

const require = createRequire(import.meta.url);
const multer = require("multer");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logFile = path.join(process.cwd(), "server.log");
const log = (msg: string) => {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try {
    fs.appendFileSync(logFile, line);
  } catch (e) {}
  console.log(msg);
};

process.on('uncaughtException', (err) => {
  log(`>>> UNCAUGHT EXCEPTION: ${err.message}\n${err.stack}`);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`>>> UNHANDLED REJECTION: ${reason}`);
});

// Ensure uploads directory exists within the workspace
const baseUploadsDir = path.join(process.cwd(), "uploads");
const videoUploadDir = path.join(baseUploadsDir, "videos");
const imageUploadDir = path.join(baseUploadsDir, "images");

[baseUploadsDir, videoUploadDir, imageUploadDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    log(`Created directory: ${dir}`);
  }
});

// Test writability
try {
  const testFile = path.join(baseUploadsDir, "test.txt");
  fs.writeFileSync(testFile, "test");
  fs.unlinkSync(testFile);
  log("Uploads directory is writable");
} catch (err: any) {
  log(`Uploads directory NOT writable: ${err.message}`);
}

// Configure multer for local storage
const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // Reduced to 50MB for debugging
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use((req, res, next) => {
    log(`${req.method} ${req.url}`);
    req.on('close', () => {
      if (!res.writableEnded) {
        log(`>>> Request closed prematurely: ${req.method} ${req.url}`);
      }
    });
    next();
  });

  app.use(express.json());
  app.use("/uploads", express.static(baseUploadsDir));

  // 1. API Routes
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "online", 
      server: "STYN VPS",
      storage: "NVMe",
      features: ["Reels", "Chat", "Dating", "Blockbuster"],
      nodeVersion: process.version 
    });
  });

  app.get("/api/logs", (req, res) => {
    if (fs.existsSync(logFile)) {
      res.send(fs.readFileSync(logFile, "utf8"));
    } else {
      res.send("No logs found");
    }
  });

  app.post("/api/upload", (req, res) => {
    log(`>>> Starting upload request. Content-Type: ${req.headers['content-type']}`);
    upload.single("file")(req, res, async (err: any) => {
      if (err) {
        log(`>>> Multer Error: ${err.message}`);
        return res.status(400).json({ error: `Upload error: ${err.message}` });
      }

      if (!req.file) {
        log(">>> Upload Error: No file received. Body keys: " + Object.keys(req.body).join(", "));
        return res.status(400).json({ error: "No file uploaded" });
      }

      log(`>>> File received in memory: ${req.file.originalname} (${req.file.size} bytes)`);

      const isVideo = req.file.mimetype.startsWith("video/");
      const subPath = isVideo ? "videos" : "images";
      const targetDir = isVideo ? videoUploadDir : imageUploadDir;
      
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const filename = uniqueSuffix + "-" + req.file.originalname.replace(/\s+/g, '-');
      const filePath = path.join(targetDir, filename);

      try {
        fs.writeFileSync(filePath, req.file.buffer);
        const fileUrl = `/uploads/${subPath}/${filename}`;
        log(`>>> Upload successful: ${fileUrl}`);
        res.json({ url: fileUrl });
      } catch (err: any) {
        log(`>>> Processing error: ${err.message}`);
        res.status(500).json({ error: "Failed to process upload" });
      }
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

  // Global Error Handler - Ensure all errors return JSON
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(">>> Server Error:", err);
    res.status(err.status || 500).json({
      error: err.message || "Internal Server Error",
      code: err.code || "UNKNOWN_ERROR"
    });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`>>> Styn Africa Server running at http://0.0.0.0:${PORT}`);
    console.log(`>>> Domain: https://styni.com/`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
