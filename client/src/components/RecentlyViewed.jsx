import React, { useEffect, useState } from "react";
import MovieCard from "./MovieCard";

const RecentlyViewed = () => {

  const [movies, setMovies] = useState([]);

  useEffect(() => {

    const stored = JSON.parse(localStorage.getItem("recentMovies")) || [];

    setMovies(stored);

  }, []);

  if (movies.length === 0) return null;

  return (

    <section className="px-6 md:px-16 lg:px-28 xl:px-40 py-16">

      <h2 className="text-xl md:text-2xl font-semibold text-white mb-8">
        Recently Viewed
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">

        {movies.map((movie) => (

          <MovieCard
            movie={movie}
            key={movie._id}
          />

        ))}

      </div>

    </section>

  );

};

export default RecentlyViewed;