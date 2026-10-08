import { Suspense, lazy, useEffect } from 'react'
import { projetos } from './content'
import { consumirRolagem, useRoute } from './router'
import { useTema } from './hooks'
import { useCliques, useTempoNoSite } from './analytics'
import { Footer, Header } from './components/Layout'
import Home from './components/Home'
import Case from './components/Case'
// A página de estatísticas (e o mapa) só é baixada por quem a abre
const Stats = lazy(() => import('./components/Stats'))

export default function App() {
  const rota = useRoute()
  useCliques()
  useTempoNoSite()
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
        {rota.name === 'stats' ? (
          <Suspense fallback={<p className="wrap dash">Carregando…</p>}>
            <Stats />
          </Suspense>
        ) : projeto ? <Case projeto={projeto} /> : <Home />}
      </main>
      <Footer />
    </>
  )
}
