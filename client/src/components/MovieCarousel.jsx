import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useRef } from "react";
import MovieCard from "./MovieCard";

const MovieCarousel = ({ title, movies = [] }) => {

  const scrollRef = useRef(null);

  const scroll = (direction) => {

    if (!scrollRef.current) return;

    const scrollAmount = 400;

    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth"
    });

  };

  if (!movies.length) return null;

  return (

    <div className="px-6 md:px-16 lg:px-24 xl:px-36 py-10">

      {/* Header */}

      <div className="flex items-center justify-between mb-6">

        <h2 className="text-xl md:text-2xl font-semibold text-white">
          {title}
        </h2>

        <div className="flex gap-2">

          <button
            onClick={() => scroll("left")}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => scroll("right")}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

        </div>

      </div>

      {/* Movie Row */}

      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth"
      >

        {movies.map((movie) => (

          <div key={movie._id || movie.id} className="min-w-[220px]">

            <MovieCard movie={movie} />

          </div>

        ))}

      </div>

    </div>

  );

};

export default MovieCarousel;