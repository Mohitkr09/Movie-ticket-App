import Review from "../models/Review.js";

export const addReview = async (req, res) => {
try {

const { movieId, rating, comment } = req.body;

const review = new Review({
movieId,
rating,
comment,
userId: req.user._id
});

await review.save();

res.json({
success: true,
review
});

} catch (error) {
res.status(500).json({
success: false,
message: error.message
});
}
};

export const getReviews = async (req, res) => {
try {

const { id } = req.params;

const reviews = await Review.find({ movieId: id })
.populate("userId", "name");

res.json({
success: true,
reviews
});

} catch (error) {
res.status(500).json({
success: false,
message: error.message
});
}
};