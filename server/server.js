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

const app = express();
const port = process.env.PORT || 3000;

// Connect to database
await connectDB();

// Stripe webhook (MUST be BEFORE express.json)
app.use(
  '/api/stripe',
  express.raw({ type: 'application/json' }),
  stripeWebhooks
);

// -----------------------------
// ✅ CORS Configuration
// -----------------------------

const allowedOrigins = [
  "https://movie-ticket-app-jz7m.vercel.app",   // Your live Vercel frontend URL
  "http://localhost:5173",                       // Vite local environment
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      console.log("❌ Blocked by CORS:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// Parse JSON (after Stripe webhook)
app.use(express.json());

// Clerk authentication middleware
app.use(clerkMiddleware());

// -----------------------------
// API Routes
// -----------------------------

app.get('/', (req, res) => res.send('Server is Live!'));

app.use('/api/inngest', serve({ client: inngest, functions }));
app.use('/api/show', showRouter);
app.use('/api/booking', bookingRouter);
app.use('/api/admin', adminRouter);
app.use('/api/user', userRouter);

// -----------------------------
// Start Server
// -----------------------------

app.listen(port, () =>
  console.log(`✅ Server listening at http://localhost:${port}`)
);
