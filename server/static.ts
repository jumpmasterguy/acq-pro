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
  app.get("/app", (_req: Request, res: Response) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });

  // Serve all static assets FIRST (JS, CSS, images, fonts, etc.)
  // Must be before blog slug route so /blog/blog.css is served as a file,
  // not intercepted by the :slug handler.
  app.use(express.static(distPath));

  // /blog routes — serve static blog HTML pages
  app.get("/blog", (_req: Request, res: Response) => {
    res.sendFile(path.resolve(distPath, "blog", "index.html"));
  });
  app.get("/blog/:slug", (req: Request, res: Response) => {
    const slug = req.params.slug;
    // Skip if this looks like a static asset (has a file extension)
    if (slug.includes('.')) {
      return res.status(404).send('Not found');
    }
    const filePath = path.resolve(distPath, "blog", `${slug}.html`);
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
    // Fallback to blog index if post not found
    return res.redirect("/blog");
  });

  // Fall through to index.html for all React routes (hash routing)
  app.use("/{*path}", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
