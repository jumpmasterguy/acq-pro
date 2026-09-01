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

  // Redirect www to apex domain
  app.use((req: Request, res: Response, next) => {
    const host = req.headers.host || '';
    if (host.startsWith('www.')) {
      return res.redirect(301, `https://acqlerate.com${req.url}`);
    }
    next();
  });

  // Helper: send file with no-cache headers to bust Cloudflare edge cache
  const sendNoCache = (res: Response, filePath: string) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    return res.sendFile(filePath);
  };

  // Always serve landing page at root — app lives at /app
  app.get("/", (_req: Request, res: Response) => {
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

  // Blog static assets — explicit routes to prevent :slug handler from intercepting
  app.get("/blog/blog.css", (_req: Request, res: Response) => {
    sendNoCache(res, path.resolve(distPath, "blog", "blog.css"));
  });
  app.get("/blog/blog.js", (_req: Request, res: Response) => {
    sendNoCache(res, path.resolve(distPath, "blog", "blog.js"));
  });



  // /pdu — PMI PDU landing page
  app.get(["/pdu", "/pdu/"], (_req: Request, res: Response) => {
    const filePath = path.resolve(distPath, "pdu", "index.html");
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
    return res.redirect("/");
  });

  // /products/* — serve product landing pages and success pages
  app.get("/products/:slug", (req: Request, res: Response) => {
    const slug = req.params.slug;
    const filePath = path.resolve(distPath, "products", slug, "index.html");
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
    return res.redirect("/blog");
  });
  app.get("/products/:slug/success", (req: Request, res: Response) => {
    const slug = req.params.slug;
    const filePath = path.resolve(distPath, "products", slug, "success.html");
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
    return res.redirect(`/products/${slug}`);
  });

  // /team/success — Team Pack purchase confirmation
  app.get(["/team/success", "/team/success/"], (_req: Request, res: Response) => {
    const filePath = path.resolve(distPath, "team", "success.html");
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
    return res.redirect("/#pricing");
  });

  // Blog HTML routes — with and without trailing slash
  app.get(["/blog", "/blog/"], (_req: Request, res: Response) => {
    sendNoCache(res, path.resolve(distPath, "blog", "index.html"));
  });
  app.get("/blog/:slug", (req: Request, res: Response) => {
    const slug = req.params.slug;
    // Serve static assets directly (avoid redirect loop)
    if (slug.includes('.')) {
      const assetPath = path.resolve(distPath, "blog", slug);
      if (fs.existsSync(assetPath)) return res.sendFile(assetPath);
      return res.status(404).send('Not found');
    }
    const filePath = path.resolve(distPath, "blog", `${slug}.html`);
    if (fs.existsSync(filePath)) {
      return sendNoCache(res, filePath);
    }
    // Fallback to blog index if post not found
    return res.redirect("/blog");
  });

  // Static informational pages
  const staticPages = ['terms', 'privacy', 'teams', 'sitemap', 'pay-guide', 'tools', 'why'];
  staticPages.forEach(page => {
    app.get([`/${page}`, `/${page}/`], (_req: Request, res: Response) => {
      const filePath = path.resolve(distPath, `${page}.html`);
      if (fs.existsSync(filePath)) return res.sendFile(filePath);
      return res.redirect('/');
    });
  });

  // Public image assets referenced from third-party contexts (email clients,
  // Resend's broadcast preview, link-unfurlers). Two things break these
  // otherwise: helmet's default Cross-Origin-Resource-Policy: same-origin
  // tells browsers to refuse a cross-origin embed even though the request
  // succeeds, and serving them with no explicit Cache-Control means a
  // conditional revalidation (304) can reach a CDN edge that never cached
  // the underlying bytes, which some edges turn into a 503 for the client
  // instead of relaying the 304. Giving these a real cache lifetime avoids
  // the revalidation path entirely, and the explicit CORP header allows the
  // cross-origin embed.
  app.get(["/icon-192x192.png", "/icon-512x512.png", "/examples/img/:file"], (req: Request, res: Response) => {
    const filePath = req.path.startsWith("/examples/img/")
      ? path.resolve(distPath, "examples", "img", req.params.file as string)
      : path.resolve(distPath, req.path.slice(1));
    if (!fs.existsSync(filePath)) return res.status(404).send("Not found");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Cache-Control", "public, max-age=86400");
    return res.sendFile(filePath);
  });

  // Serve all other static assets (JS, CSS, images, etc.)
  app.use(express.static(distPath));

  // Fall through to index.html for all React routes (hash routing)
  app.use("/{*path}", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
