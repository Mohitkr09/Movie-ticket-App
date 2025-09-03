import axios from 'axios'
import Movie from '../models/Movie.js'
import Show from '../models/Show.js'
import { inngest } from '../inngest/index.js'

/**
 * Fetch "Now Playing" movies from TMDB + attach trailers
 */
export const getNowPlayingMovies = async (req, res) => {
  try {
    // Fetch now playing movies
    const { data } = await axios.get(
      'https://api.themoviedb.org/3/movie/now_playing',
      {
        headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
      }
    )

    const movies = await Promise.all(
      (data.results || []).map(async (movie) => {
        try {
          // Fetch details + videos in parallel
          const [detailsRes, videosRes] = await Promise.all([
            axios.get(`https://api.themoviedb.org/3/movie/${movie.id}`, {
              headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
            }),
            axios.get(`https://api.themoviedb.org/3/movie/${movie.id}/videos`, {
              headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
            }),
          ])

          // ✅ Trailer
          const trailer = (videosRes.data.results || []).find(
            (vid) => vid.site === 'YouTube' && vid.type === 'Trailer'
          )
          const trailerKey = trailer ? trailer.key : null

          // ✅ Runtime
          const runtime = detailsRes.data.runtime

          console.log(
            `Movie: ${movie.title}, Runtime: ${runtime}, TrailerKey: ${trailerKey}`
          )

          return {
            ...movie,
            runtime,
            trailerKey,
          }
        } catch (err) {
          console.error(`Details/trailer fetch failed for movie ${movie.id}`, err.message)
          return { ...movie, runtime: null, trailerKey: null }
        }
      })
    )

    res.json({ success: true, movies })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: error.message })
  }
}
/**
 * Add movie + create show timings
 */
export const addShow = async (req, res) => {
  try {
    const { movieId, showsInput, showPrice } = req.body

    if (!movieId) {
      return res
        .status(400)
        .json({ success: false, message: 'movieId (TMDB ID) is required' })
    }

    let movie = await Movie.findById(movieId)

    if (!movie) {
      // Fetch both details + credits in parallel
      const [movieDetailsResponse, movieCreditsResponse] = await Promise.all([
        axios.get(`https://api.themoviedb.org/3/movie/${movieId}`, {
          headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
        }),
        axios.get(`https://api.themoviedb.org/3/movie/${movieId}/credits`, {
          headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
        }),
      ])

      const movieApiData = movieDetailsResponse.data
      const movieCreditsData = movieCreditsResponse.data

      const movieDetails = {
        _id: movieId, // store TMDB movieId as _id
        title: movieApiData.title,
        overview: movieApiData.overview,
        poster_path: movieApiData.poster_path,
        backdrop_path: movieApiData.backdrop_path,
        genres: movieApiData.genres,
        casts: movieCreditsData.cast,
        release_date: movieApiData.release_date,
        original_language: movieApiData.original_language,
        tagline: movieApiData.tagline || '',
        vote_average: movieApiData.vote_average,
        runtime: movieApiData.runtime,
      }

      movie = await Movie.create(movieDetails)
    }

    // Build show objects
    const showsToCreate = []
    showsInput.forEach((show) => {
      const showDate = show.date
      show.time.forEach((time) => {
        const dateTimeString = `${showDate}T${time}`
        showsToCreate.push({
          movie: movieId,
          showDateTime: new Date(dateTimeString),
          showPrice,
          occupiedSeats: {},
        })
      })
    })

    if (showsToCreate.length > 0) {
      await Show.insertMany(showsToCreate)
    }

    await inngest.send({
      name: 'app/show.added',
      data: { movieTitle: movie.title },
    })

    res.json({ success: true, message: 'Show(s) added successfully.' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * Get upcoming shows with populated movie details
 */
export const getShows = async (req, res) => {
  try {
    const shows = await Show.find({ showDateTime: { $gte: new Date() } })
      .populate('movie')
      .sort({ showDateTime: 1 })

    const uniqueMovies = {}
    shows.forEach((show) => {
      if (!uniqueMovies[show.movie._id]) {
        uniqueMovies[show.movie._id] = show.movie
      }
    })

    res.json({ success: true, shows: Object.values(uniqueMovies) })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * Get single movie with available shows + trailer
 */
export const getShow = async (req, res) => {
  try {
    const { movieId } = req.params
    const shows = await Show.find({
      movie: movieId,
      showDateTime: { $gte: new Date() },
    })
    const movie = await Movie.findById(movieId)

    // Fetch trailer for the movie
    let trailerKey = null
    try {
      const { data: videos } = await axios.get(
        `https://api.themoviedb.org/3/movie/${movieId}/videos`,
        {
          headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
        }
      )

      const trailer = (videos.results || []).find(
        (vid) => vid.site === 'YouTube' && vid.type === 'Trailer'
      )

      trailerKey = trailer ? trailer.key : null
      console.log(`Single Movie: ${movie.title}, TrailerKey: ${trailerKey}`)
    } catch (err) {
      console.error(`Trailer fetch failed for movie ${movieId}`, err)
    }

    const dateTime = {}
    shows.forEach((show) => {
      const date = show.showDateTime.toISOString().split('T')[0]
      if (!dateTime[date]) {
        dateTime[date] = []
      }
      dateTime[date].push({ time: show.showDateTime, showId: show._id })
    })

    res.json({
      success: true,
      movie: { ...movie.toObject(), trailerKey },
      dateTime,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * Fetch trailers (YouTube) for a given movie
 */
export const getMovieVideos = async (req, res) => {
  try {
    const { movieId } = req.params

    const { data } = await axios.get(
      `https://api.themoviedb.org/3/movie/${movieId}/videos`,
      {
        headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
      }
    )

    const trailers = (data.results || [])
      .filter((vid) => vid.site === 'YouTube' && vid.type === 'Trailer')
      .map((vid) => ({
        id: vid.id,
        key: vid.key,
        name: vid.name,
        videoUrl: `https://www.youtube.com/watch?v=${vid.key}`,
      }))

    res.json({ success: true, trailers })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: error.message })
  }
}


