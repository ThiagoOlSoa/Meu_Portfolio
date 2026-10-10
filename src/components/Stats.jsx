import { useCallback, useEffect, useRef, useState } from 'react'
import Barras from './Barras'
import Mapa from './Mapa'
import {
  PERIODOS,
  SIZES,
  agruparOrigem,
  api,
  buscar,
  calcularPeriodo,
  calcularSinais,
  dm,
  lerSalvo,
  listaDias,
  nomeOrigem,
  salvar,
  serieDe,
  soma,
  totalCat,
  totalDe,
} from '../stats/dados'

// Página privada de estatísticas (#/stats). A chave da API do GoatCounter fica
// só no navegador de quem digitou (localStorage). Nunca vai para o código do site.
const SERIES = [
  { id: 'visitantes', rotulo: 'Visitantes' },
  { id: 'cliques', rotulo: 'Cliques' },
  { id: 'secoes', rotulo: 'Seções vistas' },
  { id: 'projetos', rotulo: 'Projetos' },
]
const SECOES = [
  ['resumo', 'Resumo'],
  ['visitas', 'Visitas'],
  ['projetos', 'Projetos'],
  ['interesse', 'Interesse'],
  ['origem', 'Origem e aparelhos'],
  ['mapa', 'Mapa'],
]

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

function Variacao({ atual, antes, anterior }) {
  if (!antes) return <p className="kpi-delta">{anterior}: 0</p>
  const p = Math.round(((atual - antes) / antes) * 100)
  return (
    <p className="kpi-delta">
      <strong>
        {p > 0 ? '+' : p < 0 ? '−' : ''}
        {Math.abs(p)}%
      </strong>{' '}
      · {anterior}: {antes}
    </p>
  )
}

function Kpi({ rotulo, atual, antes, serie, anterior, nota }) {
  return (
    <div className="cartao kpi">
      <p className="kpi-label">{rotulo}</p>
      <div className="kpi-corpo">
        <div>
          <p className="kpi-num">{atual}</p>
          <Variacao atual={atual} antes={antes} anterior={anterior} />
        </div>
        <Mini valores={serie} />
      </div>
      {nota && <p className="cartao-nota">{nota}</p>}
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

// Barras com guia, balão e teclado (setas, Home, End)
function Grafico({ rotulos, valores, titulo }) {
  const [ativo, setAtivo] = useState(null)
  const max = Math.max(1, ...valores)
  const topo = max <= 4 ? max : Math.ceil(max / 5) * 5
  const estreito = typeof window !== 'undefined' && window.innerWidth < 560
  const L = 34
  const W = estreito ? 340 : 720
  const H = estreito ? 230 : 240
  const base = H - 28
  const n = rotulos.length
  const passo = (W - L - 8) / n
  const larg = Math.max(2, passo * 0.7)
  const y = (v) => base - (v / topo) * (base - 10)
  const marcas = [0, Math.round(topo / 2), topo].filter((v, i, a) => a.indexOf(v) === i)
  const rotX = [0, Math.floor((n - 1) / 2), n - 1].filter((v, i, a) => a.indexOf(v) === i)
  const tecla = (e) => {
    const f = { ArrowRight: (i) => Math.min(n - 1, (i ?? -1) + 1), ArrowLeft: (i) => Math.max(0, (i ?? n) - 1), Home: () => 0, End: () => n - 1 }[e.key]
    if (f) {
      e.preventDefault()
      setAtivo(f)
    } else if (e.key === 'Escape') setAtivo(null)
  }
  const cx = ativo === null ? 0 : L + ativo * passo + passo / 2
  return (
    <div className="grafico-caixa" onMouseLeave={() => setAtivo(null)}>
      <svg
        className="stats-grafico"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        tabIndex={0}
        onKeyDown={tecla}
        onBlur={() => setAtivo(null)}
        aria-label={`${titulo}. Total no período: ${soma(valores)}. Use as setas para ler dia a dia.`}
      >
        {marcas.map((v) => (
          <g key={v}>
            <line x1={L} x2={W - 8} y1={y(v)} y2={y(v)} className="g-linha" />
            <text x={L - 8} y={y(v) + 4} textAnchor="end" className="g-texto">
              {v}
            </text>
          </g>
        ))}
        {ativo !== null && <line x1={cx} x2={cx} y1={6} y2={base} className="g-guia" />}
        {rotulos.map((d, i) => (
          <g key={d}>
            <rect x={L + i * passo + (passo - larg) / 2} y={y(valores[i])} width={larg} height={base - y(valores[i])} className={`g-barra${ativo === i ? ' on' : ''}`} />
            <rect x={L + i * passo} y={0} width={passo} height={base} fill="transparent" onMouseEnter={() => setAtivo(i)} onMouseMove={() => setAtivo(i)} onClick={() => setAtivo(i)} />
          </g>
        ))}
        {rotX.map((i) => (
          <text key={i} x={L + i * passo + passo / 2} y={H - 6} textAnchor="middle" className="g-texto">
            {rotulos[i]}
          </text>
        ))}
      </svg>
      {ativo !== null && (
        <p className="g-balao" style={{ left: `${Math.min(88, Math.max(12, (cx / W) * 100))}%` }} aria-live="polite">
          <strong>{valores[ativo]}</strong> · {rotulos[ativo]}
        </p>
      )}
    </div>
  )
}

function Dashboard({ dados, serie, setSerie, agrup, setAgrup, buscarRegioes }) {
  const A = dados.itens
  const B = dados.itensAnt
  const per = dados.per
  const ant = per.anterior
  const dias = listaDias(per, A)
  const ehPag = (i) => i.cat === 'paginas'
  const visitasDia = serieDe(A, dias, ehPag)
  const contatos = ['clique/whatsapp', 'clique/email']
  const um = ['tempo/1min']

  const filtros = {
    visitantes: ehPag,
    cliques: (i) => i.cat === 'cliques',
    secoes: (i) => i.cat === 'secoes',
    projetos: (i) => i.cat === 'projetos',
  }
  const porDia = serieDe(A, dias, filtros[serie])
  let rotulos = dias.map(dm)
  let valores = porDia
  if (agrup === 'semana' && dias.length > 7) {
    rotulos = []
    valores = []
    for (let i = 0; i < dias.length; i += 7) {
      rotulos.push(dm(dias[i]))
      valores.push(soma(porDia.slice(i, i + 7)))
    }
  }
  const total = soma(valores)
  const titulo = SERIES.find((c) => c.id === serie).rotulo

  const lin = (c, n = 8) =>
    A.filter((i) => i.cat === c)
      .sort((a, b) => b.total - a.total)
      .slice(0, n)
      .map((i) => ({ key: i.path, label: i.rotulo, count: i.total }))
  const mapa = (arr, rot) => arr.map((e, i) => ({ key: `${e.id || i}`, label: rot(e), count: e.count }))
  const tempo = [
    ['tempo/30s', '30 segundos'],
    ['tempo/1min', '1 minuto'],
    ['tempo/3min', '3 minutos'],
  ].map(([p, r]) => ({ key: p, label: `Ficaram ${r} ou mais`, count: totalDe(A, [p]) }))
  const projetos = lin('projetos')
  const sinais = calcularSinais(dados)

  return (
    <div className="dash-secoes">
      <section id="resumo" className="dash-sec" aria-label="Resumo">
        <div className="kpis">
          <Kpi rotulo="Visitantes" atual={dados.visitantes} antes={dados.visitantesAnt} serie={visitasDia} anterior={ant} />
          <Kpi rotulo="Pedidos de contato" atual={totalDe(A, contatos)} antes={totalDe(B, contatos)} serie={serieDe(A, dias, (i) => contatos.includes(i.path))} anterior={ant} nota="Cliques em WhatsApp e e-mail." />
          <Kpi rotulo="Ficaram 1 minuto ou mais" atual={totalDe(A, um)} antes={totalDe(B, um)} serie={serieDe(A, dias, (i) => um.includes(i.path))} anterior={ant} nota="Aba aberta e visível." />
          <Kpi rotulo="Cliques no currículo" atual={totalDe(A, ['clique/curriculo'])} antes={totalDe(B, ['clique/curriculo'])} serie={serieDe(A, dias, (i) => i.path === 'clique/curriculo')} anterior={ant} nota="Fica em zero até o currículo existir no site." />
        </div>
      </section>

      <section id="visitas" className="dash-sec" aria-label="Visitas ao longo do tempo">
        <h2 className="dash-h">Visitas</h2>
        <div className="cartao grande">
          <div className="cartao-topo">
            <h3 className="cartao-titulo">
              {titulo}: {total}
            </h3>
            {dias.length > 7 && (
              <div className="stats-grupo" role="group" aria-label="Agrupar por">
                <button type="button" className="nav-link" aria-pressed={agrup === 'dia'} onClick={() => setAgrup('dia')}>
                  Dias
                </button>
                <button type="button" className="nav-link" aria-pressed={agrup === 'semana'} onClick={() => setAgrup('semana')}>
                  Semanas
                </button>
              </div>
            )}
          </div>
          <div className="stats-grupo" role="group" aria-label="Tipo de dado">
            {SERIES.map((c) => (
              <button key={c.id} type="button" className="nav-link" aria-pressed={serie === c.id} onClick={() => setSerie(c.id)}>
                {c.rotulo}
              </button>
            ))}
          </div>
          {total > 0 ? <Grafico key={serie + agrup + per.id} rotulos={rotulos} valores={valores} titulo={titulo} /> : <p className="stats-vazio">Nenhum registro neste período ainda.</p>}
          <p className="stats-aviso">
            Cada item conta os visitantes dele; quem abre duas páginas entra uma vez em cada.
            {dados.mais ? ' Há mais itens do que os 100 mostrados.' : ''}
          </p>
        </div>
      </section>

      <section id="projetos" className="dash-sec" aria-label="Projetos mais acessados">
        <h2 className="dash-h">Projetos</h2>
        <div className="dash-grade">
          <Cartao titulo="Projetos mais acessados" nota="Abertura da página de cada sistema. A contagem começou no último deploy." classe="m3 meio">
            <Barras linhas={projetos} vazio="Ainda sem aberturas de projeto neste período." />
          </Cartao>
          <Cartao titulo="Seções vistas" nota="Chegaram à seção, uma vez por visita." classe="m3 meio">
            <Barras linhas={lin('secoes')} />
          </Cartao>
          <Cartao titulo="Ações externas" nota="Cliques em contato e perfis." classe="m3 meio">
            <Barras linhas={lin('cliques')} />
          </Cartao>
          <Cartao titulo="Tempo no site" nota="Aba aberta e visível. Sobre os visitantes do período." classe="m3 meio">
            {tempo.some((t) => t.count > 0) ? (
              <Barras linhas={tempo.map((t) => ({ ...t, count: t.count }))} base={dados.visitantes} />
            ) : (
              <p className="stats-vazio">Ainda sem registros neste período.</p>
            )}
          </Cartao>
        </div>
      </section>

      <section id="interesse" className="dash-sec" aria-label="Sinais de interesse">
        <h2 className="dash-h">Sinais de interesse</h2>
        {sinais.length ? (
          <ul className="sinais">
            {sinais.map((s) => (
              <li key={s.tag}>
                <span className="sinal-tag">{s.tag}</span>
                <span>{s.texto}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="stats-vazio">Os sinais aparecem a partir de {20} visitantes no período, para não tirar conclusão de pouca coisa.</p>
        )}
        <p className="stats-aviso">Frases calculadas dos números acima, sem estimativa.</p>
      </section>

      <section id="origem" className="dash-sec" aria-label="Origem e aparelhos">
        <h2 className="dash-h">Origem e aparelhos</h2>
        <div className="dash-grade">
          {dados.origem && (
            <Cartao titulo="Origem do tráfego" nota="De onde vieram as visitas." classe="m3 meio">
              <Rosca linhas={agruparOrigem(dados.origem)} />
              <h4 className="cartao-sub">Detalhe</h4>
              <Barras linhas={mapa(dados.origem, nomeOrigem).slice(0, 6)} />
            </Cartao>
          )}
          {dados.aparelhos && (
            <Cartao titulo="Dispositivos" nota="Tamanho de tela." classe="m3 meio">
              <Rosca linhas={mapa(dados.aparelhos, (e) => SIZES[e.name] || e.name)} />
              {dados.navegadores && dados.navegadores.length > 0 && (
                <>
                  <h4 className="cartao-sub">Navegadores</h4>
                  <Barras linhas={mapa(dados.navegadores, (e) => e.name).slice(0, 5)} />
                </>
              )}
            </Cartao>
          )}
        </div>
      </section>

      <section id="mapa" className="dash-sec" aria-label="Localização dos visitantes">
        <h2 className="dash-h">Mapa</h2>
        {dados.paises ? (
          <div className="cartao grande total">
            <h3 className="cartao-titulo">Localização dos visitantes</h3>
            <p className="cartao-nota">Dourado mais forte, mais acessos. Toque num país para aproximar.</p>
            <Mapa paises={dados.paises} buscarRegioes={buscarRegioes} />
          </div>
        ) : (
          <p className="stats-vazio">O mapa não carregou. Toque em Atualizar.</p>
        )}
      </section>

      {dados.falhas && dados.falhas.length > 0 && (
        <p className="stats-aviso">Alguns quadros não carregaram ({dados.falhas.join('; ')}). Toque em Atualizar para tentar de novo.</p>
      )}
      <p className="stats-aviso">Pedidos de contato = cliques em WhatsApp e e-mail. A comparação é com {per.id === 'hoje' ? 'ontem (dia inteiro)' : `os ${dados.per.dias} dias imediatamente anteriores`}.</p>
    </div>
  )
}

function BarraPeriodo({ per, setPer, custom, setCustom, carregando, carregar, sair }) {
  const [ini, setIni] = useState(custom.ini)
  const [fim, setFim] = useState(custom.fim)
  const hoje = new Date().toISOString().slice(0, 10)
  const valido = ini && fim && ini <= fim
  return (
    <div className="stats-bar">
      <div className="stats-grupo" role="group" aria-label="Período">
        {PERIODOS.map((p) => (
          <button key={p.id} type="button" className="nav-link" aria-pressed={per === p.id} onClick={() => setPer(p.id)}>
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
      {per === 'custom' && (
        <form
          className="stats-datas"
          onSubmit={(e) => {
            e.preventDefault()
            if (valido) setCustom({ ini, fim })
          }}
        >
          <label>
            De
            <input type="date" value={ini} max={hoje} onChange={(e) => setIni(e.target.value)} required />
          </label>
          <label>
            Até
            <input type="date" value={fim} max={hoje} onChange={(e) => setFim(e.target.value)} required />
          </label>
          <button className="btn" type="submit" disabled={!valido}>
            Aplicar
          </button>
          {!valido && ini && fim && <p className="stats-erro">A data inicial precisa ser anterior à final.</p>}
        </form>
      )}
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
  const [perId, setPerId] = useState('30')
  const [custom, setCustom] = useState({ ini: '', fim: '' })
  const [serie, setSerie] = useState('visitantes')
  const [agrup, setAgrup] = useState('dia')
  const [dados, setDados] = useState(null)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [rec, setRec] = useState(0)
  const per = useRef(null)

  const carregar = useCallback(() => setRec((n) => n + 1), [])

  useEffect(() => {
    if (!cred) return
    const p = calcularPeriodo(perId, custom.ini, custom.fim)
    per.current = p
    if (!p) {
      setDados(null)
      return
    }
    let ativo = true
    setCarregando(true)
    setErro('')
    buscar(cred.conta, cred.token, p)
      .then((d) => ativo && setDados(d))
      .catch((e) => {
        if (!ativo) return
        setDados(null)
        if (e.message === 'permissao') {
          setErro('A chave foi recusada. Confira se ela tem permissão de leitura das estatísticas.')
        } else if (e instanceof TypeError) {
          setErro(`O navegador não conseguiu falar com o GoatCounter (rede, bloqueador de anúncios ou o GoatCounter não aceita chamadas vindas deste site). Use o painel direto em ${cred.conta}.goatcounter.com.`)
        } else {
          setErro(`O GoatCounter respondeu com erro (${e.message}).`)
        }
      })
      .finally(() => ativo && setCarregando(false))
    return () => {
      ativo = false
    }
  }, [cred, perId, custom, rec])

  const buscarRegioes = useCallback(
    (id) => api(cred.conta, cred.token, `stats/locations/${encodeURIComponent(id)}`, `${dados.consulta}&limit=100`).then((r) => r.stats || []),
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
  const ir = (id) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
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
            <BarraPeriodo per={perId} setPer={setPerId} custom={custom} setCustom={setCustom} carregando={carregando} carregar={carregar} sair={sair} />
            {dados && (
              <nav className="dash-nav" aria-label="Seções do painel">
                {SECOES.map(([id, r]) => (
                  <button key={id} type="button" className="nav-link" onClick={() => ir(id)}>
                    {r}
                  </button>
                ))}
              </nav>
            )}
            {perId === 'custom' && !dados && !carregando && !erro && <p className="stats-vazio">Escolha as datas e toque em Aplicar.</p>}
            {erro && (
              <p className="stats-erro" role="alert">
                {erro}
              </p>
            )}
            {dados && <Dashboard dados={dados} serie={serie} setSerie={setSerie} agrup={agrup} setAgrup={setAgrup} buscarRegioes={buscarRegioes} />}
          </>
        )}
      </div>
    </article>
  )
}
