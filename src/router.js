import { useEffect, useState } from 'react'

// Rotas por hash (#/projeto/grm), porque o GitHub Pages não faz fallback de rotas.
function ler() {
  const [a, b] = window.location.hash.replace(/^#\/?/, '').split('/')
  if (a === 'projeto' && b) return { name: 'projeto', id: b }
  return { name: 'home' }
}

export function useRoute() {
  const [rota, setRota] = useState(ler)
  useEffect(() => {
    const aoMudar = () => setRota(ler())
    window.addEventListener('hashchange', aoMudar)
    return () => window.removeEventListener('hashchange', aoMudar)
  }, [])
  return rota
}

export const caminhoProjeto = (id) => `#/projeto/${id}`

let pendente = null

// Rola até uma seção da home; se estiver numa página de projeto, volta para a home antes.
export function irParaSecao(id) {
  pendente = id
  if (ler().name === 'home') consumirRolagem()
  else window.location.hash = '#/'
}

export function consumirRolagem() {
  if (!pendente) return false
  const el = document.getElementById(pendente)
  pendente = null
  if (!el) return false
  const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduzir ? 'auto' : 'smooth' })
  return true
}

export function irParaTopo() {
  pendente = null
  if (ler().name === 'home') window.scrollTo(0, 0)
  else window.location.hash = '#/'
}
