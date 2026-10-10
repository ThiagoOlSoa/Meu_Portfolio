import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import mundo from '../data/mundo.json'
import Barras from './Barras'

// Mapa de acessos: mundo por país; clicar num país dá zoom e mostra os estados.
// Zoom por botões, roda do mouse e arrastar. Cores só em dourado/amarelo (raio).
// Geometrias: Natural Earth (domínio público), geradas por scripts/gerar-mapas.mjs.
const BASE = import.meta.env.BASE_URL
const RAZAO = 2 // largura / altura da área do mapa
const MUNDO = [0, 0, mundo.w, mundo.h]
const reduzir = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const sem = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
const nomePais = (id, fallback) => {
  try {
    return new Intl.DisplayNames(['pt-BR'], { type: 'region' }).of(String(id).toUpperCase()) || fallback
  } catch {
    return fallback
  }
}
const opac = (n, max) => 0.55 + 0.45 * Math.sqrt(n / (max || 1))
const fmt = (n) => Math.round(n).toLocaleString('pt-BR')

// Caixa (x, y, w, h) na proporção do mapa, centrada em (cx, cy)
const caixaEm = (cx, cy, w, h, folga = 1.3) => {
  let W = Math.max(w * folga, 1)
  let H = W / RAZAO
  if (h * folga > H) {
    H = h * folga
    W = H * RAZAO
  }
  return [cx - W / 2, cy - H / 2, W, H]
}
const caixaPais = (box) => {
  const [x0, y0, x1, y1] = box
  const c = caixaEm((x0 + x1) / 2, (y0 + y1) / 2, Math.max(x1 - x0, 70 / 1.3), y1 - y0)
  return c[2] >= mundo.w ? MUNDO : c
}

export default function Mapa({ paises, buscarRegioes }) {
  const [sel, setSel] = useState(null)
  const [animFim, setAnimFim] = useState(false)
  const [detalhe, setDetalhe] = useState(null) // null | 'sem' | {w,h,regioes}
  const [regioes, setRegioes] = useState({ status: 'nada', lista: [] })
  const [regSel, setRegSel] = useState(null)
  const [cam, setCam] = useState(MUNDO)
  const [dica, setDica] = useState(null)
  const camRef = useRef(MUNDO)
  const limites = useRef(MUNDO)
  const raf = useRef(0)
  const ficha = useRef(0)
  const caixa = useRef(null)
  const arrasto = useRef(null)
  const moveu = useRef(false)

  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  const aplicar = (v) => {
    camRef.current = v
    setCam(v)
  }
  const animar = useCallback((alvo, fim) => {
    cancelAnimationFrame(raf.current)
    const de = camRef.current
    if (reduzir()) {
      aplicar(alvo)
      if (fim) fim()
      return
    }
    const t0 = performance.now()
    const passo = (t) => {
      const k = Math.min(1, (t - t0) / 450)
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2
      aplicar(de.map((n, i) => n + (alvo[i] - n) * e))
      if (k < 1) raf.current = requestAnimationFrame(passo)
      else if (fim) fim()
    }
    raf.current = requestAnimationFrame(passo)
  }, [])

  // Mantém a câmera dentro dos limites do mapa atual
  const preso = (x, y, w) => {
    const [bx, by, bw, bh] = limites.current
    const W = Math.min(w, bw)
    const H = W / RAZAO
    return [Math.min(Math.max(x, bx), bx + bw - W), Math.min(Math.max(y, by), by + bh - H), W, H]
  }
  const zoom = (fator, ponto) => {
    cancelAnimationFrame(raf.current)
    const [x, y, w, h] = camRef.current
    const minimo = limites.current[2] / 60
    const nw = Math.max(minimo, Math.min(limites.current[2], w * fator))
    const px = ponto ? ponto[0] : x + w / 2
    const py = ponto ? ponto[1] : y + h / 2
    const r = nw / w
    animar(preso(px - (px - x) * r, py - (py - y) * r, nw))
  }
  const doPonteiro = (e) => {
    const r = caixa.current.getBoundingClientRect()
    const [x, y, w, h] = camRef.current
    return [x + ((e.clientX - r.left) / r.width) * w, y + ((e.clientY - r.top) / r.height) * h]
  }

  // Roda do mouse (precisa ser um ouvinte não passivo para impedir a rolagem da página)
  const zoomRef = useRef(zoom)
  zoomRef.current = zoom
  useEffect(() => {
    const el = caixa.current
    if (!el) return undefined
    const aoRolar = (e) => {
      e.preventDefault()
      const r = el.getBoundingClientRect()
      const [x, y, w, h] = camRef.current
      zoomRef.current(e.deltaY < 0 ? 0.82 : 1.22, [x + ((e.clientX - r.left) / r.width) * w, y + ((e.clientY - r.top) / r.height) * h])
    }
    el.addEventListener('wheel', aoRolar, { passive: false })
    return () => el.removeEventListener('wheel', aoRolar)
  })

  const aoPressionar = (e) => {
    if (e.button !== undefined && e.button !== 0) return
    arrasto.current = { x: e.clientX, y: e.clientY, cam: camRef.current }
    moveu.current = false
  }
  const aoMover = (e) => {
    const a = arrasto.current
    if (!a) return
    const dx = e.clientX - a.x
    const dy = e.clientY - a.y
    if (!moveu.current && Math.hypot(dx, dy) < 5) return
    moveu.current = true
    setDica(null)
    cancelAnimationFrame(raf.current)
    const r = caixa.current.getBoundingClientRect()
    const [x, y, w] = a.cam
    aplicar(preso(x - (dx / r.width) * w, y - (dy / r.height) * (w / RAZAO), w))
  }
  const aoSoltar = () => {
    arrasto.current = null
    setTimeout(() => (moveu.current = false), 50)
  }
  const semArrasto = (fn) => (...args) => {
    if (moveu.current) return undefined
    return fn(...args)
  }

  const mostrarDica = (e, titulo, linha) => {
    if (arrasto.current || e.pointerType === 'touch') return
    const r = caixa.current.getBoundingClientRect()
    setDica({
      x: Math.min(Math.max(8, e.clientX - r.left + 12), Math.max(8, r.width - 190)),
      y: Math.min(Math.max(8, e.clientY - r.top + 12), Math.max(8, r.height - 60)),
      titulo,
      linha,
    })
  }

  const abrir = (id) => {
    const minha = ++ficha.current
    const p = mundo.paises.find((x) => x.id === id)
    setSel(id)
    setRegSel(null)
    setAnimFim(false)
    setDetalhe(null)
    setDica(null)
    setRegioes({ status: 'carregando', lista: [] })
    limites.current = MUNDO
    animar(p ? caixaPais(p.box) : MUNDO, () => minha === ficha.current && setAnimFim(true))
    fetch(`${BASE}mapas/${id}.json`)
      .then((r) => {
        if (!r.ok) throw new Error('sem mapa')
        return r.json()
      })
      .then((d) => minha === ficha.current && setDetalhe(d))
      .catch(() => minha === ficha.current && setDetalhe('sem'))
    buscarRegioes(id).then(
      (lista) => minha === ficha.current && setRegioes({ status: 'ok', lista }),
      () => minha === ficha.current && setRegioes({ status: 'erro', lista: [] }),
    )
  }
  const voltar = () => {
    ficha.current += 1
    setSel(null)
    setRegSel(null)
    setAnimFim(false)
    setDetalhe(null)
    setDica(null)
    limites.current = MUNDO
    animar(MUNDO)
  }
  const enquadrar = () => {
    if (detalhado) animar(limites.current)
    else animar(MUNDO)
  }

  const porPais = useMemo(() => new Map(paises.map((p) => [String(p.id).toUpperCase(), p])), [paises])
  const totalPaises = paises.reduce((s, p) => s + p.count, 0) || 1
  const maxPais = Math.max(1, ...paises.map((p) => p.count))
  const detalhado = !!(sel && animFim && detalhe && detalhe !== 'sem')

  // Ao chegar o detalhe, a câmera passa a enquadrar o mapa do país
  useEffect(() => {
    if (!detalhado) return
    const c = caixaEm(detalhe.w / 2, detalhe.h / 2, detalhe.w, detalhe.h, 1.06)
    limites.current = c
    aplicar(c)
  }, [detalhado, detalhe])

  const { porRegiao, semPosicao } = useMemo(() => {
    const mapa = new Map()
    if (!detalhe || detalhe === 'sem') return { porRegiao: mapa, semPosicao: regioes.lista }
    const usados = new Set()
    detalhe.regioes.forEach((r) => {
      const sufixo = r.id.split('-').slice(1).join('-')
      const achou = regioes.lista.find((s) => {
        const sid = String(s.id || '').toUpperCase()
        return sid === r.id || sid === sufixo || sid.endsWith(`-${sufixo}`) || sem(s.name) === sem(r.nome)
      })
      if (achou) {
        mapa.set(r.id, achou)
        usados.add(achou)
      }
    })
    return { porRegiao: mapa, semPosicao: regioes.lista.filter((s) => !usados.has(s)) }
  }, [detalhe, regioes])

  const totalReg = regioes.lista.reduce((s, r) => s + r.count, 0) || 1
  const maxReg = Math.max(1, ...regioes.lista.map((r) => r.count))
  const nomeSel = sel ? nomePais(sel, porPais.get(sel)?.name || sel) : ''
  const ordemReg = [...regioes.lista].sort((a, b) => b.count - a.count)

  // Lista da direita: países (mundo) ou estados (país aberto)
  const linhasPaises = [...paises]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((p) => ({ key: String(p.id).toUpperCase(), label: nomePais(p.id, p.name), count: p.count }))
  const chaveReg = new Map()
  porRegiao.forEach((s, rid) => chaveReg.set(s, rid))
  const linhasRegioes = ordemReg.slice(0, 14).map((r, i) => ({ key: chaveReg.get(r) || `x${r.id || i}`, label: r.name || String(r.id), count: r.count }))
  const escolherReg = (k) => setRegSel((a) => (a === k ? null : k))

  // Resumo abaixo do mapa
  let resumo = { titulo: 'Selecione um país no mapa', sub: 'Clique num país colorido, no mapa ou na lista, para ver os estados.', m: null }
  if (sel && regSel && porRegiao.get(regSel)) {
    const s = porRegiao.get(regSel)
    const reg = detalhe.regioes.find((r) => r.id === regSel)
    resumo = { titulo: reg.nome, sub: `${nomeSel}`, m: [[fmt(s.count), 'Visitantes'], [`${Math.round((s.count / totalReg) * 100)}%`, `Do total de ${nomeSel}`], [`${ordemReg.indexOf(s) + 1}º`, 'No ranking']] }
  } else if (sel && porPais.get(sel)) {
    const s = porPais.get(sel)
    const pos = [...paises].sort((a, b) => b.count - a.count).findIndex((p) => String(p.id).toUpperCase() === sel) + 1
    resumo = { titulo: nomeSel, sub: regioes.lista.length ? `${regioes.lista.length} estados com registro` : 'Selecione um estado para detalhar.', m: [[fmt(s.count), 'Visitantes'], [`${Math.round((s.count / totalPaises) * 100)}%`, 'Do total'], [`${pos}º`, 'No ranking']] }
  }

  return (
    <div className="mapa">
      <div className="mapa-col">
        <div className="mapa-barra">
          <div className="mapa-trilha">
            {sel && (
              <button type="button" className="mapa-btn" onClick={voltar}>
                ← Mundo
              </button>
            )}
            <span>{sel ? `Mundo › ${nomeSel}` : 'Mundo'}</span>
          </div>
          <div className="mapa-ctrl" role="group" aria-label="Controles do mapa">
            <button type="button" className="mapa-btn" aria-label="Diminuir zoom" onClick={() => zoom(1.35)}>
              −
            </button>
            <button type="button" className="mapa-btn" aria-label="Aumentar zoom" onClick={() => zoom(0.74)}>
              +
            </button>
            <button type="button" className="mapa-btn" onClick={enquadrar}>
              Enquadrar
            </button>
          </div>
        </div>
        <div
          className="mapa-caixa"
          ref={caixa}
          onPointerDown={aoPressionar}
          onPointerMove={aoMover}
          onPointerUp={aoSoltar}
          onPointerCancel={aoSoltar}
          onPointerLeave={() => {
            aoSoltar()
            setDica(null)
          }}
        >
          {detalhado ? (
            <svg className="mapa-svg entra" viewBox={cam.join(' ')} role="group" aria-label={`Mapa de ${nomeSel} por estado`}>
              {detalhe.regioes.map((r) => {
                const s = porRegiao.get(r.id)
                return (
                  <path
                    key={r.id}
                    d={r.d}
                    className={`m-reg${s ? ' com' : ''}${regSel === r.id ? ' sel' : ''}`}
                    style={s ? { fillOpacity: opac(s.count, maxReg) } : undefined}
                    onClick={semArrasto(() => s && escolherReg(r.id))}
                    onPointerMove={(e) => mostrarDica(e, r.nome, `${s ? fmt(s.count) : 0} visitantes`)}
                    onPointerLeave={() => setDica(null)}
                  />
                )
              })}
            </svg>
          ) : (
            <svg className="mapa-svg" viewBox={cam.join(' ')} role="group" aria-label="Mapa-múndi de acessos por país">
              {mundo.paises.map((p) => {
                const s = porPais.get(p.id)
                if (!s) return <path key={p.id} d={p.d} className="m-pais" />
                const nome = nomePais(p.id, p.nome)
                return (
                  <path
                    key={p.id}
                    d={p.d}
                    className={`m-pais com${sel === p.id ? ' sel' : ''}`}
                    style={{ fillOpacity: opac(s.count, maxPais) }}
                    role="button"
                    tabIndex={0}
                    aria-label={`${nome}: ${s.count} visitantes. Ver estados`}
                    onClick={semArrasto(() => abrir(p.id))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        abrir(p.id)
                      }
                    }}
                    onPointerMove={(e) => mostrarDica(e, nome, `${fmt(s.count)} visitantes · clique para ver os estados`)}
                    onPointerLeave={() => setDica(null)}
                  />
                )
              })}
            </svg>
          )}
          {dica && (
            <div className="mapa-dica" style={{ left: dica.x, top: dica.y }} role="status">
              <strong>{dica.titulo}</strong>
              <span>{dica.linha}</span>
            </div>
          )}
        </div>

        <ul className="mapa-leg" aria-label="Legenda">
          <li>
            <i className="mapa-leg-a" /> Mais acessos
          </li>
          <li>
            <i className="mapa-leg-b" /> Menos acessos
          </li>
          <li>
            <i className="mapa-leg-c" /> Sem acessos registrados
          </li>
        </ul>

        <div className="mapa-resumo" aria-live="polite">
          <div>
            <strong>{resumo.titulo}</strong>
            <span>{resumo.sub}</span>
          </div>
          {resumo.m && (
            <dl>
              {resumo.m.map(([n, r]) => (
                <div key={r}>
                  <dt>{r}</dt>
                  <dd>{n}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>

      <div className="mapa-lista">
        {sel ? (
          <>
            <h4 className="mapa-sub">Estados · {nomeSel}</h4>
            {regioes.status === 'carregando' && <p className="stats-vazio">Carregando estados…</p>}
            {regioes.status === 'erro' && <p className="stats-vazio">Não consegui buscar os estados deste país no GoatCounter.</p>}
            {regioes.status === 'ok' && !regioes.lista.length && (
              <p className="stats-vazio">O GoatCounter não informou estados para este país neste período.</p>
            )}
            {regioes.lista.length > 0 && <Barras linhas={linhasRegioes} ativo={regSel} onEscolher={escolherReg} />}
            {detalhe === 'sem' && <p className="stats-vazio">Este país não tem mapa de estados disponível.</p>}
            {detalhado && semPosicao.length > 0 && (
              <p className="stats-vazio">Sem posição no mapa: {semPosicao.map((s) => `${s.name || s.id} (${s.count})`).join(', ')}.</p>
            )}
          </>
        ) : paises.length ? (
          <>
            <h4 className="mapa-sub">Países com mais acessos</h4>
            <Barras linhas={linhasPaises} onEscolher={abrir} />
          </>
        ) : (
          <p className="stats-vazio">Ainda sem registros de localização neste período.</p>
        )}
      </div>
    </div>
  )
}
