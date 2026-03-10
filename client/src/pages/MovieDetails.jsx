import React, { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import BlurCircle from "../components/BlurCircle"
import { Heart, PlayCircleIcon, StarIcon, X, Share2, Bell } from "lucide-react"
import timeFormat from "../lib/timeFormat"
import MovieCard from "../components/MovieCard"
import DateSelect from "../components/DateSelect"
import Loading from "../components/Loading"
import { useAppContext } from "../context/AppContext"
import toast from "react-hot-toast"
import { fetchRecommendations } from "../services/aiApis.js"

const MovieDetails = () => {
  const navigate = useNavigate()
  const { id } = useParams()

  const [show, setShow] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [loadingRecs, setLoadingRecs] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isTrailerOpen, setIsTrailerOpen] = useState(false)

  const [reviews, setReviews] = useState([])
  const [reviewText, setReviewText] = useState("")
  const [rating, setRating] = useState(5)

  const {
    axios,
    getToken,
    user,
    fetchFavoriteMovies,
    favoriteMovies,
    image_base_url,
  } = useAppContext()

  /* ---------------- Fetch movie ---------------- */

  const getShow = async (movieId) => {
    try {
      const { data } = await axios.get(`/api/show/${movieId}`)

      if (data.success) {
        setShow(data)
      } else {
        toast.error("Failed to fetch movie details")
      }
    } catch (error) {
      console.error(error)
      toast.error("Error fetching movie")
    }
  }

  /* ---------------- Favorite ---------------- */

  const handleFavorite = async () => {
    if (!user) return toast.error("Please login")

    try {
      setIsFavorite((prev) => !prev)

      const { data } = await axios.post(
        "/api/user/update-favorite",
        { movieId: id },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      )

      if (data.success) {
        await fetchFavoriteMovies()
      } else {
        toast.error("Failed to update favorite")
        setIsFavorite((prev) => !prev)
      }
    } catch (error) {
      toast.error("Error updating favorite")
      setIsFavorite((prev) => !prev)
    }
  }

  /* ---------------- Reviews ---------------- */

  const fetchReviews = async () => {
    try {
      const { data } = await axios.get(`/api/reviews/${id}`)

      if (data.success) {
        setReviews(data.reviews)
      }
    } catch (error) {
      console.log("Review API not available yet")
    }
  }

  const submitReview = async () => {
    if (!user) return toast.error("Please login")

    try {
      const { data } = await axios.post(
        "/api/reviews",
        {
          movieId: id,
          rating,
          comment: reviewText,
        },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      )

      if (data.success) {
        toast.success("Review added")
        setReviewText("")
        fetchReviews()
      }
    } catch (error) {
      toast.error("Failed to submit review")
    }
  }

  /* ---------------- Share Movie ---------------- */

  const shareMovie = async () => {
    try {
      if (!show?.movie) return

      if (navigator.share) {
        await navigator.share({
          title: show.movie.title,
          text: "Check out this movie!",
          url: window.location.href,
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        toast.success("Movie link copied!")
      }
    } catch (error) {
      console.log(error)
    }
  }

  /* ---------------- Reminder ---------------- */

  const setReminder = () => {
    toast.success("Reminder set 🔔")
  }

  /* ---------------- AI Recommendations ---------------- */

  const loadAIRecommendations = async () => {
    setLoadingRecs(true)

    const data = await fetchRecommendations(id)

    if (data?.recommendations?.length > 0) {
      const normalized = data.recommendations.map((rec) => ({
        _id: String(rec.id),
        title: rec.title || "Untitled",
        overview: rec.overview || "",
        backdrop_path: rec.backdrop_path || null,
        poster_path: rec.poster_path || null,
        release_date: rec.release_date || "",
        genres: rec.genres || [],
        runtime: rec.runtime || 0,
        vote_average: rec.vote_average || 0,
      }))

      setRecommendations(normalized)
    }

    setLoadingRecs(false)
  }

  /* ---------------- useEffect ---------------- */

  useEffect(() => {
    if (!id) return

    getShow(id)
    loadAIRecommendations()
    fetchReviews()

    setIsFavorite(favoriteMovies.some((fav) => fav._id === id))
  }, [id, favoriteMovies])

  if (!show || !show.movie) return <Loading />

  const movie = show.movie

  return (
    <div className="px-6 md:px-16 lg:px-40 pt-32 md:pt-50 text-white">

      {/* Movie Layout */}

      <div className="flex flex-col md:flex-row gap-10 max-w-6xl mx-auto">

        {/* Poster */}

        <div className="md:w-1/3 flex justify-center md:justify-start">
          <img
            src={
              movie.poster_path
                ? image_base_url + movie.poster_path
                : "/placeholder.jpg"
            }
            alt={movie.title}
            className="w-64 md:w-full rounded-xl shadow-lg"
          />
        </div>

        {/* Movie Info */}

        <div className="md:w-2/3 flex flex-col gap-4 relative">

          <BlurCircle top="-100px" left="-100px" />

          <p className="text-primary">
            {movie.original_language?.toUpperCase()}
          </p>

          <h1 className="text-4xl font-semibold">{movie.title}</h1>

          <div className="flex items-center gap-4 text-gray-300">
            <StarIcon className="w-5 h-5 text-primary fill-primary" />
            <span>{movie.vote_average?.toFixed(1) ?? "N/A"}</span>
          </div>

          <p className="text-gray-400">{movie.overview}</p>

          <p className="text-gray-300">
            {timeFormat(movie.runtime)} •{" "}
            {movie.genres?.map((g) => g.name).join(", ")} •{" "}
            {movie.release_date?.split("-")[0]}
          </p>

          {/* Buttons */}

          <div className="flex flex-wrap gap-4 mt-4">

            <button
              onClick={() =>
                movie.trailerKey
                  ? setIsTrailerOpen(true)
                  : toast.error("Trailer not available")
              }
              className="flex items-center gap-2 px-6 py-3 bg-gray-800 rounded"
            >
              <PlayCircleIcon className="w-5 h-5" />
              Trailer
            </button>

            {Object.keys(show.dateTime || {}).length > 0 && (
              <a href="#dateSelect" className="px-6 py-3 bg-primary rounded-md">
                Buy Tickets
              </a>
            )}

            <button
              onClick={handleFavorite}
              className="bg-gray-700 p-2 rounded-full"
            >
              <Heart
                className={`w-5 h-5 ${
                  isFavorite ? "fill-primary text-primary" : ""
                }`}
              />
            </button>

            <button
              onClick={shareMovie}
              className="bg-gray-700 p-2 rounded-full"
            >
              <Share2 className="w-5 h-5" />
            </button>

            <button
              onClick={setReminder}
              className="bg-gray-700 p-2 rounded-full"
            >
              <Bell className="w-5 h-5" />
            </button>

          </div>
        </div>
      </div>

      {/* Trailer */}

      {isTrailerOpen && movie.trailerKey && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50">

          <div className="relative w-full max-w-4xl aspect-video">

            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${movie.trailerKey}?autoplay=1`}
              allowFullScreen
              title="Trailer"
            />

            <button
              onClick={() => setIsTrailerOpen(false)}
              className="absolute top-4 right-4 bg-gray-800 p-2 rounded-full"
            >
              <X className="w-5 h-5 text-white" />
            </button>

          </div>
        </div>
      )}

      {/* Date Select */}

      <DateSelect dateTime={show.dateTime} id={id} />

      {/* Reviews */}

      <div className="mt-20 max-w-4xl mx-auto">

        <h2 className="text-xl font-semibold mb-4">User Reviews</h2>

        <textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Write review..."
          className="w-full p-3 bg-gray-800 rounded"
        />

        <button
          onClick={submitReview}
          className="mt-3 px-6 py-2 bg-primary rounded"
        >
          Submit Review
        </button>

        <div className="mt-6 space-y-4">

          {reviews.map((r) => (
            <div key={r._id} className="bg-gray-900 p-4 rounded">

              <p className="text-primary">⭐ {r.rating}/5</p>
              <p className="text-gray-300">{r.comment}</p>

            </div>
          ))}

        </div>
      </div>

      {/* AI Recommendations */}

      <p className="text-lg font-medium mt-20 mb-8">
        Recommended For You
      </p>

      <div className="flex flex-wrap gap-8">

        {loadingRecs ? (
          <p className="text-gray-400">Loading recommendations...</p>
        ) : recommendations.length > 0 ? (
          recommendations.map((rec) => (
            <MovieCard key={rec._id} movie={rec} />
          ))
        ) : (
          <p className="text-gray-400">No recommendations</p>
        )}

      </div>

      {/* Show More */}

      <div className="flex justify-center mt-20 mb-20">
        <button
          onClick={() => {
            navigate("/movies")
            scrollTo(0, 0)
          }}
          className="px-10 py-3 bg-primary rounded"
        >
          Show More
        </button>
      </div>

    </div>
  )
}

export default MovieDetails