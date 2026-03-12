import React, { useEffect, useState, Suspense } from "react"
import { X, PlayCircle } from "lucide-react"
import BlurCircle from "./BlurCircle"

const ReactPlayer = React.lazy(() => import("react-player"))

const TrailersSection = ({ movie, onClose }) => {

const [trailers,setTrailers] = useState([])
const [currentTrailer,setCurrentTrailer] = useState(null)

/* ================= FETCH TRAILERS ================= */

useEffect(()=>{

const fetchTrailers = async()=>{

try{

if(!movie?._id) return

const res = await fetch(`/api/show/${movie._id}/videos`)
const data = await res.json()

if(data.success && data.trailers?.length){

setTrailers(data.trailers)
setCurrentTrailer(data.trailers[0])

}

}catch(err){

console.error("Trailer fetch error:",err)

}

}

fetchTrailers()

},[movie])

if(!currentTrailer) return null

return (

<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md px-4">

{/* Background Glow */}

<BlurCircle top="-120px" left="-120px" size={260}/>
<BlurCircle bottom="-120px" right="-120px" size={260}/>

<div className="relative w-full max-w-6xl">

{/* Close Button */}

<button
onClick={onClose}
className="absolute -top-12 right-0 bg-gray-800 hover:bg-gray-700 p-2 rounded-full transition"
>

<X className="w-6 h-6 text-white"/>

</button>

{/* Title */}

<h2 className="text-xl md:text-2xl font-semibold text-white mb-4 text-center">

Watch Trailer

</h2>

{/* Video Player */}

<div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-2xl">

<Suspense
fallback={
<div className="flex items-center justify-center h-full text-white">
Loading trailer...
</div>
}
>

<ReactPlayer
url={`https://www.youtube.com/watch?v=${currentTrailer.key}`}
controls
playing
width="100%"
height="100%"
/>

</Suspense>

</div>

{/* TRAILER THUMBNAILS */}

{trailers.length > 1 && (

<div className="mt-6 overflow-x-auto">

<div className="flex gap-4 md:grid md:grid-cols-4 lg:grid-cols-5">

{trailers.map((trailer)=>{

const isActive = currentTrailer.id === trailer.id

return(

<div
key={trailer.id}
onClick={()=>setCurrentTrailer(trailer)}
className={`relative cursor-pointer rounded-lg overflow-hidden border transition
${isActive ? "border-primary scale-105" : "border-transparent hover:border-gray-500"}
`}
>

<img
src={`https://img.youtube.com/vi/${trailer.key}/hqdefault.jpg`}
alt={trailer.name}
className="w-40 md:w-full h-full object-cover"
/>

{/* Play icon overlay */}

<div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition">

<PlayCircle className="w-10 h-10 text-white"/>

</div>

</div>

)

})}

</div>

</div>

)}

</div>

</div>

)

}

export default TrailersSection