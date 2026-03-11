import Review from "../models/Review.js"
import { clerkClient } from "@clerk/express"

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

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5"
      })
    }

    // prevent duplicate review
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

    const review = await Review.create({
      movieId,
      rating: Number(rating),
      comment,
      userId
    })

    res.json({
      success: true,
      message: "Review added successfully",
      review
    })

  } catch (error) {

    console.error("Add Review Error:", error)

    res.status(500).json({
      success: false,
      message: "Failed to add review"
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

    /* ===========================
    GET USER DETAILS FROM CLERK
    =========================== */

    const reviewsWithUser = await Promise.all(

      reviews.map(async (review) => {

        const user = await clerkClient.users.getUser(review.userId)

        totalRating += review.rating

        if (ratingDistribution[review.rating] !== undefined) {
          ratingDistribution[review.rating]++
        }

        return {
          ...review,
          userName:
            `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
            "Anonymous",
          userImage: user?.imageUrl || null
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

    console.error("Get Reviews Error:", error)

    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews"
    })

  }

}