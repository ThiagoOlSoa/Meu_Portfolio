import { asset } from '../data'

export default function ThemeToggle({ claro, onToggle }) {
  return (
    <button
      className="btn-destaque theme-toggle"
      onClick={onToggle}
      aria-label={claro ? 'Ativar modo escuro' : 'Ativar modo claro'}
    >
      <img
        src={asset(claro ? 'Imagens/Lua.PNG' : 'Imagens/Sol.PNG')}
        alt=""
        width="24"
      />
    </button>
  )
}
