import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { assets } from "../assets/assets";
import {
  MenuIcon,
  SearchIcon,
  XIcon,
  HeartIcon,
  TicketPlus,
} from "lucide-react";
import { useClerk, UserButton, useUser } from "@clerk/clerk-react";
import { useAppContext } from "../context/AppContext";

const Navbar = () => {

  const [isOpen,setIsOpen] = useState(false)
  const [searchOpen,setSearchOpen] = useState(false)
  const [query,setQuery] = useState("")

  const { user } = useUser()
  const { openSignIn } = useClerk()
  const { favoriteMovies } = useAppContext()

  const navigate = useNavigate()
  const location = useLocation()

  useEffect(()=>{
    setSearchOpen(false)
    setIsOpen(false)
  },[location.pathname])


  const navLinks = [
    { name:"Home",path:"/" },
    { name:"Movies",path:"/movies" },
    { name:"Theaters",path:"/theaters" },
    { name:"Releases",path:"/releases" },
  ]


  const isActive = (path)=> location.pathname === path


  /* ================= SEARCH FUNCTION ================= */

  const handleSearch = (e)=>{

    if(e.key === "Enter" && query.trim() !== ""){

      navigate(`/movies?search=${query}`)

      setSearchOpen(false)

      setQuery("")

    }

  }


  return (

<div className="fixed top-0 left-0 z-50 w-full flex items-center justify-between px-6 md:px-16 lg:px-36 py-5 bg-black/50 backdrop-blur-md shadow-md">


{/* Logo */}

<Link to="/" className="flex-shrink-0">
<img src={assets.logo} alt="Logo" className="w-36 h-auto"/>
</Link>



{/* Desktop Navigation */}

<div className="hidden md:flex items-center gap-8">

{navLinks.map((link)=>(

<Link
key={link.name}
to={link.path}
className={`relative text-white font-medium hover:text-primary transition ${
isActive(link.path) ? "text-primary": ""
}`}
>

{link.name}

{isActive(link.path) && (
<span className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary"/>
)}

</Link>

))}


{favoriteMovies.length > 0 && (

<Link
to="/favorite"
className="relative text-white hover:text-primary transition flex items-center gap-1"
>

<HeartIcon className="w-5 h-5"/>

<span className="bg-primary text-black rounded-full px-2 text-xs">

{favoriteMovies.length}

</span>

</Link>

)}

</div>



{/* RIGHT SIDE */}

<div className="flex items-center gap-4 md:gap-8">


{/* SEARCH */}

<div className="relative">

<SearchIcon
className="w-6 h-6 cursor-pointer text-white"
onClick={()=> setSearchOpen(!searchOpen)}
/>

{searchOpen && (

<input
value={query}
onChange={(e)=> setQuery(e.target.value)}
onKeyDown={handleSearch}
type="text"
placeholder="Search movies..."
className="absolute top-8 right-0 w-64 p-2 rounded-md bg-black/80 text-white outline-none"
/>

)}

</div>



{/* LOGIN / USER */}

{!user ? (

<button
onClick={openSignIn}
className="px-4 py-1 sm:px-7 sm:py-2 bg-primary rounded-full font-medium"
>

Login

</button>

) : (

<UserButton>

<UserButton.MenuItems>

<UserButton.Action
label="My Bookings"
labelIcon={<TicketPlus width={15}/>}
onClick={()=> navigate("/my-bookings")}
/>

</UserButton.MenuItems>

</UserButton>

)}



{/* MOBILE MENU */}

<MenuIcon
className="md:hidden w-8 h-8 cursor-pointer text-white"
onClick={()=> setIsOpen(true)}
/>

</div>

</div>

)

}

export default Navbar