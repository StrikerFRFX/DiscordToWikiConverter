import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import discordUserRouter from "./discordUser";
import { fileURLToPath } from "url";
import path from "path";
import consola from "consola";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      consola.log(logLine);
    }
  });

  next();
});

consola.info("[server] Registering /api routes");
app.use("/api", discordUserRouter);
consola.info("[server] /api routes registered");

app.get("/api/test", (req, res) => {
  res.json({ ok: true });
});

const port = Number(process.env.PORT) || 5000;
const server = app.listen(port, "0.0.0.0", () => {
  consola.info(`Server running on port ${port}`);

  // Only require and use Vite dev server in development, using require so esbuild can tree-shake it
  if (process.env.NODE_ENV === "development") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require("./viteDevServer").setupVite(app, server);
    } catch (e) {
      consola.warn(
        "Vite dev server not started: viteDevServer.js not found or not needed in production."
      );
    }
  }
});

if (app.get("env") !== "development") {
  // Serve static files in production from dist/public
  const staticPath = path.join(__dirname, "../dist/public");
  app.use(express.static(staticPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });
}

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({ message });
  throw err;
});

// ALWAYS serve the app on port 5000
// this serves both the API and the client.
// It is the only port that is not firewalled.
