import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      output: {
        // React y Supabase pesan ~425 kB y casi nunca cambian; separarlos del
        // código de la app hace que un despliegue nuevo solo invalide ese
        // trozo y no los 560 kB enteros en el teléfono de quien ya la usó.
        manualChunks(id: string) {
          if (id.includes('node_modules/@supabase') || id.includes('node_modules/react')) {
            return 'vendor'
          }
        }
      }
    }
  }
})
