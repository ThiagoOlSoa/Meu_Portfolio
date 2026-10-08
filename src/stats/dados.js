import { ROTULOS } from '../analytics'
import { projetos } from '../content'

// Acesso e tratamento dos dados do GoatCounter para a página #/stats.
// A chave da API fica só no navegador de quem digitou (localStorage).
const CHAVE = 'gc-stats'

export const lerSalvo = () => {
  try {
    return JSON.parse(localStorage.getItem(CHAVE)) || null
  } catch {
    return null
  }
}
export const salvar = (v) => {
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
export const faixa = (a, b) => `start=${encodeURIComponent(hora(a))}&end=${encodeURIComponent(hora(b))}`

export async function api(conta, token, caminho, params) {
  const r = await fetch(`https://${conta}.goatcounter.com/api/v0/${caminho}?${params}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  })
  if (r.status === 401 || r.status === 403) throw new Error('permissao')
  if (!r.ok) throw new Error(`http ${r.status}`)
  return r.json()
}

// Períodos ---------------------------------------------------------------------
export const PERIODOS = [
  { id: '7', rotulo: 'Últimos 7 dias' },
  { id: '30', rotulo: 'Últimos 30 dias' },
  { id: '90', rotulo: 'Últimos 90 dias' },
  { id: 'ano', rotulo: 'Este ano' },
  { id: 'custom', rotulo: 'Personalizado' },
]
const DIA = 86400000

// Devolve início/fim do período e o período anterior de mesma duração (ou null se inválido)
export function calcularPeriodo(id, ini, fimData) {
  const agora = new Date()
  let inicio
  let fim = agora
  if (id === 'ano') {
    inicio = new Date(agora.getFullYear(), 0, 1)
  } else if (id === 'custom') {
    if (!ini || !fimData || ini > fimData) return null
    inicio = new Date(`${ini}T00:00:00`)
    fim = new Date(new Date(`${fimData}T00:00:00`).getTime() + DIA)
    if (fim > agora) fim = agora
    if (fim <= inicio) return null
  } else {
    inicio = new Date(agora.getTime() - Number(id) * DIA)
  }
  const dur = fim.getTime() - inicio.getTime()
  const rotulo =
    id === 'custom'
      ? `${ini.split('-').reverse().join('/')} a ${fimData.split('-').reverse().join('/')}`
      : PERIODOS.find((p) => p.id === id).rotulo.toLowerCase()
  return { id, inicio, fim, antesIni: new Date(inicio.getTime() - dur), dias: Math.max(1, Math.round(dur / DIA)), rotulo }
}

// Itens: páginas (visitas) e eventos clique/..., secao/..., tempo/..., projeto/...
const nomeProjeto = (path) => {
  const id = path.slice('projeto/'.length)
  return (projetos.find((p) => p.id === id) || {}).nome || id
}
export function paraItem(h) {
  const p = h.path || ''
  let cat = 'paginas'
  if (h.event) {
    cat = p.startsWith('clique/') ? 'cliques' : p.startsWith('secao/') ? 'secoes' : p.startsWith('tempo/') ? 'tempo' : p.startsWith('projeto/') ? 'projetos' : 'outro'
  }
  const porDia = {}
  ;(h.stats || []).forEach((s) => {
    porDia[String(s.day).slice(0, 10)] = s.daily || 0
  })
  const rotulo = cat === 'projetos' ? nomeProjeto(p) : ROTULOS[p] || p
  return { path: p, rotulo, cat, total: h.count || 0, porDia }
}

export async function buscar(conta, token, per) {
  const atual = faixa(per.inicio, per.fim)
  const anterior = faixa(per.antesIni, per.inicio)
  const [hits, hitsAnt, total, totalAnt] = await Promise.all([
    api(conta, token, 'stats/hits', `${atual}&group=day&limit=100`),
    api(conta, token, 'stats/hits', `${anterior}&limit=100`),
    api(conta, token, 'stats/total', atual),
    api(conta, token, 'stats/total', anterior),
  ])
  // Quebras (origem, aparelho, navegador, país): se alguma falhar, só some o bloco
  const pedidos = [
    ['toprefs', 50],
    ['sizes', 10],
    ['browsers', 10],
    ['locations', 100],
  ]
  const extra = await Promise.allSettled(pedidos.map(([p, n]) => api(conta, token, `stats/${p}`, `${atual}&limit=${n}`)))
  const lista = (i) => (extra[i].status === 'fulfilled' ? extra[i].value.stats || [] : null)
  const serieTotal = {}
  ;(total.stats || []).forEach((s) => {
    serieTotal[String(s.day).slice(0, 10)] = s.daily || 0
  })
  return {
    per,
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

// Utilitários -------------------------------------------------------------------
export const soma = (v) => v.reduce((a, b) => a + b, 0)
export const dm = (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`
export const totalDe = (itens, paths) => itens.filter((i) => paths.includes(i.path)).reduce((s, i) => s + i.total, 0)
export const totalCat = (itens, cat) => itens.filter((i) => i.cat === cat).reduce((s, i) => s + i.total, 0)
export const serieDe = (itens, dias, filtro) => dias.map((d) => itens.filter(filtro).reduce((s, i) => s + (i.porDia[d] || 0), 0))
export const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0)

export function listaDias(per, itens) {
  const set = new Set([per.fim.toISOString().slice(0, 10)])
  for (let t = per.inicio.getTime(); t <= per.fim.getTime(); t += DIA) set.add(new Date(t).toISOString().slice(0, 10))
  itens.forEach((i) => Object.keys(i.porDia).forEach((d) => set.add(d)))
  return [...set].sort()
}

// Nomes e agrupamentos ------------------------------------------------------------
export const SIZES = {
  Phones: 'Celulares',
  'Large phones, small tablets': 'Celulares grandes e tablets pequenos',
  'Tablets and small laptops': 'Tablets e notebooks pequenos',
  'Computer monitors': 'Monitores de computador',
  'Computer monitors larger than HD': 'Monitores maiores que HD',
  Unknown: 'Desconhecido',
}
const BUSCA = /google|bing|duckduckgo|yahoo|ecosia|brave|baidu|yandex/i
const REDES = /linkedin|instagram|facebook|twitter|t\.co|x\.com|whatsapp|telegram|youtube|reddit|tiktok|pinterest|threads/i
export const nomeOrigem = (e) => (!e.name || /^direct$/i.test(e.name) ? 'Acesso direto' : e.name)
export function categoriaOrigem(e) {
  if (!e.name || /^direct$/i.test(e.name)) return 'Acesso direto'
  if (BUSCA.test(e.name)) return 'Busca'
  if (REDES.test(e.name)) return 'Redes sociais'
  return 'Referências'
}
export function agruparOrigem(lista) {
  const m = new Map()
  lista.forEach((e) => m.set(categoriaOrigem(e), (m.get(categoriaOrigem(e)) || 0) + (e.count || 0)))
  return [...m.entries()].map(([label, count]) => ({ key: label, label, count })).sort((a, b) => b.count - a.count)
}

// Sinais de interesse: frases calculadas dos números reais, com a base à vista.
// Só aparecem quando há volume mínimo, para não exagerar diferenças pequenas.
export const MINIMO_SINAIS = 20
export function calcularSinais(d) {
  const sinais = []
  if (d.visitantes < MINIMO_SINAIS) return sinais
  const projs = d.itens.filter((i) => i.cat === 'projetos').sort((a, b) => b.total - a.total)
  const totalProj = soma(projs.map((p) => p.total))
  if (projs.length && projs[0].total >= 5) {
    const [a, b] = projs
    let t = `${a.rotulo} concentra ${pct(a.total, totalProj)}% das visitas a páginas de projeto (${a.total} de ${totalProj}).`
    if (b && b.total > 0) t += ` É ${a.total === b.total ? 'tão visto quanto' : `${pct(a.total - b.total, b.total)}% mais visto que`} ${b.rotulo}.`
    sinais.push({ tag: 'Projetos', texto: t })
  }
  if (d.aparelhos && d.aparelhos.length) {
    const tot = soma(d.aparelhos.map((e) => e.count))
    const cel = soma(d.aparelhos.filter((e) => /phone/i.test(e.name)).map((e) => e.count))
    if (tot >= MINIMO_SINAIS) {
      const p = pct(cel, tot)
      sinais.push({
        tag: 'Dispositivos',
        texto: `${p}% das visitas vêm de celular (${cel} de ${tot}).${p >= 50 ? ' Vale conferir o portfólio em tela pequena.' : ''}`,
      })
    }
  }
  if (d.origem && d.origem.length) {
    const g = agruparOrigem(d.origem)
    const tot = soma(g.map((x) => x.count))
    if (tot >= MINIMO_SINAIS && g[0]) sinais.push({ tag: 'Origem', texto: `A principal entrada é "${g[0].label}", com ${pct(g[0].count, tot)}% das visitas com origem identificada (${g[0].count} de ${tot}).` })
  }
  const contatos = totalDe(d.itens, ['clique/whatsapp', 'clique/email'])
  sinais.push({
    tag: 'Contato',
    texto: contatos
      ? `${contatos} clique${contatos > 1 ? 's' : ''} em WhatsApp ou e-mail para ${d.visitantes} visitantes (${pct(contatos, d.visitantes)}%).`
      : `Nenhum clique em WhatsApp ou e-mail para ${d.visitantes} visitantes no período.`,
  })
  return sinais
}
