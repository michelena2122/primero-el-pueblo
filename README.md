# PRI-MERO EL PUEBLO 🇲🇽

Plataforma ciudadana para recopilar demandas, quejas y propuestas sociales por red temática.

## Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS 4
- **Backend**: Express.js + SQLite (better-sqlite3)
- **Deploy**: Render.com

---

## Desarrollo local

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
# Edita .env con tus credenciales SMTP
```

### 3. Correr en desarrollo

```bash
# Terminal 1 — Backend
node --watch server/index.js

# Terminal 2 — Frontend
npx vite --port=5173
```

Abre http://localhost:5173

> 💡 En modo desarrollo, el código de verificación aparece en pantalla (modo demo) para que puedas probarlo sin necesidad de configurar SMTP.

---

## Deploy en Render.com

### Paso 1 — Subir a GitHub

```bash
git init
git add .
git commit -m "Initial commit — PRI-MERO El Pueblo"
git remote add origin https://github.com/TU-USUARIO/primero-el-pueblo.git
git push -u origin main
```

### Paso 2 — Crear servicio en Render

1. Ve a https://render.com y haz login
2. Clic en **"New +"** → **"Web Service"**
3. Conecta tu repositorio de GitHub
4. Configura:
   - **Name**: `primero-el-pueblo`
   - **Region**: `Oregon (US West)`
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

### Paso 3 — Variables de entorno en Render

En la sección **Environment** del servicio, agrega:

| Variable | Valor |
|----------|-------|
| `NODE_ENV` | `production` |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | tu-correo@gmail.com |
| `SMTP_PASS` | contraseña-de-aplicación-gmail |

> Para Gmail: activa verificación en 2 pasos → Seguridad → Contraseñas de aplicación → genera una para "Correo"

### Paso 4 — Deploy

Render hace el deploy automáticamente. En ~3-5 minutos tendrás tu URL:
`https://primero-el-pueblo.onrender.com`

---

## Base de datos

SQLite se crea automáticamente en `data/primero.db` al iniciar el servidor.

En Render (plan gratuito), los archivos persisten mientras el servicio esté activo. Para producción seria, considera agregar una base de datos PostgreSQL (Render la ofrece).

---

## Funcionalidades

- ✅ 10 redes ciudadanas temáticas
- ✅ Registro con nombre y teléfono
- ✅ Verificación por código (email o demo)
- ✅ Formulario de demanda con foto, colonia, municipio, estado
- ✅ Contador público de participación
- ✅ Aviso de privacidad y disclaimer legal
- ✅ Responsive (funciona en celular)
