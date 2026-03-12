import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    /* =========================
       USER
    ========================= */

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    /* =========================
       SHOW
    ========================= */

    show: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Show",
      required: true
    },

    /* =========================
       SEATS
    ========================= */

    bookedSeats: [
      {
        seatNumber: {
          type: String,
          required: true
        },

        type: {
          type: String,
          enum: ["regular", "premium"],
          default: "regular"
        }
      }
    ],

    /* =========================
       PAYMENT
    ========================= */

    amount: {
      type: Number,
      required: true
    },

    currency: {
      type: String,
      default: "INR"
    },

    isPaid: {
      type: Boolean,
      default: false
    },

    paymentLink: {
      type: String
    },

    paymentIntentId: {
      type: String
    },

    /* =========================
       SEAT LOCK SYSTEM
    ========================= */

    lockExpiresAt: {
      type: Date
    },

    status: {
      type: String,
      enum: [
        "pending",
        "locked",
        "confirmed",
        "cancelled"
      ],
      default: "pending"
    },

    /* =========================
       QR TICKET
    ========================= */

    ticketQRCode: {
      type: String
    }

  },

  { timestamps: true }
);

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;