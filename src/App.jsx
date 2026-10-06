import Hero from './components/Hero'
import Projetos from './components/Projetos'
import Tecnologias from './components/Tecnologias'
import Contato from './components/Contato'
import ThemeToggle from './components/ThemeToggle'
import { useFadeIn, useTema } from './hooks'

export default function App() {
  const [claro, alternarTema] = useTema()
  useFadeIn()

  return (
    <>
      <ThemeToggle claro={claro} onToggle={alternarTema} />
      <Hero />
      <Projetos />
      <Tecnologias />
      <Contato />
      <footer>
        <p>&copy; {new Date().getFullYear()} Thiago Soares. Todos os direitos reservados.</p>
      </footer>
    </>
  )
}
