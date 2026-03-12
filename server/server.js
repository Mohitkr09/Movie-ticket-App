import express from "express"
import cors from "cors"
import "dotenv/config"
import connectDB from "./configs/db.js"
import { clerkMiddleware } from "@clerk/express"
import { serve } from "inngest/express"
import { inngest, functions } from "./inngest/index.js"
import http from "http"
import { Server } from "socket.io"

/* ROUTES */
import showRouter from "./routes/showRoutes.js"
import bookingRouter from "./routes/BookingRoutes.js"
import adminRouter from "./routes/adminRoutes.js"
import userRouter from "./routes/userRoutes.js"
import aiRouter from "./routes/aiRoutes.js"
import reviewRoutes from "./routes/reviewRoutes.js"

/* CONTROLLERS */
import { stripeWebhooks } from "./controllers/stripeWebhooks.js"

/* SERVICES */
import sendEmail from "./configs/nodeMailer.js"

/* ======================================================
APP INITIALIZATION
====================================================== */

const app = express()
const port = process.env.PORT || 3000

/* ======================================================
CREATE HTTP SERVER (Required for Socket.IO)
====================================================== */

const server = http.createServer(app)

/* ======================================================
SOCKET.IO SETUP
====================================================== */

export const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})

/* ======================================================
SOCKET CONNECTION HANDLER
====================================================== */

io.on("connection", (socket) => {

  console.log("🟢 User connected:", socket.id)

  socket.on("join-show", (showId) => {
    socket.join(showId)
    console.log(`User joined show room: ${showId}`)
  })

  socket.on("lock-seat", ({ showId, seat }) => {
    socket.to(showId).emit("seat-locked", seat)
  })

  socket.on("seat-booked", ({ showId, seat }) => {
    socket.to(showId).emit("seat-booked-update", seat)
  })

  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id)
  })

})

/* ======================================================
CONNECT DATABASE
====================================================== */

await connectDB()

/* ======================================================
STRIPE WEBHOOK (RAW BODY REQUIRED)
====================================================== */

app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhooks
)

/* ======================================================
CORS CONFIGURATION (UPDATED)
====================================================== */

app.use(
  cors({
    origin: (origin, callback) => {

      if (!origin) return callback(null, true)

      /* allow localhost */
      if (origin.includes("localhost")) {
        return callback(null, true)
      }

      /* allow vercel deployments */
      if (origin.includes("vercel.app")) {
        return callback(null, true)
      }

      /* allow render deployments */
      if (origin.includes("onrender.com")) {
        return callback(null, true)
      }

      console.log("⚠️ Blocked by CORS:", origin)

      return callback(null, true) // allow but log

    },
    credentials: true
  })
)

/* ======================================================
BODY PARSER
====================================================== */

app.use(express.json())

/* ======================================================
CLERK AUTHENTICATION
====================================================== */

app.use(clerkMiddleware())

/* ======================================================
HEALTH CHECK
====================================================== */

app.get("/", (req, res) => {
  res.send("🚀 Movie Ticket API Running")
})

/* ======================================================
EMAIL TEST ROUTE
====================================================== */

app.get("/test-email", async (req, res) => {

  try {

    await sendEmail({
      to: "mkr27858@gmail.com",
      subject: "QuickShow Test Email",
      body: "<h1>Email system working successfully!</h1>"
    })

    res.send("✅ EMAIL SENT SUCCESSFULLY")

  } catch (error) {

    console.error("Email Error:", error)

    res.status(500).send("❌ EMAIL FAILED")

  }

})

/* ======================================================
API ROUTES
====================================================== */

app.use("/api/inngest", serve({ client: inngest, functions }))

app.use("/api/show", showRouter)

app.use("/api/booking", bookingRouter)

app.use("/api/admin", adminRouter)

app.use("/api/user", userRouter)

app.use("/api/ai", aiRouter)

app.use("/api/reviews", reviewRoutes)

/* ======================================================
404 ROUTE HANDLER
====================================================== */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found"
  })
})

/* ======================================================
GLOBAL ERROR HANDLER
====================================================== */

app.use((err, req, res, next) => {

  console.error("🔥 Server Error:", err)

  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error"
  })

})

/* ======================================================
START SERVER
====================================================== */

server.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`)
})