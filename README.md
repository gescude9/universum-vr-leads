# Universum VR · Gestor de Leads (React + Supabase)

App web para registrar leads de cumpleaños, asignarlos a vendedores, calcular
comisiones (10%) y agendar en un calendario semanal. Construida con **React +
Vite** y con **Supabase** como base de datos.

## Requisitos

- Node.js 18 o superior (incluye `npm`).
- Una cuenta gratuita en [supabase.com](https://supabase.com).

## 1) Configurar Supabase

1. Crea un proyecto en Supabase.
2. Abre el **SQL Editor** y ejecuta el contenido de `supabase-schema.sql`
   (crea las tablas `leads` y `vendedores`, activa RLS, las políticas, los
   permisos y carga los 5 vendedores iniciales).
3. En **Project Settings → API** copia:
   - **Project URL**
   - **clave publishable / anon** (NO la `service_role`).
4. Crea al menos un usuario en **Authentication → Users → Add user**
   (correo + contraseña). Con ese usuario iniciarás sesión en la app.

> La clave anon es pública y puede ir en el frontend: lo que protege los datos
> es RLS + el login. La clave secreta (`service_role`) nunca va en el navegador
> ni en el repositorio.

## 2) Configurar el proyecto

```bash
npm install
cp .env.example .env
```

Edita `.env` con tus datos:

```
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_CLAVE_PUBLISHABLE_ANON
```

## 3) Ejecutar en local

```bash
npm run dev
```

Abre la URL que muestra la terminal (normalmente `http://localhost:5173`),
inicia sesión con el usuario que creaste y listo.

## 4) Subir a GitHub

```bash
git init
git add .
git commit -m "Universum VR - gestor de leads"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/TU-REPO.git
git push -u origin main
```

El archivo `.gitignore` ya excluye `node_modules` y `.env`, así que tus claves
no se suben.

## 5) Desplegar

La forma más sencilla para una app React + Supabase es **Vercel** o **Netlify**:
conectas el repo, defines las variables `VITE_SUPABASE_URL` y
`VITE_SUPABASE_ANON_KEY` en el panel del servicio y se publica solo.

### Alternativa: GitHub Pages

Vite incrusta las variables `VITE_*` en el bundle al compilar, así que para
GitHub Pages necesitas que estén disponibles durante el build. La vía más
simple es compilar en tu máquina y publicar la carpeta `dist`:

```bash
npm run build      # genera /dist con tus variables del .env
npm install --save-dev gh-pages
npx gh-pages -d dist
```

Luego, en el repo: **Settings → Pages → Deploy from a branch → gh-pages**.
Como `vite.config.js` usa `base: './'`, los recursos cargan bien en la
subcarpeta de GitHub Pages.

## Estructura

```
src/
  main.jsx              Punto de entrada
  App.jsx               Orquesta sesión, datos, validaciones y modales
  index.css            Tema neón
  supabaseClient.js    Cliente de Supabase
  constants.js         Precios, paquetes, horarios, experiencias premium
  lib/
    helpers.js         Formato, fechas, horarios por día, conflictos
    data.js            Operaciones CRUD contra Supabase
  components/
    Auth.jsx           Pantalla de login
    Sidebar.jsx        Navegación
    Dashboard.jsx      KPIs y próximos cumpleaños
    Leads.jsx          Tabla con búsqueda y filtros
    LeadModal.jsx      Alta/edición de lead + cálculo automático
    Vendedores.jsx     Rendimiento por vendedor
    VendedorModal.jsx  Alta/edición de vendedor
    Calendario.jsx     Vista semanal estilo Google Calendar
    Toast.jsx          Notificaciones
```

## Notas

- Horarios: Lun–Jue y Dom 11:00–20:00 · Vie–Sáb 11:00–21:00.
- El calendario evita reservas que se solapen (según la duración del paquete).
- La comisión (10%) se calcula al marcar un lead como **Cerrado**.
