import { Inngest } from "inngest";
import dbConnect from "../configs/db.js"; // <-- make sure you have this
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import sendEmail from "../configs/nodemailer.js";

export const inngest = new Inngest({ id: "movie-ticket-booking" });

/**
 * Create user in DB when created in Clerk
 */
const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    try {
      await dbConnect();

      const { id, first_name, last_name, email_addresses, image_url } = event.data;
      const userData = {
        _id: id,
        email: email_addresses?.[0]?.email_address || "",
        name: `${first_name || ""} ${last_name || ""}`.trim(),
        image: image_url || ""
      };

      await User.create(userData);
    } catch (error) {
      console.error("Error creating user:", error.stack || error);
    }
  }
);

/**
 * Delete user in DB when deleted in Clerk
 */
const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-from-clerk" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    try {
      await dbConnect();

      const { id } = event.data;
      await User.findByIdAndDelete(id);
    } catch (error) {
      console.error("Error deleting user:", error.stack || error);
    }
  }
);

/**
 * Update user in DB when updated in Clerk
 */
const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk/user.updated" },
  async ({ event }) => {
    try {
      await dbConnect();

      const { id, first_name, last_name, email_addresses, image_url } = event.data;
      const updatedData = {
        email: email_addresses?.[0]?.email_address || "",
        name: `${first_name || ""} ${last_name || ""}`.trim(),
        image: image_url || ""
      };

      await User.findByIdAndUpdate(id, updatedData, { new: true, runValidators: true });
    } catch (error) {
      console.error("Error updating user:", error.stack || error);
    }
  }
);

/**
 * Wait 10 min → check payment → release seats & delete booking if unpaid
 */
const releaseSeatsAndDeleteBooking = inngest.createFunction(
  { id: "release-seats-delete-booking" },
  { event: "app/checkpayment" },
  async ({ event, step }) => {
    try {
      await dbConnect();

      const tenMinutesLater = new Date(Date.now() + 10 * 60 * 1000);
      await step.sleepUntil("wait-for-10-minutes", tenMinutesLater);

      await step.run("check-payment-status", async () => {
        const bookingId = event.data.bookingId;
        const booking = await Booking.findById(bookingId);

        if (!booking) {
          console.warn(`Booking not found: ${bookingId}`);
          return;
        }

        // Extra check in case payment was made during wait period
        if (!booking.isPaid) {
          const show = await Show.findById(booking.show);
          if (!show) {
            console.warn(`Show not found for booking: ${bookingId}`);
            return;
          }

          booking.bookedSeats.forEach((seat) => {
            delete show.occupiedSeats[seat];
          });

          show.markModified("occupiedSeats");
          await show.save();
          await Booking.findByIdAndDelete(booking._id);
        }
      });
    } catch (error) {
      console.error("Error in releaseSeatsAndDeleteBooking:", error.stack || error);
    }
  }
);

/**
 * Send booking confirmation email
 */
const sendBookingConfirmationEmail = inngest.createFunction(
  { id: "send-booking-confirmation-email" },
  { event: "app/show.booked" },
  async ({ event }) => {
    try {
      await dbConnect();

      const { bookingId } = event.data;
      const booking = await Booking.findById(bookingId)
        .populate({ path: "show", populate: { path: "movie", model: "Movie" } })
        .populate("user");

      if (!booking) {
        console.warn(`Booking not found for email send: ${bookingId}`);
        return;
      }

      await sendEmail({
        to: booking.user.email,
        subject: `Payment Confirmation: "${booking.show.movie.title}" booked!`,
        body: `<div style="font-family: Arial, sans-serif; line-height:1.5;">
          <h2>Hi ${booking.user.name},</h2>
          <p>Your booking for <strong style="color: #F84565;">"${booking.show.movie.title}"</strong> is confirmed.</p>
          <p>
            <strong>Date:</strong> ${new Date(booking.show.showDateTime).toLocaleDateString("en-us", { timeZone: "Asia/Kolkata" })}<br/>
            <strong>Time:</strong> ${new Date(booking.show.showDateTime).toLocaleTimeString("en-us", { timeZone: "Asia/Kolkata" })}
          </p>
          <p>Enjoy the show!</p>
          <p>Thanks for booking with us!<br/>- QuickShow Team</p>
        </div>`
      });
    } catch (error) {
      console.error("Error sending booking confirmation email:", error.stack || error);
    }
  }
);

export const functions = [
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdation,
  releaseSeatsAndDeleteBooking,
  sendBookingConfirmationEmail
];

