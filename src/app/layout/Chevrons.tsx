// Chevrons - Animated navigation arrows (bottom right)
// Pulse animation on route changes

import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

export default function Chevrons() {
  const location = useLocation()
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    setIsTransitioning(true)
    const timer = setTimeout(() => setIsTransitioning(false), 450)
    return () => clearTimeout(timer)
  }, [location.pathname])

  return (
    <div
      aria-hidden="true"
      className={isTransitioning ? 'chevrons is-transitioning' : 'chevrons'}
      style={{
        position: 'fixed',
        right: 'clamp(16px, 3vw, 32px)',
        bottom: 'clamp(16px, 3vw, 32px)',
        zIndex: 'var(--z-chevrons)',
        pointerEvents: 'none',
        opacity: 0.65,
        transition: 'opacity var(--transition)',
      }}
    >
      {/* Use image if available, otherwise CSS chevrons */}
      <img
        src="./brand/flechas.png"
        alt=""
        style={{
          width: 'clamp(48px, 6vw, 80px)',
          height: 'auto',
          filter: 'drop-shadow(0 0 8px rgba(0, 40, 255, 0.3))',
        }}
        onError={(e) => {
          // Hide image and show fallback
          e.currentTarget.style.display = 'none'
          const fallback = e.currentTarget.nextElementSibling as HTMLElement
          if (fallback) fallback.style.display = 'flex'
        }}
      />
      {/* Fallback CSS chevrons */}
      <div
        style={{
          display: 'none',
          gap: '4px',
          flexDirection: 'row',
        }}
      >
        {[1, 2, 3].map((i) => (
          <svg
            key={i}
            width="20"
            height="32"
            viewBox="0 0 20 32"
            fill="none"
            style={{
              opacity: 0.4 + i * 0.2,
            }}
          >
            <path
              d="M4 4L16 16L4 28"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: 'var(--white)' }}
            />
          </svg>
        ))}
      </div>

      <style>{`
        .chevrons.is-transitioning {
          animation: chevronPulse 450ms ease-out;
        }
        
        @keyframes chevronPulse {
          0% {
            transform: translateX(0);
            opacity: 0.65;
          }
          50% {
            transform: translateX(10px);
            opacity: 0.95;
            filter: drop-shadow(0 0 12px rgba(0, 40, 255, 0.5));
          }
          100% {
            transform: translateX(0);
            opacity: 0.65;
          }
        }
        
        @media (prefers-reduced-motion: reduce) {
          .chevrons.is-transitioning {
            animation: none;
          }
        }
        
        @media (max-width: 768px) {
          .chevrons {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}
