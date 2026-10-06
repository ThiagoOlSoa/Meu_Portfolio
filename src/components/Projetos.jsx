import { asset, projetos } from '../data'

export default function Projetos() {
  return (
    <section id="projetos">
      <h2>Projetos</h2>
      <div className="grid-projetos">
        {projetos.map((p) => (
          <div className="card-projeto fade-in" key={p.titulo}>
            <img src={asset(p.imagem)} alt={p.alt} />
            <h3>{p.titulo}</h3>
            <p>{p.descricao}</p>
            <br />
            <a href={asset(p.link)} target="_blank" rel="noreferrer" className="ver">
              Ver Projeto
            </a>
          </div>
        ))}
      </div>
    </section>
  )
}
