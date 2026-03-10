import express from "express";
import { addReview, getReviews } from "../controllers/reviewController.js";
import { protectAdmin } from "../middleware/auth.js";

const router = express.Router();

router.post("/", protectAdmin, addReview);
router.get("/:id", getReviews);

export default router;