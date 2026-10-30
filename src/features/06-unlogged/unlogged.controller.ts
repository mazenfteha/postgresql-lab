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

// PATCH /products/:id/price  body: { "price": 80 }
export async function updatePrice(req: Request, res: Response) {
  const id = Number(req.params.id);
  const price = Number(req.body?.price);
  if (!Number.isInteger(id) || !(price > 0)) {
    res.status(400).json({ error: "integer id and body { price > 0 } are required" });
    return;
  }
  const product = await service.updatePrice(id, price);
  if (!product) {
    res.status(404).json({ error: "product not found" });
    return;
  }
  res.json(product);
}
