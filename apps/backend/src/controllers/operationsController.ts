import type { Request, Response } from "express";
import {
  addTemporaryClosure,
  deleteTemporaryClosure,
  getOperatingRules,
  saveWeeklySchedule,
} from "../services/operationsService";

export async function getOperatingRulesController(_req: Request, res: Response) {
  try {
    const rules = await getOperatingRules();
    res.json(rules);
  } catch (error) {
    res.status(400).json({
      error:
        error instanceof Error
          ? error.message
          : "Unable to load operating rules.",
    });
  }
}

export async function saveWeeklyScheduleController(req: Request, res: Response) {
  try {
    const result = await saveWeeklySchedule(req.body ?? {});
    res.json(result);
  } catch (error) {
    res.status(400).json({
      error:
        error instanceof Error
          ? error.message
          : "Unable to save weekly schedule.",
    });
  }
}

export async function addTemporaryClosureController(
  req: Request,
  res: Response,
) {
  try {
    const result = await addTemporaryClosure(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({
      error:
        error instanceof Error
          ? error.message
          : "Unable to add temporary closure.",
    });
  }
}

export async function deleteTemporaryClosureController(
  req: Request,
  res: Response,
) {
  try {
    const result = await deleteTemporaryClosure(String(req.params.closureId ?? ""));
    res.json(result);
  } catch (error) {
    res.status(400).json({
      error:
        error instanceof Error
          ? error.message
          : "Unable to delete temporary closure.",
    });
  }
}
