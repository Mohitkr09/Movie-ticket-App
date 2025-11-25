import stripe from "stripe";
import Booking from "../models/Booking.js";
import { inngest } from "../inngest/index.js";

export const stripeWebhooks = async (request, response) => {
  const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
  const sig = request.headers["stripe-signature"];

  let event;

  try {
    // IMPORTANT: request.body must be RAW buffer (express.raw)
    event = stripeInstance.webhooks.constructEvent(
      request.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.log("❌ Stripe signature check failed:", error.message);
    return response.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const bookingId = session.metadata.bookingId;

        // mark booking as paid
        await Booking.findByIdAndUpdate(bookingId, {
          isPaid: true,
          paymentLink: ""
        });

        // send confirmation email
        await inngest.send({
          name: "app/show.booked",
          data: { bookingId }
        });

        console.log("🎉 Payment completed & email event sent:", bookingId);
        break;
      }

      default:
        console.log("⚠ Unhandled event type:", event.type);
    }

    response.json({ received: true });
  } catch (err) {
    console.error("Webhook processing error:", err);
    response.status(500).send("Internal Server Error");
  }
};
