import axios from 'axios'
import Movie from '../models/Movie.js'
import Show from '../models/Show.js'
import { inngest } from '../inngest/index.js'

/**
 * Fetch "Now Playing" movies from TMDB + attach trailers + genres
 */
export const getNowPlayingMovies = async (req, res) => {
  try {
    const { data } = await axios.get(
      'https://api.themoviedb.org/3/movie/now_playing',
      {
        headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
      }
    )

    const movies = await Promise.all(
      (data.results || []).map(async (movie) => {
        try {
          const [detailsRes, videosRes] = await Promise.all([
            axios.get(`https://api.themoviedb.org/3/movie/${movie.id}`, {
              headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
            }),
            axios.get(`https://api.themoviedb.org/3/movie/${movie.id}/videos`, {
              headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
            }),
          ])

          const trailer = (videosRes.data.results || []).find(
            (vid) => vid.site === 'YouTube' && vid.type === 'Trailer'
          )
          const trailerKey = trailer ? trailer.key : null
          const runtime = detailsRes.data.runtime || null
          const genres = detailsRes.data.genres || []

          return {
            ...movie,
            runtime,
            trailerKey,
            genres,
          }
        } catch (err) {
          console.error(`Details/trailer fetch failed for movie ${movie.id}`, err.message)
          return { ...movie, runtime: null, trailerKey: null, genres: [] }
        }
      })
    )

    res.json({ success: true, movies })
  } catch (error) {
    console.error(error.message)
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
      return res.status(400).json({ success: false, message: 'movieId (TMDB ID) is required' })
    }

    let movie = await Movie.findById(movieId)

    if (!movie) {
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

      const casts = (movieCreditsData.cast || [])
        .slice(0, 10)
        .map((c) => ({
          id: c.id,
          name: c.name,
          character: c.character,
          profile_path: c.profile_path,
        }))

      const movieDetails = {
        _id: movieId,
        title: movieApiData.title || 'Untitled',
        overview: movieApiData.overview || '',
        poster_path: movieApiData.poster_path || '',
        backdrop_path: movieApiData.backdrop_path || '',
        genres: movieApiData.genres || [],
        casts,
        release_date: movieApiData.release_date || null,
        original_language: movieApiData.original_language || 'N/A',
        tagline: movieApiData.tagline || '',
        vote_average: movieApiData.vote_average || 0,
        runtime: movieApiData.runtime || null,
      }

      movie = await Movie.create(movieDetails)
    }

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
    console.error(error.message)
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
      if (show.movie && !uniqueMovies[show.movie._id]) {
        uniqueMovies[show.movie._id] = show.movie
      }
    })

    res.json({ success: true, shows: Object.values(uniqueMovies) })
  } catch (error) {
    console.error(error.message)
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * Get single movie with available shows + trailer
 */
export const getShow = async (req, res) => {
  try {
    const { movieId } = req.params

    let movie = await Movie.findById(movieId)

    if (!movie) {
      try {
        const [movieRes, creditsRes] = await Promise.all([
          axios.get(`https://api.themoviedb.org/3/movie/${movieId}`, {
            headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
          }),
          axios.get(`https://api.themoviedb.org/3/movie/${movieId}/credits`, {
            headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
          }),
        ])

        const movieData = movieRes.data
        const creditsData = creditsRes.data

        const casts = (creditsData.cast || [])
          .slice(0, 10)
          .map((c) => ({
            id: c.id,
            name: c.name,
            character: c.character,
            profile_path: c.profile_path,
          }))

        movie = await Movie.create({
          _id: movieData.id,
          title: movieData.title || 'Untitled',
          overview: movieData.overview || '',
          poster_path: movieData.poster_path || '',
          backdrop_path: movieData.backdrop_path || '',
          genres: movieData.genres || [],
          casts,
          release_date: movieData.release_date || null,
          original_language: movieData.original_language || 'N/A',
          tagline: movieData.tagline || '',
          vote_average: movieData.vote_average || 0,
          runtime: movieData.runtime || null,
        })
      } catch (err) {
        console.error(`Failed to fetch movie ${movieId} from TMDB:`, err.message)
        return res.status(404).json({ success: false, message: 'Movie not found' })
      }
    }

    const shows = await Show.find({
      movie: movieId,
      showDateTime: { $gte: new Date() },
    })

    let trailerKey = null
    try {
      const { data: videos } = await axios.get(
        `https://api.themoviedb.org/3/movie/${movieId}/videos`,
        { headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` } }
      )
      const trailer = (videos.results || []).find(
        (vid) => vid.site === 'YouTube' && vid.type === 'Trailer'
      )
      trailerKey = trailer ? trailer.key : null
    } catch (err) {
      console.error(`Trailer fetch failed for movie ${movieId}:`, err.message)
    }

    const dateTime = {}
    shows.forEach((show) => {
      const date = show.showDateTime.toISOString().split('T')[0]
      if (!dateTime[date]) dateTime[date] = []
      dateTime[date].push({ time: show.showDateTime, showId: show._id })
    })

    res.json({
      success: true,
      movie: { ...movie.toObject(), trailerKey },
      dateTime,
    })
  } catch (error) {
    console.error(error.message)
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
        name: vid.name || 'Untitled',
        videoUrl: `https://www.youtube.com/watch?v=${vid.key}`,
      }))

    res.json({ success: true, trailers })
  } catch (error) {
    console.error(error.message)
    res.status(500).json({ success: false, message: error.message })
  }
}
