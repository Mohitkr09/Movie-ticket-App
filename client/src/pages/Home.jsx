import React, { useState } from 'react'
import HeroSection from '../components/HeroSection'
import FeaturedSection from '../components/FeaturedSection'
import TrailersSection from '../components/TrailersSection'

const Home = () => {
  const [selectedMovie, setSelectedMovie] = useState(null)

  return (
    <>
      <HeroSection onMovieSelect={setSelectedMovie} />
      <FeaturedSection />
      {selectedMovie && <TrailersSection movie={selectedMovie} />}
    </>
  )
}

export default Home


