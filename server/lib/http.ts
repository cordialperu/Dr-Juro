import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export type AsyncRouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const asyncHandler = (handler: AsyncRouteHandler) =>
  (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };

export const formatZodError = (error: ZodError) =>
  error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
