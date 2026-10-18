import "dotenv/config";
import express from "express";
import compression from "compression";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import multer from "multer";
import ffmpeg from "fluent-ffmpeg";
import OpenAI from "openai";

const app = express();
const PORT = 3000;

// Setup OpenAI
let openai: OpenAI | null = null;
function getOpenAI() {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is required");
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

// Middleware
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Resolve paths properly for both dev (ESM/tsx) and production (bundled CJS)
const isProduction = process.env.NODE_ENV === "production";

// Use a robust way to find paths that works when running as ESM (dev) or CJS (prod bundle)
const distPath = (typeof __dirname !== 'undefined') 
  ? __dirname 
  : path.resolve(process.cwd(), 'dist');

const projectRoot = (typeof __dirname !== 'undefined')
  ? path.resolve(__dirname, '..')
  : process.cwd();

// Resolve uploads directory safely
const customProdUploads = '/home/styni.com/stynaff/uploads/';
const uploadsDir = (isProduction && fs.existsSync(customProdUploads))
  ? customProdUploads 
  : path.resolve(projectRoot, 'uploads');

const videosDir = path.resolve(uploadsDir, 'videos');
const imagesDir = path.resolve(uploadsDir, 'images');

// Ensure directories exist
[uploadsDir, videosDir, imagesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Oct 2026 UTC timestamp bounds
const OCT_2026_START = new Date('2026-10-01T00:00:00.000Z').getTime();
const OCT_2026_END = new Date('2026-10-31T23:59:59.999Z').getTime();

// Check if a file is from October 2026 only
function isOct2026File(filename: string, fullPath?: string): boolean {
  if (filename === 'fallback.mp4') return true;
  
  // Check timestamp prefix in filename (e.g. 1791544237661-...)
  const match = filename.match(/^(\d{13})-/);
  if (match) {
    const ts = parseInt(match[1], 10);
    return ts >= OCT_2026_START && ts <= OCT_2026_END;
  }

  // If file exists on disk, check filesystem mtime
  if (fullPath && fs.existsSync(fullPath)) {
    try {
      const stats = fs.statSync(fullPath);
      const mtime = stats.mtime.getTime();
      return mtime >= OCT_2026_START && mtime <= OCT_2026_END;
    } catch {
      return false;
    }
  }

  return false;
}

// Clean old files: delete any files not from Oct 2026
function cleanupOldFiles() {
  [videosDir, imagesDir, uploadsDir].forEach(dir => {
    if (fs.existsSync(dir)) {
      try {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          const fullPath = path.resolve(dir, file);
          try {
            if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
              if (!isOct2026File(file, fullPath)) {
                log(`[Oct 2026 Retention] Removing old pre-Oct 2026 file: ${file}`);
                fs.unlinkSync(fullPath);
              }
            }
          } catch (e: any) {
            log(`Error checking file ${file}: ${e.message}`);
          }
        });
      } catch (err: any) {
        log(`Error reading directory ${dir} for cleanup: ${err.message}`);
      }
    }
  });
}

// Run cleanup on startup to remove old files and keep files from Oct 2026 only
cleanupOldFiles();

// Dedicated video route with fallback support so missing video files never return HTML or crash video demuxers
app.get('/uploads/videos/:filename', (req, res) => {
  const filePath = path.resolve(videosDir, req.params.filename);
  if (fs.existsSync(filePath)) {
    if (isOct2026File(req.params.filename, filePath)) {
      return res.sendFile(filePath);
    } else {
      // Remove old file and serve fallback
      try { fs.unlinkSync(filePath); } catch {}
    }
  }
  const fallbackPath = path.resolve(videosDir, 'fallback.mp4');
  if (fs.existsSync(fallbackPath)) {
    res.setHeader('Content-Type', 'video/mp4');
    return res.sendFile(fallbackPath);
  }
  const rootFallback = path.resolve(projectRoot, 'public', 'fallback.mp4');
  if (fs.existsSync(rootFallback)) {
    res.setHeader('Content-Type', 'video/mp4');
    return res.sendFile(rootFallback);
  }
  res.status(404).json({ error: 'Video not found' });
});

// Dedicated image route so missing images never return HTML
app.get('/uploads/images/:filename', (req, res) => {
  const filePath = path.resolve(imagesDir, req.params.filename);
  if (fs.existsSync(filePath)) {
    if (isOct2026File(req.params.filename, filePath)) {
      return res.sendFile(filePath);
    } else {
      // Remove old pre-Oct 2026 file
      try { fs.unlinkSync(filePath); } catch {}
    }
  }
  res.status(404).json({ error: 'Image not found' });
});

app.use('/uploads', express.static(uploadsDir));
app.use('/uploads', (req, res) => {
  res.status(404).json({ error: 'Upload not found' });
});

// Logging helper
const log = (msg: string) => console.log(`[${new Date().toISOString()}] ${msg}`);

// Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine subdirectory based on fieldname or mimetype
    if (file.fieldname === 'file' || file.mimetype.startsWith('video/')) {
      cb(null, videosDir);
    } else {
      cb(null, imagesDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2000 * 1024 * 1024 }, // 2GB limit for long movies
});

// --- API ROUTES ---

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Video Processing / Upload
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = req.file.path;
    // Return the proper relative path for the client
    const fileUrl = `/uploads/videos/${req.file.filename}`;
    
    log(`File uploaded: ${req.file.filename} saved to videos folder (${req.file.size} bytes)`);

    // Basic ffmpeg probe for metadata
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        log(`Probe error for ${req.file?.filename}: ${err.message}`);
        // Still return the URL even if probe fails
        return res.json({ url: fileUrl });
      }
      
      const duration = metadata.format.duration;
      res.json({ 
        url: fileUrl,
        duration: duration,
        size: req.file?.size,
        mimetype: req.file?.mimetype
      });
    });

  } catch (error: any) {
    log(`Upload processing error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Photo Upload
app.post("/api/upload-photo", upload.single("photo"), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No photo provided" });
    // Photos go to /uploads/images/
    res.json({ url: `/uploads/images/${req.file.filename}` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// AI Chatbot / OpenAI integration
app.post("/api/ai/chat", async (req, res) => {
  const { messages } = req.body;
  
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "OpenAI API key not configured" });
  }

  try {
    const ai = getOpenAI();
    const response = await ai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "You are the AI engine for Styn Africa, a premium social and dating app for Africans. You are witty, supportive, and use African slang naturally (like 'Oya', 'Abeg', 'Sharp'). Help users with profile tips, dating advice, or just chat." 
        },
        ...messages
      ],
      temperature: 0.7,
    });

    res.json({ text: response.choices[0].message.content });
  } catch (error: any) {
    log(`OpenAI error: ${error.message}`);
    res.status(500).json({ error: error.message || "AI Service temporarily unavailable" });
  }
});

// Generate AI Replies for comments/chat
app.post("/api/ai/generate-replies", async (req, res) => {
  const { message } = req.body;
  
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "OpenAI API key not configured" });
  }

  try {
    const ai = getOpenAI();
    const response = await ai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "Generate 3 short, engaging, and culturally relevant replies (in African slang/style) for the following message. Keep them under 10 words each. Return as a JSON array of strings: ['reply1', 'reply2', 'reply3']" 
        },
        { role: "user", content: message }
      ],
      response_format: { type: "json_object" }
    });

    const parsed = JSON.parse(response.choices[0].message.content || '{"replies": []}');
    res.json(parsed.replies || []);
  } catch (error: any) {
    res.json(["Nice one!", "Doing great!", "Love this!"]); // Fallback
  }
});

// Start Server helper
async function startServer() {
  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    log("Vite middleware initialized (dev mode)");
  } else {
    // Production serving
    log(`Production mode: serving static files from ${distPath}`);
    
    if (!fs.existsSync(distPath)) {
      log(`ERROR: dist folder not found at ${distPath}. Run 'npm run build' first.`);
    }

    app.use(express.static(distPath));
    
    app.get("*", (req, res) => {
      // Avoid catching API routes or uploads or other things that should have matched earlier
      if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
        return res.status(404).json({ error: `Route ${req.path} not found` });
      }

      const indexPath = path.resolve(distPath, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        log(`ERROR: index.html missing at ${indexPath}`);
        res.status(404).send(`Not Found: The app is running in production mode but cannot find the compiled frontend. Expected at: ${indexPath}. Current projectRoot: ${projectRoot}`);
      }
    });
    log("Static file serving initialized (production mode)");
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    log(`>>> Styn Africa Server running at http://0.0.0.0:${PORT}`);
    log(`>>> Domain: https://styni.com/`);
  });

  // Set timeout for large file uploads
  server.timeout = 3600000;
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;
}

startServer().catch((err) => {
  console.error("CRITICAL: Server failed to start:", err);
  process.exit(1);
});
