import express from "express";
import {
  getFavorites,
  getUserBookings,
  updateFavorite,
  enableMovieNotification
} from "../controllers/userController.js";

import { requireAuth } from "@clerk/express";

const userRouter = express.Router();


/* ==============================
GET USER BOOKINGS
============================== */

userRouter.get(
  "/bookings",
  requireAuth(),
  getUserBookings
);


/* ==============================
UPDATE FAVORITE MOVIES
============================== */

userRouter.post(
  "/update-favorite",
  requireAuth(),
  updateFavorite
);


/* ==============================
GET FAVORITES
============================== */

userRouter.get(
  "/favorites",
  requireAuth(),
  getFavorites
);


/* ==============================
ENABLE MOVIE NOTIFICATION 🔔
============================== */

userRouter.post(
  "/notify",
  requireAuth(),
  enableMovieNotification
);


export default userRouter;