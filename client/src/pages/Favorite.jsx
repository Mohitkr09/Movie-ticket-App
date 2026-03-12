import React from "react";
import MovieCard from "../components/MovieCard";
import BlurCircle from "../components/BlurCircle";
import { Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

const Favorite = () => {

  const { favoriteMovies } = useAppContext();
  const navigate = useNavigate();

  return favoriteMovies.length > 0 ? (

    <section className="relative px-6 md:px-16 lg:px-28 xl:px-40 py-28 min-h-[80vh] overflow-hidden">

      {/* Background Blur Effects */}

      <BlurCircle top="150px" left="0px" />
      <BlurCircle bottom="50px" right="50px" />

      {/* Header */}

      <div className="flex items-center gap-3 mb-10">

        <Heart className="text-primary w-6 h-6 fill-primary" />

        <h1 className="text-2xl md:text-3xl font-semibold text-white">
          Your Favorite Movies
        </h1>

      </div>

      {/* Movie Grid */}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">

        {favoriteMovies.map((movie) => (

          <MovieCard
            movie={movie}
            key={movie._id}
          />

        ))}

      </div>

    </section>

  ) : (

    /* ================= EMPTY STATE ================= */

    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-6">

      <Heart className="w-16 h-16 text-gray-600 mb-6" />

      <h2 className="text-2xl font-semibold text-white mb-2">
        No Favorite Movies Yet
      </h2>

      <p className="text-gray-400 max-w-md mb-6">
        Start exploring movies and add them to your favorites so you
        can easily find them later.
      </p>

      <button
        onClick={() => navigate("/movies")}
        className="px-6 py-3 bg-primary hover:bg-primary-dull rounded-full text-sm font-medium transition"
      >
        Browse Movies
      </button>

    </div>

  );
};

export default Favorite;