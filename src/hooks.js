import { useState } from 'react'
import { movimentoReduzido } from './motion'

const temaDoSistema = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

// Risco diagonal que cruza a tela ao trocar o tema (desligado com movimento reduzido)
function faisca() {
  if (movimentoReduzido()) return
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
    if (!movimentoReduzido()) {
      // as cores deslizam em vez de pular enquanto o risco cruza a tela
      const raiz = document.documentElement
      raiz.classList.add('trocando-tema')
      setTimeout(() => raiz.classList.remove('trocando-tema'), 800)
    }
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
