import { contatos } from '../data'

export default function Contato() {
  return (
    <section className="contato">
      <h2>Vamos conversar?</h2>
      <p>Entre em contato ou veja meu GitHub.</p>
      <br />
      <ul>
        {contatos.map((c) => (
          <li key={c.href}>
            {c.icone}{' '}
            <a href={c.href} {...(c.externo ? { target: '_blank', rel: 'noreferrer' } : {})}>
              {c.texto}
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
