import type { Request, Response, NextFunction } from "express";
import { HttpError } from "../lib/http";

export interface AuthProfile {
  id: string;
  username: string;
  role: string;
  createdAt: Date;
}

// Type guard for checking if user is authenticated
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    throw new HttpError(401, "No autenticado");
  }
  next();
}

// Middleware for role-based access control
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.userId) {
      throw new HttpError(401, "No autenticado");
    }

    const userRole = req.session.userRole;
    
    if (!userRole) {
      throw new HttpError(403, "Rol de usuario no definido");
    }

    if (!allowedRoles.includes(userRole)) {
      throw new HttpError(403, "No tienes permisos para realizar esta acción");
    }

    next();
  };
}

// Check if user is admin
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  return requireRole('admin')(req, res, next);
}

// Check if user can write (admin or abogado)
export function requireWriter(req: Request, res: Response, next: NextFunction) {
  return requireRole('admin', 'abogado')(req, res, next);
}
