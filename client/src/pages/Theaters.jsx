import React, { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import Loading from "../components/Loading";
import MovieCard from "../components/MovieCard";

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
    <div className="container mx-auto px-4 mt-10">
      <h1 className="text-3xl font-bold mb-6">Theaters</h1>

      {movies.length === 0 ? (
        <p className="text-gray-400">No movies available in theaters.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {movies.map((movie) => (
            <MovieCard key={movie._id} movie={movie} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Theaters;
