import { useEffect, useState } from 'react'

// Rotas por hash (#/projeto/grm), porque o GitHub Pages não faz fallback de rotas.
let hashAtual = window.location.hash
const ouvintes = new Set()

function ir(hash) {
  hashAtual = hash
  try {
    window.location.hash = hash
  } catch {
    /* ambientes que bloqueiam o hash (prévia incorporada) usam só o estado interno */
  }
  ouvintes.forEach((f) => f())
}

function ler() {
  const [a, b] = hashAtual.replace(/^#\/?/, '').split('/')
  if (a === 'projeto' && b) return { name: 'projeto', id: b }
  if (a === 'stats') return { name: 'stats' }
  return { name: 'home' }
}

export function useRoute() {
  const [rota, setRota] = useState(ler)
  useEffect(() => {
    const aoMudar = () => setRota(ler())
    const aoHash = () => {
      hashAtual = window.location.hash
      aoMudar()
    }
    const aoClicar = (e) => {
      const a = e.target.closest && e.target.closest('a[href^="#/"]')
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey) return
      e.preventDefault()
      ir(a.getAttribute('href'))
    }
    ouvintes.add(aoMudar)
    window.addEventListener('hashchange', aoHash)
    document.addEventListener('click', aoClicar)
    return () => {
      ouvintes.delete(aoMudar)
      window.removeEventListener('hashchange', aoHash)
      document.removeEventListener('click', aoClicar)
    }
  }, [])
  return rota
}

export const caminhoProjeto = (id) => `#/projeto/${id}`

let pendente = null

// Rola até uma seção da home; se estiver numa página de projeto, volta para a home antes.
export function irParaSecao(id) {
  pendente = id
  if (ler().name === 'home') consumirRolagem()
  else ir('#/')
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
  else ir('#/')
}
