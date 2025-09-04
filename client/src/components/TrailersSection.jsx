import React, { useEffect, useState, Suspense } from "react"
import { X } from "lucide-react"

// Lazy import ReactPlayer
const ReactPlayer = React.lazy(() => import("react-player"))

const TrailersSection = ({ movie, onClose }) => {
  const [trailers, setTrailers] = useState([])
  const [currentTrailer, setCurrentTrailer] = useState(null)

  useEffect(() => {
    const fetchTrailers = async () => {
      try {
        if (!movie?._id) return

        const res = await fetch(`/api/show/${movie._id}/videos`)
        const data = await res.json()

        if (data.success && data.trailers.length > 0) {
          setTrailers(data.trailers)
          setCurrentTrailer(data.trailers[0]) // first trailer as default
        }
      } catch (error) {
        console.error("Error fetching trailers:", error)
      }
    }

    fetchTrailers()
  }, [movie])

  if (!currentTrailer) return null

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-white text-2xl z-50"
      >
        <X size={32} />
      </button>

      {/* Main video player */}
      <div className="relative">
        <Suspense fallback={<div className="text-white">Loading player...</div>}>
          <ReactPlayer
            url={`https://www.youtube.com/watch?v=${currentTrailer.key}`}
            controls
            playing
            onEnded={onClose} // resume slideshow after trailer ends
            className="mx-auto max-w-full"
            width="960px"
            height="540px"
          />
        </Suspense>
      </div>

      {/* Thumbnails */}
      {trailers.length > 1 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-8 mt-6 max-w-3xl mx-auto">
          {trailers.map((trailer) => (
            <div
              key={trailer.id}
              className="relative cursor-pointer hover:opacity-80"
              onClick={() => setCurrentTrailer(trailer)}
            >
              <img
                src={`https://img.youtube.com/vi/${trailer.key}/hqdefault.jpg`}
                alt={trailer.name}
                className="rounded-lg w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TrailersSection

