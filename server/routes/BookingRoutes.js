import express from "express";

import {
  createBooking,
  getOccupiedSeats,
  getUserBookings,
  lockSeats
} from "../controllers/bookingController.js";

import { protect } from "../middleware/auth.js";

const bookingRouter = express.Router();

/* =====================================================
CREATE BOOKING
===================================================== */

bookingRouter.post(
  "/create",
  protect,
  createBooking
);

/* =====================================================
LOCK SEATS (TEMPORARY 5 MINUTE HOLD)
===================================================== */

bookingRouter.post(
  "/lock-seats",
  protect,
  lockSeats
);

/* =====================================================
GET OCCUPIED SEATS
===================================================== */

bookingRouter.get(
  "/seats/:showId",
  getOccupiedSeats
);

/* =====================================================
GET USER BOOKINGS
===================================================== */

bookingRouter.get(
  "/my-bookings",
  protect,
  getUserBookings
);

export default bookingRouter;