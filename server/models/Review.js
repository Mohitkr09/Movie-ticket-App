import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
{
movieId: {
type: String,
required: true
},
userId: {
type: mongoose.Schema.Types.ObjectId,
ref: "User",
required: true
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

export default mongoose.model("Review", reviewSchema);