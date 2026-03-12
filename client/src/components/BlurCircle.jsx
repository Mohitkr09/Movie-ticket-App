import React from "react"

const BlurCircle = ({
  top = "auto",
  left = "auto",
  right = "auto",
  bottom = "auto",
  size = 260
}) => {

  return (

    <div
      className="absolute -z-50 pointer-events-none"
      style={{ top, left, right, bottom }}
    >

      {/* Main glow */}

      <div
        className="rounded-full blur-3xl opacity-40 animate-pulse"
        style={{
          width: size,
          height: size,
          background:
            "radial-gradient(circle at center, rgba(255,0,150,0.6), rgba(0,200,255,0.4), transparent)"
        }}
      />

      {/* Secondary glow layer */}

      <div
        className="absolute inset-0 rounded-full blur-[120px] opacity-30"
        style={{
          background:
            "radial-gradient(circle at center, rgba(99,102,241,0.5), transparent)"
        }}
      />

    </div>

  )

}

export default BlurCircle