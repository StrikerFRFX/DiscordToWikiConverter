import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import discordUserRouter from "./discordUser";
import path from "path";
import consola from "consola";

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

app.use("/api", discordUserRouter);

const port = Number(process.env.PORT) || 5000;
const server = app.listen(port, "0.0.0.0", () => {
  consola.info(`Server running on port ${port}`);

  // Only import and use Vite in development, after server is started
  if (app.get("env") === "development") {
    (async () => {
      // Only import vite in dev, and only if vite.js exists
      try {
        const { setupVite } = await import("./vite.js");
        await setupVite(app, server);
      } catch (e) {
        consola.warn(
          "Vite dev server not started: vite.js not found or not needed in production."
        );
      }
    })();
  }
});

if (app.get("env") !== "development") {
  // Serve static files in production
  app.use(express.static(path.join(__dirname, "../client/dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/dist/index.html"));
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
