import React, { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import BlurCircle from "../components/BlurCircle"
import { Heart, PlayCircleIcon, StarIcon, X, Share2, Bell } from "lucide-react"
import timeFormat from "../lib/timeFormat"
import MovieCard from "../components/MovieCard"
import DateSelect from "../components/DateSelect"
import Loading from "../components/Loading"
import { useAppContext } from "../context/AppContext"
import toast from "react-hot-toast"
import { fetchRecommendations } from "../services/aiApis.js"

const MovieDetails = () => {

const navigate = useNavigate()
const { id } = useParams()

const [show,setShow] = useState(null)
const [recommendations,setRecommendations] = useState([])
const [loadingRecs,setLoadingRecs] = useState(false)
const [isFavorite,setIsFavorite] = useState(false)
const [isTrailerOpen,setIsTrailerOpen] = useState(false)

const [reviews,setReviews] = useState([])
const [reviewText,setReviewText] = useState("")
const [rating,setRating] = useState(5)

const {
axios,
getToken,
user,
fetchFavoriteMovies,
favoriteMovies,
image_base_url
} = useAppContext()

/* ---------------- Fetch Movie ---------------- */

const getShow = async(movieId)=>{
try{

const {data} = await axios.get(`/api/show/${movieId}`)

if(data.success) setShow(data)

}catch{
toast.error("Failed to load movie")
}
}

/* ---------------- Favorite ---------------- */

const handleFavorite = async()=>{
if(!user) return toast.error("Login required")

try{

setIsFavorite(prev=>!prev)

const {data} = await axios.post(
"/api/user/update-favorite",
{movieId:id},
{headers:{Authorization:`Bearer ${await getToken()}`}}
)

if(data.success) await fetchFavoriteMovies()

}catch{
toast.error("Favorite update failed")
}
}

/* ---------------- Reviews ---------------- */

const fetchReviews = async()=>{
try{

const {data} = await axios.get(`/api/reviews/${id}`)

if(data.success) setReviews(data.reviews)

}catch{
console.log("Review API not ready")
}
}

const submitReview = async()=>{

if(!user) return toast.error("Login required")
if(!reviewText) return toast.error("Write a review")

try{

const {data} = await axios.post(
"/api/reviews",
{movieId:id,rating,comment:reviewText},
{headers:{Authorization:`Bearer ${await getToken()}`}}
)

if(data.success){

toast.success("Review submitted")

setReviewText("")
setRating(5)

fetchReviews()

}

}catch{
toast.error("Review failed")
}
}

/* ---------------- Share ---------------- */

const shareMovie = async()=>{

try{

if(navigator.share){

await navigator.share({
title:show.movie.title,
url:window.location.href
})

}else{

navigator.clipboard.writeText(window.location.href)
toast.success("Link copied")

}

}catch{}
}

/* ---------------- Reminder ---------------- */

const setReminder = ()=> toast.success("Reminder set 🔔")

/* ---------------- AI Recommendations ---------------- */

const loadAIRecommendations = async()=>{

setLoadingRecs(true)

const data = await fetchRecommendations(id)

if(data?.recommendations?.length>0){

setRecommendations(
data.recommendations.map(rec=>({
_id:String(rec.id),
...rec
}))
)

}

setLoadingRecs(false)
}

/* ---------------- useEffect ---------------- */

useEffect(()=>{

if(!id) return

getShow(id)
fetchReviews()
loadAIRecommendations()

setIsFavorite(favoriteMovies.some(fav=>fav._id===id))

},[id,favoriteMovies])

if(!show || !show.movie) return <Loading/>

const movie = show.movie

return(

<div className="px-6 md:px-16 lg:px-40 pt-32 text-white">

{/* Movie Layout */}

<div className="flex flex-col md:flex-row gap-10 max-w-6xl mx-auto">

<img
src={movie.poster_path ? image_base_url+movie.poster_path : "/placeholder.jpg"}
alt={movie.title}
className="w-64 rounded-xl shadow-xl"
/>

<div className="flex flex-col gap-4">

<p className="text-primary">{movie.original_language?.toUpperCase()}</p>

<h1 className="text-4xl font-semibold">{movie.title}</h1>

<div className="flex items-center gap-2">

<StarIcon className="w-5 h-5 text-yellow-400 fill-yellow-400"/>

<span>{movie.vote_average?.toFixed(1)}</span>

</div>

<p className="text-gray-400">{movie.overview}</p>

<p className="text-gray-300">

{timeFormat(movie.runtime)} •{" "}
{movie.genres?.map(g=>g.name).join(", ")} •{" "}
{movie.release_date?.split("-")[0]}

</p>

{/* Buttons */}

<div className="flex gap-4 mt-4">

<button
onClick={()=> movie.trailerKey
? setIsTrailerOpen(true)
: toast.error("Trailer not available")}
className="flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded"
>
<PlayCircleIcon className="w-5 h-5"/> Trailer
</button>

<button onClick={handleFavorite} className="bg-gray-700 p-2 rounded-full">
<Heart className={`w-5 h-5 ${isFavorite ? "fill-primary text-primary":""}`}/>
</button>

<button onClick={shareMovie} className="bg-gray-700 p-2 rounded-full">
<Share2 className="w-5 h-5"/>
</button>

<button onClick={setReminder} className="bg-gray-700 p-2 rounded-full">
<Bell className="w-5 h-5"/>
</button>

</div>

</div>

</div>

{/* Trailer */}

{isTrailerOpen && (

<div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50">

<div className="relative w-full max-w-4xl aspect-video">

<iframe
src={`https://www.youtube.com/embed/${movie.trailerKey}?autoplay=1`}
className="w-full h-full"
allowFullScreen
/>

<button
onClick={()=>setIsTrailerOpen(false)}
className="absolute top-4 right-4 bg-gray-800 p-2 rounded-full"
>

<X/>

</button>

</div>

</div>

)}

<DateSelect dateTime={show.dateTime} id={id}/>

{/* Reviews */}

<div className="mt-20 max-w-4xl mx-auto">

<h2 className="text-xl font-semibold mb-4">User Reviews</h2>

{/* Rating selector */}

<div className="flex gap-2 mb-3">

{[1,2,3,4,5].map(star=>(

<StarIcon
key={star}
onClick={()=>setRating(star)}
className={`w-7 h-7 cursor-pointer transition ${
rating>=star
? "text-yellow-400 fill-yellow-400"
: "text-gray-500"
}`}
/>

))}

</div>

<textarea
value={reviewText}
onChange={(e)=>setReviewText(e.target.value)}
placeholder="Write your review..."
className="w-full p-4 bg-gray-800 rounded-lg"
/>

<button
onClick={submitReview}
className="mt-4 px-6 py-2 bg-primary hover:bg-primary-dull rounded-lg"
>
Submit Review
</button>

{/* Reviews list */}

<div className="mt-8 space-y-6">

{reviews.map(r=>(

<div key={r._id} className="bg-gray-900 p-5 rounded-xl flex gap-4">

{/* Avatar */}

<img
src={r.userImage || "/avatar.png"}
alt="user"
className="w-10 h-10 rounded-full"
/>

<div className="flex-1">

<div className="flex items-center gap-1 mb-1">

{[...Array(r.rating)].map((_,i)=>(
<StarIcon key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400"/>
))}

<span className="text-gray-400 text-sm ml-2">{r.rating}/5</span>

</div>

<p className="text-gray-300">{r.comment}</p>

<div className="text-xs text-gray-500 mt-2 flex justify-between">

<span>{r.userName || "Anonymous"}</span>

<span>{new Date(r.createdAt).toLocaleDateString()}</span>

</div>

</div>

</div>

))}

</div>

</div>

{/* Recommendations */}

<p className="text-lg font-medium mt-20 mb-8">Recommended For You</p>

<div className="flex flex-wrap gap-8">

{loadingRecs
? "Loading..."
: recommendations.map(rec=>(
<MovieCard key={rec._id} movie={rec}/>
))}

</div>

</div>

)

}

export default MovieDetails