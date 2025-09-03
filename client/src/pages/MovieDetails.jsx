import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import BlurCircle from '../components/BlurCircle'
import { Heart, PlayCircleIcon, StarIcon } from 'lucide-react'
import timeFormat from '../lib/timeFormat'
import MovieCard from '../components/MovieCard'
import DateSelect from '../components/DateSelect'
import Loading from '../components/Loading'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'

const MovieDetails = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [show, setShow] = useState(null)
  const {
    shows,
    axios,
    getToken,
    user,
    fetchFavoriteMovies,
    favoriteMovies,
    image_base_url,
  } = useAppContext()

  const [recommendations, setRecommendations] = useState([])
  const [loadingRecs, setLoadingRecs] = useState(false)

  const getShow = async () => {
    try {
      const { data } = await axios.get(`/api/show/${id}`)
      if (data.success) {
        setShow(data)
      } else {
        toast.error("Failed to fetch movie details")
      }
    } catch (error) {
      console.error("Error fetching show details:", error)
      toast.error("Error fetching movie details")
    }
  }

  const handleFavorite = async () => {
    try {
      if (!user) {
        toast.error("Please login to proceed")
        return
      }
      const { data } = await axios.post(
        '/api/user/update-favorite',
        { movieId: id },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      )

      if (data.success) {
        await fetchFavoriteMovies()
        toast.success(data.message)
      } else {
        toast.error("Failed to update favorites")
      }
    } catch (error) {
      console.error("Error updating favorites:", error)
      toast.error("An error occurred while updating favorites")
    }
  }

  useEffect(() => {
    if (!id) return

    getShow()

    setLoadingRecs(true)
    fetch("http://127.0.0.1:5000/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ movie_id: Number(id) }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const error = await res.json().catch(() => ({ error: "Unknown error" }))
          throw new Error(error.error || "Failed to fetch recommendations")
        }
        return res.json()
      })
      .then((data) => {
        if (data.recommendations && data.recommendations.length > 0) {
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
        } else {
          toast.error("No AI recommendations found")
          setRecommendations([])
        }
      })
      .catch((err) => {
        console.error("❌ Error fetching recommendations:", err)
        toast.error(err.message || "Failed to load AI recommendations")
        setRecommendations([])
      })
      .finally(() => {
        setLoadingRecs(false)
      })
  }, [id])

  if (!show || !show.movie) {
    return <Loading />
  }

  const movie = show.movie

  return (
    <div className="px-6 md:px-16 lg:px-40 pt-30 md:pt-50">
      {/* Movie details layout */}
      <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto">
        <img
          src={
            movie.poster_path
              ? image_base_url + movie.poster_path
              : '/placeholder.jpg'
          }
          alt={movie.title || "Movie Poster"}
          className="max-md:mx-auto rounded-xl h-104 max-w-70 object-cover"
        />

        <div className="relative flex flex-col gap-3">
          <BlurCircle top="-100px" left="-100px" />
          <p className="text-primary">ENGLISH</p>
          <h1 className="text-4xl font-semibold max-w-96 text-balance">{movie.title}</h1>

          <div className="flex items-center gap-2 text-gray-300">
            <StarIcon className="w-5 h-5 text-primary fill-primary" />
            <span>{movie.vote_average?.toFixed(1) ?? "N/A"}</span>
          </div>

          <p className="text-gray-400 mt-2 text-sm leading-tight max-w-xl">{movie.overview}</p>

          <p>
            {timeFormat(movie.runtime)} •{" "}
            {movie.genres?.map((genre) => genre.name).join(", ")} •{" "}
            {movie.release_date?.split("-")[0]}
          </p>

          <div className="flex items-center flex-wrap gap-4 mt-4">
            <button className="flex items-center gap-2 px-7 py-3 text-sm bg-gray-800 hover:bg-gray-900 transition rounded-md font-medium cursor-pointer active:scale-95">
              <PlayCircleIcon className="w-5 h-5" /> Watch Trailer
            </button>

            <a
              href="#dateSelect"
              className="px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md font-medium cursor-pointer active:scale-95"
            >
              Buy Tickets
            </a>

            <button
              onClick={handleFavorite}
              className="bg-gray-700 p-2.5 rounded-full transition cursor-pointer active:scale-95"
              aria-label="Toggle Favorite"
            >
              <Heart
                className={`w-5 h-5 ${
                  favoriteMovies.find((fav) => fav._id === id)
                    ? "fill-primary text-primary"
                    : ""
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Cast Section */}
      <div className="mt-20">
        <p className="text-lg font-medium">Your Favorite Casts</p>
        <div className="overflow-x-auto no-scrollbar mt-8 pb-4">
          <div className="flex items-center gap-4 w-max px-4">
            {movie.casts?.slice(0, 12).map((cast, index) => (
              <div key={index} className="flex flex-col items-center text-center">
                <img
                  src={
                    cast.profile_path
                      ? image_base_url + cast.profile_path
                      : '/placeholder.jpg'
                  }
                  alt={cast.name}
                  className="rounded-full h-20 md:h-20 aspect-square object-cover"
                />
                <p className="font-medium text-x5 mt-3">{cast.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Date Select */}
        <DateSelect dateTime={show.dateTime} id={id} />

        {/* You May Also Like */}
        <p className="text-lg font-medium mt-20 mb-8">You May Also Like</p>
        <div className="flex flex-wrap max-sm:justify-center gap-8">
          {shows.slice(0, 4).map((movie, index) => (
            <MovieCard key={index} movie={movie} />
          ))}
        </div>

        {/* AI Recommendations */}
        <p className="text-lg font-medium mt-20 mb-8">AI Recommendations</p>
        <div className="flex flex-wrap max-sm:justify-center gap-8">
          {loadingRecs ? (
            <p className="text-gray-400 animate-pulse">⏳ Fetching AI recommendations...</p>
          ) : recommendations.length > 0 ? (
            recommendations.map((movie, index) => (
              <MovieCard key={index} movie={movie} />
            ))
          ) : (
            <p className="text-gray-400">No AI recommendations available</p>
          )}
        </div>

        <div className="flex justify-center mt-20">
          <button
            onClick={() => {
              navigate('/movies')
              scrollTo(0, 0)
            }}
            className="px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md font-medium cursor-pointer"
          >
            Show More
          </button>
        </div>
      </div>
    </div>
  )
}

export default MovieDetails
