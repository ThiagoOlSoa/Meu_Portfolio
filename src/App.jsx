import { useEffect } from 'react'
import { projetos } from './content'
import { consumirRolagem, useRoute } from './router'
import { useTema } from './hooks'
import { useCliques } from './analytics'
import { Footer, Header } from './components/Layout'
import Home from './components/Home'
import Case from './components/Case'
import Stats from './components/Stats'

export default function App() {
  const rota = useRoute()
  useCliques()
  const [tema, alternarTema] = useTema()
  const projeto = rota.name === 'projeto' ? projetos.find((p) => p.id === rota.id) : null

  useEffect(() => {
    document.title =
      rota.name === 'stats'
        ? 'Estatísticas | Thiago Soares'
        : projeto
          ? `${projeto.nome} | Thiago Soares`
          : 'Thiago Soares | Desenvolvedor full stack em Salvador'
    if (projeto) window.scrollTo(0, 0)
    else if (!consumirRolagem()) window.scrollTo(0, 0)
  }, [projeto])

  return (
    <>
      <a className="skip" href="#conteudo">
        Ir para o conteúdo
      </a>
      <Header tema={tema} onAlternarTema={alternarTema} />
      <main id="conteudo">
        {rota.name === 'stats' ? <Stats /> : projeto ? <Case projeto={projeto} /> : <Home />}
      </main>
      <Footer />
    </>
  )
}
