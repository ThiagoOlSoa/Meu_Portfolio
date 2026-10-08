import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import mundo from '../data/mundo.json'
import Barras from './Barras'

// Mapa de acessos: mundo por país; clicar num país dá zoom e mostra os estados.
// Cores só em dourado/amarelo (raio). Geometrias: Natural Earth (domínio público),
// geradas por scripts/gerar-mapas.mjs. Detalhe de cada país carrega só ao clicar.
const BASE = import.meta.env.BASE_URL
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

// Caixa de zoom (x, y, largura, altura) com a mesma proporção do mapa
function caixa(box) {
  const [x0, y0, x1, y1] = box
  const cx = (x0 + x1) / 2
  const cy = (y0 + y1) / 2
  const prop = mundo.w / mundo.h
  let W = Math.max((x1 - x0) * 1.3, 70)
  let H = W / prop
  if ((y1 - y0) * 1.3 > H) {
    H = (y1 - y0) * 1.3
    W = H * prop
  }
  if (W >= mundo.w) return MUNDO
  return [cx - W / 2, cy - H / 2, W, H]
}

export default function Mapa({ paises, buscarRegioes }) {
  const [sel, setSel] = useState(null)
  const [animFim, setAnimFim] = useState(false)
  const [detalhe, setDetalhe] = useState(null) // null | 'sem' | {w,h,regioes}
  const [regioes, setRegioes] = useState({ status: 'nada', lista: [] })
  const [vb, setVb] = useState(MUNDO)
  const vbRef = useRef(MUNDO)
  const raf = useRef(0)
  const ficha = useRef(0)

  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  const animar = useCallback((alvo, fim) => {
    cancelAnimationFrame(raf.current)
    const de = vbRef.current
    if (reduzir()) {
      vbRef.current = alvo
      setVb(alvo)
      if (fim) fim()
      return
    }
    const t0 = performance.now()
    const passo = (t) => {
      const k = Math.min(1, (t - t0) / 450)
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2
      const v = de.map((n, i) => n + (alvo[i] - n) * e)
      vbRef.current = v
      setVb(v)
      if (k < 1) raf.current = requestAnimationFrame(passo)
      else if (fim) fim()
    }
    raf.current = requestAnimationFrame(passo)
  }, [])

  const abrir = (id) => {
    const minha = ++ficha.current
    const p = mundo.paises.find((x) => x.id === id)
    setSel(id)
    setAnimFim(false)
    setDetalhe(null)
    setRegioes({ status: 'carregando', lista: [] })
    animar(p ? caixa(p.box) : MUNDO, () => minha === ficha.current && setAnimFim(true))
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
    setAnimFim(false)
    setDetalhe(null)
    animar(MUNDO)
  }

  const porPais = useMemo(() => new Map(paises.map((p) => [String(p.id).toUpperCase(), p])), [paises])
  const maxPais = Math.max(1, ...paises.map((p) => p.count))
  const detalhado = !!(sel && animFim && detalhe && detalhe !== 'sem')

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
  const maxReg = Math.max(1, ...regioes.lista.map((r) => r.count))
  const nomeSel = sel ? nomePais(sel, porPais.get(sel)?.name || sel) : ''

  const linhasPaises = [...paises]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((p) => ({ key: String(p.id).toUpperCase(), label: nomePais(p.id, p.name), count: p.count }))
  const linhasRegioes = [...regioes.lista]
    .sort((a, b) => b.count - a.count)
    .slice(0, 12)
    .map((r, i) => ({ key: `${r.id || i}`, label: r.name || String(r.id), count: r.count }))

  return (
    <div className="mapa">
      <div className="mapa-caixa">
        {detalhado ? (
          <svg className="mapa-svg entra" viewBox={`0 0 ${detalhe.w} ${detalhe.h}`} role="img" aria-label={`Mapa de ${nomeSel} por estado`}>
            {detalhe.regioes.map((r) => {
              const s = porRegiao.get(r.id)
              return (
                <path
                  key={r.id}
                  d={r.d}
                  className={`m-reg${s ? ' com' : ''}`}
                  style={s ? { fillOpacity: opac(s.count, maxReg) } : undefined}
                >
                  <title>{`${r.nome}: ${s ? s.count : 0}`}</title>
                </path>
              )
            })}
          </svg>
        ) : (
          <svg className="mapa-svg" viewBox={vb.join(' ')} role="group" aria-label="Mapa-múndi de acessos por país">
            {mundo.paises.map((p) => {
              const s = porPais.get(p.id)
              if (!s) return <path key={p.id} d={p.d} className="m-pais" />
              return (
                <path
                  key={p.id}
                  d={p.d}
                  className={`m-pais com${sel === p.id ? ' sel' : ''}`}
                  style={{ fillOpacity: opac(s.count, maxPais) }}
                  role="button"
                  tabIndex={0}
                  aria-label={`${nomePais(p.id, p.nome)}: ${s.count} acessos. Ver detalhes`}
                  onClick={() => abrir(p.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      abrir(p.id)
                    }
                  }}
                >
                  <title>{`${nomePais(p.id, p.nome)}: ${s.count}`}</title>
                </path>
              )
            })}
          </svg>
        )}
      </div>

      <div className="mapa-lista">
        {sel ? (
          <>
            <button type="button" className="link stats-sair" onClick={voltar}>
              ← Voltar ao mundo
            </button>
            <h4 className="mapa-sub">{nomeSel}</h4>
            {regioes.status === 'carregando' && <p className="stats-vazio">Carregando estados…</p>}
            {regioes.status === 'erro' && <p className="stats-vazio">Não consegui buscar os estados deste país no GoatCounter.</p>}
            {regioes.status === 'ok' && !regioes.lista.length && (
              <p className="stats-vazio">O GoatCounter não informou estados para este país neste período.</p>
            )}
            {regioes.lista.length > 0 && <Barras linhas={linhasRegioes} />}
            {detalhe === 'sem' && <p className="stats-vazio">Este país não tem mapa de estados disponível.</p>}
            {detalhado && semPosicao.length > 0 && (
              <p className="stats-vazio">
                Sem posição no mapa: {semPosicao.map((s) => `${s.name || s.id} (${s.count})`).join(', ')}.
              </p>
            )}
          </>
        ) : paises.length ? (
          <>
            <h4 className="mapa-sub">Países</h4>
            <p className="stats-vazio mapa-dica">Clique num país colorido, no mapa ou na lista, para ver os estados.</p>
            <Barras linhas={linhasPaises} onEscolher={abrir} />
          </>
        ) : (
          <p className="stats-vazio">Ainda sem registros de localização neste período.</p>
        )}
      </div>
    </div>
  )
}
