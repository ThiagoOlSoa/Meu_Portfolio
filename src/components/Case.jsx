import { useEffect, useRef, useState } from 'react'
import { asset, projetos } from '../content'
import { movimentoReduzido } from '../motion'
import { caminhoProjeto, irParaSecao } from '../router'
import Ecossistema from './Ecossistema'
import { Section } from './Layout'

const TEMPO_PASSO = 4200

// Sequência de telas do fluxo: troca sozinha enquanto está visível, para ao passar o mouse ou clicar.
function Fluxo({ itens }) {
  const [i, setI] = useState(0)
  const [auto, setAuto] = useState(!movimentoReduzido())
  const [visivel, setVisivel] = useState(false)
  const [parado, setParado] = useState(false)
  const ref = useRef(null)
  const rodando = auto && visivel && !parado

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return
    const obs = new IntersectionObserver(([e]) => setVisivel(e.isIntersecting), { threshold: 0.5 })
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!rodando) return
    const t = setTimeout(() => setI((x) => (x + 1) % itens.length), TEMPO_PASSO)
    return () => clearTimeout(t)
  }, [rodando, i, itens.length])

  return (
    <div
      className="fluxo"
      ref={ref}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setParado(true)}
      onPointerLeave={() => setParado(false)}
    >
      <div className="fluxo-tela">
        {itens.map((c, n) => (
          <figure key={c.arquivo} className={n === i ? 'on' : ''} aria-hidden={n !== i}>
            <img src={asset(`capturas/${c.arquivo}`)} alt={c.alt} loading="lazy" />
          </figure>
        ))}
      </div>
      <p className="fluxo-legenda" aria-live="polite">
        <span className="fluxo-n">
          {i + 1}/{itens.length}
        </span>
        {itens[i].legenda} Dados fictícios.
      </p>
      <div className="fluxo-passos">
        {itens.map((c, n) => (
          <button
            key={c.arquivo}
            type="button"
            className={n === i ? 'on' : ''}
            aria-current={n === i ? 'step' : undefined}
            aria-label={`Tela ${n + 1}: ${c.legenda}`}
            onClick={() => {
              setI(n)
              setAuto(false)
            }}
          >
            <span
              key={n === i && rodando ? `r${i}` : `p${n}`}
              className={n === i && rodando ? 'run' : ''}
              style={{ animationDuration: `${TEMPO_PASSO}ms` }}
            />
          </button>
        ))}
        <button
          type="button"
          className="fluxo-play"
          onClick={() => setAuto((a) => !a)}
          aria-pressed={!auto}
        >
          {auto ? 'Pausar' : 'Tocar'}
        </button>
      </div>
    </div>
  )
}

function Capturas({ itens }) {
  if (!itens.length) return null
  if (itens.length > 1)
    return (
      <Section id="caso-capturas" titulo="Fluxo">
        <Fluxo itens={itens} />
      </Section>
    )
  return (
    <Section id="caso-capturas" titulo="Capturas">
      <div className="shots">
        {itens.map((c) => (
          <figure key={c.arquivo}>
            <img src={asset(`capturas/${c.arquivo}`)} alt={c.alt} loading="lazy" />
            <figcaption>{c.legenda} Dados fictícios.</figcaption>
          </figure>
        ))}
      </div>
    </Section>
  )
}

export default function Case({ projeto }) {
  const indice = projetos.findIndex((p) => p.id === projeto.id)
  const proximo = projetos[(indice + 1) % projetos.length]

  return (
    <article>
      <header className="case-head">
        <div className="wrap">
          <a
            className="link"
            href="#/projetos"
            onClick={(e) => {
              e.preventDefault()
              irParaSecao('projetos')
            }}
          >
            Todos os projetos
          </a>
          <h1 className="case-title">{projeto.nome}</h1>
          <p className={`case-status status-${projeto.status}`}>{projeto.statusTexto}</p>
          <p className="case-lead">{projeto.resumo}</p>
        </div>
      </header>

      <Section id="caso-problema" titulo="O problema">
        <p className="prose-text">{projeto.problema}</p>
      </Section>

      <Section id="caso-funciona" titulo="Como funciona">
        <ol className="steps">
          {projeto.passos.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ol>
        {projeto.ecossistema && <Ecossistema />}
      </Section>

      <Section id="caso-decisoes" titulo="Decisões técnicas">
        <div className="decisions">
          {projeto.decisoes.map((d) => (
            <div className="decision" key={d.titulo}>
              <h3>{d.titulo}</h3>
              <p>{d.texto}</p>
            </div>
          ))}
        </div>
      </Section>

      <Capturas itens={projeto.capturas} />

      <Section id="caso-stack" titulo="Tecnologias">
        <p className="prose-text">{projeto.stack}</p>
      </Section>

      <Section id="caso-estado" titulo="Estado atual">
        <p className="prose-text">{projeto.estado}</p>
      </Section>

      <section className="section case-next">
        <div className="wrap">
          <a className="next-link" href={caminhoProjeto(proximo.id)}>
            <span className="next-label">Próximo projeto</span>
            <span className="next-name">{proximo.nome}</span>
          </a>
        </div>
      </section>
    </article>
  )
}
