import { Router } from "express";
import createPrologRouter from "./prolog";
import createQueryRouter from "./query";
import PrologService from "../services/PrologService";

export default function setupRoutes(service: PrologService) {
  const router = Router();
  router.use("/prolog", createPrologRouter(service));
  router.use("/query", createQueryRouter(service));
  return router;
}
