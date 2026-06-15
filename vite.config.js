import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' permite que la app funcione tanto en la raíz como en una
// subcarpeta de GitHub Pages (https://usuario.github.io/repo/).
export default defineConfig({
  plugins: [react()],
  base: './',
})
