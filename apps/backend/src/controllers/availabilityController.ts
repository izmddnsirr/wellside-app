import type { Request, Response } from "express";
import {
  fetchClosedDates,
  getAvailableSlots,
} from "../services/availabilityService";

export async function getSlotsController(req: Request, res: Response) {
  try {
    const barberId = String(req.query.barberId ?? "");
    const dateISO = String(req.query.dateISO ?? "");
    const slots = await getAvailableSlots(barberId, dateISO);
    res.json(slots);
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "Unable to load slots.",
    });
  }
}

export async function getClosedDatesController(req: Request, res: Response) {
  try {
    const fromISO = String(req.query.fromISO ?? "");
    const toISO = String(req.query.toISO ?? "");
    const data = await fetchClosedDates(fromISO, toISO);
    res.json(data);
  } catch (error) {
    res.status(400).json({
      error:
        error instanceof Error ? error.message : "Unable to load closed dates.",
    });
  }
}
