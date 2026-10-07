// Todo o texto do site fica aqui. Nada de dados reais de clientes, candidatos ou da empresa.
// Para adicionar capturas de tela de um projeto, coloque as imagens em public/capturas/
// e liste em `capturas`: { arquivo: 'grm-solicitacoes.png', legenda: '...', alt: '...' }

export const asset = (path) => `${import.meta.env.BASE_URL}${path}`

export const perfil = {
  nome: 'Thiago Soares',
  email: 'thiagoosoa0201@gmail.com',
  github: 'https://github.com/ThiagoOlSoa',
  instagram: 'https://instagram.com/thiagoolsoa',
  instagramUser: '@thiagoolsoa',
  repositorio: 'https://github.com/ThiagoOlSoa/Meu_Portfolio',
}

export const projetos = [
  {
    id: 'grm',
    nome: 'GRM',
    destaque: true,
    status: 'uso',
    statusTexto: 'Em uso interno',
    linha:
      'Solicitações, clientes, equipe e agenda de uma empresa de serviços contábeis, com responsável, prazo e histórico em cada demanda.',
    resumo:
      'Plataforma de gestão operacional que reúne solicitações, clientes, equipe e agenda, e serve de porta de entrada para os outros três sistemas.',
    problema:
      'Demandas de clientes e de outros setores chegam dispersas. O GRM transforma cada uma em um registro com solicitante, responsável, cliente, prazo e fase, para que ninguém precise perguntar em que pé ela está.',
    passos: [
      'Alguém cria a solicitação. Conforme o tipo, ela passa por triagem e é encaminhada.',
      'Responsáveis e participantes entram no registro. Conversas e anexos ficam junto dele.',
      'O andamento aparece em listas e em quadro Kanban, com o prazo calculado separado da fase.',
      'Conclusão e validações alimentam o dashboard e os relatórios de supervisão e diretoria.',
    ],
    decisoes: [
      {
        titulo: 'Fase e atraso são calculados em camadas diferentes',
        texto:
          'Uma camada classifica cada solicitação como pendente, concluída, cancelada ou inativa. Outra calcula o atraso. Todas as telas leem o mesmo dado do mesmo jeito, e uma demanda pendente não vira atrasada por engano.',
      },
      {
        titulo: 'A aprovação de novos clientes tem a palavra final no banco',
        texto:
          'O pedido de cadastro segue um caminho: solicitação, aprovação, processamento pelo TI e efetivação. As regras ficam no banco, em funções e políticas de acesso por linha, e não só na tela. O sistema impede CNPJ duplicado e preserva os vínculos dos clientes que já existiam.',
      },
      {
        titulo: 'Localização e disponibilidade são coisas diferentes',
        texto:
          'Uma pessoa pode estar em home office e disponível, ou na empresa e em reunião. Regras habituais, exceções e compromissos definem o estado mostrado na equipe.',
      },
    ],
    stack:
      'React 18, Vite e React Router na interface. Supabase para autenticação, PostgreSQL e atualizações em tempo real. ExcelJS, JSZip e PDF.js para exportações e anexos.',
    estado:
      'Em uso interno. O módulo de disponibilidade da equipe ainda está em validação, e a integração com os outros três sistemas está em andamento.',
    ecossistema: true,
    capturas: [],
  },
  {
    id: 'comunicados',
    nome: 'Comunicados',
    status: 'teste',
    statusTexto: 'Em teste',
    linha:
      'Envio de e-mails com aprovação do conteúdo, leitura de respostas e controle de falhas.',
    resumo:
      'Sistema em Python que programa envios de e-mail, lê as respostas e exige nova aprovação quando o conteúdo muda.',
    problema:
      'Mandar um e-mail é a parte simples. O trabalho está em saber quem aprovou, quem respondeu, o que falhou e o que já foi enviado. O Comunicados cuida desse ciclo inteiro, não só do disparo.',
    passos: [
      'Monta-se um modelo ou comunicado e escolhem-se os destinatários, organizados por empresa e obrigação.',
      'O envio é manual ou vira uma rotina periódica.',
      'Se o comunicado exige aprovação, o sistema registra uma versão e pede a decisão dos aprovadores, com quórum e participantes obrigatórios.',
      'Um motor periódico processa a fila de envio, lê as respostas por IMAP e liga cada uma ao registro correspondente.',
      'Relatórios mostram envios, retornos, falhas e consumo de cota, e exportam para CSV.',
    ],
    decisoes: [
      {
        titulo: 'A aprovação fica presa ao conteúdo',
        texto:
          'O sistema calcula uma impressão digital da arte, do assunto, do corpo e dos anexos. Mudou qualquer um depois da aprovação, é preciso aprovar de novo. O histórico anterior continua disponível.',
      },
      {
        titulo: 'Na dúvida, o envio espera uma pessoa',
        texto:
          'Quando não dá para saber se um envio terminou, o item não é reenviado sozinho: alguém decide. É melhor parar do que mandar o mesmo e-mail duas vezes. Cota de envio, bloqueio contra execuções simultâneas e supressão de endereços recusados seguem a mesma lógica.',
      },
      {
        titulo: 'Servidor e janela são separados',
        texto:
          'A versão desktop abre uma janela sobre um servidor local. Fechar a janela não interrompe o servidor nem corta um envio em andamento.',
      },
    ],
    stack:
      'Python com servidor HTTP da biblioteca padrão e SQLite. SMTP e IMAP para e-mail. HTML, CSS e JavaScript na interface, com janela desktop via pywebview.',
    estado:
      'Em teste. A aprovação dá rastreabilidade ao fluxo, mas não é assinatura digital: não prova quem respondeu o e-mail.',
    capturas: [],
  },
  {
    id: 'banco-de-talentos',
    nome: 'Banco de Talentos',
    status: 'teste',
    statusTexto: 'Em teste',
    linha:
      'Currículos, vagas e entrevistas, com um ranking que explica a pontuação de cada candidato.',
    resumo:
      'Sistema de RH que lê currículos, organiza candidatos e vagas e mostra por que cada candidato aparece onde aparece no ranking.',
    problema:
      'Currículos chegam em PDF, Word e foto, e compará-los com os requisitos de uma vaga é trabalho manual. O sistema junta tudo em um lugar e deixa a comparação à vista.',
    passos: [
      'Envia-se o currículo em PDF, DOCX ou imagem. O servidor guarda o arquivo e extrai o texto.',
      'Dados e competências são identificados e ficam disponíveis para revisão e correção.',
      'A vaga é cadastrada com requisitos obrigatórios e desejáveis.',
      'O ranking de aderência ordena os candidatos e mostra o que foi encontrado e o que falta.',
      'A entrevista é agendada com os participantes, e o sistema avisa conflitos de horário antes de confirmar.',
    ],
    decisoes: [
      {
        titulo: 'O ranking explica a nota',
        texto:
          'A pontuação soma competências (60 pontos), experiência (25) e localização (15). Se a vaga não define localização, os pesos são redistribuídos. É apoio à triagem: quem decide a contratação é uma pessoa.',
      },
      {
        titulo: 'Falha de leitura é um caso previsto',
        texto:
          'PDF com texto, Word e imagem têm tratamentos diferentes: PDF.js, Mammoth e OCR com Tesseract. PDF escaneado sem texto não passa por OCR direto, então o sistema avisa e pede as páginas como imagem ou o preenchimento manual.',
      },
      {
        titulo: 'Cada pessoa vê o que precisa da agenda',
        texto:
          'Quem consulta a disponibilidade de outra pessoa nem sempre recebe o motivo de uma ausência.',
      },
    ],
    stack:
      'React 19, TypeScript e Vite no front. Node.js, Express e PostgreSQL no servidor. PDF.js, Mammoth e Tesseract.js para documentos, Zod para validação e Vitest nos testes.',
    estado:
      'Em teste, com currículos fictícios. A leitura de documentos depende da qualidade do arquivo e pede revisão humana. A disponibilidade ainda usa só os compromissos do próprio sistema; a ligação com a agenda do GRM é uma evolução prevista.',
    capturas: [],
  },
  {
    id: 'mapeamentos',
    nome: 'Central de Mapeamentos',
    status: 'teste',
    statusTexto: 'Em teste',
    linha:
      'Processos e rotinas dos setores contábil, fiscal e pessoal em um portal com busca e fichas.',
    resumo:
      'Portal de consulta com 21 processos e 30 rotinas catalogados dos setores contábil, fiscal e de departamento pessoal, com busca, filtros e uma ficha para cada item.',
    problema:
      'Orientações de processo ficam espalhadas em arquivos e na cabeça de quem executa. O portal reúne tudo em um catálogo que qualquer pessoa autorizada consulta no dia a dia.',
    passos: [
      'Escolhe-se um setor ou pesquisa-se um tema.',
      'O catálogo filtra os itens por setor e categoria.',
      'A ficha mostra objetivo, pré-requisitos, etapas, controles, resultados e referências.',
      'Favoritos guardam o que se consulta sempre, e o sino avisa o que é novo ou mudou.',
    ],
    decisoes: [
      {
        titulo: 'O portal documenta, não executa',
        texto:
          'Ele orienta a consulta e não roda as rotinas nos sistemas da empresa. Deixar isso explícito evita confundir catálogo com automação instalada.',
      },
      {
        titulo: 'O aviso de novidade vem do conteúdo',
        texto:
          'Cada item recebe um identificador calculado a partir do próprio conteúdo: mudou o texto, mudou o identificador, e o sino avisa. Na primeira visita, o conteúdo existente conta como visto, para não gerar uma lista enorme.',
      },
      {
        titulo: 'O conteúdo interno é protegido no servidor',
        texto:
          'Os arquivos com o conteúdo só são entregues depois do login. Uma tela de login por cima de arquivos abertos não protegeria nada.',
      },
    ],
    stack:
      'React 18, TypeScript, Vite e React Router no front. Node.js, Express e SQLite no servidor. ExcelJS para importar a equipe.',
    estado:
      'Em teste. O conteúdo fica em arquivos do projeto, então atualizar um processo exige publicar uma nova versão: não há editor na interface.',
    capturas: [],
  },
]

export const ecossistema = {
  legenda:
    'Integração em andamento. Cada sistema abre dentro do GRM, usa a sessão dele e segue o tema claro ou escuro, mas mantém servidor e dados próprios.',
  modulos: [
    { nome: 'Comunicados', estado: 'Em teste' },
    { nome: 'Banco de Talentos', estado: 'Em teste' },
    { nome: 'Central de Mapeamentos', estado: 'Em teste' },
  ],
}

export const sobre = [
  'Estudo Análise e Desenvolvimento de Sistemas na UniJorge e desenvolvo sistemas internos no meu estágio. Gosto da parte que costuma ficar escondida: regras de acesso, fluxos de aprovação, o que acontece quando um envio falha.',
  'Uso assistentes de IA no desenvolvimento, como ferramenta de trabalho. Cada sistema neste site traz o estado real em que está.',
]

export const tecnologias = [
  { onde: 'GRM', itens: 'React, Vite, React Router, Supabase (autenticação, PostgreSQL, tempo real), ExcelJS, PDF.js' },
  { onde: 'Comunicados', itens: 'Python, SQLite, SMTP e IMAP, HTML, CSS e JavaScript' },
  { onde: 'Banco de Talentos', itens: 'React, TypeScript, Node.js, Express, PostgreSQL, PDF.js, Mammoth, Tesseract.js' },
  { onde: 'Central de Mapeamentos', itens: 'React, TypeScript, Node.js, Express, SQLite' },
  { onde: 'Faculdade', itens: 'C, Java, Python, SQL (MySQL e SQLite), estruturas de dados' },
  { onde: 'Rotina de trabalho', itens: 'Git e GitHub, Scrum' },
]

export const certificado = {
  texto: 'Scrum Fundamentals, certificado (PDF)',
  arquivo: 'scrum/ScrumFundamentalsCertified-ThiagoSoares-1083922.pdf',
}

export const primeirosPassos = [
  { nome: 'TechSolution', texto: 'Primeiro exercício, só em HTML.', arquivo: 'Projeto1/TechSolution.html' },
  { nome: 'TechConnect', texto: 'HTML e CSS para a página de um evento de tecnologia.', arquivo: 'Projeto2/TechConnect.html' },
  { nome: 'YouTube', texto: 'A interface do YouTube recriada só com HTML e CSS.', arquivo: 'Projeto3/Youtube.html' },
]
