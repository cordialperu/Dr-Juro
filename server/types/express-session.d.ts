import "express-session";
import { Request } from "express";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    userRole?: string;
  }
}

export interface RequestWithSession extends Request {
  session: any;
}
