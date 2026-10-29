import { Router } from "express";
import { semantic, similar } from "./pgvector.controller.js";

export const pgvectorRouter = Router();

pgvectorRouter.get("/products/:id/similar", similar);
pgvectorRouter.get("/search/semantic", semantic);
