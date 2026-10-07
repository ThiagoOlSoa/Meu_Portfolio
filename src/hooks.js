import { useState } from 'react'

const temaDoSistema = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

export function useTema() {
  const [tema, setTema] = useState(() => document.documentElement.dataset.theme || temaDoSistema())

  const alternar = () => {
    const proximo = tema === 'dark' ? 'light' : 'dark'
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
