import { useCallback, useEffect, useState } from 'react'
import { ROTULOS } from '../analytics'
import Barras from './Barras'
import Mapa from './Mapa'

// Página privada de estatísticas (#/stats). A chave da API do GoatCounter fica
// só no navegador de quem digitou (localStorage). Nunca vai para o código do site.
const CHAVE = 'gc-stats'
const PERIODOS = [
  { dias: 7, rotulo: '7 dias' },
  { dias: 30, rotulo: '30 dias' },
  { dias: 90, rotulo: '90 dias' },
]
const CATEGORIAS = [
  { id: 'paginas', rotulo: 'Páginas' },
  { id: 'cliques', rotulo: 'Cliques' },
  { id: 'secoes', rotulo: 'Seções vistas' },
]

const lerSalvo = () => {
  try {
    return JSON.parse(localStorage.getItem(CHAVE)) || null
  } catch {
    return null
  }
}
const salvar = (v) => {
  try {
    if (v) localStorage.setItem(CHAVE, JSON.stringify(v))
    else localStorage.removeItem(CHAVE)
  } catch {
    /* sem armazenamento: vale só nesta visita */
  }
}

// A API pede datas arredondadas para a hora
const hora = (d) => {
  const x = new Date(d)
  x.setMinutes(0, 0, 0)
  return x.toISOString()
}
const faixa = (a, b) => `start=${encodeURIComponent(hora(a))}&end=${encodeURIComponent(hora(b))}`

async function api(conta, token, caminho, params) {
  const r = await fetch(`https://${conta}.goatcounter.com/api/v0/${caminho}?${params}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  })
  if (r.status === 401 || r.status === 403) throw new Error('permissao')
  if (!r.ok) throw new Error(`http ${r.status}`)
  return r.json()
}

// Quatro tipos: páginas (visitas) e eventos clique/..., secao/..., tempo/...
function paraItem(h) {
  const p = h.path || ''
  const cat = !h.event
    ? 'paginas'
    : p.startsWith('clique/')
      ? 'cliques'
      : p.startsWith('secao/')
        ? 'secoes'
        : p.startsWith('tempo/')
          ? 'tempo'
          : 'outro'
  const porDia = {}
  ;(h.stats || []).forEach((s) => {
    porDia[String(s.day).slice(0, 10)] = s.daily || 0
  })
  return { path: p, rotulo: ROTULOS[p] || p, cat, total: h.count || 0, porDia }
}

async function buscar(conta, token, dias) {
  const fim = new Date()
  const inicio = new Date(fim.getTime() - dias * 86400000)
  const antes = new Date(inicio.getTime() - dias * 86400000)
  const atual = faixa(inicio, fim)
  const anterior = faixa(antes, inicio)
  const [hits, hitsAnt, total, totalAnt] = await Promise.all([
    api(conta, token, 'stats/hits', `${atual}&group=day&limit=100`),
    api(conta, token, 'stats/hits', `${anterior}&limit=100`),
    api(conta, token, 'stats/total', atual),
    api(conta, token, 'stats/total', anterior),
  ])
  // Quebras (origem, aparelho, navegador, país): se alguma falhar, só some o painel
  const pedidos = [
    ['toprefs', 8],
    ['sizes', 8],
    ['browsers', 8],
    ['locations', 100],
  ]
  const extra = await Promise.allSettled(pedidos.map(([p, n]) => api(conta, token, `stats/${p}`, `${atual}&limit=${n}`)))
  const lista = (i) => (extra[i].status === 'fulfilled' ? extra[i].value.stats || [] : null)
  const serieTotal = {}
  ;(total.stats || []).forEach((s) => {
    serieTotal[String(s.day).slice(0, 10)] = s.daily || 0
  })
  return {
    inicio,
    fim,
    dias,
    consulta: atual,
    itens: (hits.hits || []).map(paraItem),
    itensAnt: (hitsAnt.hits || []).map(paraItem),
    mais: !!hits.more,
    visitantes: Math.max(0, (total.total || 0) - (total.total_events || 0)),
    visitantesAnt: Math.max(0, (totalAnt.total || 0) - (totalAnt.total_events || 0)),
    serieTotal,
    origem: lista(0),
    aparelhos: lista(1),
    navegadores: lista(2),
    paises: lista(3),
  }
}

const SIZES = {
  Phones: 'Celulares',
  'Large phones, small tablets': 'Celulares grandes e tablets pequenos',
  'Tablets and small laptops': 'Tablets e notebooks pequenos',
  'Computer monitors': 'Monitores de computador',
  'Computer monitors larger than HD': 'Monitores maiores que HD',
  Unknown: 'Desconhecido',
}
const nomeOrigem = (e) => (!e.name || e.name === 'Direct' ? 'Acesso direto' : e.name)

function listaDias(inicio, fim, itens) {
  const set = new Set([fim.toISOString().slice(0, 10)])
  for (let t = inicio.getTime(); t <= fim.getTime(); t += 86400000) {
    set.add(new Date(t).toISOString().slice(0, 10))
  }
  itens.forEach((i) => Object.keys(i.porDia).forEach((d) => set.add(d)))
  return [...set].sort()
}
const dm = (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`
const soma = (v) => v.reduce((a, b) => a + b, 0)
const totalDe = (itens, paths) => itens.filter((i) => paths.includes(i.path)).reduce((s, i) => s + i.total, 0)
const totalCat = (itens, cat) => itens.filter((i) => i.cat === cat).reduce((s, i) => s + i.total, 0)
const serieDe = (itens, dias, filtro) => dias.map((d) => itens.filter(filtro).reduce((s, i) => s + (i.porDia[d] || 0), 0))

function Grafico({ rotulos, valores, titulo }) {
  const max = Math.max(1, ...valores)
  const topo = max <= 4 ? max : Math.ceil(max / 5) * 5
  const L = 40
  const W = 720
  const H = 240
  const base = H - 28
  const passo = (W - L - 8) / rotulos.length
  const larg = Math.max(2, passo * 0.7)
  const y = (v) => base - (v / topo) * (base - 10)
  const marcas = [0, Math.round(topo / 2), topo].filter((v, i, a) => a.indexOf(v) === i)
  const rotX = [0, Math.floor((rotulos.length - 1) / 2), rotulos.length - 1].filter((v, i, a) => a.indexOf(v) === i)
  return (
    <svg className="stats-grafico" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${titulo}. Total no período: ${soma(valores)}.`}>
      {marcas.map((v) => (
        <g key={v}>
          <line x1={L} x2={W - 8} y1={y(v)} y2={y(v)} className="g-linha" />
          <text x={L - 8} y={y(v) + 4} textAnchor="end" className="g-texto">
            {v}
          </text>
        </g>
      ))}
      {rotulos.map((d, i) => (
        <rect key={d} x={L + i * passo + (passo - larg) / 2} y={y(valores[i])} width={larg} height={base - y(valores[i])} className="g-barra">
          <title>{`${d}: ${valores[i]}`}</title>
        </rect>
      ))}
      {rotX.map((i) => (
        <text key={i} x={L + i * passo + passo / 2} y={H - 6} textAnchor="middle" className="g-texto">
          {rotulos[i]}
        </text>
      ))}
    </svg>
  )
}

// Miniatura da evolução diária (dados reais; sem eixos)
function Mini({ valores }) {
  const max = Math.max(1, ...valores)
  const n = Math.max(1, valores.length - 1)
  const pts = valores.map((v, i) => `${(i / n) * 100},${30 - (v / max) * 28}`)
  return (
    <svg className="mini" viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true">
      <polygon points={`0,32 ${pts.join(' ')} 100,32`} className="mini-area" />
      <polyline points={pts.join(' ')} className="mini-linha" />
    </svg>
  )
}

function Variacao({ atual, antes }) {
  if (!antes) return <p className="kpi-delta">Período anterior: 0</p>
  const p = Math.round(((atual - antes) / antes) * 100)
  return (
    <p className="kpi-delta">
      <strong>
        {p > 0 ? '+' : p < 0 ? '−' : ''}
        {Math.abs(p)}%
      </strong>{' '}
      · antes: {antes}
    </p>
  )
}

function Kpi({ rotulo, atual, antes, serie }) {
  return (
    <div className="cartao kpi">
      <p className="kpi-label">{rotulo}</p>
      <div className="kpi-corpo">
        <div>
          <p className="kpi-num">{atual}</p>
          <Variacao atual={atual} antes={antes} />
        </div>
        <Mini valores={serie} />
      </div>
    </div>
  )
}

function Cartao({ titulo, nota, classe = '', id, children }) {
  return (
    <section className={`cartao ${classe}`} id={id} aria-label={titulo}>
      <h3 className="cartao-titulo">{titulo}</h3>
      {nota && <p className="cartao-nota">{nota}</p>}
      {children}
    </section>
  )
}

// Rosca com legenda. Até 4 fatias + "Outros".
function Rosca({ linhas }) {
  const total = soma(linhas.map((l) => l.count))
  if (!total) return <p className="stats-vazio">Ainda sem registros neste período.</p>
  const top = linhas.slice(0, 4)
  const resto = soma(linhas.slice(4).map((l) => l.count))
  const itens = resto ? [...top, { key: 'outros', label: 'Outros', count: resto }] : top
  const R = 40
  const C = 2 * Math.PI * R
  let acc = 0
  return (
    <div className="rosca">
      <svg viewBox="0 0 100 100" className="rosca-svg" role="img" aria-label={`Total ${total}. ${itens.map((i) => `${i.label}: ${Math.round((i.count / total) * 100)}%`).join('; ')}`}>
        {itens.map((it, i) => {
          const len = (it.count / total) * C
          const gap = itens.length > 1 && len > 2 ? 1.2 : 0
          const el = (
            <circle
              key={it.key}
              cx="50"
              cy="50"
              r={R}
              fill="none"
              strokeWidth="14"
              className={`rc-${i}`}
              strokeDasharray={`${Math.max(len - gap, 0.1)} ${C}`}
              strokeDashoffset={-acc}
              transform="rotate(-90 50 50)"
            />
          )
          acc += len
          return el
        })}
        <text x="50" y="49" textAnchor="middle" className="rosca-n">
          {total}
        </text>
        <text x="50" y="62" textAnchor="middle" className="rosca-t">
          visitas
        </text>
      </svg>
      <ul className="rosca-leg">
        {itens.map((it, i) => (
          <li key={it.key}>
            <span className={`dot rcb-${i}`} aria-hidden="true" />
            <span className="leg-rot">{it.label}</span>
            <span className="leg-pct">{Math.round((it.count / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Dashboard({ dados, cat, setCat, item, setItem, agrup, setAgrup, buscarRegioes }) {
  const doCat = dados.itens.filter((i) => i.cat === cat).sort((a, b) => b.total - a.total)
  const selecionado = doCat.find((i) => i.path === item) || null
  const alvo = selecionado ? [selecionado] : doCat

  const dias = listaDias(dados.inicio, dados.fim, dados.itens)
  const porDia = dias.map((d) => alvo.reduce((s, i) => s + (i.porDia[d] || 0), 0))
  let rotulos = dias.map(dm)
  let valores = porDia
  if (agrup === 'semana') {
    rotulos = []
    valores = []
    for (let i = 0; i < dias.length; i += 7) {
      rotulos.push(dm(dias[i]))
      valores.push(soma(porDia.slice(i, i + 7)))
    }
  }
  const total = soma(valores)
  const titulo = selecionado ? selecionado.rotulo : CATEGORIAS.find((c) => c.id === cat).rotulo

  const lin = (c, n = 8) =>
    dados.itens
      .filter((i) => i.cat === c)
      .sort((a, b) => b.total - a.total)
      .slice(0, n)
      .map((i) => ({ key: i.path, label: i.rotulo, count: i.total }))
  const escolher = (c) => (path) => {
    setCat(c)
    setItem((atual) => (atual === path && cat === c ? null : path))
    const g = document.getElementById('stats-grafico')
    if (g) g.scrollIntoView({ block: 'nearest' })
  }
  const ativoDe = (c) => (cat === c ? item : null)
  const mapa = (arr, rot) => arr.map((e, i) => ({ key: `${e.id || i}`, label: rot(e), count: e.count }))

  const A = dados.itens
  const B = dados.itensAnt
  const contatos = ['clique/whatsapp', 'clique/email']
  const tempo = [
    ['tempo/30s', '30 segundos'],
    ['tempo/1min', '1 minuto'],
    ['tempo/3min', '3 minutos'],
  ].map(([p, r]) => ({ key: p, label: `Ficaram ${r} ou mais`, count: totalDe(A, [p]) }))

  return (
    <div className="dash-grade">
      <Kpi rotulo="Visitantes" atual={dados.visitantes} antes={dados.visitantesAnt} serie={dias.map((d) => dados.serieTotal[d] || 0)} />
      <Kpi rotulo="Cliques em links" atual={totalCat(A, 'cliques')} antes={totalCat(B, 'cliques')} serie={serieDe(A, dias, (i) => i.cat === 'cliques')} />
      <Kpi rotulo="Pedidos de contato" atual={totalDe(A, contatos)} antes={totalDe(B, contatos)} serie={serieDe(A, dias, (i) => contatos.includes(i.path))} />
      <Kpi rotulo="Chegaram a Contato" atual={totalDe(A, ['secao/contato'])} antes={totalDe(B, ['secao/contato'])} serie={serieDe(A, dias, (i) => i.path === 'secao/contato')} />

      <section className="cartao grande" id="stats-grafico" aria-label="Acessos ao longo do tempo">
        <div className="cartao-topo">
          <h3 className="cartao-titulo">
            {titulo}: {total}
          </h3>
          <div className="stats-grupo" role="group" aria-label="Agrupar por">
            <button type="button" className="nav-link" aria-pressed={agrup === 'dia'} onClick={() => setAgrup('dia')}>
              Dias
            </button>
            <button type="button" className="nav-link" aria-pressed={agrup === 'semana'} onClick={() => setAgrup('semana')}>
              Semanas
            </button>
          </div>
        </div>
        <div className="stats-grupo" role="group" aria-label="Tipo de dado">
          {CATEGORIAS.map((c) => (
            <button
              key={c.id}
              type="button"
              className="nav-link"
              aria-pressed={cat === c.id}
              onClick={() => {
                setCat(c.id)
                setItem(null)
              }}
            >
              {c.rotulo}
            </button>
          ))}
        </div>
        {total > 0 ? <Grafico rotulos={rotulos} valores={valores} titulo={titulo} /> : <p className="stats-vazio">Nenhum registro neste período ainda.</p>}
        {selecionado && (
          <button type="button" className="link stats-sair" onClick={() => setItem(null)}>
            Mostrar todos os itens
          </button>
        )}
        <p className="stats-aviso">
          Cada item conta os visitantes dele; quem abre duas páginas entra uma vez em cada.
          {dados.mais ? ' Há mais itens do que os 100 mostrados.' : ''}
        </p>
      </section>

      <Cartao titulo="Seções vistas" nota="Chegaram à seção, uma vez por visita." classe="m3">
        <Barras linhas={lin('secoes')} ativo={ativoDe('secoes')} onEscolher={escolher('secoes')} />
      </Cartao>
      <Cartao titulo="Páginas mais vistas" nota="Clique numa linha para filtrar o gráfico." classe="m3">
        <Barras linhas={lin('paginas')} ativo={ativoDe('paginas')} onEscolher={escolher('paginas')} />
      </Cartao>

      <Cartao titulo="Ações externas" nota="Cliques em contato e perfis." classe="m3">
        <Barras linhas={lin('cliques')} ativo={ativoDe('cliques')} onEscolher={escolher('cliques')} />
      </Cartao>
      <Cartao titulo="Tempo no site" nota="Aba aberta e visível. Sobre os visitantes do período." classe="m3">
        {tempo.some((t) => t.count > 0) ? (
          <ul className="blist">
            {tempo.map((t) => {
              const pct = dados.visitantes ? Math.min(100, Math.round((t.count / dados.visitantes) * 100)) : 0
              return (
                <li key={t.key}>
                  <div className="bl-linha">
                    <span className="bl-rot">{t.label}</span>
                    <span className="bl-num">{t.count}</span>
                    <span className="bl-pct">{pct}%</span>
                    <span className="bl-trilho" aria-hidden="true">
                      <span className="bl-fill" style={{ width: `${Math.max(pct, 2)}%` }} />
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="stats-vazio">Ainda sem registros. A medição começa a valer depois do último deploy.</p>
        )}
      </Cartao>
      {dados.aparelhos && (
        <Cartao titulo="Dispositivos" nota="Tamanho de tela." classe="m3">
          <Rosca linhas={mapa(dados.aparelhos, (e) => SIZES[e.name] || e.name)} />
          {dados.navegadores && dados.navegadores.length > 0 && (
            <>
              <h4 className="cartao-sub">Navegadores</h4>
              <Barras linhas={mapa(dados.navegadores, (e) => e.name).slice(0, 5)} />
            </>
          )}
        </Cartao>
      )}
      {dados.origem && (
        <Cartao titulo="Origem do tráfego" nota="De onde vieram as visitas." classe="m3">
          <Rosca linhas={mapa(dados.origem, nomeOrigem)} />
        </Cartao>
      )}

      {dados.paises && (
        <Cartao titulo="Localização dos visitantes" nota="Dourado mais forte, mais acessos." classe="grande total">
          <Mapa paises={dados.paises} buscarRegioes={buscarRegioes} />
        </Cartao>
      )}
      <p className="stats-aviso total">
        Pedidos de contato = cliques em WhatsApp e e-mail. A comparação é com os {dados.dias} dias imediatamente anteriores.
        Porcentagens sobre os itens listados em cada cartão.
      </p>
    </div>
  )
}

function Entrar({ onEntrar, erro }) {
  const [conta, setConta] = useState('thiagoolsoa')
  const [token, setToken] = useState('')
  return (
    <form
      className="stats-form"
      onSubmit={(e) => {
        e.preventDefault()
        onEntrar({ conta: conta.trim(), token: token.trim() })
      }}
    >
      <p className="section-intro">
        Cole a chave de leitura do GoatCounter (no painel: seu usuário, no menu do topo, depois API). Ela fica salva só
        neste navegador.
      </p>
      <label>
        Conta
        <input value={conta} onChange={(e) => setConta(e.target.value)} autoComplete="off" required />
      </label>
      <label>
        Chave da API
        <input type="password" value={token} onChange={(e) => setToken(e.target.value)} autoComplete="off" required />
      </label>
      {erro && (
        <p className="stats-erro" role="alert">
          {erro}
        </p>
      )}
      <button className="btn" type="submit">
        Ver estatísticas
      </button>
    </form>
  )
}

export default function Stats() {
  const [cred, setCred] = useState(lerSalvo)
  const [dias, setDias] = useState(30)
  const [cat, setCat] = useState('paginas')
  const [item, setItem] = useState(null)
  const [agrup, setAgrup] = useState('dia')
  const [dados, setDados] = useState(null)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  const carregar = useCallback(async () => {
    if (!cred) return
    setCarregando(true)
    setErro('')
    try {
      setDados(await buscar(cred.conta, cred.token, dias))
    } catch (e) {
      setDados(null)
      if (e.message === 'permissao') {
        setErro('A chave foi recusada. Confira se ela tem permissão de leitura das estatísticas.')
      } else if (e instanceof TypeError) {
        setErro(
          'O navegador não conseguiu falar com o GoatCounter (rede, bloqueador de anúncios ou o GoatCounter não aceita chamadas vindas deste site). Use o painel direto em ' +
            `${cred.conta}.goatcounter.com.`,
        )
      } else {
        setErro(`O GoatCounter respondeu com erro (${e.message}).`)
      }
    } finally {
      setCarregando(false)
    }
  }, [cred, dias])

  useEffect(() => {
    carregar()
  }, [carregar])

  const buscarRegioes = useCallback(
    (id) =>
      api(cred.conta, cred.token, `stats/locations/${encodeURIComponent(id)}`, `${dados.consulta}&limit=100`).then((r) => r.stats || []),
    [cred, dados],
  )

  const entrar = (c) => {
    salvar(c)
    setCred(c)
  }
  const sair = () => {
    salvar(null)
    setCred(null)
    setDados(null)
    setErro('')
  }

  return (
    <article>
      <header className="case-head">
        <div className="wrap">
          <h1 className="case-title">Estatísticas</h1>
          <p className="case-lead">Página só sua. Os números vêm do GoatCounter, sem dados de exemplo.</p>
        </div>
      </header>
      <div className="wrap dash">
        {!cred ? (
          <Entrar onEntrar={entrar} erro={erro} />
        ) : (
          <>
            <div className="stats-bar">
              <div className="stats-grupo" role="group" aria-label="Período">
                {PERIODOS.map((p) => (
                  <button key={p.dias} type="button" className="nav-link" aria-pressed={dias === p.dias} onClick={() => setDias(p.dias)}>
                    {p.rotulo}
                  </button>
                ))}
              </div>
              <div className="stats-grupo">
                <button type="button" className="link stats-sair" onClick={carregar} disabled={carregando}>
                  {carregando ? 'Carregando…' : 'Atualizar'}
                </button>
                <button type="button" className="link stats-sair" onClick={sair}>
                  Sair e apagar a chave
                </button>
              </div>
            </div>
            {erro && (
              <p className="stats-erro" role="alert">
                {erro}
              </p>
            )}
            {dados && (
              <Dashboard
                dados={dados}
                cat={cat}
                setCat={setCat}
                item={item}
                setItem={setItem}
                agrup={agrup}
                setAgrup={setAgrup}
                buscarRegioes={buscarRegioes}
              />
            )}
          </>
        )}
      </div>
    </article>
  )
}
