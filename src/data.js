// Caminhos de arquivos em /public respeitam o base do Vite (/Meu_Portfolio/)
export const asset = (path) => `${import.meta.env.BASE_URL}${path}`

export const projetos = [
  {
    titulo: 'TechSolution',
    descricao: 'Meu primeiro projeto, usando somente HTML sobre uma startup inovadora.',
    imagem: 'Imagens/techsolution.png',
    alt: 'Projeto TechSolution',
    link: 'Projeto1/TechSolution.html',
  },
  {
    titulo: 'TechConnect',
    descricao:
      'Meu primeiro projeto juntando HTML e CSS de um Summit sobre tecnologia e design de interface.',
    imagem: 'Imagens/techconnect.png',
    alt: 'Projeto TechConnect',
    link: 'Projeto2/TechConnect.html',
  },
  {
    titulo: 'YouTube',
    descricao:
      'Projeto de recriar o YouTube somente usando HTML e CSS, mas de forma mais complexa.',
    imagem: 'Imagens/Youtube.png',
    alt: 'YouTube com HTML e CSS',
    link: 'Projeto3/Youtube.html',
  },
]

export const tecnologias = [
  'HTML', 'CSS', 'JavaScript', 'Git / GitHub', 'Java', 'Python', 'C', 'MySQL', 'SQLite',
]

export const certificado = {
  texto: 'SCRUM (certificado)',
  link: 'scrum/ScrumFundamentalsCertified-ThiagoSoares-1083922.pdf',
}

export const contatos = [
  { icone: '📞', texto: '+55 071 99327-6841', href: 'tel:+5571993276841' },
  { icone: '📧', texto: 'thiagoosoa0201@gmail.com', href: 'mailto:thiagoosoa0201@gmail.com' },
  { icone: '📸', texto: '@thiagoolsoa', href: 'https://instagram.com/thiagoolsoa', externo: true },
  { icone: '💻', texto: 'ThiagoOlSoa', href: 'https://github.com/ThiagoOlSoa', externo: true },
]
