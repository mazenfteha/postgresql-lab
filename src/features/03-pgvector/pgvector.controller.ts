import type { Request, Response } from "express";
import * as service from "./pgvector.service.js";

// GET /products/:id/similar
export async function similar(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "id must be an integer" });
    return;
  }
  const result = await service.similar(id);
  if (!result) {
    res.status(404).json({ error: "product not found or not embedded yet (run npm run embed)" });
    return;
  }
  res.json(result);
}

// GET /search/semantic?q=something to keep my coffee hot
export async function semantic(req: Request, res: Response) {
  const q = String(req.query.q ?? "").trim();
  if (!q) {
    res.status(400).json({ error: "q is required" });
    return;
  }
  res.json(await service.semantic(q));
}
