import { useState } from 'react'

const temaDoSistema = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

// Risco diagonal que cruza a tela ao trocar o tema (desligado com movimento reduzido)
function faisca() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const el = document.createElement('div')
  el.className = 'faisca'
  el.setAttribute('aria-hidden', 'true')
  document.body.appendChild(el)
  el.addEventListener('animationend', () => el.remove(), { once: true })
}

export function useTema() {
  const [tema, setTema] = useState(() => document.documentElement.dataset.theme || temaDoSistema())

  const alternar = () => {
    const proximo = tema === 'dark' ? 'light' : 'dark'
    faisca()
    document.documentElement.dataset.theme = proximo
    try {
      localStorage.setItem('theme', proximo)
    } catch {
      // sem armazenamento disponível: o tema vale só nesta visita
    }
    setTema(proximo)
  }

  return [tema, alternar]
}
