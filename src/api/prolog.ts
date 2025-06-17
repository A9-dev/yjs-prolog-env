import { Router, RequestHandler } from "express";
import PrologService from "../services/PrologService";

export default function createPrologRouter(service: PrologService): Router {
  const router = Router();

  const handler: RequestHandler = async (req, res, next) => {
    try {
      const { prolog } = req.body;
      if (typeof prolog !== "string") {
        res.status(400).json({ error: "Invalid prolog rule format" });
        return;
      }
      await service.addRule(prolog);
      res.status(200).json({ message: "Prolog rule added successfully" });
    } catch (err) {
      next(err);
    }
  };

  router.post("/", handler);

  return router;
}
