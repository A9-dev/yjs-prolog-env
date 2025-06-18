import { Request, Response, NextFunction } from "express";
import logger from "../logger";

export default function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error({ err }, "Unhandled API error");
  res.status(500).json({ error: err.message || "Internal Server Error" });
}
