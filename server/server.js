import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./configs/db.js";
import { clerkMiddleware } from "@clerk/express";
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js";
import showRouter from "./routes/showRoutes.js";
import bookingRouter from "./routes/BookingRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import userRouter from "./routes/userRoutes.js";
import { stripeWebhooks } from "./controllers/stripeWebhooks.js";

const app = express();

// ✅ Use Render’s dynamic port
const PORT = process.env.PORT || 3000;

// ✅ Connect DB
await connectDB();

// ✅ Stripe webhook (must come before express.json())
app.use("/api/stripe", express.raw({ type: "application/json" }), stripeWebhooks);

// ✅ Middlewares
app.use(cors());
app.use(express.json());

// ✅ Routes
app.get("/", (req, res) => res.send("🚀 Server is Live!"));
app.use(clerkMiddleware());
app.use("/api/inngest", serve({ client: inngest, functions }));
app.use("/api/show", showRouter);
app.use("/api/booking", bookingRouter);
app.use("/api/admin", adminRouter);
app.use("/api/user", userRouter);

// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ Server listening at http://localhost:${PORT}`);
});
