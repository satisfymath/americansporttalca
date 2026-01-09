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

      {/* Left rail - Hombre with red overlay */}
      <div
        className="rail-left"
        style={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          width: 'var(--rail-width)',
          height: '90%',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'flex-start',
        }}
      >
        <img
          src="./brand/hombre.png"
          alt=""
          loading="lazy"
          style={{
            height: '100%',
            width: 'auto',
            objectFit: 'contain',
            objectPosition: 'bottom left',
            opacity: 0.85,
            filter: 'saturate(0.9)',
            mixBlendMode: 'luminosity',
          }}
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
        {/* Red/Magenta overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, rgba(190, 24, 93, 0.3) 0%, transparent 70%)',
            mixBlendMode: 'multiply',
          }}
        />
      </div>
    </div>
  )
}
