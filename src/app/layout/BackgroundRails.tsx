// BackgroundRails - Decorative side images with overlays
// Hombre izquierda con tinte magenta, Mujer derecha con tinte azul

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

      {/* Left rail - Hombre with magenta overlay */}
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
        {/* Placeholder - will show if image exists */}
        <img
          src="./brand/unnamed.png"
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
        {/* Magenta overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, rgba(252, 2, 13, 0.30) 0%, transparent 70%)',
            mixBlendMode: 'multiply',
          }}
        />
      </div>

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

      {/* Cinta vertical izquierda */}
      <div
        className="cinta-vertical"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: '100%',
          width: 'clamp(40px, 4vw, 64px)',
          background: `linear-gradient(180deg, 
            var(--navy-950) 0%, 
            var(--red-600) 20%, 
            var(--white) 40%, 
            var(--red-600) 60%, 
            var(--navy-950) 80%,
            var(--navy-950) 100%
          )`,
          opacity: 0.9,
          boxShadow: '1px 0 0 rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Estrella decorativa */}
        <div
          style={{
            position: 'absolute',
            top: '15%',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 'clamp(18px, 2vw, 28px)',
            color: 'var(--white)',
            textShadow: '0 0 10px rgba(255,255,255,0.5)',
          }}
        >
          ★
        </div>
      </div>
    </div>
  )
}
