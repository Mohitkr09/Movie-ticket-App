import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import BlurCircle from '../components/BlurCircle'
import { Heart, PlayCircleIcon, StarIcon, X } from 'lucide-react'
import timeFormat from '../lib/timeFormat'
import MovieCard from '../components/MovieCard'
import DateSelect from '../components/DateSelect'
import Loading from '../components/Loading'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'
import { fetchRecommendations } from '../services/aiApis.js'

const MovieDetails = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [show, setShow] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [loadingRecs, setLoadingRecs] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isTrailerOpen, setIsTrailerOpen] = useState(false)

  const { axios, getToken, user, fetchFavoriteMovies, favoriteMovies, image_base_url } =
    useAppContext()

  // ---------------- Fetch movie details ----------------
  const getShow = async (movieId) => {
    try {
      const { data } = await axios.get(`/api/show/${movieId}`)
      if (data.success) setShow(data)
      else toast.error('Failed to fetch movie details')
    } catch (error) {
      console.error('Error fetching show details:', error)
      toast.error('Error fetching movie details')
    }
  }

  // ---------------- Favorite toggle ----------------
  const handleFavorite = async () => {
    if (!user) return toast.error('Please login to proceed')
    try {
      setIsFavorite((prev) => !prev)
      const { data } = await axios.post(
        '/api/user/update-favorite',
        { movieId: id },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      )
      if (data.success) await fetchFavoriteMovies()
      else {
        toast.error('Failed to update favorites')
        setIsFavorite((prev) => !prev)
      }
    } catch (error) {
      console.error('Error updating favorites:', error)
      toast.error('An error occurred while updating favorites')
      setIsFavorite((prev) => !prev)
    }
  }

  // ---------------- Load AI Recommendations ----------------
  const loadAIRecommendations = async () => {
    setLoadingRecs(true)
    const data = await fetchRecommendations(id)
    if (data?.recommendations?.length > 0) {
      const normalized = data.recommendations.map((rec) => ({
        _id: String(rec.id),
        title: rec.title || 'Untitled',
        overview: rec.overview || '',
        backdrop_path: rec.backdrop_path || null,
        poster_path: rec.poster_path || null,
        release_date: rec.release_date || '',
        genres: rec.genres || [],
        runtime: rec.runtime || 0,
        vote_average: rec.vote_average || 0,
      }))
      setRecommendations(normalized)
    } else {
      setRecommendations([])
      toast.error('No AI recommendations found')
    }
    setLoadingRecs(false)
  }

  useEffect(() => {
    if (!id) return
    getShow(id)
    loadAIRecommendations()
    setIsFavorite(favoriteMovies.some((fav) => fav._id === id))
  }, [id, favoriteMovies])

  if (!show || !show.movie) return <Loading />

  const movie = show.movie

  return (
    <div className="px-6 md:px-16 lg:px-40 pt-32 md:pt-50 text-white">
      {/* ---------------- Movie Details Layout ---------------- */}
      <div className="flex flex-col md:flex-row gap-10 max-w-6xl mx-auto">
        {/* Left: Poster */}
        <div className="md:w-1/3 flex justify-center md:justify-start">
          <img
            src={movie.poster_path ? image_base_url + movie.poster_path : '/placeholder.jpg'}
            alt={movie.title}
            className="w-64 md:w-full rounded-xl shadow-lg"
          />
        </div>

        {/* Right: Movie Info */}
        <div className="md:w-2/3 flex flex-col gap-4 relative">
          <BlurCircle top="-100px" left="-100px" />

          <p className="text-primary">{movie.original_language.toUpperCase()}</p>
          <h1 className="text-4xl font-semibold">{movie.title}</h1>

          <div className="flex items-center gap-4 text-gray-300 flex-wrap">
            <StarIcon className="w-5 h-5 text-primary fill-primary" />
            <span>{movie.vote_average?.toFixed(1) ?? 'N/A'}</span>
          </div>

          <p className="text-gray-400 mt-2 text-sm leading-tight max-w-xl">{movie.overview}</p>

          <p className="text-gray-300 mt-2">
            {timeFormat(movie.runtime)} •{' '}
            {movie.genres?.map((genre) => genre.name).join(', ') || 'No genres'} •{' '}
            {movie.release_date?.split('-')[0]}
          </p>

          {/* ---------------- Cast Images ---------------- */}
          {movie.casts?.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-2">Cast</h2>
              <div className="flex gap-4 overflow-x-auto py-2">
                {movie.casts.slice(0, 10).map((cast) => (
                  <div key={cast.id} className="flex flex-col items-center w-20 flex-shrink-0">
                    <img
                      src={
                        cast.profile_path
                          ? image_base_url + cast.profile_path
                          : '/placeholder.jpg'
                      }
                      alt={cast.name}
                      className="w-20 h-28 object-cover rounded-lg"
                    />
                    <p className="text-sm mt-1 text-center">{cast.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ---------------- Buttons ---------------- */}
          <div className="flex items-center flex-wrap gap-4 mt-4">
            <button
              onClick={() => {
                if (movie.trailerKey) setIsTrailerOpen(true)
                else toast.error('Trailer not available')
              }}
              className="flex items-center gap-2 px-7 py-3 text-sm bg-gray-800 hover:bg-gray-900 transition rounded-md font-medium"
            >
              <PlayCircleIcon className="w-5 h-5" /> Watch Trailer
            </button>

            {Object.keys(show.dateTime || {}).length > 0 && (
              <a
                href="#dateSelect"
                className="px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md font-medium"
              >
                Buy Tickets
              </a>
            )}

            <button
              onClick={handleFavorite}
              className="bg-gray-700 p-2.5 rounded-full transition cursor-pointer"
              aria-label="Toggle Favorite"
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-primary text-primary' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ---------------- Trailer Modal ---------------- */}
      {isTrailerOpen && movie.trailerKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
          <div className="relative w-full max-w-4xl aspect-video rounded-xl overflow-hidden">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${movie.trailerKey}?autoplay=1`}
              title="Trailer"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <button
              onClick={() => setIsTrailerOpen(false)}
              className="absolute top-4 right-4 text-white bg-gray-800 p-2 rounded-full hover:bg-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* ---------------- Date Select ---------------- */}
      <DateSelect dateTime={show.dateTime} id={id} />

      {/* ---------------- AI Recommendations ---------------- */}
      <p className="text-lg font-medium mt-20 mb-8">AI Recommendations</p>
      <div className="flex flex-wrap max-sm:justify-center gap-8">
        {loadingRecs ? (
          <p className="text-gray-400 animate-pulse">⏳ Fetching AI recommendations...</p>
        ) : recommendations.length > 0 ? (
          recommendations.map((rec) => <MovieCard key={rec._id} movie={rec} />)
        ) : (
          <p className="text-gray-400">No AI recommendations available</p>
        )}
      </div>

      {/* ---------------- Show More Button ---------------- */}
      <div className="flex justify-center mt-20 mb-20">
        <button
          onClick={() => {
            navigate('/movies')
            scrollTo(0, 0)
          }}
          className="px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md font-medium"
        >
          Show More
        </button>
      </div>
    </div>
  )
}

export default MovieDetails
