import { Router, RequestHandler } from "express";
import PrologService from "../services/PrologService";
import YjsService from "../services/YjsService";
import { APIRule } from "../types";

export default function createPrologRouter(service: YjsService): Router {
  const router = Router();

  const handler: RequestHandler = async (req, res, next) => {
    try {
      const { prolog } = req.body;
      if (typeof prolog !== "string") {
        res.status(400).json({ error: "Invalid prolog rule format" });
        return;
      }
      const apiRule: APIRule = {
        prolog,
        timestamp: new Date().toISOString(),
      };
      await service.addItem(apiRule);
      res
        .status(200)
        .json({ message: "Prolog rule added successfully to Yjs array" });
    } catch (err) {
      next(err);
    }
  };

  router.post("/", handler);

  return router;
}
