import { useEffect, useRef, useState } from 'react'

export const movimentoReduzido = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Revela cada seção uma vez, quando entra na tela. Sem JS ou com movimento reduzido, tudo aparece de início.
export function useRevelar(chave) {
  useEffect(() => {
    const alvos = [...document.querySelectorAll('.rev:not(.in)')]
    if (!alvos.length) return
    if (movimentoReduzido() || !('IntersectionObserver' in window)) {
      alvos.forEach((a) => a.classList.add('in'))
      return
    }
    document.documentElement.classList.add('js-rev')
    const obs = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => {
          if (!e.isIntersecting) return
          e.target.classList.add('in')
          obs.unobserve(e.target)
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    )
    alvos.forEach((a) => obs.observe(a))
    return () => obs.disconnect()
  }, [chave])
}

// Número que sobe até o valor real quando aparece na tela.
export function Contagem({ para }) {
  const [n, setN] = useState(movimentoReduzido() ? para : 0)
  const ref = useRef(null)
  useEffect(() => {
    if (movimentoReduzido() || !('IntersectionObserver' in window)) {
      setN(para)
      return
    }
    let raf
    const obs = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        obs.disconnect()
        const ini = performance.now()
        const dur = 800
        const passo = (t) => {
          const p = Math.min(1, (t - ini) / dur)
          setN(Math.round(para * (1 - Math.pow(1 - p, 3))))
          if (p < 1) raf = requestAnimationFrame(passo)
        }
        raf = requestAnimationFrame(passo)
      },
      { threshold: 0.6 },
    )
    obs.observe(ref.current)
    return () => {
      obs.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [para])
  return (
    <span ref={ref} aria-label={String(para)}>
      <span aria-hidden="true">{n}</span>
    </span>
  )
}
