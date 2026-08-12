import cors from "cors";
import express from "express";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ?? 8000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  const memory = process.memoryUsage();
  const uptimeSeconds = Math.floor(process.uptime());

  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: uptimeSeconds,
    process: {
      pid: process.pid,
      nodeVersion: process.version,
      memory: {
        rssMB: (memory.rss / (1024 * 1024)).toFixed(2),
        heapTotalMB: (memory.heapTotal / (1024 * 1024)).toFixed(2),
        heapUsedMB: (memory.heapUsed / (1024 * 1024)).toFixed(2),
      },
    },
    system: {
      platform: process.platform,
      arch: process.arch,
      freememMB: (os.freemem() / (1024 * 1024)).toFixed(2),
      totalmemMB: (os.totalmem() / (1024 * 1024)).toFixed(2),
      cpus: os.cpus().length,
      loadavg: os.loadavg(),
    },
  });
});

// Serve frontend static files if present
const frontendDistPath = path.join(__dirname, "../../frontend/dist");
app.use(express.static(frontendDistPath));

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next();
  }
  res.sendFile(path.join(frontendDistPath, "index.html"), (err) => {
    if (err) next();
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


