import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: process.env.PORT || 3000, // Use Heroku's dynamic port
  },
  build: {
    outDir: "dist", // Ensure Vite outputs to "dist"
  }
})
