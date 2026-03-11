import { clerkClient } from "@clerk/express";
import Booking from "../models/Booking.js";
import Movie from "../models/Movie.js";


/* ======================================================
GET USER BOOKINGS
====================================================== */

export const getUserBookings = async (req, res) => {

  try {

    const userId = req.auth.userId;

    const bookings = await Booking.find({ user: userId })
      .populate({
        path: "show",
        populate: { path: "movie" }
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      bookings
    });

  } catch (error) {

    console.error("Bookings Error:", error.message);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

};


/* ======================================================
UPDATE FAVORITE MOVIES
====================================================== */

export const updateFavorite = async (req, res) => {

  try {

    const userId = req.auth.userId;
    const { movieId } = req.body;

    if (!movieId) {

      return res.status(400).json({
        success: false,
        message: "movieId is required"
      });

    }

    const user = await clerkClient.users.getUser(userId);

    const privateMetadata = user.privateMetadata || {};
    const favorites = privateMetadata.favorites || [];

    let updatedFavorites;

    if (favorites.includes(movieId)) {

      updatedFavorites = favorites.filter(id => id !== movieId);

    } else {

      updatedFavorites = [...favorites, movieId];

    }

    await clerkClient.users.updateUserMetadata(userId, {
      privateMetadata: {
        ...privateMetadata,
        favorites: updatedFavorites
      }
    });

    res.json({
      success: true,
      message: "Favorite movie updated successfully."
    });

  } catch (error) {

    console.error("Favorite Update Error:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

};


/* ======================================================
GET FAVORITE MOVIES
====================================================== */

export const getFavorites = async (req, res) => {

  try {

    const userId = req.auth.userId;

    const user = await clerkClient.users.getUser(userId);

    const favorites = user.privateMetadata?.favorites || [];

    const movies = await Movie.find({
      _id: { $in: favorites }
    });

    res.json({
      success: true,
      movies
    });

  } catch (error) {

    console.error("Favorites Error:", error.message);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

};


/* ======================================================
ENABLE MOVIE NOTIFICATION 🔔
====================================================== */

export const enableMovieNotification = async (req, res) => {

  try {

    const userId = req.auth.userId;
    const { movieId } = req.body;

    if (!movieId) {

      return res.status(400).json({
        success: false,
        message: "movieId is required"
      });

    }

    const user = await clerkClient.users.getUser(userId);

    const privateMetadata = user.privateMetadata || {};
    const notifications = privateMetadata.notifications || [];

    let updatedNotifications;

    if (notifications.includes(movieId)) {

      updatedNotifications = notifications;

    } else {

      updatedNotifications = [...notifications, movieId];

    }

    await clerkClient.users.updateUserMetadata(userId, {
      privateMetadata: {
        ...privateMetadata,
        notifications: updatedNotifications
      }
    });

    res.json({
      success: true,
      message: "Movie notification enabled 🔔"
    });

  } catch (error) {

    console.error("Notification Error:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

};