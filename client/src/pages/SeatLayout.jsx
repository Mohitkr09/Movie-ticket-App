import React, { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowRightIcon, ClockIcon, PlayCircleIcon, Heart } from "lucide-react"
import BlurCircle from "../components/BlurCircle"
import Loading from "../components/Loading"
import toast from "react-hot-toast"
import isoTimeFormat from "../lib/isoTimeFormat"
import timeFormat from "../lib/timeFormat"
import { useAppContext } from "../context/AppContext"
import { assets } from "../assets/assets"

const groupRows = [["A", "B"], ["C", "D"], ["E", "F"], ["G", "H"], ["I", "J"]]

const premiumRows = ["A", "B"]   // premium seats

const SeatLayout = () => {

  const { id, date } = useParams()
  const navigate = useNavigate()

  const {
    axios,
    getToken,
    user,
    fetchFavoriteMovies,
    favoriteMovies,
    image_base_url
  } = useAppContext()

  const [show, setShow] = useState(null)
  const [selectedSeats, setSelectedSeats] = useState([])
  const [selectedTime, setSelectedTime] = useState(null)
  const [occupiedSeats, setOccupiedSeats] = useState([])
  const [lockedSeats, setLockedSeats] = useState([])
  const [isFavorite, setIsFavorite] = useState(false)

  const [timeLeft, setTimeLeft] = useState(300)

  /* =========================
  FETCH SHOW
  ========================= */

  const getShow = async () => {
    try {

      const { data } = await axios.get(`/api/show/${id}`)

      if (data.success) setShow(data)

    } catch (error) {

      toast.error("Failed to fetch show")

    }
  }

  /* =========================
  FETCH BOOKED SEATS
  ========================= */

  const getOccupiedSeats = async () => {

    if (!selectedTime) return

    try {

      const { data } = await axios.get(`/api/booking/seats/${selectedTime.showId}`)

      if (data.success) {

        setOccupiedSeats(data.occupiedSeats)
        setLockedSeats(data.lockedSeats || [])

      }

    } catch (error) {

      console.log(error)

    }

  }

  /* =========================
  LOCK SEATS
  ========================= */

  const lockSeats = async (seats) => {

    try {

      await axios.post(
        "/api/booking/lock-seats",
        {
          showId: selectedTime.showId,
          seats
        },
        {
          headers: { Authorization: `Bearer ${await getToken()}` }
        }
      )

    } catch (error) {

      toast.error("Failed to lock seats")

    }

  }

  /* =========================
  SEAT CLICK
  ========================= */

  const handleSeatClick = async (seatId) => {

    if (!selectedTime) return toast("Select a time first")

    if (occupiedSeats.includes(seatId))
      return toast("Seat already booked")

    if (lockedSeats.includes(seatId))
      return toast("Seat temporarily locked")

    if (!selectedSeats.includes(seatId) && selectedSeats.length >= 5)
      return toast("Max 5 seats allowed")

    let updatedSeats

    if (selectedSeats.includes(seatId)) {

      updatedSeats = selectedSeats.filter((s) => s !== seatId)

    } else {

      updatedSeats = [...selectedSeats, seatId]

      await lockSeats([seatId])   // lock seat

    }

    setSelectedSeats(updatedSeats)

  }

  /* =========================
  BOOK TICKETS
  ========================= */

  const bookTickets = async () => {

    if (!user) return toast.error("Login required")

    if (!selectedTime || !selectedSeats.length)
      return toast.error("Select time & seats")

    try {

      const { data } = await axios.post(
        "/api/booking/create",
        {
          showId: selectedTime.showId,
          selectedSeats
        },
        {
          headers: { Authorization: `Bearer ${await getToken()}` }
        }
      )

      if (data.success) {

        window.location.href = data.url

      }

    } catch (error) {

      toast.error("Booking failed")

    }

  }

  /* =========================
  FAVORITE
  ========================= */

  const handleFavorite = async () => {

    if (!user) return toast.error("Login required")

    try {

      setIsFavorite(!isFavorite)

      const { data } = await axios.post(
        "/api/user/update-favorite",
        { movieId: id },
        {
          headers: { Authorization: `Bearer ${await getToken()}` }
        }
      )

      if (data.success) fetchFavoriteMovies()

    } catch (error) {

      setIsFavorite(!isFavorite)

      toast.error("Failed to update favorite")

    }

  }

  /* =========================
  TIMER
  ========================= */

  useEffect(() => {

    if (!selectedSeats.length) return

    const timer = setInterval(() => {

      setTimeLeft((prev) => {

        if (prev <= 1) {

          setSelectedSeats([])

          toast("Seat lock expired")

          return 300

        }

        return prev - 1

      })

    }, 1000)

    return () => clearInterval(timer)

  }, [selectedSeats])

  /* =========================
  EFFECTS
  ========================= */

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

  /* =========================
  SEAT RENDER
  ========================= */

  const renderSeats = (row, count = 10) => (

    <div key={row} className="flex gap-2 justify-center flex-wrap">

      {Array.from({ length: count }, (_, i) => {

        const seatId = `${row}${i + 1}`

        const isPremium = premiumRows.includes(row)

        let color = "border-primary/60"

        if (occupiedSeats.includes(seatId))
          color = "bg-red-500"

        else if (lockedSeats.includes(seatId))
          color = "bg-gray-400"

        else if (selectedSeats.includes(seatId))
          color = "bg-blue-500"

        else if (isPremium)
          color = "bg-yellow-400 text-black"

        return (

          <button
            key={seatId}
            onClick={() => handleSeatClick(seatId)}
            className={`h-9 w-9 rounded text-[11px] flex items-center justify-center transition ${color}`}
          >

            {seatId}

          </button>

        )

      })}

    </div>

  )

  return (

    <div className="px-4 sm:px-6 md:px-12 lg:px-24 py-10 text-white relative">

      <BlurCircle top="-120px" left="-120px" />
      <BlurCircle bottom="-40px" right="-40px" />

      <div className="w-full max-w-6xl mx-auto flex flex-col gap-12">

        {/* MOVIE SECTION */}

        <div className="flex flex-col md:flex-row gap-10">

          <div className="md:w-1/3 flex flex-col gap-6">

            <img
              src={
                movie.poster_path
                  ? image_base_url + movie.poster_path
                  : "/placeholder.jpg"
              }
              className="rounded-xl shadow-lg w-full object-cover max-h-[420px]"
            />

            <h2 className="text-2xl sm:text-3xl font-semibold">

              {movie.title}

            </h2>

            <p className="text-gray-300 text-sm sm:text-base">

              {movie.genres?.map((g) => g.name).join(", ")}

            </p>

            <p className="text-gray-400 text-sm sm:text-base">

              {timeFormat(movie.runtime)} •{" "}
              {movie.release_date?.split("-")[0]}

            </p>

            {/* TIMINGS */}

            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mt-4 w-full">

              <h3 className="font-semibold mb-3">

                Available Timings

              </h3>

              <div className="flex flex-wrap gap-2">

                {showTimes.map((t) => (

                  <div
                    key={t.time}
                    onClick={() => setSelectedTime(t)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md cursor-pointer transition
                      ${
                        selectedTime?.time === t.time
                          ? "bg-primary text-white"
                          : "hover:bg-primary/20"
                      }`}
                  >

                    <ClockIcon className="w-4 h-4" />

                    {isoTimeFormat(t.time)}

                  </div>

                ))}

              </div>

            </div>

          </div>

        </div>

        {/* SEATS */}

        {selectedTime ? (

          <div className="flex flex-col items-center">

            <h2 className="text-xl sm:text-2xl font-semibold mb-2">

              Select your seats

            </h2>

            <p className="text-sm text-gray-400 mb-6">

              Time remaining: {Math.floor(timeLeft / 60)}:
              {(timeLeft % 60).toString().padStart(2, "0")}

            </p>

            <img
              src={assets.screenImage}
              className="mx-auto mt-2 mb-2 max-w-[90%] sm:max-w-md"
            />

            <p className="text-gray-400 text-sm mb-10">

              Screen Side

            </p>

            <div className="flex flex-col gap-6 items-center">

              {groupRows.map((group, idx) => (

                <div
                  key={idx}
                  className="flex gap-6 justify-center flex-wrap"
                >

                  {group.map((row) => renderSeats(row))}

                </div>

              ))}

            </div>

            <button
              onClick={bookTickets}
              className="mt-10 px-10 py-3 bg-primary hover:bg-primary-dull rounded-full text-sm font-medium flex items-center gap-2"
            >

              Proceed to Checkout

              <ArrowRightIcon className="w-4 h-4" />

            </button>

          </div>

        ) : (

          <p className="text-gray-400 text-center text-lg">

            Select a showtime to view seats

          </p>

        )}

      </div>

    </div>

  )

}

export default SeatLayout