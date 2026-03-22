import express, { type Express, type Request, type Response } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Serve landing page at root for unauthenticated visitors
  // MUST be before express.static so it intercepts / before index.html is served
  app.get("/", (req: Request, res: Response) => {
    if ((req as any).isAuthenticated && (req as any).isAuthenticated()) {
      return res.sendFile(path.resolve(distPath, "index.html"));
    }
    const landingPath = path.resolve(distPath, "landing.html");
    if (fs.existsSync(landingPath)) {
      return res.sendFile(landingPath);
    }
    return res.sendFile(path.resolve(distPath, "index.html"));
  });

  // /app route — always serves the React app (index.html)
  // Used by landing page CTAs so hash routing works correctly
  app.get("/app", (_req: Request, res: Response) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });

  // Serve all other static assets (JS, CSS, images, etc.)
  app.use(express.static(distPath));

  // Fall through to index.html for all React routes (hash routing)
  app.use("/{*path}", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
