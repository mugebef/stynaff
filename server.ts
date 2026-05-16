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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Static files for uploads
// Using a relative path from the current working directory is safer across dev/prod when bundled
const uploadsDir = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use('/uploads', express.static(uploadsDir));

// Logging helper
const log = (msg: string) => console.log(`[${new Date().toISOString()}] ${msg}`);

// Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
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
    const fileUrl = `/uploads/${req.file.filename}`;
    
    log(`File uploaded: ${req.file.filename} (${req.file.size} bytes)`);

    // Basic ffmpeg probe for metadata
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        log(`Probe error: ${err.message}`);
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
    res.json({ url: `/uploads/${req.file.filename}` });
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
    const distPath = path.join(process.cwd(), "dist");
    if (!fs.existsSync(distPath)) {
      log("WARNING: dist folder not found. Run 'npm run build' first.");
    }
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      const indexPath = path.join(distPath, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send("Not Found");
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
