// BackgroundRails - Decorative side images with overlays
// Banda izquierda, Mujer derecha con tinte azul

export default function BackgroundRails() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--z-rails)',
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Gradient base background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            linear-gradient(90deg, var(--magenta-700) 0%, var(--navy-950) 35%, var(--ink-950) 100%),
            radial-gradient(circle at 50% 0%, rgba(0, 40, 255, 0.18), transparent 55%)
          `,
          backgroundBlendMode: 'normal',
        }}
      />

      {/* Radial glow top center */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          height: '60%',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(0, 40, 255, 0.15), transparent 60%)',
        }}
      />

      {/* Right rail - Mujer with blue overlay */}
      <div
        className="rail-right"
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: 'var(--rail-width)',
          height: '90%',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
        }}
      >
        <img
          src="./brand/mujer.png"
          alt=""
          loading="lazy"
          style={{
            height: '100%',
            width: 'auto',
            objectFit: 'contain',
            objectPosition: 'bottom right',
            opacity: 0.85,
            filter: 'saturate(0.9)',
            mixBlendMode: 'luminosity',
          }}
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
        {/* Blue overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(270deg, rgba(0, 40, 255, 0.25) 0%, transparent 70%)',
            mixBlendMode: 'multiply',
          }}
        />
      </div>

      {/* Banda vertical izquierda - usando imagen */}
      <div
        className="cinta-vertical"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: '100%',
          width: 'clamp(48px, 5vw, 72px)',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <img
          src="./brand/banda.png"
          alt=""
          style={{
            height: '100%',
            width: 'auto',
            objectFit: 'cover',
            objectPosition: 'top center',
          }}
          onError={(e) => {
            // Fallback to CSS gradient if image fails
            e.currentTarget.style.display = 'none'
            const parent = e.currentTarget.parentElement
            if (parent) {
              parent.style.background = `linear-gradient(180deg, 
                var(--navy-950) 0%, 
                var(--red-600) 20%, 
                var(--white) 40%, 
                var(--red-600) 60%, 
                var(--navy-950) 80%,
                var(--navy-950) 100%
              )`
            }
          }}
        />
      </div>
    </div>
  )
}
