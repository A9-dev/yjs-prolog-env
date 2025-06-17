import { Router, RequestHandler } from "express";
import PrologService from "../services/PrologService";

export default function createRulesRouter(service: PrologService): Router {
  const router = Router();

  const handler: RequestHandler = async (req, res, next) => {
    try {
      const { rule } = req.body;
      if (typeof rule !== "string") {
        res.status(400).json({ error: "Invalid rule format" });
        return;
      }
      await service.addRule(rule);
      res.status(200).json({ message: "Rule added successfully" });
    } catch (err) {
      next(err);
    }
  };

  router.post("/", handler);

  return router;
}
