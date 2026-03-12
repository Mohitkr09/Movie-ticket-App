import { StarIcon, PlayCircle } from "lucide-react"
import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import timeFormat from "../lib/timeFormat"
import { useAppContext } from "../context/AppContext"

const MovieCard = ({ movie }) => {

const navigate = useNavigate()

const { image_base_url } = useAppContext()

const [hovered,setHovered] = useState(false)

if(!movie) return null

const movieId = movie._id || movie.id

const handleClick = ()=>{

navigate(`/movies/${movieId}`)
window.scrollTo({top:0,behavior:"smooth"})

}

const poster =
movie.poster_path
? image_base_url + movie.poster_path
: movie.backdrop_path
? image_base_url + movie.backdrop_path
: "/placeholder.jpg"

return(

<div
className={`group relative bg-gray-900 rounded-2xl overflow-hidden shadow-lg
transition-all duration-300 cursor-pointer
hover:scale-[1.05] hover:shadow-2xl`}
onMouseEnter={()=>setHovered(true)}
onMouseLeave={()=>setHovered(false)}
>

{/* ================= MEDIA ================= */}

<div className="relative w-full h-64 overflow-hidden">

{/* Poster */}

<img
src={poster}
alt={movie.title}
className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500
${hovered && movie.trailerKey ? "opacity-0" : "opacity-100"}
`}
/>

{/* Trailer */}

{movie.trailerKey && (

<iframe
className={`absolute inset-0 w-full h-full transition-opacity duration-500
${hovered ? "opacity-100" : "opacity-0"}
`}
src={`https://www.youtube.com/embed/${movie.trailerKey}?autoplay=1&mute=1&controls=0`}
title="Trailer"
allow="autoplay"
/>

)}

{/* Gradient overlay */}

<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"/>

{/* Rating badge */}

{movie.vote_average && (

<div className="absolute top-3 right-3 flex items-center gap-1 bg-black/70 px-2 py-1 rounded-md text-xs text-white backdrop-blur">

<StarIcon className="w-3 h-3 text-yellow-400 fill-yellow-400"/>

{movie.vote_average.toFixed(1)}

</div>

)}

{/* Play button */}

<div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">

<PlayCircle className="w-12 h-12 text-white drop-shadow-lg"/>

</div>

</div>

{/* ================= INFO ================= */}

<div className="p-4">

<h3 className="text-white font-semibold text-sm md:text-base truncate">

{movie.title || "Untitled"}

</h3>

<p className="text-xs text-gray-400 mt-1 line-clamp-1">

{movie.release_date
? new Date(movie.release_date).getFullYear()
: "—"}

{" • "}

{movie.genres?.length
? movie.genres.slice(0,2).map(g=>g.name).join(" | ")
: "Genres"}

{" • "}

{movie.runtime ? timeFormat(movie.runtime) : "—"}

</p>

{/* ACTION BAR */}

<div className="flex items-center justify-between mt-4">

<button
onClick={handleClick}
className="flex items-center gap-2 px-4 py-2 text-xs bg-primary hover:bg-primary-dull rounded-full transition"
>

<PlayCircle className="w-4 h-4"/>

Book Tickets

</button>

<div className="flex items-center gap-1 text-xs text-gray-400">

<StarIcon className="w-4 h-4 text-yellow-400 fill-yellow-400"/>

{movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}

</div>

</div>

</div>

</div>

)

}

export default MovieCard