import { Router } from "express";
import createPrologRouter from "./prolog";
import createQueryRouter from "./query";
import PrologQueryService from "../services/PrologQueryService";
import YjsService from "../services/YjsService";

export default function setupRoutes(
  prologService: PrologQueryService,
  yjsService: YjsService
) {
  const router = Router();
  router.use("/query", createQueryRouter(prologService));
  router.use("/prolog", createPrologRouter(yjsService));
  return router;
}
