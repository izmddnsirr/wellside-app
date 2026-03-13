import type { Request, Response } from "express";
import {
  cancelCustomerBooking,
  createAdminBooking,
  createCustomerBooking,
  updateAdminBookingStatus,
  updateBarberBookingStatus,
} from "../services/bookingsService";
import type { BookingStatus } from "../types/booking";

export async function createCustomerBookingController(
  req: Request,
  res: Response,
) {
  try {
    const result = await createCustomerBooking(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({
      error:
        error instanceof Error ? error.message : "Unable to create booking.",
    });
  }
}

export async function createAdminBookingController(req: Request, res: Response) {
  try {
    const result = await createAdminBooking(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({
      error:
        error instanceof Error ? error.message : "Unable to create booking.",
    });
  }
}

export async function cancelCustomerBookingController(
  req: Request,
  res: Response,
) {
  try {
    const result = await cancelCustomerBooking(String(req.body.bookingId ?? ""));
    res.json(result);
  } catch (error) {
    res.status(400).json({
      error:
        error instanceof Error ? error.message : "Unable to cancel booking.",
    });
  }
}

export async function updateAdminBookingStatusController(
  req: Request,
  res: Response,
) {
  try {
    const bookingId = String(req.body.bookingId ?? "");
    const status = String(req.body.status ?? "") as BookingStatus;
    const result = await updateAdminBookingStatus(bookingId, status);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      error:
        error instanceof Error
          ? error.message
          : "Unable to update booking status.",
    });
  }
}

export async function updateBarberBookingStatusController(
  req: Request,
  res: Response,
) {
  try {
    const result = await updateBarberBookingStatus({
      bookingId: String(req.body.bookingId ?? ""),
      barberId: String(req.body.barberId ?? ""),
      status: String(req.body.status ?? "") as BookingStatus,
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({
      error:
        error instanceof Error
          ? error.message
          : "Unable to update booking status.",
    });
  }
}
