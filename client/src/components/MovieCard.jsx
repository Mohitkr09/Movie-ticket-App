import { StarIcon } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import timeFormat from '../lib/timeFormat';
import { useAppContext } from '../context/AppContext';

const MovieCard = ({ movie }) => {
  const navigate = useNavigate();
  const { image_base_url } = useAppContext();

  // If movie is missing, don't render anything
  if (!movie) return null;

  const handleClick = () => {
    navigate(`/movies/${movie._id}`);
    scrollTo(0, 0);
  };

  return (
    <div className="flex flex-col justify-between p-3 bg-gray-800 rounded-2xl
      hover:-translate-y-1 transition duration-300 w-66">
      
      <img
        onClick={handleClick}
        src={
          movie.backdrop_path
            ? image_base_url + movie.backdrop_path
            : '/placeholder.jpg' // fallback image
        }
        alt={movie.title || 'Untitled'}
        className="rounded-lg h-52 w-full object-cover object-right-bottom cursor-pointer"
      />

      <p className="font-semibold mt-2 truncate">
        {movie.title || 'Untitled'}
      </p>

      <p className="text-sm text-gray-400 mt-2">
        {movie.release_date ? new Date(movie.release_date).getFullYear() : '—'} .
        {(movie.genres?.length > 0
          ? movie.genres.slice(0, 2).map((genre) => genre.name).join(' | ')
          : 'No genres')}
        . {movie.runtime ? timeFormat(movie.runtime) : '—'}
      </p>

      <div className="flex items-center justify-between mt-4 pb-3">
        <button
          onClick={handleClick}
          className="px-4 py-2 text-xs bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer"
        >
          Buy Tickets
        </button>

        <p className="flex items-center gap-1 text-sm text-gray-400 mt-1 pr-1">
          <StarIcon className="w-4 h-4 text-primary fill-primary" />
          {movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}
        </p>
      </div>
    </div>
  );
};

export default MovieCard;

