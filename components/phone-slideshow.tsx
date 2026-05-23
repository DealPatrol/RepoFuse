'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'

const SLIDES = [
  {
    src: '/screenshots/blueprints.png',
    label: 'DISCOVER',
    title: 'Ideas ranked by viability',
    desc: 'AI surfaces the best apps hiding in your code, scored and ready to build.',
  },
  {
    src: '/screenshots/build-modal.png',
    label: 'BUILD',
    title: 'Generate all missing files',
    desc: 'Select an idea, pick GitHub or GitLab, and Claude writes every missing file.',
  },
  {
    src: '/screenshots/build-progress.png',
    label: 'SHIP',
    title: 'Watch it deploy in 30 seconds',
    desc: 'File generation, repo creation, and push — all automated end-to-end.',
  },
]

const INTERVAL_MS = 4000

export function PhoneSlideshow() {
  const [current, setCurrent] = useState(0)
  const [animating, setAnimating] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const go = useCallback(
    (idx: number) => {
      if (animating || idx === current) return
      setAnimating(true)
      setCurrent(idx)
      setTimeout(() => setAnimating(false), 450)
    },
    [animating, current],
  )

  const next = useCallback(() => go((current + 1) % SLIDES.length), [current, go])

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(next, INTERVAL_MS)
  }, [next])

  useEffect(() => {
    resetTimer()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [resetTimer])

  const handleDotClick = (idx: number) => {
    go(idx)
    resetTimer()
  }

  return (
    <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">
      {/* Phone mockup */}
      <div className="relative flex-shrink-0">
        {/* Ambient glow */}
        <div className="absolute inset-0 bg-cyan-500/15 blur-3xl rounded-full -z-10 scale-90" />
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-48 h-12 bg-cyan-500/10 blur-2xl -z-10" />

        {/* Phone shell */}
        <div
          className="relative bg-[#111827] rounded-[48px] shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_32px_80px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.06)]"
          style={{ width: 270, height: 560 }}
        >
          {/* Side buttons */}
          <div className="absolute -left-[3px] top-24 w-[3px] h-8 bg-white/10 rounded-l-sm" />
          <div className="absolute -left-[3px] top-36 w-[3px] h-14 bg-white/10 rounded-l-sm" />
          <div className="absolute -left-[3px] top-52 w-[3px] h-14 bg-white/10 rounded-l-sm" />
          <div className="absolute -right-[3px] top-32 w-[3px] h-16 bg-white/10 rounded-r-sm" />

          {/* Screen area */}
          <div className="absolute inset-[3px] rounded-[46px] overflow-hidden bg-[#0a0a0f]">
            {/* Dynamic Island */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center"
              style={{ width: 110, height: 30 }}>
              <div className="w-full h-full bg-black rounded-full shadow-lg" />
            </div>

            {/* Status bar */}
            <div className="absolute top-0 left-0 right-0 z-20 flex items-start justify-between px-8 pt-3">
              <span className="text-[10px] font-semibold text-white/70 mt-1">5:10</span>
              <div className="flex items-center gap-1 mt-1">
                <svg width="14" height="10" viewBox="0 0 14 10" fill="none" className="opacity-70">
                  <rect x="0" y="4" width="3" height="6" rx="0.5" fill="white"/>
                  <rect x="4" y="2.5" width="3" height="7.5" rx="0.5" fill="white"/>
                  <rect x="8" y="1" width="3" height="9" rx="0.5" fill="white"/>
                </svg>
                <svg width="14" height="10" viewBox="0 0 14 10" fill="none" className="opacity-70">
                  <path d="M7 2C9.5 2 11.7 3.1 13.2 4.8L14 4C12.3 2.1 9.8 1 7 1C4.2 1 1.7 2.1 0 4L0.8 4.8C2.3 3.1 4.5 2 7 2Z" fill="white"/>
                  <path d="M7 4C8.7 4 10.2 4.7 11.3 5.8L12.1 5C10.8 3.7 9 3 7 3C5 3 3.2 3.7 1.9 5L2.7 5.8C3.8 4.7 5.3 4 7 4Z" fill="white"/>
                  <circle cx="7" cy="8" r="1.5" fill="white"/>
                </svg>
                <div className="flex items-center gap-0.5 opacity-70">
                  <div className="w-5 h-2.5 border border-white rounded-sm relative">
                    <div className="absolute inset-0.5 right-1 bg-white rounded-sm" />
                    <div className="absolute -right-[3px] top-[3px] w-[3px] h-1 bg-white rounded-r-sm" />
                  </div>
                </div>
              </div>
            </div>

            {/* Slides */}
            {SLIDES.map((slide, i) => (
              <div
                key={i}
                className="absolute inset-0"
                style={{
                  opacity: i === current ? 1 : 0,
                  transition: 'opacity 0.45s ease-in-out',
                  zIndex: i === current ? 10 : 1,
                }}
              >
                <Image
                  src={slide.src}
                  alt={slide.label}
                  fill
                  sizes="270px"
                  className="object-cover object-top"
                  priority={i === 0}
                />
              </div>
            ))}

            {/* Home indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 w-28 h-[5px] bg-white/25 rounded-full" />
          </div>
        </div>
      </div>

      {/* Caption + nav */}
      <div className="flex flex-col gap-8 max-w-sm text-center md:text-left">
        <div className="space-y-1">
          <p className="text-xs font-mono font-bold tracking-[0.2em] text-cyan-400 uppercase">
            {SLIDES[current].label}
          </p>
          <h3
            className="text-2xl sm:text-3xl font-black text-white transition-all duration-300"
            key={`title-${current}`}
          >
            {SLIDES[current].title}
          </h3>
          <p className="text-base text-gray-400 leading-relaxed">{SLIDES[current].desc}</p>
        </div>

        {/* Slide list nav */}
        <div className="flex flex-col gap-3">
          {SLIDES.map((slide, i) => (
            <button
              key={i}
              onClick={() => handleDotClick(i)}
              className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-300 ${
                i === current
                  ? 'border-cyan-500/40 bg-cyan-500/8'
                  : 'border-white/6 bg-white/2 hover:border-white/12 hover:bg-white/5'
              }`}
            >
              <div
                className={`w-1 self-stretch rounded-full flex-shrink-0 transition-colors duration-300 ${
                  i === current ? 'bg-cyan-400' : 'bg-white/15'
                }`}
              />
              <div>
                <p className={`text-xs font-mono font-bold tracking-wider uppercase mb-0.5 transition-colors ${i === current ? 'text-cyan-400' : 'text-gray-500'}`}>
                  {slide.label}
                </p>
                <p className={`text-sm font-semibold transition-colors ${i === current ? 'text-white' : 'text-gray-400'}`}>
                  {slide.title}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Dot indicators */}
        <div className="flex gap-2 justify-center md:justify-start">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => handleDotClick(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? 'w-6 h-2 bg-cyan-400'
                  : 'w-2 h-2 bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
