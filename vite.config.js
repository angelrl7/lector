import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

// https + host: permite abrir la app desde el celular en la misma red Wi-Fi
// (la cámara solo funciona en páginas seguras).
export default defineConfig({
  plugins: [react(), basicSsl()],
  server: { host: true },
  // NEXT_PUBLIC_ es el prefijo que usa la integración de Supabase en Vercel
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
});
