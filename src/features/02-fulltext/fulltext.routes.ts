import { Router } from "express";
import { fuzzy, search } from "./fulltext.controller.js";

export const fulltextRouter = Router();

fulltextRouter.get("/search", search);
fulltextRouter.get("/search/fuzzy", fuzzy);
