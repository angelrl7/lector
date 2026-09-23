import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

// https + host: permite abrir la app desde el celular en la misma red Wi-Fi
// (la cámara solo funciona en páginas seguras).
export default defineConfig({
  plugins: [react(), basicSsl()],
  server: { host: true },
});
