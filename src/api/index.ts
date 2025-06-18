import { Router } from "express";
import createPrologRouter from "./prolog";
import createQueryRouter from "./query";
import PrologService from "../services/PrologService";
import YjsService from "../services/YjsService";

export default function setupRoutes(
  prologService: PrologService,
  yjsService: YjsService
) {
  const router = Router();
  router.use("/query", createQueryRouter(prologService));
  router.use("/prolog", createPrologRouter(yjsService));
  return router;
}
