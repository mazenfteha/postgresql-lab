import type { Request, Response } from "express";
import * as service from "./fulltext.service.js";

const readQ = (req: Request) => String(req.query.q ?? "").trim();

// GET /search?q=wireless headphones
export async function search(req: Request, res: Response) {
  const q = readQ(req);
  if (!q) {
    res.status(400).json({ error: "q is required" });
    return;
  }
  res.json(await service.search(q));
}

// GET /search/fuzzy?q=wireles hedphones
export async function fuzzy(req: Request, res: Response) {
  const q = readQ(req);
  if (!q) {
    res.status(400).json({ error: "q is required" });
    return;
  }
  res.json(await service.fuzzy(q));
}
