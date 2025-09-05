import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowRightIcon, ClockIcon, StarIcon, PlayCircleIcon, Heart, X } from 'lucide-react'
import BlurCircle from '../components/BlurCircle'
import Loading from '../components/Loading'
import toast from 'react-hot-toast'
import isoTimeFormat from '../lib/isoTimeFormat'
import timeFormat from '../lib/timeFormat'
import { useAppContext } from '../context/AppContext'
import { assets } from '../assets/assets'

const groupRows = [['A', 'B'], ['C', 'D'], ['E', 'F'], ['G', 'H'], ['I', 'J']]

const SeatLayout = () => {
  const { id, date } = useParams()
  const navigate = useNavigate()
  const { axios, getToken, user, fetchFavoriteMovies, favoriteMovies, image_base_url } =
    useAppContext()

  const [show, setShow] = useState(null)
  const [selectedSeats, setSelectedSeats] = useState([])
  const [selectedTime, setSelectedTime] = useState(null)
  const [occupiedSeats, setOccupiedSeats] = useState([])
  const [isFavorite, setIsFavorite] = useState(false)
  const [isTrailerOpen, setIsTrailerOpen] = useState(false)

  // ---------------- Fetch show info ----------------
  const getShow = async () => {
    try {
      const { data } = await axios.get(`/api/show/${id}`)
      if (data.success) setShow(data)
    } catch (error) {
      console.log(error)
      toast.error('Failed to fetch show')
    }
  }

  // ---------------- Fetch occupied seats ----------------
  const getOccupiedSeats = async () => {
    if (!selectedTime) return
    try {
      const { data } = await axios.get(`/api/booking/seats/${selectedTime.showId}`)
      if (data.success) setOccupiedSeats(data.occupiedSeats)
      else toast.error(data.message)
    } catch (error) {
      console.log(error)
    }
  }

  // ---------------- Seat selection ----------------
  const handleSeatClick = (seatId) => {
    if (!selectedTime) return toast('Please select time first')
    if (!selectedSeats.includes(seatId) && selectedSeats.length >= 5)
      return toast('You can only select 5 seats')
    if (occupiedSeats.includes(seatId)) return toast('This seat is already booked')
    setSelectedSeats((prev) =>
      prev.includes(seatId) ? prev.filter((s) => s !== seatId) : [...prev, seatId]
    )
  }

  // ---------------- Book tickets ----------------
  const bookTickets = async () => {
    if (!user) return toast.error('Please login to proceed')
    if (!selectedTime || !selectedSeats.length) return toast.error('Select time & seats')
    try {
      const { data } = await axios.post(
        '/api/booking/create',
        { showId: selectedTime.showId, selectedSeats },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      )
      if (data.success) window.location.href = data.url
      else toast.error(data.message)
    } catch (error) {
      toast.error(error.message)
    }
  }

  // ---------------- Toggle favorite ----------------
  const handleFavorite = async () => {
    if (!user) return toast.error('Please login to proceed')
    try {
      setIsFavorite((prev) => !prev)
      const { data } = await axios.post(
        '/api/user/update-favorite',
        { movieId: id },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      )
      if (data.success) await fetchFavoriteMovies()
      else {
        toast.error('Failed to update favorites')
        setIsFavorite((prev) => !prev)
      }
    } catch (error) {
      console.log(error)
      setIsFavorite((prev) => !prev)
      toast.error('Error updating favorites')
    }
  }

  useEffect(() => {
    getShow()
    setIsFavorite(favoriteMovies.some((fav) => fav._id === id))
  }, [id, favoriteMovies])

  useEffect(() => {
    getOccupiedSeats()
  }, [selectedTime])

  if (!show || !show.movie) return <Loading />

  const movie = show.movie
  const showTimes = show.dateTime?.[date] || []

  const renderSeats = (row, count = 9) => (
    <div key={row} className="flex gap-2 mt-2">
      {Array.from({ length: count }, (_, i) => {
        const seatId = `${row}${i + 1}`
        return (
          <button
            key={seatId}
            onClick={() => handleSeatClick(seatId)}
            className={`h-8 w-8 rounded border border-primary/60 cursor-pointer transition
              ${selectedSeats.includes(seatId) ? 'bg-primary text-white' : ''}
              ${occupiedSeats.includes(seatId) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {seatId}
          </button>
        )
      })}
    </div>
  )

  return (
    <div className="flex flex-col md:flex-row px-6 md:px-16 lg:px-40 py-10 text-white gap-10">
      {/* ---------------- Left Panel: Movie + Timings ---------------- */}
      <div className="md:w-1/3 flex flex-col gap-6 sticky top-24">
        {/* Movie info */}
        <img
          src={movie.poster_path ? image_base_url + movie.poster_path : '/placeholder.jpg'}
          alt={movie.title}
          className="rounded-lg shadow-md w-full"
        />
        <h2 className="text-xl font-semibold">{movie.title}</h2>
        <p className="text-gray-300">{movie.genres?.map((g) => g.name).join(', ')}</p>
        <p className="text-gray-400">
          {timeFormat(movie.runtime)} • {movie.release_date?.split('-')[0]}
        </p>
        {/* Favorite & Trailer */}
        <div className="flex gap-4 mt-2">
          <button
            onClick={handleFavorite}
            className="p-2 bg-gray-700 rounded-full hover:bg-gray-600 transition"
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-primary text-primary' : ''}`} />
          </button>
          <button
            onClick={() => {
              if (movie.trailerKey) window.open(`https://www.youtube.com/watch?v=${movie.trailerKey}`)
              else toast.error('Trailer not available')
            }}
            className="flex items-center gap-1 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-md text-sm"
          >
            <PlayCircleIcon className="w-4 h-4" /> Trailer
          </button>
        </div>
        {/* Available show timings */}
        <div className="bg-primary/10 border-primary/20 rounded-lg p-4 mt-6">
          <h3 className="font-semibold mb-2">Available Timings</h3>
          <div className="space-y-2">
            {showTimes.map((item) => (
              <div
                key={item.time}
                onClick={() => setSelectedTime(item)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md cursor-pointer transition ${
                  selectedTime?.time === item.time ? 'bg-primary text-white' : 'hover:bg-primary/20'
                }`}
              >
                <ClockIcon className="w-4 h-4" />
                <span>{isoTimeFormat(item.time)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---------------- Right Panel: Seats ---------------- */}
      <div className="flex-1 flex flex-col items-center relative">
        <BlurCircle top="-100px" left="-100px" />
        <BlurCircle bottom="0" right="0" />

        <h2 className="text-2xl font-semibold mb-4">Select your seats</h2>
        <img src={assets.screenImage} alt="screen" className="mb-2" />
        <p className="text-gray-400 text-sm mb-6">Screen Side</p>

        {/* Seat grid */}
        <div className="flex flex-col items-center gap-4 text-xs text-gray-300">
          {groupRows.map((group, idx) => (
            <div key={idx} className="flex gap-8">
              {group.map((row) => renderSeats(row))}
            </div>
          ))}
        </div>

        {/* Checkout */}
        <button
          onClick={bookTickets}
          className="flex items-center gap-2 mt-10 px-10 py-3 bg-primary hover:bg-primary-dull rounded-full text-sm font-medium transition"
        >
          Proceed to Checkout <ArrowRightIcon strokeWidth={3} className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default SeatLayout
