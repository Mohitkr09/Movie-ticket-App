import express from "express"

import {
  createBooking,
  getOccupiedSeats,
  getUserBookings,
  lockSeats
} from "../controllers/bookingController.js"

import { protectAdmin } from "../middleware/auth.js"

const bookingRouter = express.Router()

/* =====================================================
CREATE BOOKING
===================================================== */

bookingRouter.post(
  "/create",
  protectAdmin,
  createBooking
)

/* =====================================================
LOCK SEATS (TEMPORARY 5 MINUTE HOLD)
===================================================== */

bookingRouter.post(
  "/lock-seats",
  protectAdmin,
  lockSeats
)

/* =====================================================
GET OCCUPIED SEATS
===================================================== */

bookingRouter.get(
  "/seats/:showId",
  getOccupiedSeats
)

/* =====================================================
GET USER BOOKINGS
===================================================== */

bookingRouter.get(
  "/my-bookings",
 protectAdmin,
  getUserBookings
)

export default bookingRouter