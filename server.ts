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
// Priority for custom VPS path requested by user, fallback to local project root
const customVpsPath = "/home/styni.com/stynaff/uploads";
const localUploadsPath = path.join(process.cwd(), "uploads");
let baseUploadsDir = localUploadsPath;

// If a custom VPS path exists or we can create it (production VPS)
if (fs.existsSync("/home/styni.com/stynaff")) {
  try {
    if (!fs.existsSync(customVpsPath)) {
      fs.mkdirSync(customVpsPath, { recursive: true });
    }
    fs.accessSync(customVpsPath, fs.constants.W_OK);
    baseUploadsDir = customVpsPath;
  } catch (e) {
    log(`Custom path ${customVpsPath} not accessible/writable: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
}

const videoUploadDir = path.join(baseUploadsDir, "videos");
const imageUploadDir = path.join(baseUploadsDir, "images");

log(`Using uploads base directory: ${baseUploadsDir}`);

[baseUploadsDir, videoUploadDir, imageUploadDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      log(`Created directory: ${dir}`);
    } catch (e: any) {
      log(`Failed to create directory ${dir}: ${e.message}`);
    }
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
  app.set('trust proxy', true);
  const PORT = 3000;

  // 0. LOGGING FIRST (Critical for debugging why requests might be dropped)
  app.use((req, res, next) => {
    // A. Disable aggressive caching globally
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    // B. HTTPS and styni.com Logic
    const host = req.headers.host || "";
    // Only apply redirect logic if the host is related to styni.com
    // This prevents redirect loops on development/preview URLs
    if (host.includes('styni.com')) {
      const isWWW = host.startsWith('www.');
      // Check both standard protocol and common proxy headers to avoid redirect loops
      const proto = req.headers['x-forwarded-proto'] || req.protocol;
      const isHTTP = proto === 'http';
      
      if (isWWW || isHTTP) {
        return res.redirect(301, `https://styni.com${req.url}`);
      }
    }

    log(`${req.method} ${req.url} (Content-Length: ${req.headers['content-length'] || 'unknown'})`);
    req.on('close', () => {
      if (!res.writableEnded) {
        log(`>>> Request closed prematurely: ${req.method} ${req.url}`);
      }
    });
    next();
  });

  // 1. LIMITS (Right after app init and logging)
  app.use(express.json({ limit: '2gb' }));
  app.use(express.urlencoded({ extended: true, limit: '2gb' }));

  // Serve from both custom and local paths to avoid mismatch
  log(`Setting up static serving for /uploads to ${baseUploadsDir}`);
  const staticOptions = {
    etag: false,
    lastModified: false,
    setHeaders: (res: express.Response, filePath: string) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      
      // Ensure correct MIME types for common video formats
      if (filePath.endsWith('.mp4')) {
        res.setHeader('Content-Type', 'video/mp4');
      } else if (filePath.endsWith('.mov')) {
        res.setHeader('Content-Type', 'video/quicktime');
      } else if (filePath.endsWith('.m4v')) {
        res.setHeader('Content-Type', 'video/x-m4v');
      }
    }
  };

  app.use("/uploads", express.static(baseUploadsDir, staticOptions));
  
  // Explicitly 404 for missing upload files to match Nginx "try_files $uri $uri/ =404"
  app.use("/uploads", (req, res) => {
    const fullPath = path.join(baseUploadsDir, req.url);
    log(`>>> Upload 404: ${req.url} (Looking at: ${fullPath})`);
    res.status(404).send("File not found");
  });

  // Multer Configuration
  const sanitizeFilename = (filename: string) => {
    return filename
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^\x20-\x7E]/g, '') // Remove non-printable/non-ASCII
      .replace(/[\s#%&{}\\<>*?/$!'":@+`|=]+/g, '_') // Replace dangerous URL characters with underscores
      .substring(0, 80); // Limit length
  };

  const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      const isVideo = file.mimetype.startsWith('video/');
      const finalDir = path.join(baseUploadsDir, isVideo ? 'videos' : 'images');
      if (!fs.existsSync(finalDir)) {
        fs.mkdirSync(finalDir, { recursive: true });
      }
      cb(null, finalDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname).toLowerCase();
      const nameOnly = path.basename(file.originalname, ext);
      const safeName = sanitizeFilename(nameOnly);
      cb(null, `${uniqueSuffix}-${safeName || 'file'}${ext}`);
    }
  });

  const upload = multer({ 
    storage: multerStorage,
    limits: { fileSize: 2048 * 1024 * 1024 } // 2GB limit for all, client differentiates
  });

  // 1. API Routes
  app.post("/api/upload", (req, res, next) => {
    log(`>>> Starting upload processing for ${req.url}`);
    
    upload.single("file")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        log(`>>> Multer Error: ${err.message} (${err.code})`);
        return res.status(400).json({ error: `Upload error: ${err.message}`, code: err.code });
      } else if (err) {
        log(`>>> Unknown Upload Error: ${err.message}`);
        return res.status(500).json({ error: "Unknown upload error", details: err.message });
      }
      
      // No error, continue to handler
      next();
    });
  }, async (req, res) => {
    try {
      if (!req.file) {
        log(">>> Upload attempt with no file");
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      const isVideo = req.file.mimetype.startsWith('video/');
      const subDir = isVideo ? 'videos' : 'images';
      const finalFilename = req.file.filename;

      // Note: Video compression is disabled during the HTTP request to prevent timeouts
      // Especially crucial for large (up to 2GB) files.
      // If compression is needed, it should be done as a background worker process.
      
      // Return relative URL to allow the same code to work on both dev/preview and production
      const fileUrl = `/uploads/${subDir}/${finalFilename}`;
      const stats = fs.statSync(req.file.path);
      log(`Upload successful: ${fileUrl} (Size: ${stats.size} bytes, Multer reported: ${req.file.size})`);
      
      if (stats.size === 0) {
        log(`>>> CRITICAL: Uploaded file ${finalFilename} is 0 bytes!`);
      }
      
      res.json({ url: fileUrl });
    } catch (err: any) {
      log(`Upload handler error: ${err.message}`);
      res.status(500).json({ error: "Internal server error during upload finishing" });
    }
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
      
      // Graceful fallback for Quota / Rate Limit errors
      if (err.status === 429 || err.message?.includes('429') || err.message?.includes('quota')) {
        return res.json({ 
          text: "I'm feeling a bit overwhelmed with so much love right now, Darling. My heart needs a tiny second to catch its breath... say something sweet to me while I wait?",
          isFallback: true
        });
      }

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
          { role: "system", content: "Suggest 3 short, friendly, and relevant one-tap dating app replies. Return ONLY a JSON object with a 'replies' key containing an array of 3 strings." },
          { role: "user", content: message }
        ],
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content || '{"replies": ["Hey there!", "How are you?", "Nice profile!"]}';
      const parsed = JSON.parse(content);
      res.json(parsed.replies || ["Hey!", "Hi there", "Hello"]);
    } catch (err: any) {
      log(`OpenAI Replies Error: ${err.message}`);
      // Fallback replies
      res.json(["Tell me more!", "That's interesting!", "I love that"]);
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
    if (!fs.existsSync(distPath)) {
      console.warn("WARNING: 'dist' directory not found. Did you run 'npm run build'?");
    }

    app.use(express.static(distPath, {
      etag: false,
      lastModified: false,
      setHeaders: (res) => {
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
      }
    }));
    app.get("*", (req, res) => {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      res.sendFile(path.join(distPath, "index.html"), (err) => {
        if (err) {
          res.status(500).send("Server Error: Static files missing. Please run build.");
        }
      });
    });
  }

  // Global Error Handler - Ensure all errors return JSON
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    const errorMsg = `>>> Global Server Error: ${err.message || err}\nStack: ${err.stack}`;
    log(errorMsg);
    res.status(err.status || 500).json({
      error: err.message || "Internal Server Error",
      code: err.code || "UNKNOWN_ERROR"
    });
  });

  const server = app.listen(PORT, "0.0.0.0", () => {
    log(`>>> Styn Africa Server running at http://0.0.0.0:${PORT}`);
    log(`>>> Domain: https://styni.com/`);
  });

  // Set timeout to 1 hour for very large video uploads (2GB)
  server.timeout = 3600000;
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
