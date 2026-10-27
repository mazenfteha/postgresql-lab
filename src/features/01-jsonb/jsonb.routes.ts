import { Router } from "express";
import { attributesById, byAttributes } from "./jsonb.controller.js";

export const jsonbRouter = Router();

jsonbRouter.get("/products/by-attributes", byAttributes);
jsonbRouter.get("/products/:id/attributes", attributesById);
