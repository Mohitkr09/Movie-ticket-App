import React, { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { ArrowRightIcon, ClockIcon } from "lucide-react"

import BlurCircle from "../components/BlurCircle"
import Loading from "../components/Loading"

import toast from "react-hot-toast"

import isoTimeFormat from "../lib/isoTimeFormat"
import timeFormat from "../lib/timeFormat"

import { useAppContext } from "../context/AppContext"
import { assets } from "../assets/assets"

const groupRows = [["A","B"],["C","D"],["E","F"],["G","H"],["I","J"]]

const premiumRows = ["A","B"]

const SeatLayout = () => {

const { id, date } = useParams()

const {
axios,
getToken,
user,
image_base_url
} = useAppContext()

const [show,setShow] = useState(null)

const [selectedSeats,setSelectedSeats] = useState([])
const [selectedTime,setSelectedTime] = useState(null)

const [occupiedSeats,setOccupiedSeats] = useState([])
const [lockedSeats,setLockedSeats] = useState([])

const [timeLeft,setTimeLeft] = useState(300)

/* ================= FETCH SHOW ================= */

const getShow = async()=>{

try{

const {data} = await axios.get(`/api/show/${id}`)

if(data.success) setShow(data)

}catch{

toast.error("Failed to fetch show")

}

}

/* ================= FETCH OCCUPIED SEATS ================= */

const getOccupiedSeats = async()=>{

if(!selectedTime) return

try{

const {data} = await axios.get(`/api/booking/seats/${selectedTime.showId}`)

if(data.success){

setOccupiedSeats(data.occupiedSeats)
setLockedSeats(data.lockedSeats || [])

}

}catch(err){

console.log(err)

}

}

/* ================= LOCK SEATS ================= */

const lockSeats = async(seats)=>{

try{

await axios.post(
"/api/booking/lock-seats",
{
showId:selectedTime.showId,
seats
},
{
headers:{Authorization:`Bearer ${await getToken()}`}
}
)

}catch{

toast.error("Seat lock failed")

}

}

/* ================= HANDLE SEAT CLICK ================= */

const handleSeatClick = async(seatId)=>{

if(!selectedTime) return toast("Select showtime first")

if(occupiedSeats.includes(seatId))
return toast("Seat already booked")

if(lockedSeats.includes(seatId))
return toast("Seat temporarily locked")

if(!selectedSeats.includes(seatId) && selectedSeats.length >= 5)
return toast("Max 5 seats allowed")

let updated

if(selectedSeats.includes(seatId)){

updated = selectedSeats.filter(s=>s!==seatId)

}else{

updated = [...selectedSeats,seatId]

await lockSeats([seatId])

}

setSelectedSeats(updated)

}

/* ================= BOOK TICKETS ================= */

const bookTickets = async()=>{

if(!user) return toast.error("Login required")

if(!selectedTime || !selectedSeats.length)
return toast.error("Select seats")

try{

const {data} = await axios.post(
"/api/booking/create",
{
showId:selectedTime.showId,
selectedSeats
},
{
headers:{Authorization:`Bearer ${await getToken()}`}
}
)

if(data.success){

window.location.href = data.url

}else{

toast.error(data.message)

}

}catch{

toast.error("Booking failed")

}

}

/* ================= TIMER ================= */

useEffect(()=>{

if(!selectedSeats.length) return

const timer = setInterval(()=>{

setTimeLeft(prev=>{

if(prev<=1){

setSelectedSeats([])
toast("Seat reservation expired")

return 300

}

return prev-1

})

},1000)

return ()=>clearInterval(timer)

},[selectedSeats])

/* ================= EFFECTS ================= */

useEffect(()=>{

getShow()

},[id])

useEffect(()=>{

getOccupiedSeats()

},[selectedTime])

if(!show || !show.movie) return <Loading/>

const movie = show.movie

const showTimes = show.dateTime?.[date] || []

/* ================= PRICE CALCULATION ================= */

const basePrice = show.showPrice || 0

const calculateSeatPrice = (seat)=>{

if(premiumRows.includes(seat[0]))
return basePrice * 1.5

return basePrice

}

const totalPrice = selectedSeats.reduce(
(sum,seat)=> sum + calculateSeatPrice(seat),
0
)

/* ================= SEAT RENDER ================= */

const renderSeats = (row,count=10)=>(

<div key={row} className="flex gap-2 justify-center flex-wrap">

{Array.from({length:count},(_,i)=>{

const seatId = `${row}${i+1}`

const isPremium = premiumRows.includes(row)

let color = "border border-primary/60"

if(occupiedSeats.includes(seatId))
color = "bg-red-500"

else if(lockedSeats.includes(seatId))
color = "bg-gray-400"

else if(selectedSeats.includes(seatId))
color = "bg-blue-500"

else if(isPremium)
color = "bg-yellow-400 text-black"

return(

<button
key={seatId}
onClick={()=>handleSeatClick(seatId)}
className={`h-10 w-10 rounded-md text-xs font-medium flex items-center justify-center transition hover:scale-110 ${color}`}
>

{seatId}

</button>

)

})}

</div>

)

/* ================= UI ================= */

return(

<div className="px-6 md:px-16 lg:px-28 py-12 text-white relative">

<BlurCircle top="-120px" left="-120px"/>
<BlurCircle bottom="-40px" right="-40px"/>

<div className="max-w-6xl mx-auto flex flex-col gap-14">

{/* MOVIE INFO */}

<div className="flex flex-col md:flex-row gap-10">

<img
src={movie.poster_path
? image_base_url+movie.poster_path
: "/placeholder.jpg"}
className="w-64 rounded-xl shadow-lg"
/>

<div className="flex flex-col gap-4">

<h1 className="text-3xl font-semibold">
{movie.title}
</h1>

<p className="text-gray-400">
{timeFormat(movie.runtime)} • {movie.release_date?.split("-")[0]}
</p>

{/* SHOWTIMES */}

<div className="bg-primary/10 border border-primary/20 rounded-xl p-4">

<h3 className="font-semibold mb-3">
Available Timings
</h3>

<div className="flex flex-wrap gap-2">

{showTimes.map(t=>(

<div
key={t.time}
onClick={()=>setSelectedTime(t)}
className={`flex items-center gap-2 px-4 py-2 rounded-md cursor-pointer transition
${selectedTime?.time===t.time
? "bg-primary text-white"
: "hover:bg-primary/20"}
`}
>

<ClockIcon className="w-4 h-4"/>

{isoTimeFormat(t.time)}

</div>

))}

</div>

</div>

</div>

</div>

{/* SEAT SECTION */}

{selectedTime ? (

<div className="flex flex-col items-center">

{/* TIMER */}

<div className="mb-6 bg-gray-900 border border-gray-800 rounded-lg px-6 py-3 text-center">

<p className="text-sm text-gray-400">
Seat reservation expires in
</p>

<p className="text-lg font-semibold text-primary">
{Math.floor(timeLeft/60)}:
{(timeLeft%60).toString().padStart(2,"0")}
</p>

</div>

{/* SCREEN */}

<div className="relative mb-10">

<img
src={assets.screenImage}
className="mx-auto max-w-md"
/>

<p className="text-center text-gray-400 text-sm mt-2">
All eyes this way please 👀
</p>

</div>

{/* SEATS */}

<div className="flex flex-col gap-6 items-center">

{groupRows.map((group,idx)=>(

<div key={idx} className="flex gap-6 flex-wrap justify-center">

{group.map(row=>renderSeats(row))}

</div>

))}

</div>

{/* SUMMARY */}

<div className="mt-8 bg-gray-900 border border-gray-800 rounded-xl p-6 text-center w-full max-w-md">

<p className="text-gray-400 text-sm">
Selected Seats
</p>

<p className="text-lg font-semibold mt-1">
{selectedSeats.length
? selectedSeats.join(", ")
: "None"}
</p>

<p className="text-gray-400 text-sm mt-3">
Total Tickets: {selectedSeats.length}
</p>

<p className="text-primary font-semibold mt-2 text-lg">
Total Price: ₹{totalPrice}
</p>

</div>

<button
onClick={bookTickets}
disabled={!selectedSeats.length}
className={`mt-10 px-12 py-3 rounded-full text-sm font-semibold flex items-center gap-2 shadow-lg transition-all
${selectedSeats.length
? "bg-primary hover:bg-primary-dull hover:scale-105"
: "bg-gray-700 cursor-not-allowed"}
`}
>

Proceed to Checkout

<ArrowRightIcon className="w-4 h-4"/>

</button>

</div>

):( 

<p className="text-gray-400 text-center text-lg">
Select a showtime to view seats
</p>

)}

</div>

</div>

)

}

export default SeatLayout