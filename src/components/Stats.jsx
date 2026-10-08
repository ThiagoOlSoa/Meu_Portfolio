import { useCallback, useEffect, useState } from 'react'
import { ROTULOS } from '../analytics'
import { Section } from './Layout'

// Página privada de estatísticas (#/stats). A chave da API do GoatCounter fica
// só no navegador de quem digitou (localStorage). Nunca vai para o código do site.
const CHAVE = 'gc-stats'
const PERIODOS = [
  { dias: 7, rotulo: '7 dias' },
  { dias: 30, rotulo: '30 dias' },
  { dias: 90, rotulo: '90 dias' },
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

async function buscar(conta, token, dias) {
  const fim = new Date()
  const inicio = new Date(fim.getTime() - dias * 86400000)
  const q = `start=${encodeURIComponent(hora(inicio))}&end=${encodeURIComponent(hora(fim))}&group=day&limit=100`
  const r = await fetch(`https://${conta}.goatcounter.com/api/v0/stats/hits?${q}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  })
  if (r.status === 401 || r.status === 403) throw new Error('permissao')
  if (!r.ok) throw new Error(`http ${r.status}`)
  const json = await r.json()
  return { itens: (json.hits || []).map(paraItem), inicio, fim, mais: !!json.more }
}

// Três tipos: páginas (visitas), cliques (eventos clique/...) e seções (eventos secao/...)
function paraItem(h) {
  const evento = !!h.event
  const cat = !evento ? 'paginas' : h.path.startsWith('clique/') ? 'cliques' : h.path.startsWith('secao/') ? 'secoes' : 'outro'
  const porDia = {}
  ;(h.stats || []).forEach((s) => {
    porDia[String(s.day).slice(0, 10)] = s.daily || 0
  })
  return { path: h.path, rotulo: ROTULOS[h.path] || h.path, cat, total: h.count || 0, porDia }
}

const CATEGORIAS = [
  { id: 'paginas', rotulo: 'Páginas' },
  { id: 'cliques', rotulo: 'Cliques' },
  { id: 'secoes', rotulo: 'Seções vistas' },
]

function listaDias(inicio, fim, itens) {
  const set = new Set([fim.toISOString().slice(0, 10)])
  for (let t = inicio.getTime(); t <= fim.getTime(); t += 86400000) {
    set.add(new Date(t).toISOString().slice(0, 10))
  }
  itens.forEach((i) => Object.keys(i.porDia).forEach((d) => set.add(d)))
  return [...set].sort()
}

const dm = (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`

function Grafico({ dias, valores, titulo }) {
  const max = Math.max(1, ...valores)
  const topo = max <= 4 ? max : Math.ceil(max / 5) * 5
  const L = 40
  const W = 720
  const H = 220
  const base = H - 28
  const util = W - L - 8
  const passo = util / dias.length
  const larg = Math.max(2, passo * 0.7)
  const y = (v) => base - (v / topo) * (base - 10)
  const marcas = [0, Math.round(topo / 2), topo].filter((v, i, a) => a.indexOf(v) === i)
  const rotX = [0, Math.floor((dias.length - 1) / 2), dias.length - 1].filter((v, i, a) => a.indexOf(v) === i)
  return (
    <svg
      className="stats-grafico"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`${titulo}. Total no período: ${valores.reduce((a, b) => a + b, 0)}. Os valores por dia estão na tabela abaixo.`}
    >
      {marcas.map((v) => (
        <g key={v}>
          <line x1={L} x2={W - 8} y1={y(v)} y2={y(v)} className="g-linha" />
          <text x={L - 8} y={y(v) + 4} textAnchor="end" className="g-texto">
            {v}
          </text>
        </g>
      ))}
      {dias.map((d, i) => (
        <rect key={d} x={L + i * passo + (passo - larg) / 2} y={y(valores[i])} width={larg} height={base - y(valores[i])} className="g-barra">
          <title>{`${dm(d)}: ${valores[i]}`}</title>
        </rect>
      ))}
      {rotX.map((i) => (
        <text key={i} x={L + i * passo + passo / 2} y={H - 6} textAnchor="middle" className="g-texto">
          {dm(dias[i])}
        </text>
      ))}
    </svg>
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
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          autoComplete="off"
          required
        />
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

function Painel({ dados, cat, setCat, item, setItem }) {
  const itensCat = dados.itens.filter((i) => i.cat === cat).sort((a, b) => b.total - a.total)
  const selecionado = itensCat.find((i) => i.path === item) || null
  const alvo = selecionado ? [selecionado] : itensCat
  const dias = listaDias(dados.inicio, dados.fim, dados.itens)
  const valores = dias.map((d) => alvo.reduce((soma, i) => soma + (i.porDia[d] || 0), 0))
  const total = valores.reduce((a, b) => a + b, 0)
  const nomeCat = CATEGORIAS.find((c) => c.id === cat).rotulo
  const titulo = selecionado ? selecionado.rotulo : nomeCat

  return (
    <>
      <div className="stats-filtros" role="group" aria-label="Tipo de dado">
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

      <h3 className="sub">
        {titulo}: {total} no período
      </h3>
      {total > 0 ? (
        <Grafico dias={dias} valores={valores} titulo={titulo} />
      ) : (
        <p className="section-intro">Nenhum registro neste período ainda.</p>
      )}
      <p className="section-note stats-aviso">
        Cada item conta visitantes dele; a mesma pessoa em páginas diferentes entra uma vez em cada.
        {dados.mais ? ' Há mais itens do que os 100 mostrados.' : ''}
      </p>

      <h3 className="sub">Por item</h3>
      {itensCat.length ? (
        <table className="stats-tabela">
          <thead>
            <tr>
              <th scope="col">Item (clique para filtrar o gráfico)</th>
              <th scope="col">Total</th>
            </tr>
          </thead>
          <tbody>
            {itensCat.map((i) => (
              <tr key={i.path}>
                <td>
                  <button
                    type="button"
                    className="stats-linha"
                    aria-pressed={selecionado && selecionado.path === i.path}
                    onClick={() => setItem(selecionado && selecionado.path === i.path ? null : i.path)}
                  >
                    {i.rotulo}
                  </button>
                </td>
                <td>{i.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="section-intro">Nada nesta categoria ainda.</p>
      )}
      {selecionado && (
        <p className="section-note">
          <button type="button" className="link stats-sair" onClick={() => setItem(null)}>
            Mostrar todos os itens
          </button>
        </p>
      )}
    </>
  )
}

export default function Stats() {
  const [cred, setCred] = useState(lerSalvo)
  const [dias, setDias] = useState(7)
  const [cat, setCat] = useState('paginas')
  const [item, setItem] = useState(null)
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
          <p className="case-lead">Página só sua. Os números vêm do GoatCounter.</p>
        </div>
      </header>
      <Section id="stats" titulo="Visitas">
        {!cred ? (
          <Entrar onEntrar={entrar} erro={erro} />
        ) : (
          <>
            <div className="stats-bar">
              <div className="stats-periodos" role="group" aria-label="Período">
                {PERIODOS.map((p) => (
                  <button
                    key={p.dias}
                    type="button"
                    className="nav-link"
                    aria-pressed={dias === p.dias}
                    onClick={() => setDias(p.dias)}
                  >
                    {p.rotulo}
                  </button>
                ))}
              </div>
              <button type="button" className="link stats-sair" onClick={sair}>
                Sair e apagar a chave
              </button>
            </div>

            {carregando && <p className="section-intro">Carregando…</p>}
            {erro && (
              <p className="stats-erro" role="alert">
                {erro}
              </p>
            )}

            {dados && <Painel dados={dados} cat={cat} setCat={setCat} item={item} setItem={setItem} />}
          </>
        )}
      </Section>
    </article>
  )
}
