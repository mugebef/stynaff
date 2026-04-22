import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import multer from "multer";
import ffmpeg from "fluent-ffmpeg";
import OpenAI from "openai";

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

  app.use(express.json({ limit: '500mb' }));
  app.use(express.urlencoded({ extended: true, limit: '500mb' }));
  app.use("/uploads", express.static(baseUploadsDir));

  // Multer Configuration
  const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      const isVideo = file.mimetype.startsWith('video/');
      cb(null, isVideo ? videoUploadDir : imageUploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  });

  const upload = multer({ 
    storage: multerStorage,
    limits: { fileSize: 500 * 1024 * 1024 } // 500MB limit
  });

  // 1. API Routes
  app.post("/api/upload", upload.single("file"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    
    const isVideo = req.file.mimetype.startsWith('video/');
    const subDir = isVideo ? 'videos' : 'images';
    let finalFilename = req.file.filename;

    if (isVideo) {
      const inputPath = req.file.path;
      const compressedFilename = `compressed-${req.file.filename}`;
      const outputPath = path.join(videoUploadDir, compressedFilename);
      
      try {
        log(`Compressing video: ${req.file.filename}`);
        await new Promise<void>((resolve, reject) => {
          ffmpeg(inputPath)
            .output(outputPath)
            .videoCodec('libx264')
            .size('720x?') // Optimize for mobile: 720p height
            .addOptions([
              '-crf 28',        // Constant Rate Factor: 28 is a good balance
              '-preset faster', // Faster encoding
              '-movflags +faststart' // Enable fast start for web streaming
            ])
            .on('end', () => resolve())
            .on('error', (err) => reject(err))
            .run();
        });
        
        // Remove original and use compressed
        if (fs.existsSync(outputPath)) {
          fs.unlinkSync(inputPath);
          finalFilename = compressedFilename;
          log(`Compression complete: ${finalFilename}`);
        }
      } catch (err: any) {
        log(`Video compression failed: ${err.message}. Using original file.`);
        // Fallback to original file if compression fails
      }
    }
    
    const fileUrl = `/uploads/${subDir}/${finalFilename}`;
    
    log(`File ready: ${fileUrl}`);
    res.json({ url: fileUrl });
  });

  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "online", 
      server: "STYN VPS",
      storage: "NVMe",
      mode: process.env.NODE_ENV || "development",
      features: ["Videos", "Chat", "Match", "Cinema"],
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

  // 2. OpenAI Route
  app.post("/api/ai/chat", async (req, res) => {
    const { prompt, systemInstruction } = req.body;
    
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OpenAI API Key not configured on server" });
    }

    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Efficient model for dating chat
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      res.json({ text: response.choices[0].message.content });
    } catch (err: any) {
      log(`OpenAI API Error: ${err.message}`);
      res.status(500).json({ error: "AI processing failed", details: err.message });
    }
  });

  app.post("/api/ai/generate-replies", async (req, res) => {
    const { message } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OpenAI API Key not configured on server" });
    }

    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Suggest 3 short, friendly, and relevant one-tap dating app replies. Return ONLY a JSON array of 3 strings." },
          { role: "user", content: message }
        ],
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content || '{"replies": []}';
      const parsed = JSON.parse(content);
      // Ensure we return the array directly or in expected format
      res.json(parsed.replies || parsed);
    } catch (err: any) {
      log(`OpenAI Replies Error: ${err.message}`);
      res.status(500).json({ error: "AI processing failed" });
    }
  });

  // Vite Integration for Development
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
