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

await connectDB();

// ✅ Stripe webhook must come before JSON parser
app.use('/api/stripe', express.raw({ type: 'application/json' }), stripeWebhooks);

// ✅ CORS config
const allowedOrigins = [
  "https://movie-ticket-app-7d2z.vercel.app", // your actual Vercel frontend
  "http://localhost:5173", // local dev
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(clerkMiddleware());

app.get('/', (req, res) => res.send('Server is Live!'));
app.use('/api/inngest', serve({ client: inngest, functions }));
app.use('/api/show', showRouter);
app.use('/api/booking', bookingRouter);
app.use('/api/admin', adminRouter);
app.use('/api/user', userRouter);
app.use("/api/ai", aiRouter);


app.listen(port, () =>
  console.log(`✅ Server listening at http://localhost:${port}`)
);
