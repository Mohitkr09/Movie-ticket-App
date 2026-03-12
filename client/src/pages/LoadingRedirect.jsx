import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { CheckCircle2 } from "lucide-react"
import BlurCircle from "../components/BlurCircle"

export default function LoadingRedirect() {

const navigate = useNavigate()

const [progress,setProgress] = useState(0)

useEffect(()=>{

const progressInterval = setInterval(()=>{

setProgress(prev=>{
if(prev >= 100) return 100
return prev + 5
})

},70)

const timer = setTimeout(()=>{

navigate("/my-bookings")

},1600)

return ()=>{

clearInterval(progressInterval)
clearTimeout(timer)

}

},[])

return (

<div className="relative flex flex-col items-center justify-center min-h-screen text-white px-6">

{/* Background glow */}

<BlurCircle top="-120px" left="-120px" size={300}/>
<BlurCircle bottom="-120px" right="-120px" size={260}/>

{/* Card */}

<div className="bg-gray-900/70 backdrop-blur-md border border-gray-700 rounded-2xl p-10 max-w-md w-full text-center shadow-xl">

{/* Icon */}

<div className="flex justify-center mb-6">

<CheckCircle2 className="w-14 h-14 text-primary animate-pulse"/>

</div>

{/* Title */}

<h1 className="text-2xl font-semibold mb-3">

Processing Payment

</h1>

<p className="text-gray-400 text-sm mb-6">

Please wait while we confirm your booking.
This usually takes just a moment.

</p>

{/* Progress bar */}

<div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">

<div
className="bg-primary h-full transition-all duration-200"
style={{width:`${progress}%`}}
></div>

</div>

<p className="text-xs text-gray-500 mt-3">

Redirecting to your bookings...

</p>

</div>

</div>

)

}