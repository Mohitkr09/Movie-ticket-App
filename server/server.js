import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./configs/db.js";
import { clerkMiddleware } from "@clerk/express";
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js";
import http from "http";
import { Server } from "socket.io";

import showRouter from "./routes/showRoutes.js";
import bookingRouter from "./routes/BookingRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import userRouter from "./routes/userRoutes.js";
import aiRouter from "./routes/aiRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";

import { stripeWebhooks } from "./controllers/stripeWebhooks.js";
import sendEmail from "./configs/nodeMailer.js";


/* ======================================================
APP SETUP
====================================================== */

const app = express();
const port = process.env.PORT || 3000;


/* ======================================================
CREATE HTTP SERVER (for socket support)
====================================================== */

const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: "*",
    credentials: true
  }
});


/* ======================================================
SOCKET CONNECTION
====================================================== */

io.on("connection", (socket) => {

  console.log("🟢 Socket connected:", socket.id);

  socket.on("join-movie", (movieId) => {
    socket.join(movieId);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Socket disconnected:", socket.id);
  });

});


/* ======================================================
CONNECT DATABASE
====================================================== */

await connectDB();


/* ======================================================
STRIPE WEBHOOK (RAW BODY)
====================================================== */

app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhooks
);


/* ======================================================
CORS CONFIG
====================================================== */

const allowedOrigins = [
  "http://localhost:5173",
  "https://movie-ticket-app-radp.vercel.app",
  "https://movie-ticket-app-radp-ivdlfj2w8-mohits-projects-92e7fc3c.vercel.app",
  "https://movie-ticket-app-jz7m.vercel.app",
  "https://movie-ticket-app-zi7g.vercel.app",
  "https://movie-ticket-app-14.onrender.com"
];

app.use(
  cors({
    origin: (origin, callback) => {

      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);


/* ======================================================
JSON PARSER
====================================================== */

app.use(express.json());


/* ======================================================
CLERK AUTH
====================================================== */

app.use(clerkMiddleware());


/* ======================================================
HEALTH CHECK
====================================================== */

app.get("/", (req, res) => {
  res.send("🚀 Movie Ticket Server Running");
});


/* ======================================================
TEST EMAIL ROUTE
====================================================== */

app.get("/test-email", async (req, res) => {

  try {

    await sendEmail({
      to: "mkr27858@gmail.com",
      subject: "QuickShow Test Email",
      body: "<h1>Test email success!</h1>"
    });

    res.send("EMAIL SENT ✔");

  } catch (error) {

    console.error("Email Error:", error);

    res.status(500).send("FAILED ❌");

  }

});


/* ======================================================
API ROUTES
====================================================== */

app.use("/api/inngest", serve({ client: inngest, functions }));

app.use("/api/show", showRouter);

app.use("/api/booking", bookingRouter);

app.use("/api/admin", adminRouter);

app.use("/api/user", userRouter);

app.use("/api/ai", aiRouter);

app.use("/api/reviews", reviewRoutes);


/* ======================================================
404 HANDLER
====================================================== */

app.use((req, res) => {

  res.status(404).json({
    success: false,
    message: "API route not found"
  });

});


/* ======================================================
GLOBAL ERROR HANDLER
====================================================== */

app.use((err, req, res, next) => {

  console.error("Server Error:", err);

  res.status(500).json({
    success: false,
    message: "Internal Server Error"
  });

});


/* ======================================================
START SERVER
====================================================== */

server.listen(port, () => {

  console.log(`✅ Server running on http://localhost:${port}`);

});