import { Router, RequestHandler } from "express";
import PrologService from "../services/PrologService";

export default function createQueryRouter(service: PrologService): Router {
  const router = Router();

  const handler: RequestHandler = async (req, res, next) => {
    try {
      const { query } = req.body;
      if (typeof query !== "string") {
        res.status(400).json({ error: "Invalid query format" });
        return;
      }
      const result = await service.query(query);
      res.status(200).json({ result });
    } catch (err) {
      next(err);
    }
  };

  router.post("/", handler);

  return router;
}
