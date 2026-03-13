import { Router } from "express";
import {
  addTemporaryClosureController,
  deleteTemporaryClosureController,
  getOperatingRulesController,
  saveWeeklyScheduleController,
} from "../controllers/operationsController";

const router = Router();

router.get("/rules", getOperatingRulesController);
router.put("/weekly-schedule", saveWeeklyScheduleController);
router.post("/temporary-closures", addTemporaryClosureController);
router.delete(
  "/temporary-closures/:closureId",
  deleteTemporaryClosureController,
);

export default router;
