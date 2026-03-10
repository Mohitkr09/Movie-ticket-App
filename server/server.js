import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/db.js';
import { clerkMiddleware } from '@clerk/express';
import { serve } from 'inngest/express';
import { inngest, functions } from './inngest/index.js';
import showRouter from './routes/showRoutes.js';
import bookingRouter from './routes/BookingRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import userRouter from './routes/userRoutes.js';
import aiRouter from './routes/aiRoutes.js';
import { stripeWebhooks } from './controllers/stripeWebhooks.js';
import sendEmail from "./configs/nodeMailer.js";
import reviewRoutes from "./routes/reviewRoutes.js";

const app = express();
const port = process.env.PORT || 3000;


// -------------------------------
// 🔗 CONNECT DATABASE
// -------------------------------
await connectDB();


// -------------------------------
// ⚠️ STRIPE WEBHOOK (MUST BE 1ST)
// Raw body needed for signature check
// -------------------------------
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhooks
);


// -------------------------------
// 🌍 CORS CONFIG (AFTER WEBHOOK, BEFORE JSON)
// -------------------------------
const allowedOrigins = [
  "http://localhost:5173",
  "https://movie-ticket-app-radp.vercel.app",
  "https://movie-ticket-app-radp-ivdlfj2w8-mohits-projects-92e7fc3c.vercel.app",
  "https://movie-ticket-app-jz7m.vercel.app",
  "https://movie-ticket-app-zi7g.vercel.app",
  "https://movie-ticket-app-14.onrender.com",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);


// -------------------------------
// JSON PARSER (AFTER WEBHOOK ONLY)
// -------------------------------
app.use(express.json());


// -------------------------------
// 🔐 CLERK AUTH
// -------------------------------
app.use(clerkMiddleware());


// -------------------------------
// 📧 TEST EMAIL ROUTE
// -------------------------------
app.get("/test-email", async (req, res) => {
  try {
    await sendEmail({
      to: "mkr27858@gmail.com",
      subject: "QuickShow Test Email",
      body: "<h1>Test email success!</h1>",
    });

    res.send("EMAIL SENT ✔");
  } catch (error) {
    console.error("❌ Test email error:", error);
    res.status(500).send("FAILED ❌");
  }
});


// -------------------------------
// ROUTES
// -------------------------------
app.get("/", (req, res) => res.send("Server is Live ✅"));

app.use("/api/inngest", serve({ client: inngest, functions }));
app.use("/api/show", showRouter);
app.use("/api/booking", bookingRouter);
app.use("/api/admin", adminRouter);
app.use("/api/user", userRouter);
app.use("/api/ai", aiRouter);
app.use("/api/reviews", reviewRoutes);


// -------------------------------
// 🚀 START SERVER
// -------------------------------
app.listen(port, () => {
  console.log(`✅ Server listening at http://localhost:${port}`);
});
