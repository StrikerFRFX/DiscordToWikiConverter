// Only used in development. Sets up Vite dev server middleware for Express.

export function setupVite(app: any, server: any) {
  (async () => {
    try {
      const { createServer } = await import("vite");
      const vite = await createServer({
        server: { middlewareMode: true },
        root: process.cwd() + "/client",
      });
      app.use(vite.middlewares);
      console.log("Vite dev server middleware enabled.");
    } catch (err) {
      console.error("Failed to start Vite dev server:", err);
    }
  })();
}
