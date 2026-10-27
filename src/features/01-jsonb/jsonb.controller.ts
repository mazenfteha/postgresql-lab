import type { Request, Response } from "express";
import * as service from "./jsonb.service.js";

// GET /products/by-attributes?filter={"color":"red"}
export async function byAttributes(req: Request, res: Response) {
  let filter: unknown;
  try {
    filter = JSON.parse(String(req.query.filter ?? "{}"));
  } catch {
    res.status(400).json({ error: "filter must be valid JSON" });
    return;
  }
  if (typeof filter !== "object" || filter === null || Array.isArray(filter)) {
    res.status(400).json({ error: "filter must be a JSON object" });
    return;
  }
  res.json(await service.findByAttributes(filter as Record<string, unknown>));
}

// GET /products/:id/attributes
export async function attributesById(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "id must be an integer" });
    return;
  }
  const row = await service.getAttributes(id);
  if (!row) {
    res.status(404).json({ error: "product not found" });
    return;
  }
  res.json(row);
}
