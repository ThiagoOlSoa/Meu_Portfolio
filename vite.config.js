import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// O base precisa ser igual ao nome do repositório para o GitHub Pages
export default defineConfig({
  base: '/Meu_Portfolio/',
  plugins: [react()],
})
