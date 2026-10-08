import { useEffect } from 'react'

// Eventos do GoatCounter (sem cookies). Cada evento é um "caminho" com prefixo:
//   clique/<nome>  → clique em link marcado com data-gc="<nome>"
//   secao/<nome>   → seção que chegou à tela (uma vez por visita)
// Se o GoatCounter não carregou (bloqueador de anúncios) ou a página é a de
// estatísticas, nada é enviado.
export const ROTULOS = {
  'clique/whatsapp': 'Clique: WhatsApp',
  'clique/email': 'Clique: e-mail',
  'clique/github': 'Clique: GitHub',
  'clique/linkedin': 'Clique: LinkedIn',
  'clique/instagram': 'Clique: Instagram',
  'clique/falar-projeto': 'Clique: falar sobre o projeto',
  'clique/certificado': 'Clique: certificado',
  'clique/estudo': 'Clique: exercício de estudo',
  'clique/curriculo': 'Clique: currículo',
  'secao/projetos': 'Seção: Projetos',
  'secao/servicos': 'Seção: Serviços',
  'secao/sobre': 'Seção: Sobre',
  'secao/tecnologias': 'Seção: Tecnologias',
  'secao/estudos': 'Seção: Estudos',
  'secao/contato': 'Seção: Contato',
}

export function registrar(path, tentativas = 3) {
  if (window.location.hash.startsWith('#/stats')) return
  const gc = window.goatcounter
  if (gc && typeof gc.count === 'function') {
    gc.count({ path, title: ROTULOS[path] || path, event: true })
  } else if (tentativas > 0) {
    setTimeout(() => registrar(path, tentativas - 1), 1500)
  }
}

// Um único ouvinte de clique para todos os links com data-gc
export function useCliques() {
  useEffect(() => {
    const aoClicar = (e) => {
      const el = e.target.closest && e.target.closest('[data-gc]')
      if (el) registrar(`clique/${el.dataset.gc}`)
    }
    document.addEventListener('click', aoClicar)
    return () => document.removeEventListener('click', aoClicar)
  }, [])
}

// Registra cada seção da home uma vez por visita, quando metade dela aparece
export function useSecoesVistas(ids) {
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return
    const vistas = new Set()
    const obs = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((en) => {
          if (!en.isIntersecting || vistas.has(en.target.id)) return
          vistas.add(en.target.id)
          obs.unobserve(en.target)
          registrar(`secao/${en.target.id}`)
        })
      },
      { threshold: 0.35 },
    )
    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) obs.observe(el)
    })
    return () => obs.disconnect()
  }, [ids])
}
