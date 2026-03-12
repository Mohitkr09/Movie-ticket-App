import React, { useState, useEffect } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { Ticket, Clock, Film, CheckCircle } from "lucide-react"

import BlurCircle from "../components/BlurCircle"
import Loading from "../components/Loading"

import { useAppContext } from "../context/AppContext"
import { dateFormat } from "../lib/dateFormat"
import timeFormat from "../lib/timeFormat"

const MyBookings = () => {

const currency = import.meta.env.VITE_CURRENCY

const { axios, getToken, user, image_base_url } = useAppContext()

const navigate = useNavigate()
const location = useLocation()

const [bookings,setBookings] = useState([])
const [isLoading,setIsLoading] = useState(true)

/* ================= FETCH BOOKINGS ================= */

const getMyBookings = async()=>{

try{

const {data} = await axios.get("/api/user/bookings",{
headers:{Authorization:`Bearer ${await getToken()}`}
})

if(data.success){

setBookings(data.bookings || [])

}

}catch(error){

console.error("Booking fetch error:",error)

}

setIsLoading(false)

}

/* ================= STRIPE REDIRECT ================= */

useEffect(()=>{

const fromStripe = location.pathname.includes("/loading")

const loadBookings = async()=>{

if(fromStripe){

await new Promise(resolve=>setTimeout(resolve,1500))

try{

await axios.get("/api/payment/verify-latest",{
headers:{Authorization:`Bearer ${await getToken()}`}
})

}catch(err){

console.log("Payment verify error:",err)

}

}

if(user) await getMyBookings()

}

loadBookings()

},[user,location.pathname])

if(isLoading) return <Loading/>

return (

<section className="relative px-6 md:px-16 lg:px-28 xl:px-40 pt-32 min-h-[80vh]">

<BlurCircle top="100px" left="100px" size={260}/>
<BlurCircle bottom="0px" right="200px" size={240}/>

{/* HEADER */}

<div className="flex items-center gap-3 mb-10">

<Ticket className="text-primary w-6 h-6"/>

<h1 className="text-3xl font-semibold text-white">

My Bookings

</h1>

</div>

{/* EMPTY STATE */}

{bookings.length === 0 ? (

<div className="flex flex-col items-center justify-center text-center mt-20">

<Film className="w-16 h-16 text-gray-600 mb-4"/>

<h2 className="text-xl text-white font-semibold">

No Bookings Yet

</h2>

<p className="text-gray-400 mt-2 max-w-md">

You haven't booked any tickets yet.
Discover movies and reserve your seats.

</p>

<button
onClick={()=>navigate("/movies")}
className="mt-6 px-6 py-2 bg-primary rounded-full hover:bg-primary-dull transition"
>

Browse Movies

</button>

</div>

):( 

<div className="grid gap-8 max-w-5xl">

{bookings.map((item,index)=>{

const movie = item.show?.movie

const poster = movie?.poster_path
? image_base_url + movie.poster_path
: "/placeholder.jpg"

const goToMovie = ()=>{

if(movie?._id) navigate(`/movies/${movie._id}`)

}

return(

<div
key={index}
className="bg-gray-900/70 backdrop-blur-lg border border-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition"
>

<div className="flex flex-col md:flex-row">

{/* POSTER */}

<div
className="relative md:w-48 cursor-pointer"
onClick={goToMovie}
>

<img
src={poster}
alt={movie?.title}
className="w-full h-full object-cover"
/>

<div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"/>

</div>

{/* CONTENT */}

<div className="flex flex-col flex-1 p-6 justify-between">

<div>

<h3 className="text-xl font-semibold text-white">

{movie?.title || "Untitled"}

</h3>

<p className="text-gray-400 text-sm mt-1">

{timeFormat(movie?.runtime)}

</p>

{/* BOOKING INFO */}

<div className="flex flex-wrap gap-4 mt-4 text-sm">

<span className="flex items-center gap-1 bg-gray-800 px-3 py-1 rounded-full">

<Clock className="w-4 h-4"/>

{dateFormat(item.show?.showDateTime)}

</span>

<span className="bg-gray-800 px-3 py-1 rounded-full">

Seats: {item.bookedSeats?.join(", ")}

</span>

<span className="bg-gray-800 px-3 py-1 rounded-full">

Tickets: {item.bookedSeats?.length}

</span>

</div>

</div>

{/* PAYMENT SECTION */}

<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-6">

<p className="text-2xl font-semibold text-primary">

{currency}{item.amount}

</p>

{!item.isPaid && item.paymentLink &&(

<Link
to={item.paymentLink}
className="bg-primary hover:bg-primary-dull text-white px-6 py-2 rounded-full text-sm font-medium"
>

Complete Payment

</Link>

)}

{item.isPaid &&(

<span className="flex items-center gap-1 text-green-400 text-sm font-medium">

<CheckCircle className="w-4 h-4"/>

Payment Confirmed

</span>

)}

</div>

</div>

</div>

</div>

)

})}

</div>

)}

</section>

)

}

export default MyBookings