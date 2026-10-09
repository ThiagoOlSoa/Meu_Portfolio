import { perfil } from '../content'
import { irParaSecao, irParaTopo } from '../router'

export const CAMINHO_RAIO = 'M300 0 L400 0 L318 130 L392 130 L276 262 L346 262 L80 500 L186 322 L112 322 L220 186 L146 186 Z'

function LinkSecao({ id, children }) {
  return (
    <a
      className="nav-link"
      href={`#/${id}`}
      onClick={(e) => {
        e.preventDefault()
        irParaSecao(id)
      }}
    >
      {children}
    </a>
  )
}

export function Header({ tema, onAlternarTema }) {
  const escuro = tema === 'dark'
  return (
    <header className="topbar">
      <div className="wrap topbar-in">
        <a
          className="wordmark"
          href="#/"
          onClick={(e) => {
            e.preventDefault()
            irParaTopo()
          }}
        >
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 400 500" width="13" height="16" focusable="false">
              <path d={CAMINHO_RAIO} fill="currentColor" />
            </svg>
          </span>
          {perfil.nome}
        </a>
        <nav className="nav" aria-label="Principal">
          <LinkSecao id="projetos">Projetos</LinkSecao>
          <LinkSecao id="sobre">Sobre</LinkSecao>
          <LinkSecao id="tecnologias">Tecnologias</LinkSecao>
          <LinkSecao id="contato">Contato</LinkSecao>
          <button type="button" className="nav-link" onClick={onAlternarTema}>
            {escuro ? 'Tema claro' : 'Tema escuro'}
          </button>
        </nav>
      </div>
    </header>
  )
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-in">
        <span>&copy; {new Date().getFullYear()} {perfil.nome}</span>
        <a className="link" href={perfil.repositorio} target="_blank" rel="noreferrer">
          Código deste site no GitHub
        </a>
      </div>
    </footer>
  )
}

// Seção com título na coluna estreita e conteúdo na larga
export function Section({ id, titulo, children }) {
  return (
    <section className="section" id={id} aria-labelledby={`${id}-titulo`}>
      <div className="wrap split rev">
        <h2 className="section-title" id={`${id}-titulo`}>
          {titulo}
        </h2>
        <div className="section-body">{children}</div>
      </div>
    </section>
  )
}
