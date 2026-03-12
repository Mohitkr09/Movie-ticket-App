import React, { useEffect, useState } from "react"
import { Search } from "lucide-react"

import { useAppContext } from "../context/AppContext"
import Loading from "../components/Loading"
import MovieCard from "../components/MovieCard"
import BlurCircle from "../components/BlurCircle"

const Theaters = () => {

const { axios } = useAppContext()

const [movies,setMovies] = useState([])
const [filtered,setFiltered] = useState([])

const [loading,setLoading] = useState(true)

const [search,setSearch] = useState("")
const [genre,setGenre] = useState("All")

/* ================= FETCH MOVIES ================= */

const fetchMovies = async()=>{

try{

const {data} = await axios.get("/api/show/all")

if(data.success){

setMovies(data.shows || [])
setFiltered(data.shows || [])

}

}catch(err){

console.log("Error fetching shows:",err)

}

setLoading(false)

}

/* ================= FILTER ================= */

useEffect(()=>{

let result = [...movies]

if(search){

result = result.filter(movie=>
movie.movie?.title?.toLowerCase().includes(search.toLowerCase())
)

}

if(genre !== "All"){

result = result.filter(movie=>
movie.movie?.genres?.some(g=>g.name === genre)
)

}

setFiltered(result)

},[search,genre,movies])

/* ================= INIT ================= */

useEffect(()=>{

fetchMovies()

},[])

if(loading) return <Loading/>

return(

<section className="relative min-h-screen text-white px-5 sm:px-10 md:px-16 lg:px-24 xl:px-32 pt-28 pb-20">

{/* BACKGROUND EFFECT */}

<BlurCircle top="-80px" left="-60px" size={280}/>
<BlurCircle bottom="-80px" right="-100px" size={260}/>

{/* ================= HEADER ================= */}

<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-12">

<div>

<h1 className="text-3xl md:text-4xl font-semibold">

🎬 Movies in Theaters

</h1>

<p className="text-gray-400 mt-2 text-sm">

Discover the latest movies currently playing in cinemas

</p>

</div>

{/* SEARCH */}

<div className="relative w-full md:w-80">

<Search className="absolute left-3 top-3 w-4 h-4 text-gray-400"/>

<input
type="text"
placeholder="Search movies..."
value={search}
onChange={(e)=>setSearch(e.target.value)}
className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-primary"
/>

</div>

</div>

{/* ================= FILTER BAR ================= */}

<div className="flex flex-wrap items-center gap-4 mb-10">

<select
value={genre}
onChange={(e)=>setGenre(e.target.value)}
className="bg-gray-900 border border-gray-800 px-4 py-2 rounded-lg"
>

<option value="All">All Genres</option>
<option value="Action">Action</option>
<option value="Comedy">Comedy</option>
<option value="Drama">Drama</option>
<option value="Horror">Horror</option>
<option value="Sci-Fi">Sci-Fi</option>

</select>

<p className="text-gray-400 text-sm">

{filtered.length} movies found

</p>

</div>

{/* ================= MOVIE GRID ================= */}

{filtered.length === 0 ?(

<div className="flex flex-col items-center justify-center mt-20 text-center">

<img
src="/empty.png"
alt="No movies"
className="w-44 opacity-70"
/>

<p className="text-gray-400 mt-4">

No movies found.

</p>

</div>

):( 

<div
className="
grid
grid-cols-2
sm:grid-cols-2
md:grid-cols-3
lg:grid-cols-4
xl:grid-cols-5
gap-8
"
>

{filtered.map(movie=>(
<MovieCard
key={movie._id}
movie={movie}
/>
))}

</div>

)}

</section>

)

}

export default Theaters