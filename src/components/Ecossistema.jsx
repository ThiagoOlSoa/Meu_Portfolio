import { ecossistema } from '../content'

// Diagrama real da arquitetura: o GRM como porta de entrada dos outros sistemas.
export function MapaEcossistema() {
  return (
    <div className="eco-map">
      <div className="eco-grm">
        <strong>GRM</strong>
        <span>Porta de entrada</span>
      </div>
      <ul className="eco-list">
        {ecossistema.modulos.map((m) => (
          <li className="eco-item" key={m.nome}>
            <strong>{m.nome}</strong>
            <span>{m.estado}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Ecossistema() {
  return (
    <figure className="eco">
      <MapaEcossistema />
      <figcaption>{ecossistema.legenda}</figcaption>
    </figure>
  )
}
