import { asset, certificado, tecnologias } from '../data'

export default function Tecnologias() {
  return (
    <section className="tecnologias">
      <h2>Tecnologias Conhecidas</h2>
      <ul>
        {tecnologias.map((t) => (
          <li key={t}>{t}</li>
        ))}
        <li>
          <a href={asset(certificado.link)} target="_blank" rel="noreferrer">
            {certificado.texto}
          </a>
        </li>
      </ul>
    </section>
  )
}
