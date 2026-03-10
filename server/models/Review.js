import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
{
  movieId: {
    type: String,
    required: true
  },

  userId: {
    type: String,   // ✅ must match User _id type
    required: true,
    ref: "User"
  },

  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },

  comment: {
    type: String
  }

},
{ timestamps: true }
);

const Review = mongoose.model("Review", reviewSchema);

export default Review;