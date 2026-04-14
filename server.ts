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

// Ensure uploads directory exists
const baseUploadsDir = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
const videoUploadDir = process.env.VIDEO_UPLOAD_DIR || path.join(baseUploadsDir, "videos");
const imageUploadDir = process.env.IMAGE_UPLOAD_DIR || path.join(baseUploadsDir, "images");

[baseUploadsDir, videoUploadDir, imageUploadDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

console.log(`>>> Base Uploads directory: ${baseUploadsDir}`);
console.log(`>>> Video Uploads directory: ${videoUploadDir}`);
console.log(`>>> Image Uploads directory: ${imageUploadDir}`);

// Configure multer for local storage
const storage = multer.memoryStorage(); // Use memory storage for sharp processing

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit for video uploads
});

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

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

  app.post("/api/upload", upload.single("file"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const isVideo = req.file.mimetype.startsWith("video/");
    const targetDir = isVideo ? videoUploadDir : imageUploadDir;
    const subPath = isVideo ? "videos" : "images";

    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = uniqueSuffix + "-" + req.file.originalname.replace(/\s+/g, '-');
    const outputPath = path.join(targetDir, filename);

    try {
      if (req.file.mimetype.startsWith("image/")) {
        // Compress image using sharp
        await sharp(req.file.buffer)
          .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toFile(outputPath);
      } else {
        // For videos or other files, just save as is
        fs.writeFileSync(outputPath, req.file.buffer);
      }

      const fileUrl = `/uploads/${subPath}/${filename}`;
      res.json({ url: fileUrl });
    } catch (err) {
      console.error("Upload error:", err);
      res.status(500).json({ error: "Failed to process upload" });
    }
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
