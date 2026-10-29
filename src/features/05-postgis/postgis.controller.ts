import type { Request, Response } from "express";
import * as service from "./postgis.service.js";

// lat/lng from the query string, or null if missing / out of range.
function point(req: Request) {
  const lat = Number.parseFloat(String(req.query.lat));
  const lng = Number.parseFloat(String(req.query.lng));
  if (!(Math.abs(lat) <= 90) || !(Math.abs(lng) <= 180)) return null;
  return { lat, lng };
}

// GET /stores/nearby?lat=30.0444&lng=31.2357&km=10
export async function nearby(req: Request, res: Response) {
  const p = point(req);
  const km = req.query.km === undefined ? 10 : Number.parseFloat(String(req.query.km));
  if (!p || !(km > 0)) {
    res.status(400).json({ error: "lat (-90..90), lng (-180..180) and km > 0 are required" });
    return;
  }
  const stores = await service.nearby(p.lat, p.lng, km);
  res.json({ count: stores.length, stores });
}

// GET /stores/:id/distance?lat=30.0444&lng=31.2357
export async function distance(req: Request, res: Response) {
  const id = Number(req.params.id);
  const p = point(req);
  if (!Number.isInteger(id) || !p) {
    res.status(400).json({ error: "integer id, lat (-90..90) and lng (-180..180) are required" });
    return;
  }
  const store = await service.distance(id, p.lat, p.lng);
  if (!store) {
    res.status(404).json({ error: "store not found (run npm run seed:stores)" });
    return;
  }
  res.json(store);
}
