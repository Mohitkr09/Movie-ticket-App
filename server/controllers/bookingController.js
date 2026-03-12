import Show from "../models/Show.js"
import Booking from "../models/Booking.js"
import Stripe from "stripe"
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

    console.log(error.message)
    return false

  }

}


/* =====================================================
LOCK SEATS (TEMPORARY HOLD)
===================================================== */

export const lockSeats = async (req, res) => {

  try {

    const { showId, seats } = req.body
    const { userId } = req.auth()

    const showData = await Show.findById(showId)

    if (!showData) {

      return res.json({
        success: false,
        message: "Show not found"
      })

    }

    const occupiedSeats = showData.occupiedSeats || {}

    const isTaken = seats.some(seat => occupiedSeats[seat])

    if (isTaken) {

      return res.json({
        success: false,
        message: "Seat already locked"
      })

    }

    seats.forEach(seat => {

      occupiedSeats[seat] = userId

    })

    showData.occupiedSeats = occupiedSeats

    showData.markModified("occupiedSeats")

    await showData.save()

    res.json({
      success: true,
      message: "Seats locked"
    })

  } catch (error) {

    console.log(error.message)

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

  try {

    const { userId } = req.auth()

    const { showId, selectedSeats } = req.body

    const { origin } = req.headers

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

    const isAvailable = await checkSeatsAvailability(
      showId,
      selectedSeats
    )

    if (!isAvailable) {

      return res.json({
        success: false,
        message: "Selected seats are already booked"
      })

    }

    const showData = await Show
      .findById(showId)
      .populate("movie")

    if (!showData) {

      return res.json({
        success: false,
        message: "Show not found"
      })

    }

    const amount = showData.showPrice * selectedSeats.length

    const booking = await Booking.create({

      user: userId,

      show: showId,

      amount,

      bookedSeats: selectedSeats.map(seat => ({
        seatNumber: seat,
        type: ["A", "B"].includes(seat[0])
          ? "premium"
          : "regular"
      })),

      status: "locked",

      lockExpiresAt: new Date(
        Date.now() + 5 * 60 * 1000
      )

    })

    selectedSeats.forEach(seat => {

      showData.occupiedSeats[seat] = userId

    })

    showData.markModified("occupiedSeats")

    await showData.save()

    const line_items = [

      {
        price_data: {

          currency: "INR",

          product_data: {
            name: showData.movie.title
          },

          unit_amount: Math.floor(amount * 100)

        },

        quantity: 1

      }

    ]

    const session = await stripe.checkout.sessions.create({

      success_url: `${origin}/loading/my-bookings`,

      cancel_url: `${origin}/my-bookings`,

      line_items,

      mode: "payment",

      metadata: {

        bookingId: booking._id.toString()

      },

      expires_at: Math.floor(
        Date.now() / 1000 + 30 * 60
      )

    })

    booking.paymentLink = session.url

    await booking.save()

    await inngest.send({

      name: "app/checkpayment",

      data: {

        bookingId: booking._id.toString()

      }

    })

    res.json({
      success: true,
      url: session.url
    })

  } catch (error) {

    console.log(error.message)

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

    console.log(error.message)

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

    const { userId } = req.auth()

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

    console.log(error.message)

    res.status(500).json({

      success: false,
      message: error.message

    })

  }

}