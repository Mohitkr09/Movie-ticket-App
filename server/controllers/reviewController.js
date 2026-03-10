import Review from "../models/Review.js"
import User from "../models/User.js"

/* ===========================
ADD REVIEW
=========================== */

export const addReview = async (req, res) => {

  try {

    const { movieId, rating, comment } = req.body
    const userId = req.auth?.userId

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      })
    }

    if (!movieId || !rating) {
      return res.status(400).json({
        success: false,
        message: "MovieId and rating are required"
      })
    }

    // Prevent duplicate review
    const existingReview = await Review.findOne({
      movieId,
      userId
    })

    if (existingReview) {
      return res.json({
        success: false,
        message: "You already reviewed this movie"
      })
    }

    const review = new Review({
      movieId,
      rating: Number(rating),
      comment,
      userId
    })

    await review.save()

    res.json({
      success: true,
      review
    })

  } catch (error) {

    console.error("Add Review Error:", error)

    res.status(500).json({
      success: false,
      message: error.message
    })

  }

}


/* ===========================
GET REVIEWS + STATS
=========================== */

export const getReviews = async (req, res) => {

  try {

    const { id } = req.params

    const reviews = await Review.find({ movieId: id })
      .sort({ createdAt: -1 })
      .lean()

    const totalReviews = reviews.length

    let totalRating = 0

    const ratingDistribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    }

    // Collect all userIds
    const userIds = reviews.map(r => r.userId)

    const users = await User.find({ _id: { $in: userIds } }).lean()

    const userMap = {}

    users.forEach(user => {
      userMap[user._id] = user
    })

    const reviewsWithUser = reviews.map(review => {

      const user = userMap[review.userId]

      totalRating += review.rating
      ratingDistribution[review.rating]++

      return {
        ...review,
        userName: user?.name || "Anonymous",
        userImage: user?.image || null
      }

    })

    const averageRating =
      totalReviews > 0
        ? (totalRating / totalReviews).toFixed(1)
        : 0

    res.json({
      success: true,
      reviews: reviewsWithUser,
      stats: {
        totalReviews,
        averageRating,
        ratingDistribution
      }
    })

  } catch (error) {

    console.error("Get Reviews Error:", error)

    res.status(500).json({
      success: false,
      message: error.message
    })

  }

}