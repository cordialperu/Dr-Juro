import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import cookieParser from 'cookie-parser';
import path from "path";
import rateLimit from "express-rate-limit";
import responseTime from "response-time";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupSession } from "./auth/session";
import { doubleCsrfProtection, generateToken } from "./lib/csrf";
import { logger, recordRequest, recordResponseTime, recordError, metrics } from "./lib/logger";
import { verifyToken } from "./lib/jwt";

const app = express();
app.set("trust proxy", 1); // Trust first proxy (Vercel)
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
setupSession(app);

// JWT to Session middleware - extracts userId from JWT and adds to session
app.use((req: Request, res: Response, next: NextFunction) => {
  // Skip if already has session userId
  if (req.session?.userId) {
    return next();
  }

  // Try to get token from cookie or Authorization header
  const token = req.cookies.auth_token || req.headers.authorization?.replace('Bearer ', '');
  
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      // Add userId to session for compatibility with existing routes
      req.session.userId = payload.userId;
      req.session.userRole = payload.userRole;
    }
  }
  
  next();
});

// Response time tracking
app.use(responseTime((req, res, time) => {
  const method = (req as Request).method ?? "UNKNOWN";
  const requestPath = (req as Request).path ?? (req as any).url ?? "";
  recordRequest(method, requestPath);
  recordResponseTime(time);

  if (res.statusCode >= 400) {
    recordError(res.statusCode);
  }
}));

// Health check endpoint (antes de CSRF para no requerir token)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    metrics: {
      requests: metrics.requests.total,
      avgResponseTime: Math.round(metrics.responseTime.avg),
      errors: metrics.errors.total,
    },
  });
});

// Metrics endpoint (protegido, para admin)
app.get('/api/metrics', (req, res) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  res.json({
    ...metrics,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// CSRF Protection (DISABLED for development - uncomment for production)
// app.use(doubleCsrfProtection);

// Endpoint para obtener token CSRF
app.get('/api/csrf-token', (req, res) => {
  // Temporarily return empty token for development
  res.json({ csrfToken: '' });
});

// Rate limiting general para toda la API (relajado para desarrollo)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // 1000 requests por IP por ventana (relajado para dev)
  message: { error: 'Demasiadas solicitudes, intenta más tarde' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'development', // Skip en desarrollo
});

// Rate limiting estricto para endpoints de IA (costosos)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 50, // 50 requests por minuto (relajado para dev)
  message: { error: 'Límite de análisis con IA alcanzado. Espera 1 minuto.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'development', // Skip en desarrollo
});

// Aplicar rate limiting a rutas de API
app.use('/api/', apiLimiter);
app.use('/api/analyze-document', aiLimiter);
app.use('/api/gemini/query', aiLimiter);

app.use(
  "/pdfs",
  express.static(path.resolve(import.meta.dirname, "../pdfs"), {
    fallthrough: false,
    setHeaders(res) {
      res.setHeader("Cache-Control", "public, max-age=3600, immutable");
    },
  }),
);

app.use((req, res, next) => {
  const start = Date.now();
  const requestPath = (req as Request).path ?? (req as any).url ?? "";
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

    res.on("finish", () => {
    const duration = Date.now() - start;
    if (requestPath.startsWith("/api")) {
      let logLine = `${(req as Request).method} ${requestPath} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

let server: any = null;

export const init = async () => {
  if (server) return server;

  server = await registerRoutes(app);
  
  // Setup WebSocket server
  const { setupWebSocket } = await import('./lib/websocket');
  setupWebSocket(server);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Log the error
    console.error('Server Error:', err);
    
    // Return detailed error for debugging (TEMPORARY)
    if (!res.headersSent) {
      res.status(status).json({ 
        message,
        error: err.toString(),
        stack: err.stack,
        dbConfigured: !!process.env.DATABASE_URL
      });
    }
  });  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else if (!process.env.VERCEL) {
    serveStatic(app);
  }
  
  return server;
};

// Start server if run directly
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  init().then((server) => {
    const port = parseInt(process.env.PORT || '5000', 10);
    server.listen({
      port,
      host: "0.0.0.0",
    }, () => {
      log(`serving on port ${port}`);
    });
  });
}

export { app };
