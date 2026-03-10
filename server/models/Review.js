import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
{
  movieId: {
    type: String,
    required: true,
    index: true
  },

  userId: {
    type: String,   // must match User _id
    required: true,
    ref: "User",
    index: true
  },

  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },

  comment: {
    type: String,
    trim: true,
    maxlength: 500
  }

},
{
  timestamps: true
}
)

/* ===========================
PREVENT DUPLICATE REVIEWS
1 USER = 1 REVIEW PER MOVIE
=========================== */

reviewSchema.index(
  { movieId: 1, userId: 1 },
  { unique: true }
)

const Review = mongoose.model("Review", reviewSchema)

export default Review