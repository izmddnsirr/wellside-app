import { Router } from "express";
import {
  cancelCustomerBookingController,
  createAdminBookingController,
  createCustomerBookingController,
  updateAdminBookingStatusController,
  updateBarberBookingStatusController,
} from "../controllers/bookingsController";

const router = Router();

router.post("/customer-confirm", createCustomerBookingController);
router.post("/admin-create", createAdminBookingController);
router.post("/customer-cancel", cancelCustomerBookingController);
router.post("/admin-status", updateAdminBookingStatusController);
router.post("/barber-status", updateBarberBookingStatusController);

export default router;
