import winston from 'winston';
import fs from 'fs';
import path from 'path';

const isProduction = process.env.NODE_ENV === 'production';
const isDebug = process.env.DEBUG === 'true';

// Crear directorio de logs si no existe
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Winston logger configuration
const winstonLogger = winston.createLogger({
  level: isDebug ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'drjuro-api' },
  transports: [
    new winston.transports.File({ filename: path.join(logsDir, 'error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(logsDir, 'combined.log') }),
  ],
});

// Console transport for development
if (!isProduction) {
  winstonLogger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

// Métricas en memoria (para dashboard simple)
export const metrics = {
  requests: {
    total: 0,
    byMethod: {} as Record<string, number>,
    byPath: {} as Record<string, number>,
  },
  responseTime: {
    avg: 0,
    max: 0,
    min: Infinity,
    samples: [] as number[],
  },
  errors: {
    total: 0,
    by5xx: 0,
    by4xx: 0,
  },
};

export function recordRequest(method: string, path: string) {
  metrics.requests.total++;
  metrics.requests.byMethod[method] = (metrics.requests.byMethod[method] || 0) + 1;
  metrics.requests.byPath[path] = (metrics.requests.byPath[path] || 0) + 1;
}

export function recordResponseTime(duration: number) {
  metrics.responseTime.samples.push(duration);
  if (metrics.responseTime.samples.length > 100) {
    metrics.responseTime.samples.shift(); // Keep last 100 samples
  }
  
  const sum = metrics.responseTime.samples.length > 0
    ? metrics.responseTime.samples.reduce((a, b) => a + b, 0)
    : 0;
  metrics.responseTime.avg = metrics.responseTime.samples.length > 0
    ? sum / metrics.responseTime.samples.length
    : 0;
  metrics.responseTime.max = Math.max(metrics.responseTime.max, duration);
  metrics.responseTime.min = Math.min(metrics.responseTime.min, duration);
}

export function recordError(statusCode: number) {
  metrics.errors.total++;
  if (statusCode >= 500) {
    metrics.errors.by5xx++;
  } else if (statusCode >= 400) {
    metrics.errors.by4xx++;
  }
}

// Utility logger que respeta el entorno
export const logger = {
  info: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      winstonLogger.info(args.join(' '));
    }
  },
  error: (...args: unknown[]) => {
    winstonLogger.error(args.join(' '));
  },
  warn: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      winstonLogger.warn(args.join(' '));
    }
  },
  debug: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development' && process.env.DEBUG === 'true') {
      winstonLogger.debug(args.join(' '));
    }
  },
};
