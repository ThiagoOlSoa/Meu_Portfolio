import { asset, projetos } from '../content'
import { caminhoProjeto, irParaSecao } from '../router'
import Ecossistema from './Ecossistema'
import { Section } from './Layout'

function Capturas({ itens }) {
  if (!itens.length) return null
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
