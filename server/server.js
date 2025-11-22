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
import { stripeWebhooks } from './controllers/stripeWebhooks.js';
import aiRouter from './routes/aiRoutes.js';

const app = express();
const port = process.env.PORT || 3000;

// -------------------------------
// 🔗 CONNECT DATABASE
// -------------------------------
await connectDB();

// -------------------------------
// ⚠️ STRIPE WEBHOOK (RAW BODY)
// MUST BE BEFORE express.json()
// -------------------------------
app.use(
  "/api/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhooks
);

// -------------------------------
// 🌍 CORS CONFIG (UPDATED)
// -------------------------------
// 🌍 CORS CONFIG (UPDATED)
const allowedOrigins = [
  "http://localhost:5173",

  // Your active frontend
  "https://movie-ticket-app-radp.vercel.app",

  // Your auto-generated preview deployment
  "https://movie-ticket-app-radp-ivdlfj2w8-mohits-projects-92e7fc3c.vercel.app",

  // (Optional) Old deploys
  "https://movie-ticket-app-jz7m.vercel.app",
  "https://movie-ticket-app-zi7g.vercel.app",

  // Your backend on render
  "https://movie-ticket-app-14.onrender.com"
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        console.log("✔ ALLOWED ORIGIN:", origin);
        return callback(null, true);
      }

      console.log("❌ BLOCKED BY CORS:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);


// -------------------------------
// JSON PARSER (after webhook)
// -------------------------------
app.use(express.json());

// -------------------------------
// 🔐 CLERK AUTH MIDDLEWARE
// -------------------------------
app.use(clerkMiddleware());

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

// -------------------------------
// 🚀 START SERVER
// -------------------------------
app.listen(port, () => {
  console.log(`✅ Server listening at http://localhost:${port}`);
});
