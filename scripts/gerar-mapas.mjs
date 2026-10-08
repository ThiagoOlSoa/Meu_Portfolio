// Gera os mapas usados na página #/stats a partir do Natural Earth (domínio público).
// Uso: node scripts/gerar-mapas.mjs paises110.geojson estados10.geojson
// Saída: src/data/mundo.json (países) e public/mapas/<PAIS>.json (estados de cada país).
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { geoNaturalEarth1, geoMercator, geoPath } from 'd3-geo'
import { topology } from 'topojson-server'
import { presimplify, simplify } from 'topojson-simplify'
import { feature } from 'topojson-client'

const [paisesArq, estadosArq] = process.argv.slice(2)
if (!paisesArq || !estadosArq) {
  console.error('Uso: node scripts/gerar-mapas.mjs paises110.geojson estados10.geojson')
  process.exit(1)
}

const paises = JSON.parse(readFileSync(paisesArq, 'utf8'))
const estados = JSON.parse(readFileSync(estadosArq, 'utf8'))

const a2 = (p) => {
  const v = p.ISO_A2_EH && p.ISO_A2_EH !== '-99' ? p.ISO_A2_EH : p.ISO_A2
  return v && v !== '-99' ? v : null
}

// Mundo -------------------------------------------------------------------
const W = 1000
const H = 500
const proj = geoNaturalEarth1().fitSize([W, H], { type: 'Sphere' })
const caminho = geoPath(proj).digits(1)
const lista = []
for (const f of paises.features) {
  const id = a2(f.properties)
  if (!id || id === 'AQ') continue
  const d = caminho(f)
  if (!d) continue
  const [[x0, y0], [x1, y1]] = caminho.bounds(f)
  lista.push({ id, nome: f.properties.NAME, d, box: [x0, y0, x1, y1].map((n) => Math.round(n * 10) / 10) })
}
writeFileSync('src/data/mundo.json', JSON.stringify({ w: W, h: H, paises: lista }))
console.log('mundo:', lista.length, 'países')

// Estados por país -----------------------------------------------------------
const porPais = new Map()
for (const f of estados.features) {
  const id = f.properties.iso_a2
  if (!/^[A-Z]{2}$/.test(id || '')) continue
  if (!porPais.has(id)) porPais.set(id, [])
  porPais.get(id).push(f)
}

rmSync('public/mapas', { recursive: true, force: true })
mkdirSync('public/mapas', { recursive: true })
const ALVO = 1800 // pontos mantidos por país
let total = 0
for (const [id, fs] of porPais) {
  const colecao = {
    type: 'FeatureCollection',
    features: fs.map((f) => ({
      type: 'Feature',
      properties: { id: f.properties.iso_3166_2, nome: f.properties.name_pt || f.properties.name },
      geometry: f.geometry,
    })),
  }
  const topo = presimplify(topology({ r: colecao }, 1e5))
  const pesos = []
  for (const arco of topo.arcs) for (const p of arco) if (Number.isFinite(p[2])) pesos.push(p[2])
  pesos.sort((a, b) => b - a)
  const limite = pesos.length > ALVO ? pesos[ALVO] : 0
  const simples = simplify(topo, limite)
  const col = feature(simples, simples.objects.r)

  const largura = 800
  const p = geoMercator().fitWidth(largura, col)
  const c = geoPath(p).digits(1)
  const [[, y0], [, y1]] = c.bounds(col)
  const altura = Math.ceil(y1 - y0 + 2)
  const p2 = geoMercator().fitExtent([[0, 0], [largura, altura]], col)
  const c2 = geoPath(p2).digits(1)
  const regioes = col.features
    .map((f) => ({ id: f.properties.id, nome: f.properties.nome, d: c2(f) }))
    .filter((r) => r.d)
  const saida = JSON.stringify({ w: largura, h: altura, regioes })
  writeFileSync(`public/mapas/${id}.json`, saida)
  total += saida.length
}
console.log('estados:', porPais.size, 'países,', Math.round(total / 1024), 'KB no total')
