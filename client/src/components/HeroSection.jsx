import { ArrowRight, CalendarIcon, ClockIcon, PlayCircleIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import timeFormat from '../lib/timeFormat';
import toast from 'react-hot-toast';
import axios from 'axios';

const HeroSection = ({ onMovieSelect }) => {
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTrailer, setShowTrailer] = useState(false);

  // Fetch now-playing movies using axios (FIXED)
  useEffect(() => {
    const fetchNowPlaying = async () => {
      try {
        const { data } = await axios.get('/api/show/now-playing');

        if (data.success && data.movies?.length > 0) {
          setMovies(data.movies);
          setCurrentIndex(0);
        }
      } catch (error) {
        console.error('Error fetching movies:', error);
        toast.error("Failed to load movies");
      }
    };

    fetchNowPlaying();
  }, []);

  // Auto-rotate every 6 seconds
  useEffect(() => {
    if (movies.length === 0 || showTrailer) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % movies.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [movies, showTrailer]);

  // Notify parent
  useEffect(() => {
    if (movies.length > 0 && onMovieSelect) {
      onMovieSelect(movies[currentIndex]);
    }
  }, [currentIndex, movies, onMovieSelect]);

  if (movies.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  const movie = movies[currentIndex];

  const backdropUrl = movie.backdrop_path
    ? `${import.meta.env.VITE_TMDB_IMAGE_BASE_URL}${movie.backdrop_path}`
    : '/placeholder.jpg';

  const posterUrl = movie.poster_path
    ? `${import.meta.env.VITE_TMDB_IMAGE_BASE_URL}${movie.poster_path}`
    : '/placeholder.jpg';

  const genresText =
    movie.genres?.length > 0
      ? movie.genres.map((g) => g.name).join(' | ')
      : 'Genre unavailable';

  return (
    <div
      className="relative flex flex-col items-start justify-center gap-4 px-6 md:px-16 lg:px-36 bg-cover bg-center h-screen transition-all duration-1000 ease-in-out"
      style={{ backgroundImage: `url(${backdropUrl})` }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60"></div>

      {/* Poster thumbnail */}
      <img
        src={posterUrl}
        alt={movie.title}
        className="absolute bottom-6 right-6 w-28 h-auto rounded-lg shadow-xl border border-white/20 hidden md:block"
      />

      {/* Content */}
      <div className="relative z-10 max-w-3xl">
        <h1 className="text-5xl md:text-[70px] md:leading-[1.1] font-semibold drop-shadow-lg">
          {movie.title}
        </h1>

        <div className="flex items-center gap-4 text-gray-300 mt-2">
          <span>{genresText}</span>
          <div className="flex items-center gap-1">
            <CalendarIcon className="w-4.5 h-4.5" />
            {movie.release_date?.split('-')[0] || 'N/A'}
          </div>
          <div className="flex items-center gap-1">
            <ClockIcon className="w-4.5 h-4.5" />
            {timeFormat(movie.runtime) || 'N/A'}
          </div>
        </div>

        <p className="max-w-md text-gray-300 line-clamp-3 mt-4">{movie.overview}</p>

        <div className="flex items-center gap-4 mt-6">
          <button
            onClick={() => navigate(`/movies/${movie._id || movie.id}`)}
            className="flex items-center gap-2 px-6 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-full font-medium"
          >
            Explore <ArrowRight />
          </button>

          <button
            onClick={() => {
              if (movie.trailerKey) setShowTrailer(true);
              else toast.error('Trailer not available');
            }}
            className="flex items-center gap-2 px-6 py-3 text-sm bg-white/20 hover:bg-white/30 transition rounded-full font-medium text-white"
          >
            <PlayCircleIcon /> Watch Trailer
          </button>
        </div>
      </div>

      {/* Trailer modal */}
      {showTrailer && movie.trailerKey && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="relative w-full max-w-4xl aspect-video">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${movie.trailerKey}?autoplay=1`}
              title={`${movie.title} Trailer`}
              allowFullScreen
              className="w-full h-full rounded-xl shadow-lg"
            />
            <button
              onClick={() => setShowTrailer(false)}
              className="absolute top-2 right-2 bg-black/70 text-white px-3 py-1 rounded-lg hover:bg-black"
            >
              ✕ Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeroSection;
