import express from 'express'
import { addShow, getNowPlayingMovies, getShows, getShow } from '../controllers/showController.js'
import { protectAdmin } from '../middleware/auth.js'
import { getMovieVideos } from '../controllers/showController.js'


const showRouter = express.Router()

// ✅ Make now-playing public so frontend HeroSection can fetch
showRouter.get('/now-playing', getNowPlayingMovies)

// Protected routes for admin
showRouter.post('/add', protectAdmin, addShow)

// Show routes
showRouter.get("/all", getShows)
showRouter.get("/:movieId", getShow)
showRouter.get('/:movieId/videos', getMovieVideos)


export default showRouter
