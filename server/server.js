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
const allowedOrigins = [
  "https://movie-ticket-app-jz7m.vercel.app",  // Your current Vercel frontend
  "http://localhost:5173",                     // Local dev
  "https://movie-ticket-app-6-eery.onrender.com", // Backend itself (Render)
  "https://movie-ticket-app-zi7g.vercel.app"   // Another possible build of frontend
];

// 🔥 SAFE CORS FUNCTION
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., Postman, backend-to-backend)
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
