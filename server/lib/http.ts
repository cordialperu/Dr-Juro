import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export type AsyncRouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const asyncHandler = (handler: AsyncRouteHandler) =>
  (req: Request, res: Response, next: NextFunction) => {
    // Allow route handlers to return a Promise that may resolve to a value
    // (for example when returning the result of `res.json(...)`). We only
    // need to ensure errors are forwarded to `next`.
    Promise.resolve(handler(req, res, next)).catch(next);
  };

export const formatZodError = (error: ZodError) =>
  error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
