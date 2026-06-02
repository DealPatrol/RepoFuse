'use client'

import { useEffect, useState } from 'react'

export function RepoFuseLogo3D({ className = "h-12 w-12" }: { className?: string }) {
  const [lightningActive, setLightningActive] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setLightningActive(true)
      setTimeout(() => setLightningActive(false), 200)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={`relative ${className}`}>
      {/* Glow effect behind logo */}
      <div className={`absolute inset-0 bg-cyan-500/30 blur-xl rounded-full transition-opacity duration-200 ${lightningActive ? 'opacity-80' : 'opacity-30'}`} />
      
      <svg
        viewBox="0 0 60 72"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 w-full h-full drop-shadow-[0_0_10px_rgba(0,229,255,0.5)]"
      >
        <defs>
          {/* Main gradient */}
          <linearGradient id="hexGradient" x1="0" y1="0" x2="60" y2="72" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00e5ff" />
            <stop offset="100%" stopColor="#ff6b35" />
          </linearGradient>
          
          {/* Lightning gradient */}
          <linearGradient id="lightningGradient" x1="0" y1="0" x2="100%" y2="0">
            <stop offset="0%" stopColor="#00e5ff" />
            <stop offset="50%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#ff6b35" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Electric pulse animation */}
          <filter id="electricGlow">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feFlood floodColor="#00e5ff" floodOpacity="0.8"/>
            <feComposite in2="blur" operator="in"/>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Hexagon border - 3D effect with multiple layers */}
        <polygon 
          points="30,2 56,16 56,56 30,70 4,56 4,16" 
          fill="#0d1f3a" 
          stroke="url(#hexGradient)" 
          strokeWidth="2"
          filter="url(#glow)"
        />
        
        {/* Inner hexagon for depth */}
        <polygon 
          points="30,8 50,20 50,52 30,64 10,52 10,20" 
          fill="transparent" 
          stroke="rgba(0,229,255,0.3)" 
          strokeWidth="1"
        />

        {/* Left branch - Cyan */}
        <g filter={lightningActive ? "url(#electricGlow)" : "url(#glow)"}>
          <circle cx="20" cy="18" r="4" fill="#00e5ff">
            <animate attributeName="opacity" values="1;0.6;1" dur="2s" repeatCount="indefinite"/>
          </circle>
          <circle cx="20" cy="36" r="4" fill="none" stroke="#00e5ff" strokeWidth="2"/>
          <circle cx="20" cy="54" r="4" fill="#00e5ff">
            <animate attributeName="opacity" values="1;0.6;1" dur="2s" repeatCount="indefinite" begin="0.5s"/>
          </circle>
          <line x1="20" y1="22" x2="20" y2="32" stroke="#00e5ff" strokeWidth="2">
            <animate attributeName="stroke-opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite"/>
          </line>
          <line x1="20" y1="40" x2="20" y2="50" stroke="#00e5ff" strokeWidth="2">
            <animate attributeName="stroke-opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite" begin="0.3s"/>
          </line>
        </g>

        {/* Right branch - Orange */}
        <g filter={lightningActive ? "url(#electricGlow)" : "url(#glow)"}>
          <circle cx="40" cy="18" r="4" fill="#ff6b35">
            <animate attributeName="opacity" values="1;0.6;1" dur="2s" repeatCount="indefinite" begin="0.2s"/>
          </circle>
          <circle cx="40" cy="36" r="4" fill="none" stroke="#ff6b35" strokeWidth="2"/>
          <circle cx="40" cy="54" r="4" fill="#ff6b35">
            <animate attributeName="opacity" values="1;0.6;1" dur="2s" repeatCount="indefinite" begin="0.7s"/>
          </circle>
          <line x1="40" y1="22" x2="40" y2="32" stroke="#ff6b35" strokeWidth="2">
            <animate attributeName="stroke-opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite" begin="0.2s"/>
          </line>
          <line x1="40" y1="40" x2="40" y2="50" stroke="#ff6b35" strokeWidth="2">
            <animate attributeName="stroke-opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite" begin="0.5s"/>
          </line>
        </g>

        {/* Center fusion point */}
        <g>
          <line x1="20" y1="36" x2="30" y2="36" stroke="url(#lightningGradient)" strokeWidth="2">
            <animate attributeName="stroke-opacity" values="0.5;1;0.5" dur="1s" repeatCount="indefinite"/>
          </line>
          <line x1="40" y1="36" x2="30" y2="36" stroke="url(#lightningGradient)" strokeWidth="2">
            <animate attributeName="stroke-opacity" values="0.5;1;0.5" dur="1s" repeatCount="indefinite" begin="0.1s"/>
          </line>
          <circle cx="30" cy="36" r="6" fill="none" stroke="url(#hexGradient)" strokeWidth="2">
            <animate attributeName="r" values="5;6;5" dur="2s" repeatCount="indefinite"/>
          </circle>
          <circle cx="30" cy="36" r="3" fill="url(#hexGradient)">
            <animate attributeName="opacity" values="0.8;1;0.8" dur="1s" repeatCount="indefinite"/>
          </circle>
        </g>

        {/* Lightning bolt effect - appears periodically */}
        {lightningActive && (
          <g className="animate-pulse">
            <path 
              d="M30,10 L28,24 L34,24 L26,42 L32,42 L24,62" 
              fill="none" 
              stroke="#ffffff" 
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#electricGlow)"
            />
            <path 
              d="M30,10 L28,24 L34,24 L26,42 L32,42 L24,62" 
              fill="none" 
              stroke="#00e5ff" 
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        )}

        {/* Additional electric sparks */}
        <g opacity={lightningActive ? "1" : "0"} className="transition-opacity duration-100">
          <circle cx="15" cy="28" r="1" fill="#00e5ff"/>
          <circle cx="45" cy="28" r="1" fill="#ff6b35"/>
          <circle cx="25" cy="50" r="1" fill="#00e5ff"/>
          <circle cx="35" cy="22" r="1" fill="#ff6b35"/>
        </g>
      </svg>

      {/* Text beneath logo */}
      <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
        <span className="text-xs font-bold tracking-widest">
          <span className="text-cyan-400">REPO</span>
          <span className="text-orange-400">FUSE</span>
        </span>
      </div>
    </div>
  )
}
