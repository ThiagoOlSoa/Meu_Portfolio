import { useEffect, useState } from 'react'

export function useTema() {
  const [claro, setClaro] = useState(() => {
    try {
      return localStorage.getItem('theme') === 'light'
    } catch {
      return false
    }
  })

  useEffect(() => {
    document.documentElement.classList.toggle('light-mode', claro)
    try {
      localStorage.setItem('theme', claro ? 'light' : 'dark')
    } catch {}
  }, [claro])

  return [claro, () => setClaro((v) => !v)]
}

export function useFadeIn() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('visible')
        }),
      { threshold: 0.1 },
    )
    document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])
}
