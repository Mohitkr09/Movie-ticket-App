import { Inngest } from "inngest";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import sendEmail from "../configs/nodeMailer.js";

export const inngest = new Inngest({ id: "movie-ticket-booking" });

/* -----------------------------------------------------------
   1️⃣ CLERK SYNC — CREATE USER
------------------------------------------------------------ */
const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    try {
      const { id, first_name, last_name, email_addresses, image_url } = event.data;

      await User.create({
        _id: id,
        email: email_addresses?.[0]?.email_address || "",
        name: `${first_name || ""} ${last_name || ""}`.trim(),
        image: image_url || ""
      });
    } catch (error) {
      console.error("Error creating user:", error);
    }
  }
);

/* -----------------------------------------------------------
   2️⃣ CLERK SYNC — DELETE USER
------------------------------------------------------------ */
const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-from-clerk" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    try {
      await User.findByIdAndDelete(event.data.id);
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  }
);

/* -----------------------------------------------------------
   3️⃣ CLERK SYNC — UPDATE USER
------------------------------------------------------------ */
const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk/user.updated" },
  async ({ event }) => {
    try {
      const { id, first_name, last_name, email_addresses, image_url } = event.data;

      await User.findByIdAndUpdate(
        id,
        {
          email: email_addresses?.[0]?.email_address || "",
          name: `${first_name || ""} ${last_name || ""}`.trim(),
          image: image_url || ""
        },
        { new: true, runValidators: true }
      );
    } catch (error) {
      console.error("Error updating user:", error);
    }
  }
);

/* -----------------------------------------------------------
   4️⃣ RELEASE SEATS AFTER 10 MIN IF PAYMENT NOT DONE
------------------------------------------------------------ */
const releaseSeatsAndDeleteBooking = inngest.createFunction(
  { id: "release-seats-delete-booking" },
  { event: "app/checkpayment" },
  async ({ event, step }) => {
    const tenMinutesLater = new Date(Date.now() + 10 * 60 * 1000);

    await step.sleepUntil("wait-for-10-minutes", tenMinutesLater);

    await step.run("check-payment-status", async () => {
      const bookingId = event.data.bookingId;
      const booking = await Booking.findById(bookingId);

      if (!booking) return;

      // Payment still not completed → release seats
      if (!booking.isPaid) {
        const show = await Show.findById(booking.show);
        if (!show) return;

        booking.bookedSeats.forEach((seat) => {
          delete show.occupiedSeats[seat];
        });

        show.markModified("occupiedSeats");
        await show.save();
        await Booking.findByIdAndDelete(booking._id);
      }
    });
  }
);

/* -----------------------------------------------------------
   5️⃣ SEND CONFIRMATION EMAIL (AFTER STRIPE WEBHOOK)
------------------------------------------------------------ */
const sendBookingConfirmationEmail = inngest.createFunction(
  { id: "send-booking-confirmation-email" },
  { event: "app/show.booked" },
  async ({ event }) => {
    const { bookingId } = event.data;

    const booking = await Booking.findById(bookingId)
      .populate({
        path: "show",
        populate: { path: "movie", model: "Movie" }
      })
      .populate("user");

    if (!booking || !booking.user || !booking.show) {
      console.log("⚠ Missing booking data for email:", bookingId);
      return;
    }

    // Send email
    await sendEmail({
      to: booking.user.email,
      subject: `🎟 Payment Confirmation: "${booking.show.movie.title}" Booked!`,
      body: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
          <div style="max-width: 600px; background-color: white; margin: auto; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">

            <div style="background-color: #F84565; padding: 15px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 24px;">🎬 QuickShow</h1>
              <p style="margin: 0; font-size: 16px;">Your Movie Ticket is Confirmed!</p>
            </div>

            <div style="padding: 20px; color: #333;">
              <h2 style="color: #F84565;">Hi ${booking.user.name},</h2>
              <p>Your booking for <strong>"${booking.show.movie.title}"</strong> is confirmed.</p>

              <div style="background-color: #fdf2f3; padding: 15px; border-left: 4px solid #F84565; margin: 20px 0; border-radius: 5px;">
                <p style="margin: 0; font-size: 16px;">
                  <strong>Date:</strong> ${new Date(booking.show.showDateTime).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}<br/>
                  <strong>Time:</strong> ${new Date(booking.show.showDateTime).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" })}
                </p>
              </div>

              <p>Enjoy the show! 🍿</p>
              <p style="margin-top: 10px;">Thanks for booking with us!<br/>- <strong>QuickShow Team</strong></p>
            </div>

            <div style="background-color: #f9f9f9; padding: 10px; text-align: center; font-size: 12px; color: #888;">
              <p style="margin: 0;">This is an automated confirmation. Please do not reply.</p>
            </div>
          </div>
        </div>
      `
    });
  }
);

/* -----------------------------------------------------------
   6️⃣ SEND REMINDERS 8 HOURS BEFORE SHOW
------------------------------------------------------------ */
const sendShowReminders = inngest.createFunction(
  { id: "send-show-reminders" },
  { cron: "0 */8 * * *" },
  async ({ step }) => {
    const now = new Date();
    const in8Hours = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const windowStart = new Date(in8Hours.getTime() - 10 * 60 * 1000);

    // Find shows starting soon
    const remainderTasks = await step.run("prepare-reminders", async () => {
      const shows = await Show.find({
        showTime: { $gte: windowStart, $lte: in8Hours }
      }).populate("movie");

      const tasks = [];

      for (const show of shows) {
        const userIds = [...new Set(Object.values(show.occupiedSeats))];

        const users = await User.find({ _id: { $in: userIds } }).select("name email");

        users.forEach((user) => {
          tasks.push({
            userEmail: user.email,
            userName: user.name,
            movieTitle: show.movie.title,
            showTime: show.showTime
          });
        });
      }

      return tasks;
    });

    if (remainderTasks.length === 0) return { sent: 0, message: "No reminders to send." };

    // Send reminders
    const results = await step.run("send-reminders", async () =>
      Promise.allSettled(
        remainderTasks.map((task) =>
          sendEmail({
            to: task.userEmail,
            subject: `Reminder: Your movie "${task.movieTitle}" starts soon!`,
            body: `
              <div style="font-family: Arial;">
                <h2>Hello ${task.userName},</h2>
                <p>Your movie:</p>
                <h3 style="color: #F84565;">"${task.movieTitle}"</h3>
                <p>
                  is scheduled for <strong>${new Date(task.showTime).toLocaleString("en-IN")}</strong>.
                </p>
                <p>Enjoy the show!<br/>QuickShow Team</p>
              </div>
            `
          })
        )
      )
    );

    return {
      sent: results.filter((r) => r.status === "fulfilled").length,
      failed: results.filter((r) => r.status === "rejected").length
    };
  }
);

/* -----------------------------------------------------------
   7️⃣ SEND NOTIFICATION WHEN NEW SHOW IS ADDED
------------------------------------------------------------ */
const sendNewShowNotifications = inngest.createFunction(
  { id: "send-new-show-notifications" },
  { event: "app/show.added" },
  async ({ event }) => {
    const users = await User.find({});
    const { movieTitle } = event.data;

    for (const user of users) {
      await sendEmail({
        to: user.email,
        subject: `New Show Added: ${movieTitle}`,
        body: `
          <div style="font-family: Arial; padding: 20px;">
            <h2>Hi ${user.name},</h2>
            <p>A new show has been added:</p>
            <h3 style="color:#F84565">"${movieTitle}"</h3>
            <p>Visit our website to book your tickets!</p>
            <p>QuickShow Team</p>
          </div>
        `
      });
    }

    return { message: "Notifications sent." };
  }
);

/* -----------------------------------------------------------
   EXPORT ALL FUNCTIONS
------------------------------------------------------------ */
export const functions = [
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdation,
  releaseSeatsAndDeleteBooking,
  sendBookingConfirmationEmail,
  sendShowReminders,
  sendNewShowNotifications
];
