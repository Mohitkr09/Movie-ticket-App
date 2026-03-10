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

    // Prevent duplicate review by same user
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
      rating,
      comment,
      userId
    })

    await review.save()

    res.json({
      success: true,
      review
    })

  } catch (error) {

    console.error(error)

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

    const totalReviews = reviews.length

    let totalRating = 0

    const ratingDistribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    }

    // Add user details
    const reviewsWithUser = await Promise.all(

      reviews.map(async (review) => {

        const user = await User.findById(review.userId)

        totalRating += review.rating
        ratingDistribution[review.rating]++

        return {
          ...review._doc,
          userName: user?.name || "Anonymous",
          userImage: user?.image || null
        }

      })

    )

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

    console.error(error)

    res.status(500).json({
      success: false,
      message: error.message
    })

  }

}