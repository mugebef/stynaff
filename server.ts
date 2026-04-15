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

// Ensure uploads directory exists within the workspace
const baseUploadsDir = path.join(process.cwd(), "uploads");
const videoUploadDir = path.join(baseUploadsDir, "videos");
const imageUploadDir = path.join(baseUploadsDir, "images");

[baseUploadsDir, videoUploadDir, imageUploadDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

console.log(`>>> Base Uploads directory: ${baseUploadsDir}`);
console.log(`>>> Video Uploads directory: ${videoUploadDir}`);
console.log(`>>> Image Uploads directory: ${imageUploadDir}`);

// Configure multer for local storage
const storage = multer.diskStorage({
  destination: function (req: any, file: any, cb: any) {
    const isVideo = file.mimetype.startsWith("video/");
    const targetDir = isVideo ? videoUploadDir : imageUploadDir;
    cb(null, targetDir);
  },
  filename: function (req: any, file: any, cb: any) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname.replace(/\s+/g, '-'));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 200 * 1024 * 1024 } // 200MB limit
});

async function startServer() {
  const app = express();
  const PORT = 3000;

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

  app.post("/api/upload", (req, res) => {
    upload.single("file")(req, res, async (err: any) => {
      if (err instanceof multer.MulterError) {
        console.error(">>> Multer Error:", err);
        return res.status(400).json({ error: `Upload error: ${err.message}` });
      } else if (err) {
        console.error(">>> Unknown Upload Error:", err);
        return res.status(500).json({ error: "An unknown error occurred during upload" });
      }

      if (!req.file) {
        console.error(">>> Upload Error: No file received in request");
        return res.status(400).json({ error: "No file uploaded" });
      }

      console.log(`>>> Uploaded: ${req.file.filename} (${req.file.mimetype}, ${req.file.size} bytes)`);

      const isVideo = req.file.mimetype.startsWith("video/");
      const subPath = isVideo ? "videos" : "images";

      try {
        if (req.file.mimetype.startsWith("image/")) {
          const outputPath = req.file.path + ".webp";
          // Compress image using sharp
          await sharp(req.file.path)
            .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 80 })
            .toFile(outputPath);
          
          // Delete original file
          fs.unlinkSync(req.file.path);
          
          const fileUrl = `/uploads/${subPath}/${path.basename(outputPath)}`;
          res.json({ url: fileUrl });
        } else {
          // For videos, it's already saved by multer
          const fileUrl = `/uploads/${subPath}/${req.file.filename}`;
          res.json({ url: fileUrl });
        }
      } catch (err) {
        console.error("Processing error:", err);
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
