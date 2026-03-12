import Show from "../models/Show.js"
import Booking from "../models/Booking.js"
import Stripe from "stripe"
import mongoose from "mongoose"
import { inngest } from "../inngest/index.js"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

/* =====================================================
CHECK SEAT AVAILABILITY
===================================================== */

const checkSeatsAvailability = async (showId, selectedSeats) => {

  try {

    const showData = await Show.findById(showId)

    if (!showData) return false

    const occupiedSeats = showData.occupiedSeats || {}

    const isAnySeatTaken = selectedSeats.some(
      seat => occupiedSeats[seat]
    )

    return !isAnySeatTaken

  } catch (error) {

    console.log("Seat availability error:", error.message)

    return false

  }

}

/* =====================================================
LOCK SEATS (TEMPORARY HOLD)
===================================================== */

export const lockSeats = async (req, res) => {

  try {

    const { showId, seats } = req.body

    const userId = req.auth?.userId

    if (!userId) {

      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      })

    }

    const showData = await Show.findById(showId)

    if (!showData) {

      return res.json({
        success: false,
        message: "Show not found"
      })

    }

    if (!showData.occupiedSeats) {
      showData.occupiedSeats = {}
    }

    const isTaken = seats.some(
      seat => showData.occupiedSeats[seat]
    )

    if (isTaken) {

      return res.json({
        success: false,
        message: "Seat already locked"
      })

    }

    seats.forEach(seat => {
      showData.occupiedSeats[seat] = userId
    })

    showData.markModified("occupiedSeats")

    await showData.save()

    res.json({
      success: true,
      message: "Seats locked successfully"
    })

  } catch (error) {

    console.log("Lock seat error:", error)

    res.status(500).json({
      success: false,
      message: error.message
    })

  }

}

/* =====================================================
CREATE BOOKING
===================================================== */

export const createBooking = async (req, res) => {

  const sessionDB = await mongoose.startSession()

  sessionDB.startTransaction()

  try {

    const userId = req.auth?.userId

    const { showId, selectedSeats } = req.body

    const { origin } = req.headers

    if (!userId) {

      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      })

    }

    if (!selectedSeats || selectedSeats.length === 0) {

      return res.json({
        success: false,
        message: "No seats selected"
      })

    }

    if (selectedSeats.length > 5) {

      return res.json({
        success: false,
        message: "Maximum 5 seats allowed"
      })

    }

    /* ========================
    FETCH SHOW
    ======================== */

    const showData = await Show
      .findById(showId)
      .populate("movie")
      .session(sessionDB)

    if (!showData) {

      return res.json({
        success: false,
        message: "Show not found"
      })

    }

    if (!showData.occupiedSeats) {
      showData.occupiedSeats = {}
    }

    /* ========================
    CHECK SEAT AVAILABILITY
    ======================== */

    const isAvailable = selectedSeats.every(
      seat => !showData.occupiedSeats[seat]
    )

    if (!isAvailable) {

      return res.json({
        success: false,
        message: "Some seats are already booked"
      })

    }

    /* ========================
    LOCK SEATS
    ======================== */

    selectedSeats.forEach(seat => {
      showData.occupiedSeats[seat] = userId
    })

    showData.markModified("occupiedSeats")

    await showData.save({ session: sessionDB })

    /* ========================
    CALCULATE PRICE
    ======================== */

    const amount = showData.showPrice * selectedSeats.length

    const finalAmount = Math.max(amount, 30) // Stripe minimum protection

    /* ========================
    CREATE BOOKING
    ======================== */

    const booking = await Booking.create([{

      user: userId,

      show: showId,

      amount: finalAmount,

      bookedSeats: selectedSeats.map(seat => ({
        seatNumber: seat,
        type: ["A", "B"].includes(seat[0]) ? "premium" : "regular"
      })),

      status: "locked",

      lockExpiresAt: new Date(Date.now() + 5 * 60 * 1000)

    }], { session: sessionDB })

    /* ========================
    STRIPE CHECKOUT SESSION
    ======================== */

    const stripeSession = await stripe.checkout.sessions.create({

      success_url: `${origin}/loading/my-bookings`,

      cancel_url: `${origin}/my-bookings`,

      payment_method_types: ["card"],

      line_items: [

        {

          price_data: {

            currency: "INR",

            product_data: {
              name: showData.movie.title
            },

            unit_amount: finalAmount * 100

          },

          quantity: 1

        }

      ],

      mode: "payment",

      metadata: {

        bookingId: booking[0]._id.toString()

      }

    })

    booking[0].paymentLink = stripeSession.url

    await booking[0].save({ session: sessionDB })

    await sessionDB.commitTransaction()

    sessionDB.endSession()

    /* ========================
    BACKGROUND PAYMENT CHECK
    ======================== */

    await inngest.send({

      name: "app/checkpayment",

      data: {

        bookingId: booking[0]._id.toString()

      }

    })

    res.json({

      success: true,

      url: stripeSession.url

    })

  } catch (error) {

    await sessionDB.abortTransaction()

    sessionDB.endSession()

    console.log("Create booking error:", error)

    res.status(500).json({

      success: false,

      message: error.message

    })

  }

}

/* =====================================================
GET OCCUPIED SEATS
===================================================== */

export const getOccupiedSeats = async (req, res) => {

  try {

    const { showId } = req.params

    const showData = await Show.findById(showId)

    if (!showData) {

      return res.json({
        success: false,
        message: "Show not found"
      })

    }

    const occupiedSeats = Object.keys(
      showData.occupiedSeats || {}
    )

    res.json({

      success: true,

      occupiedSeats

    })

  } catch (error) {

    console.log("Occupied seats error:", error)

    res.status(500).json({

      success: false,

      message: error.message

    })

  }

}

/* =====================================================
GET USER BOOKINGS
===================================================== */

export const getUserBookings = async (req, res) => {

  try {

    const userId = req.auth?.userId

    if (!userId) {

      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      })

    }

    const bookings = await Booking
      .find({ user: userId })
      .populate({
        path: "show",
        populate: {
          path: "movie"
        }
      })
      .sort({ createdAt: -1 })

    res.json({

      success: true,

      bookings

    })

  } catch (error) {

    console.log("User booking error:", error)

    res.status(500).json({

      success: false,

      message: error.message

    })

  }

}