import { Router } from "express";
import { cached, updatePrice } from "./unlogged.controller.js";

export const unloggedRouter = Router();

unloggedRouter.get("/products/:id/cached", cached);
unloggedRouter.patch("/products/:id/price", updatePrice);
