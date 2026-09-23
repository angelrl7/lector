# Lector de Precios

App web para celulares: escaneás un código de barras con la cámara y te muestra el precio.
React + Vite en el frontend, Supabase como base de datos y login.

## Puesta en marcha

1. Creá un proyecto en https://supabase.com.
2. En **SQL Editor**, pegá y ejecutá el contenido de [`supabase/schema.sql`](supabase/schema.sql).
3. Copiá `.env.example` como `.env` y completalo con los datos de **Project Settings > API**
   (`Project URL` y la clave `anon public`).
4. Instalá y levantá la app:

   ```bash
   npm install
   npm run dev
   ```

5. Abrí en el celular la dirección `https://192.168.x.x:5173` que muestra la consola
   (misma red Wi-Fi). El certificado es de desarrollo: aceptá la advertencia del navegador.

> Opcional: en Supabase > Authentication > Providers > Email podés desactivar
> "Confirm email" para no tener que confirmar cada cuenta por mail.

## Publicar

`npm run build` genera la carpeta `dist/`. Se puede subir a Netlify, Vercel o Cloudflare Pages.
Configurá ahí las mismas variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

## Importar productos

Desde **Productos > Importar CSV**. Columnas: `codigo,nombre,precio[,categoria][,stock]`
(separador `,` o `;`). Si el código ya existe, se actualiza. Ver `productos-ejemplo.csv`.

## Estructura

- `supabase/schema.sql` — tablas `products`, `price_history`, `scans`, triggers y permisos (RLS)
- `src/components/` — pantallas (Escanear, Productos, Actividad, formulario, login)
- `src/lib/` — acceso a Supabase, CSV y formato de precios
- `legacy/` — la primera versión, un solo HTML sin servidor
