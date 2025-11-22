import React, { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import Loading from "../components/Loading";
import MovieCard from "../components/MovieCard";
import BlurCircle from "../components/BlurCircle";

const Theaters = () => {
  const { axios } = useAppContext();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMovies = async () => {
    try {
      const { data } = await axios.get("/api/show/all");
      if (data.success) setMovies(data.shows);
    } catch (err) {
      console.log("Error fetching shows:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="relative px-5 sm:px-8 md:px-14 lg:px-24 xl:px-32 pt-28 pb-20 text-white min-h-screen">

      {/* Background Blur Circles */}
      <BlurCircle top="-50px" left="-60px" />
      <BlurCircle bottom="-60px" right="-80px" />

      <h1 className="text-2xl sm:text-3xl font-semibold mb-10">
        Movies in Theaters
      </h1>

      {movies.length === 0 ? (
        <p className="text-gray-400 text-center sm:text-left">
          No movies available in theaters.
        </p>
      ) : (
        <div
          className="
            grid
            grid-cols-1
            sm:grid-cols-2
            md:grid-cols-3
            lg:grid-cols-4
            xl:grid-cols-5
            gap-8
            sm:gap-10
            lg:gap-12
            w-full
            place-items-center
            md:place-items-start
          "
        >
          {movies.map((movie) => (
            <MovieCard key={movie._id} movie={movie} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Theaters;
