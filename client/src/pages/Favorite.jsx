import React from 'react'
import MovieCard from '../components/MovieCard'
import BlurCircle from '../components/BlurCircle'
import { useAppContext } from '../context/AppContext'

const Favorite = () => {
  const {favoriteMovies} = useAppContext()
  return favoriteMovies.length > 0? (
    <div className='relative  mb-50 px-6 md:px-16 lg:px-40 xl:px-44 overflow-hidden min-h-[80vh'>
      <BlurCircle top="150px" left="0px"/> 
      <BlurCircle bottom="50px" right="50px"/>
      <h1 className='text-lg font-medium my-26 mb-4'> Your Favorite movie</h1>
   <div className='flex flex-wrap max-sm:justify-center gap-8'>
     {favoriteMovies.map((movie)=>(
       <MovieCard movie={movie} key={movie._id}/>
     ))}
   </div>
     </div>
  ):(
    <div className='flex flex-col items-center justify-center h-screen'>
      <h1 className='text-3xl font-old text-center'>No movie available</h1>
    </div>
  )
}

export default Favorite
