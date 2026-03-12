import React from "react";
import MovieCard from "../components/MovieCard";
import BlurCircle from "../components/BlurCircle";
import { Film } from "lucide-react";
import { useAppContext } from "../context/AppContext";

const Movies = () => {

  const { shows } = useAppContext();

  const validShows = (shows || []).filter(show => show && show._id);

  return validShows.length > 0 ? (

    <section className="relative px-6 md:px-16 lg:px-28 xl:px-40 py-28 min-h-[80vh] overflow-hidden">

      {/* Background Effects */}

      <BlurCircle top="150px" left="0px" />
      <BlurCircle bottom="50px" right="50px" />

      {/* Header */}

      <div className="mb-12">

        <h1 className="text-3xl md:text-4xl font-semibold text-white">
          Now Showing
        </h1>

        <p className="text-gray-400 mt-2 text-sm md:text-base">
          Discover the latest movies currently playing in theaters.
        </p>

      </div>

      {/* Movie Grid */}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">

        {validShows.map(movie => (

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

      <Film className="w-16 h-16 text-gray-600 mb-6" />

      <h2 className="text-2xl font-semibold text-white mb-2">
        No Movies Available
      </h2>

      <p className="text-gray-400 max-w-md">
        There are currently no movies showing. Please check back later
        for the latest releases.
      </p>

    </div>

  );

};

export default Movies;