import React, { useEffect, useState } from "react";
import axios from "axios";
import MovieCard from "../components/MovieCard";
import Loading from "../components/Loading";
import toast from "react-hot-toast";
import BlurCircle from "../components/BlurCircle";   // ✅ ADDED

const Releases = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadReleases = async () => {
    try {
      const { data } = await axios.get("/api/show/now-playing");

      if (data.success && data.movies?.length > 0) {
        setMovies(data.movies);
      } else {
        toast.error("No new releases found");
      }
    } catch (error) {
      console.error("Error loading releases:", error);
      toast.error("Failed to load new releases");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadReleases();
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="relative px-6 md:px-16 lg:px-32 pt-28 pb-20 text-white">

      {/* 🔵 BLUR BACKGROUND EFFECTS */}
      <BlurCircle top="-80px" left="-80px" />
      <BlurCircle bottom="0px" right="-60px" />

      <h1 className="text-3xl font-semibold mb-10 relative z-10">New Releases</h1>

      {movies.length === 0 ? (
        <p className="text-gray-400 relative z-10">No new releases available.</p>
      ) : (
        <div
          className="
            relative z-10
            grid
            grid-cols-1
            sm:grid-cols-2
            md:grid-cols-3
            lg:grid-cols-4
            xl:grid-cols-5
            gap-x-32
            gap-y-20
          "
        >
          {movies.map((movie) => (
            <MovieCard key={movie._id || movie.id} movie={movie} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Releases;
