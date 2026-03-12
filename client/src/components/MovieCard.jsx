import { StarIcon, PlayCircle } from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import timeFormat from "../lib/timeFormat";
import { useAppContext } from "../context/AppContext";

const MovieCard = ({ movie }) => {

  const navigate = useNavigate();
  const { image_base_url } = useAppContext();
  const [hovered, setHovered] = useState(false);

  if (!movie) return null;

  const movieId = movie._id || movie.id;

  const handleClick = () => {
    navigate(`/movies/${movieId}`);
    window.scrollTo(0, 0);
  };

  const poster =
    movie.poster_path
      ? image_base_url + movie.poster_path
      : movie.backdrop_path
      ? image_base_url + movie.backdrop_path
      : "/placeholder.jpg";

  return (

    <div
      className={`relative bg-gray-900 rounded-2xl overflow-hidden shadow-lg
      transition-all duration-300 cursor-pointer
      ${hovered ? "scale-105 z-20" : "scale-100"}
      `}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >

      {/* ================= TRAILER / POSTER ================= */}

      <div className="relative">

        {!hovered ? (

          <img
            src={poster}
            alt={movie.title}
            className="w-full h-64 object-cover"
          />

        ) : movie.trailerKey ? (

          <iframe
            className="w-full h-64"
            src={`https://www.youtube.com/embed/${movie.trailerKey}?autoplay=1&mute=1&controls=0`}
            title="Trailer"
            allow="autoplay"
          />

        ) : (

          <img
            src={poster}
            alt={movie.title}
            className="w-full h-64 object-cover"
          />

        )}

        {/* Rating badge */}

        {movie.vote_average && (

          <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/70 px-2 py-1 rounded-md text-xs text-white">

            <StarIcon className="w-3 h-3 text-yellow-400 fill-yellow-400" />

            {movie.vote_average.toFixed(1)}

          </div>

        )}

      </div>

      {/* ================= MOVIE INFO ================= */}

      <div className="p-4">

        <h3 className="text-white font-semibold truncate">
          {movie.title || "Untitled"}
        </h3>

        <p className="text-xs text-gray-400 mt-1">

          {movie.release_date
            ? new Date(movie.release_date).getFullYear()
            : "—"}

          {" • "}

          {movie.genres?.length
            ? movie.genres.slice(0, 2).map((g) => g.name).join(" | ")
            : "No genres"}

          {" • "}

          {movie.runtime ? timeFormat(movie.runtime) : "—"}

        </p>

        {/* ================= ACTION BUTTONS ================= */}

        {hovered && (

          <div className="flex items-center justify-between mt-4">

            <button
              onClick={handleClick}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-primary hover:bg-primary-dull rounded-full transition"
            >

              <PlayCircle className="w-4 h-4" />

              Book Tickets

            </button>

            <p className="flex items-center gap-1 text-sm text-gray-400">

              <StarIcon className="w-4 h-4 text-yellow-400 fill-yellow-400" />

              {movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}

            </p>

          </div>

        )}

      </div>

    </div>

  );

};

export default MovieCard;