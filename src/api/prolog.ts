import { Router, RequestHandler } from "express";
import YjsService from "../services/YjsService";
import { VerifiableCredential } from "verifiable-credential-toolkit";

export default function createPrologRouter(service: YjsService): Router {
  const router = Router();

  const handler: RequestHandler = async (req, res, next) => {
    try {
      const verifiableCredential: VerifiableCredential = req.body;
      await service.addItem(verifiableCredential);
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
