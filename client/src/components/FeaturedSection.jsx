import { ArrowRight } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";
import BlurCircle from "./BlurCircle";
import MovieCard from "./MovieCard";
import { useAppContext } from "../context/AppContext";

const FeaturedSection = () => {

  const navigate = useNavigate();
  const { shows } = useAppContext();

  return (

    <section className="relative px-4 sm:px-8 md:px-16 lg:px-24 xl:px-40 py-20">

      <BlurCircle top="0" right="-80px" />

      {/* ================= HEADER ================= */}

      <div className="flex items-center justify-between mb-12">

        <div>

          <h2 className="text-2xl sm:text-3xl font-semibold text-white">
            Now Showing
          </h2>

          <p className="text-gray-400 text-sm mt-1">
            Book tickets for the latest movies in theaters
          </p>

        </div>

        {/* View All */}

        <button
          onClick={() => {
            navigate("/movies");
            window.scrollTo(0, 0);
          }}
          className="group flex items-center gap-2 text-sm text-gray-300 hover:text-white transition"
        >

          View All

          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />

        </button>

      </div>

      {/* ================= MOVIE GRID ================= */}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">

        {shows
          ?.filter((show) => show)
          .slice(0, 8)
          .map((show) => (

            <div
              key={show._id}
              className="group transform transition duration-300 hover:-translate-y-2"
            >

              <MovieCard movie={show} />

            </div>

          ))}

      </div>

      {/* ================= SHOW MORE BUTTON ================= */}

      <div className="flex justify-center mt-16">

        <button
          onClick={() => {
            navigate("/movies");
            window.scrollTo(0, 0);
          }}
          className="px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-full font-medium"
        >

          Explore All Movies

        </button>

      </div>

    </section>

  );
};

export default FeaturedSection;