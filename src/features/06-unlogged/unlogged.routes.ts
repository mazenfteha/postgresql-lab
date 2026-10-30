import { Router } from "express";
import { cached } from "./unlogged.controller.js";

export const unloggedRouter = Router();

unloggedRouter.get("/products/:id/cached", cached);
