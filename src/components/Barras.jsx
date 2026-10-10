const soma = (v) => v.reduce((a, b) => a + b, 0)

// Lista com barra fina proporcional. Se tiver onEscolher, cada linha vira botão.
export default function Barras({ linhas, ativo, onEscolher, base: baseFixa, vazio = 'Ainda sem registros neste período.' }) {
  const base = baseFixa || soma(linhas.map((l) => l.count)) || 1
  if (!linhas.length) return <p className="stats-vazio">{vazio}</p>
  return (
    <ul className="blist">
      {linhas.map((l) => {
        const pct = Math.min(100, Math.round((l.count / base) * 100))
        const conteudo = (
          <>
            <span className="bl-rot">{l.label}</span>
            <span className="bl-num">{l.count}</span>
            <span className="bl-pct">{pct}%</span>
            <span className="bl-trilho" aria-hidden="true">
              <span className="bl-fill" style={{ width: `${Math.max(pct, 2)}%` }} />
            </span>
          </>
        )
        return (
          <li key={l.key}>
            {onEscolher ? (
              <button type="button" className="bl-linha" aria-pressed={ativo === l.key} onClick={() => onEscolher(l.key)}>
                {conteudo}
              </button>
            ) : (
              <div className="bl-linha">{conteudo}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
