import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowRightIcon, ClockIcon, PlayCircleIcon, Heart } from 'lucide-react'
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

  // ---------------- Fetch show info ----------------
  const getShow = async () => {
    try {
      const { data } = await axios.get(`/api/show/${id}`)
      if (data.success) setShow(data)
    } catch (error) {
      toast.error('Failed to fetch show')
    }
  }

  // ---------------- Fetch occupied seats ----------------
  const getOccupiedSeats = async () => {
    if (!selectedTime) return
    try {
      const { data } = await axios.get(`/api/booking/seats/${selectedTime.showId}`)
      if (data.success) setOccupiedSeats(data.occupiedSeats)
    } catch (error) {
      console.log(error)
    }
  }

  // ---------------- Seat selection ----------------
  const handleSeatClick = (seatId) => {
    if (!selectedTime) return toast('Select a time first')
    if (occupiedSeats.includes(seatId)) return toast('Seat already booked')
    if (!selectedSeats.includes(seatId) && selectedSeats.length >= 5)
      return toast('You can select a maximum of 5 seats')

    setSelectedSeats((prev) =>
      prev.includes(seatId) ? prev.filter((s) => s !== seatId) : [...prev, seatId]
    )
  }

  // ---------------- Book tickets ----------------
  const bookTickets = async () => {
    if (!user) return toast.error('Login required')
    if (!selectedTime || !selectedSeats.length) return toast.error('Select time & seats')

    try {
      const { data } = await axios.post(
        '/api/booking/create',
        { showId: selectedTime.showId, selectedSeats },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      )
      if (data.success) window.location.href = data.url
    } catch (error) {
      toast.error('Booking failed')
    }
  }

  // ---------------- Toggle favorite ----------------
  const handleFavorite = async () => {
    if (!user) return toast.error('Login required')

    try {
      setIsFavorite(!isFavorite)
      const { data } = await axios.post(
        '/api/user/update-favorite',
        { movieId: id },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      )
      if (data.success) fetchFavoriteMovies()
    } catch (error) {
      setIsFavorite(!isFavorite)
      toast.error('Failed to update favorite')
    }
  }

  // ---------------- Effects ----------------
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

  // ---------------- Render a row of seats ----------------
  const renderSeats = (row, count = 10) => (
    <div key={row} className="flex gap-2 justify-center flex-wrap">
      {Array.from({ length: count }, (_, i) => {
        const seatId = `${row}${i + 1}`
        return (
          <button
            key={seatId}
            onClick={() => handleSeatClick(seatId)}
            className={`h-9 w-9 rounded border text-[11px] flex items-center justify-center transition
              ${selectedSeats.includes(seatId) ? 'bg-primary text-white' : 'border-primary/60'}
              ${occupiedSeats.includes(seatId) ? 'opacity-40 cursor-not-allowed' : 'hover:border-primary'}
            `}
          >
            {seatId}
          </button>
        )
      })}
    </div>
  )

  return (
    <div className="px-6 md:px-16 lg:px-36 py-14 text-white relative">

      <BlurCircle top="-120px" left="-120px" />
      <BlurCircle bottom="-40px" right="-40px" />

      <div className="w-full max-w-5xl mx-auto flex flex-col gap-12">

        {/* ---------------- Movie Info + Timings ---------------- */}
        <div className="flex flex-col md:flex-row gap-10">

          {/* LEFT SIDE */}
          <div className="md:w-1/3 flex flex-col gap-6">

            <img
              src={movie.poster_path ? image_base_url + movie.poster_path : "/placeholder.jpg"}
              className="rounded-xl shadow-lg w-full"
            />

            <h2 className="text-3xl font-semibold">{movie.title}</h2>
            <p className="text-gray-300">{movie.genres?.map((g) => g.name).join(", ")}</p>
            <p className="text-gray-400">{timeFormat(movie.runtime)} • {movie.release_date?.split("-")[0]}</p>

            {/* Favorite + Trailer */}
            <div className="flex gap-4">
              <button onClick={handleFavorite} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700">
                <Heart className={`w-5 h-5 ${isFavorite ? "fill-primary text-primary" : ""}`} />
              </button>

              <button
                onClick={() =>
                  movie.trailerKey
                    ? window.open(`https://www.youtube.com/watch?v=${movie.trailerKey}`)
                    : toast.error("Trailer not available")
                }
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 text-sm"
              >
                <PlayCircleIcon className="w-4 h-4" /> Trailer
              </button>
            </div>

            {/* Available Timings */}
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mt-4">
              <h3 className="font-semibold mb-3">Available Timings</h3>

              <div className="space-y-2">
                {showTimes.map(t => (
                  <div
                    key={t.time}
                    onClick={() => setSelectedTime(t)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md cursor-pointer transition
                      ${selectedTime?.time === t.time ? "bg-primary text-white" : "hover:bg-primary/20"}
                    `}
                  >
                    <ClockIcon className="w-4 h-4" />
                    {isoTimeFormat(t.time)}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* ---------------- Seat Layout (STATIC BELOW TIMINGS) ---------------- */}
        {selectedTime ? (
          <div className="flex flex-col items-center">

            <h2 className="text-2xl font-semibold mb-4">Select your seats</h2>

            <img src={assets.screenImage} className="mx-auto mt-2 mb-2" />
            <p className="text-gray-400 text-sm mb-10">Screen Side</p>

            {/* Seat Grid */}
            <div className="flex flex-col gap-8 items-center">
              {groupRows.map((group, idx) => (
                <div key={idx} className="flex gap-8 justify-center flex-wrap">
                  {group.map(row => renderSeats(row))}
                </div>
              ))}
            </div>

            <button
              onClick={bookTickets}
              className="mt-10 px-10 py-3 bg-primary hover:bg-primary-dull rounded-full text-sm font-medium flex items-center gap-2"
            >
              Proceed to Checkout <ArrowRightIcon className="w-4 h-4" />
            </button>

          </div>
        ) : (
          <p className="text-gray-400 text-center text-lg">Select a showtime to view seats</p>
        )}

      </div>
    </div>
  )
}

export default SeatLayout
