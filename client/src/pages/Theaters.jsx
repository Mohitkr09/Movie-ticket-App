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
      if (data.success) {
        setMovies(data.shows);
      }
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
    <div className="relative px-6 md:px-16 lg:px-32 pt-28 pb-20 text-white min-h-screen">

      {/* Background Blur Circles */}
      <BlurCircle top="-50px" left="-100px" />
      <BlurCircle bottom="-50px" right="-100px" />

      <h1 className="text-3xl font-semibold mb-10">Movies in Theaters</h1>

      {movies.length === 0 ? (
        <p className="text-gray-400">No movies available in theaters.</p>
      ) : (
        <div
          className="
            grid
            grid-cols-1
            sm:grid-cols-2
            md:grid-cols-3
            lg:grid-cols-4
            xl:grid-cols-5
            gap-x-10
            gap-y-16
            max-sm:justify-center
          "
        >
          {movies.map((movie) => (
            <div key={movie._id}>
              <MovieCard movie={movie} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Theaters;
