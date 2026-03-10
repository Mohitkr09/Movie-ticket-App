import Review from "../models/Review.js"

export const addReview = async (req, res) => {
  try {

    const { movieId, rating, comment } = req.body

    const userId = req.auth?.userId   // Clerk user

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
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


export const getReviews = async (req, res) => {

  try {

    const { id } = req.params

    const reviews = await Review.find({ movieId: id })

    res.json({
      success: true,
      reviews
    })

  } catch (error) {

    console.error(error)

    res.status(500).json({
      success: false,
      message: error.message
    })

  }

}