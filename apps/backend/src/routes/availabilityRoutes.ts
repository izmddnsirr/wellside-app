import { Router } from "express";
import {
  getClosedDatesController,
  getSlotsController,
} from "../controllers/availabilityController";

const router = Router();

router.get("/slots", getSlotsController);
router.get("/closed-dates", getClosedDatesController);

export default router;
