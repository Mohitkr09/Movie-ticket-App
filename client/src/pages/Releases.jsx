import React, { useEffect, useState } from "react"
import axios from "axios"
import { Search, Filter } from "lucide-react"

import MovieCard from "../components/MovieCard"
import Loading from "../components/Loading"
import BlurCircle from "../components/BlurCircle"

import toast from "react-hot-toast"

const Releases = () => {

const [movies,setMovies] = useState([])
const [filtered,setFiltered] = useState([])

const [loading,setLoading] = useState(true)

const [search,setSearch] = useState("")
const [sort,setSort] = useState("latest")

/* ================= LOAD RELEASES ================= */

const loadReleases = async()=>{

try{

const {data} = await axios.get("/api/show/now-playing")

if(data.success){

setMovies(data.movies || [])
setFiltered(data.movies || [])

}else{

toast.error("No new releases found")

}

}catch(error){

console.error("Error loading releases:",error)

toast.error("Failed to load new releases")

}

setLoading(false)

}

/* ================= FILTER + SEARCH ================= */

useEffect(()=>{

let result = [...movies]

if(search){

result = result.filter(movie =>
movie.title?.toLowerCase().includes(search.toLowerCase())
)

}

/* SORT */

if(sort === "rating"){

result.sort((a,b)=>b.vote_average - a.vote_average)

}

if(sort === "latest"){

result.sort(
(a,b)=> new Date(b.release_date) - new Date(a.release_date)
)

}

setFiltered(result)

},[search,sort,movies])

/* ================= INIT ================= */

useEffect(()=>{

loadReleases()

},[])

if(loading) return <Loading/>

return(

<section className="relative min-h-screen px-6 md:px-16 lg:px-32 pt-28 pb-20 text-white overflow-hidden">

{/* BACKGROUND EFFECTS */}

<BlurCircle top="-80px" left="-80px" size={260}/>
<BlurCircle bottom="0px" right="-60px" size={240}/>

{/* ================= HEADER ================= */}

<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-12">

<div>

<h1 className="text-3xl md:text-4xl font-semibold">

🎬 New Releases

</h1>

<p className="text-gray-400 mt-2 text-sm">

Discover the latest movies currently playing in theaters.

</p>

</div>

{/* SEARCH */}

<div className="relative w-full md:w-80">

<Search className="absolute left-3 top-3 w-4 h-4 text-gray-400"/>

<input
type="text"
placeholder="Search new releases..."
value={search}
onChange={(e)=>setSearch(e.target.value)}
className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-primary"
/>

</div>

</div>

{/* ================= FILTER BAR ================= */}

<div className="flex flex-wrap items-center gap-4 mb-10">

<div className="flex items-center gap-2 text-gray-400">

<Filter className="w-4 h-4"/>

<span className="text-sm">Sort by:</span>

</div>

<select
value={sort}
onChange={(e)=>setSort(e.target.value)}
className="bg-gray-900 border border-gray-800 px-4 py-2 rounded-lg"
>

<option value="latest">Latest</option>
<option value="rating">Top Rated</option>

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

No releases found.

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

{filtered.map(movie => (

<MovieCard
key={movie._id || movie.id}
movie={movie}
/>

))}

</div>

)}

</section>

)

}

export default Releases