import express from 'express'
import { addShow, getNowPlayingMovies } from '../controllers/showController.js'
import { protectAdmin } from '../middleware/auth.js';
import { getShows } from '../controllers/showController.js';
import { getShow } from '../controllers/showController.js';
const showRouter = express.Router();
showRouter.get('/now-playing',protectAdmin,getNowPlayingMovies)
showRouter.post('/add',protectAdmin, addShow)
showRouter.get("/all",getShows)
showRouter.get("/:movieId",getShow)

export default showRouter;