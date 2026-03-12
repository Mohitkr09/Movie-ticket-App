import {
  ArrowRight,
  CalendarIcon,
  ClockIcon,
  PlayCircleIcon,
  StarIcon
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import timeFormat from "../lib/timeFormat";
import toast from "react-hot-toast";
import axios from "axios";

const HeroSection = ({ onMovieSelect }) => {

  const navigate = useNavigate();

  const [movies, setMovies] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTrailer, setShowTrailer] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  /* ================= FETCH MOVIES ================= */

  useEffect(() => {

    const fetchNowPlaying = async () => {

      try {

        const { data } = await axios.get("/api/show/now-playing");

        if (data.success && data.movies?.length > 0) {

          setMovies(data.movies);

          setCurrentIndex(0);

        }

      } catch (error) {

        console.error("Error fetching movies:", error);

        toast.error("Failed to load movies");

      }

    };

    fetchNowPlaying();

  }, []);

  /* ================= AUTO SLIDER ================= */

  useEffect(() => {

    if (movies.length === 0 || showTrailer || isHovering) return;

    const interval = setInterval(() => {

      setCurrentIndex((prev) => (prev + 1) % movies.length);

    }, 6000);

    return () => clearInterval(interval);

  }, [movies, showTrailer, isHovering]);

  /* ================= NOTIFY PARENT ================= */

  useEffect(() => {

    if (movies.length > 0 && onMovieSelect) {

      onMovieSelect(movies[currentIndex]);

    }

  }, [currentIndex, movies, onMovieSelect]);

  if (movies.length === 0) {

    return (

      <div className="flex items-center justify-center h-screen">

        <p className="text-gray-400">Loading movies...</p>

      </div>

    );

  }

  const movie = movies[currentIndex];

  const backdropUrl = movie.backdrop_path
    ? `${import.meta.env.VITE_TMDB_IMAGE_BASE_URL}${movie.backdrop_path}`
    : "/placeholder.jpg";

  const posterUrl = movie.poster_path
    ? `${import.meta.env.VITE_TMDB_IMAGE_BASE_URL}${movie.poster_path}`
    : "/placeholder.jpg";

  const genresText =
    movie.genres?.length > 0
      ? movie.genres.map((g) => g.name).join(" | ")
      : "Genre unavailable";

  return (

    <div
      className="relative flex flex-col items-start justify-center gap-4 px-6 md:px-16 lg:px-36 bg-cover bg-center h-screen transition-all duration-1000"
      style={{ backgroundImage: `url(${backdropUrl})` }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >

      {/* ================= BACKDROP OVERLAY ================= */}

      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent"></div>

      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>

      {/* ================= POSTER PREVIEW ================= */}

      <img
        src={posterUrl}
        alt={movie.title}
        className="absolute bottom-6 right-6 w-32 rounded-xl shadow-2xl border border-white/10 hidden md:block"
      />

      {/* ================= CONTENT ================= */}

      <div className="relative z-10 max-w-3xl">

        <h1 className="text-4xl md:text-[70px] font-semibold leading-tight drop-shadow-xl">

          {movie.title}

        </h1>

        {/* META INFO */}

        <div className="flex flex-wrap items-center gap-4 text-gray-300 mt-3">

          <span>{genresText}</span>

          <div className="flex items-center gap-1">

            <CalendarIcon className="w-4 h-4" />

            {movie.release_date?.split("-")[0] || "N/A"}

          </div>

          <div className="flex items-center gap-1">

            <ClockIcon className="w-4 h-4" />

            {movie.runtime ? timeFormat(movie.runtime) : "N/A"}

          </div>

          {movie.vote_average && (

            <div className="flex items-center gap-1">

              <StarIcon className="w-4 h-4 text-yellow-400 fill-yellow-400" />

              {movie.vote_average.toFixed(1)}

            </div>

          )}

        </div>

        {/* OVERVIEW */}

        <p className="max-w-lg text-gray-300 line-clamp-3 mt-4">

          {movie.overview}

        </p>

        {/* ACTION BUTTONS */}

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

              else toast.error("Trailer not available");

            }}
            className="flex items-center gap-2 px-6 py-3 text-sm bg-white/20 hover:bg-white/30 backdrop-blur rounded-full font-medium text-white"
          >

            <PlayCircleIcon />

            Watch Trailer

          </button>

        </div>

      </div>

      {/* ================= SLIDER INDICATORS ================= */}

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">

        {movies.map((_, i) => (

          <div
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`h-2 rounded-full cursor-pointer transition-all duration-300
            ${i === currentIndex ? "w-8 bg-primary" : "w-2 bg-white/40"}
            `}
          ></div>

        ))}

      </div>

      {/* ================= TRAILER MODAL ================= */}

      {showTrailer && movie.trailerKey && (

        <div className="fixed inset-0 bg-black/90 backdrop-blur flex items-center justify-center z-50">

          <div className="relative w-full max-w-4xl aspect-video">

            <iframe
              src={`https://www.youtube-nocookie.com/embed/${movie.trailerKey}?autoplay=1`}
              title={`${movie.title} Trailer`}
              allowFullScreen
              className="w-full h-full rounded-xl shadow-lg"
            />

            <button
              onClick={() => setShowTrailer(false)}
              className="absolute top-3 right-3 bg-black/70 text-white px-3 py-1 rounded-lg hover:bg-black"
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