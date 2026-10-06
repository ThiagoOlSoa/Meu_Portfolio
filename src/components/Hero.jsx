import { asset } from '../data'

export default function Hero() {
  return (
    <header className="hero">
      <div className="hero-content">
        <img src={asset('Imagens/Thiagoft2.JPG')} alt="Foto de Thiago" className="foto-perfil" />
        <h1>Thiago Soares</h1>
        <p>Desenvolvedor Front-End</p>
        <a href="#projetos" className="botaodestaque">Meus Projetos</a>
      </div>
    </header>
  )
}
