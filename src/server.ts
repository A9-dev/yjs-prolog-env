import express from "express";
import PrologBuilder from "./PrologBuilder";
import PrologService from "./services/PrologService";
import { ydoc, yarray } from "./yjsInstance";
import setupRoutes from "./api";
import errorHandler from "./middleware/errorHandler";
import logger from "./logger";

const app = express();
app.use(express.json());

const prologBuilder = new PrologBuilder(ydoc, yarray);
const prologService = new PrologService(prologBuilder);

app.use("/api", setupRoutes(prologService));
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => logger.info(`API server running on port ${PORT}`));
