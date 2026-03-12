import React, { useState, useRef } from "react"
import BlurCircle from "./BlurCircle"
import { toast } from "react-hot-toast"
import { useNavigate } from "react-router-dom"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

const DateSelect = ({ dateTime, id }) => {

  const navigate = useNavigate()
  const scrollRef = useRef(null)

  const [selected, setSelected] = useState(null)

  const onBookHandler = () => {

    if (!selected) {
      return toast("Please select a date")
    }

    navigate(`/movies/${id}/${selected}`)

    window.scrollTo({ top: 0, behavior: "smooth" })

  }

  const scrollLeft = () => {
    scrollRef.current.scrollBy({ left: -200, behavior: "smooth" })
  }

  const scrollRight = () => {
    scrollRef.current.scrollBy({ left: 200, behavior: "smooth" })
  }

  return (

    <section id="dateSelect" className="pt-28 px-6 md:px-16 lg:px-28">

      <div className="relative p-8 md:p-10 bg-primary/10 border border-primary/20 rounded-2xl overflow-hidden">

        {/* background glow */}

        <BlurCircle top="-120px" left="-120px" size={260} />
        <BlurCircle top="-100px" right="-100px" size={240} />

        <div className="flex flex-col md:flex-row items-center justify-between gap-10">

          {/* LEFT SECTION */}

          <div>

            <h3 className="text-xl font-semibold text-white">

              Choose Your Date

            </h3>

            <p className="text-gray-400 text-sm mt-1">

              Select a date to see available showtimes

            </p>

            {/* DATE SCROLLER */}

            <div className="flex items-center gap-4 mt-6">

              <button
                onClick={scrollLeft}
                className="bg-gray-800 hover:bg-gray-700 p-2 rounded-full transition"
              >
                <ChevronLeftIcon width={22} />
              </button>

              <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide"
              >

                {Object.keys(dateTime).map((date) => {

                  const day = new Date(date).toLocaleDateString("en-US", {
                    weekday: "short"
                  })

                  const dayNum = new Date(date).getDate()

                  const month = new Date(date).toLocaleDateString("en-US", {
                    month: "short"
                  })

                  return (

                    <button
                      key={date}
                      onClick={() => setSelected(date)}
                      className={`flex flex-col items-center justify-center 
                      min-w-[70px] h-[70px] rounded-xl border transition-all duration-200

                      ${
                        selected === date
                          ? "bg-primary text-white border-primary scale-105 shadow-lg"
                          : "border-gray-600 hover:border-primary hover:bg-primary/20"
                      }`}
                    >

                      <span className="text-xs text-gray-400">

                        {day}

                      </span>

                      <span className="text-lg font-semibold">

                        {dayNum}

                      </span>

                      <span className="text-xs">

                        {month}

                      </span>

                    </button>

                  )

                })}

              </div>

              <button
                onClick={scrollRight}
                className="bg-gray-800 hover:bg-gray-700 p-2 rounded-full transition"
              >
                <ChevronRightIcon width={22} />
              </button>

            </div>

          </div>

          {/* RIGHT CTA */}

          <div className="flex flex-col items-center">

            <button
              onClick={onBookHandler}
              className="bg-primary hover:bg-primary/90 text-white px-10 py-3 rounded-full font-semibold shadow-md transition"
            >

              Book Tickets

            </button>

            <p className="text-gray-400 text-xs mt-2">

              Seats will be reserved for 5 minutes

            </p>

          </div>

        </div>

      </div>

    </section>

  )

}

export default DateSelect