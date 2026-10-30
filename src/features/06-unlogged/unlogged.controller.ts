import type { Request, Response } from "express";
import * as service from "./unlogged.service.js";

// GET /products/:id/cached  -> header X-Cache: HIT | MISS
export async function cached(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "id must be an integer" });
    return;
  }
  const result = await service.cachedProduct(id);
  if (!result) {
    res.status(404).json({ error: "product not found" });
    return;
  }
  res.set("X-Cache", result.cache).json(result.product);
}
