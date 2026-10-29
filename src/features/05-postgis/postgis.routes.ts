import { Router } from "express";
import { distance, nearby } from "./postgis.controller.js";

export const postgisRouter = Router();

postgisRouter.get("/stores/nearby", nearby);
postgisRouter.get("/stores/:id/distance", distance);
