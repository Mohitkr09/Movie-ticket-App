import React, { useState } from "react";
import HeroSection from "../components/HeroSection";
import FeaturedSection from "../components/FeaturedSection";
import TrailersSection from "../components/TrailersSection";
import MovieCarousel from "../components/MovieCarousel";
import RecentlyViewed from "../components/RecentlyViewed";
import { useAppContext } from "../context/AppContext";

const Home = () => {

  const [selectedMovie, setSelectedMovie] = useState(null);

  const { shows = [] } = useAppContext();

  /* ================= MOVIE GROUPS ================= */

  const trendingMovies = shows.slice(0, 10);
  const topRatedMovies = shows.slice(10, 20);
  const upcomingMovies = shows.slice(20, 30);

  return (

    <div className="w-full overflow-hidden">

      {/* ================= HERO SECTION ================= */}

      <HeroSection onMovieSelect={setSelectedMovie} />

      {/* ================= FEATURED MOVIES ================= */}

      <FeaturedSection />

      {/* ================= TRAILERS ================= */}

      {selectedMovie && (
        <TrailersSection movie={selectedMovie} />
      )}

      {/* ================= RECENTLY VIEWED ================= */}

      <RecentlyViewed />

      {/* ================= MOVIE CAROUSELS ================= */}

      <MovieCarousel
        title="🔥 Trending Now"
        movies={trendingMovies}
      />

      <MovieCarousel
        title="⭐ Top Rated"
        movies={topRatedMovies}
      />

      <MovieCarousel
        title="🎬 Coming Soon"
        movies={upcomingMovies}
      />

    </div>

  );

};

export default Home;