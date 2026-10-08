import { useCallback, useEffect, useState } from 'react'
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
  const q = `start=${encodeURIComponent(hora(inicio))}&end=${encodeURIComponent(hora(fim))}`
  const base = `https://${conta}.goatcounter.com/api/v0/stats`
  const opts = { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }
  const [t, h] = await Promise.all([
    fetch(`${base}/total?${q}`, opts),
    fetch(`${base}/hits?${q}&limit=15`, opts),
  ])
  if (t.status === 401 || t.status === 403 || h.status === 401 || h.status === 403) {
    throw new Error('permissao')
  }
  if (!t.ok || !h.ok) throw new Error(`http ${t.status}/${h.status}`)
  return { total: await t.json(), hits: await h.json() }
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

export default function Stats() {
  const [cred, setCred] = useState(lerSalvo)
  const [dias, setDias] = useState(7)
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

            {dados && (
              <>
                <dl className="defs">
                  <div className="def">
                    <dt>Visitantes</dt>
                    <dd>{dados.total.total ?? 0}</dd>
                  </div>
                </dl>
                <h3 className="sub">Páginas mais vistas</h3>
                {dados.hits.hits && dados.hits.hits.length ? (
                  <table className="stats-tabela">
                    <thead>
                      <tr>
                        <th scope="col">Página</th>
                        <th scope="col">Visitantes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dados.hits.hits.map((h) => (
                        <tr key={h.path_id || h.path}>
                          <td>{h.path}</td>
                          <td>{h.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="section-intro">Nenhuma visita neste período ainda.</p>
                )}
              </>
            )}
          </>
        )}
      </Section>
    </article>
  )
}
