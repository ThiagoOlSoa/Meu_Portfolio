import {
  asset,
  certificado,
  perfil,
  primeirosPassos,
  projetos,
  sobre,
  tecnologias,
} from '../content'
import { caminhoProjeto, irParaSecao } from '../router'
import { Section } from './Layout'

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
        <div className="hero-art">
          <div className="hero-slab" aria-hidden="true" />
          <img
            className="hero-photo"
            src={asset('thiago.jpg')}
            alt="Thiago Soares sorrindo, em frente a uma cachoeira"
            width="1000"
            height="979"
            fetchPriority="high"
          />
        </div>
      </div>
    </section>
  )
}

function Projetos() {
  return (
    <Section id="projetos" titulo="Projetos">
      <p className="section-intro">
        Quatro sistemas que desenvolvo no estágio. O GRM está em uso; os outros três estão em
        teste e sendo conectados a ele. Nenhum dado real aparece aqui.
      </p>
      <ul className="rows">
        {projetos.map((p) => (
          <li key={p.id}>
            <a className={`row${p.destaque ? ' row-lead' : ''}`} href={caminhoProjeto(p.id)}>
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
    <Section id="primeiros-passos" titulo="Primeiros passos">
      <p className="section-intro">Exercícios de HTML e CSS que fiz ao começar.</p>
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
      <p className="contact-lead">
        Aberto a freelas de sites e sistemas web. O jeito mais rápido de falar comigo é por e-mail.
      </p>
      <a className="btn" href={`mailto:${perfil.email}`}>
        Enviar e-mail
      </a>
      <dl className="defs defs-contact">
        <div className="def">
          <dt>E-mail</dt>
          <dd>
            <a className="link" href={`mailto:${perfil.email}`}>
              {perfil.email}
            </a>
          </dd>
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
          <dt>Instagram</dt>
          <dd>
            <a className="link" href={perfil.instagram} target="_blank" rel="noreferrer">
              {perfil.instagramUser}
            </a>
          </dd>
        </div>
      </dl>
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
