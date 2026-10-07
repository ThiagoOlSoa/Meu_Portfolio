import { useEffect, useRef, useState } from 'react'
import {
  asset,
  certificado,
  perfil,
  primeirosPassos,
  projetos,
  sobre,
  tecnologias,
  trajetoria,
} from '../content'
import { caminhoProjeto, irParaSecao } from '../router'
import { MapaEcossistema } from './Ecossistema'
import { CAMINHO_RAIO, Section } from './Layout'

// Efeito de velocidade: no desktop segue o mouse; no celular dispara uma vez
// cada vez que a foto aparece na tela.
function Retrato() {
  const [fx, setFx] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!window.matchMedia('(hover: none)').matches || !('IntersectionObserver' in window)) return
    let timer
    let visivel = false
    const obs = new IntersectionObserver(
      ([e]) => {
        const agora = e.intersectionRatio >= 0.5
        if (agora && !visivel) {
          setFx(true)
          timer = setTimeout(() => setFx(false), 1000)
        }
        visivel = agora
      },
      { threshold: [0, 0.5] },
    )
    obs.observe(ref.current)
    return () => {
      obs.disconnect()
      clearTimeout(timer)
    }
  }, [])

  const mouse = (valor) => (e) => {
    if (e.pointerType === 'mouse') setFx(valor)
  }

  return (
    <div
      className={`hero-art${fx ? ' fx' : ''}`}
      ref={ref}
      onPointerEnter={mouse(true)}
      onPointerLeave={mouse(false)}
    >
      <svg className="hero-bolt" viewBox="0 0 400 500" aria-hidden="true" focusable="false">
        <path className="bolt-fill" d={CAMINHO_RAIO} />
        <path
          className="bolt-line"
          d={CAMINHO_RAIO}
          pathLength="1"
          transform="translate(22 -18)"
        />
        <path
          className="bolt-hover"
          d={CAMINHO_RAIO}
          pathLength="1"
          transform="translate(22 -18)"
        />
      </svg>
      <span className="eco-frame eco-2" aria-hidden="true" />
      <span className="eco-frame eco-1" aria-hidden="true" />
      <span className="trail trail-1" aria-hidden="true" />
      <span className="trail trail-2" aria-hidden="true" />
      <span className="trail trail-3" aria-hidden="true" />
      <img
        className="hero-photo"
        src={asset('thiago.jpg')}
        alt="Thiago Soares, de camisa preta, em um fundo escuro com luzes vermelhas e douradas"
        width="900"
        height="1316"
        fetchPriority="high"
      />
    </div>
  )
}

function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-titulo">
      <div className="wrap hero-grid">
        <div className="hero-copy">
          <h1 className="hero-title" id="hero-titulo">
            Construo os sistemas por onde passa o trabalho de uma empresa.
          </h1>
          <p className="hero-lead">
            Sou Thiago Soares, desenvolvedor full stack em Salvador. No estágio, desenvolvo uma
            plataforma de gestão que já está em uso e três sistemas que se conectam a ela.
          </p>
          <div className="hero-actions">
            <a
              className="btn"
              href="#/projetos"
              onClick={(e) => {
                e.preventDefault()
                irParaSecao('projetos')
              }}
            >
              Ver projetos
            </a>
            <a
              className="link"
              href="#/contato"
              onClick={(e) => {
                e.preventDefault()
                irParaSecao('contato')
              }}
            >
              Falar comigo
            </a>
          </div>
        </div>
        <Retrato />
      </div>
    </section>
  )
}

function Destaque({ projeto }) {
  return (
    <a className="feature" href={caminhoProjeto(projeto.id)}>
      <div className="feature-text">
        <h3 className="feature-name">{projeto.nome}</h3>
        <p className={`feature-status status-${projeto.status}`}>{projeto.statusTexto}</p>
        <p className="feature-desc">{projeto.linha}</p>
        <span className="feature-cta">Ver o projeto</span>
      </div>
      <div className="feature-visual" aria-hidden="true">
        <MapaEcossistema />
      </div>
    </a>
  )
}

function Projetos() {
  const destaque = projetos.find((p) => p.destaque)
  const demais = projetos.filter((p) => !p.destaque)
  return (
    <Section id="projetos" titulo="Projetos">
      <p className="section-intro">
        Quatro sistemas que desenvolvo no estágio. O GRM está em uso; os outros três estão em
        teste e sendo conectados a ele. Nenhum dado real aparece aqui.
      </p>
      <Destaque projeto={destaque} />
      <ul className="rows">
        {demais.map((p) => (
          <li key={p.id}>
            <a className="row" href={caminhoProjeto(p.id)}>
              <span className="row-name">{p.nome}</span>
              <span className={`row-status status-${p.status}`}>{p.statusTexto}</span>
              <span className="row-desc">{p.linha}</span>
            </a>
          </li>
        ))}
      </ul>
    </Section>
  )
}

function Sobre() {
  return (
    <Section id="sobre" titulo="Sobre">
      <div className="prose">
        {sobre.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
      <dl className="defs defs-path">
        {trajetoria.map((t) => (
          <div className="def" key={t.quando}>
            <dt>{t.quando}</dt>
            <dd>{t.texto}</dd>
          </div>
        ))}
      </dl>
    </Section>
  )
}

function Tecnologias() {
  return (
    <Section id="tecnologias" titulo="Tecnologias">
      <p className="section-intro">Cada tecnologia aparece onde foi usada.</p>
      <dl className="defs">
        {tecnologias.map((t) => (
          <div className="def" key={t.onde}>
            <dt>{t.onde}</dt>
            <dd>{t.itens}</dd>
          </div>
        ))}
      </dl>
      <p className="section-note">
        <a className="link" href={asset(certificado.arquivo)} target="_blank" rel="noreferrer">
          {certificado.texto}
        </a>
      </p>
    </Section>
  )
}

function PrimeirosPassos() {
  return (
    <Section id="estudos" titulo="Estudos">
      <p className="section-intro">Projetos de estudo, anteriores ao estágio: exercícios de HTML e CSS.</p>
      <ul className="plain-list">
        {primeirosPassos.map((p) => (
          <li key={p.nome}>
            <a className="link" href={asset(p.arquivo)} target="_blank" rel="noreferrer">
              {p.nome}
            </a>
            <span className="plain-desc">{p.texto}</span>
          </li>
        ))}
      </ul>
    </Section>
  )
}

function Contato() {
  return (
    <Section id="contato" titulo="Contato">
      <div className="contact-panel">
        <div>
          <p className="contact-title">Precisa de um site ou de um sistema web?</p>
          <p className="contact-lead">
            Aberto a freelas. O jeito mais rápido de falar comigo é por e-mail.
          </p>
          <a className="btn" href={`mailto:${perfil.email}`}>
            Enviar e-mail
          </a>
        </div>
        <dl className="defs defs-contact">
          <div className="def">
            <dt>E-mail</dt>
            <dd>{perfil.email}</dd>
          </div>
          <div className="def">
            <dt>GitHub</dt>
            <dd>
              <a className="link" href={perfil.github} target="_blank" rel="noreferrer">
                ThiagoOlSoa
              </a>
            </dd>
          </div>
          <div className="def">
            <dt>LinkedIn</dt>
            <dd>
              <a className="link" href={perfil.linkedin} target="_blank" rel="noreferrer">
                thiagoolsoa
              </a>
            </dd>
          </div>
          <div className="def">
            <dt>Instagram</dt>
            <dd>
              <a className="link" href={perfil.instagram} target="_blank" rel="noreferrer">
                {perfil.instagramUser}
              </a>
            </dd>
          </div>
        </dl>
      </div>
    </Section>
  )
}

export default function Home() {
  return (
    <>
      <Hero />
      <Projetos />
      <Sobre />
      <Tecnologias />
      <PrimeirosPassos />
      <Contato />
    </>
  )
}
