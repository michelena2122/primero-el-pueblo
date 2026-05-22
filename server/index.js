import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// ── Data directory ────────────────────────────────────────────────────────────
const dataDir = join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// ── In-memory storage (JSON file backed) ─────────────────────────────────────
// Simple, no native compilation needed. Works on Node 24+.
const dbPath = join(dataDir, 'db.json');

function loadDB() {
  try {
    if (fs.existsSync(dbPath)) return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  } catch {}
  return { ciudadanos: [], quejas: [], nextCiudadanoId: 1, nextQuejaId: 1 };
}

function saveDB(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(join(__dirname, '..', 'dist')));

// ── Email ─────────────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

// ── POST /api/registro ────────────────────────────────────────────────────────
app.post('/api/registro', async (req, res) => {
  const { nombre, telefono, email } = req.body;
  if (!nombre?.trim() || !telefono?.trim())
    return res.status(400).json({ error: 'Nombre y teléfono son requeridos.' });

  const codigo = Math.floor(100000 + Math.random() * 900000).toString();
  const expira = Date.now() + 15 * 60 * 1000;

  const db = loadDB();
  const idx = db.ciudadanos.findIndex(c => c.telefono === telefono.trim());

  const ciudadano = {
    id: idx >= 0 ? db.ciudadanos[idx].id : db.nextCiudadanoId++,
    nombre: nombre.trim(),
    telefono: telefono.trim(),
    email: email?.trim() || null,
    codigo,
    expira,
    verificado: false,
    fechaRegistro: Date.now(),
  };

  if (idx >= 0) db.ciudadanos[idx] = ciudadano;
  else db.ciudadanos.push(ciudadano);
  saveDB(db);

  // Send email if configured
  if (email?.trim() && process.env.SMTP_USER) {
    try {
      await transporter.sendMail({
        from: `"PRI-MERO El Pueblo" <${process.env.SMTP_USER}>`,
        to: email.trim(),
        subject: 'Tu código de verificación — PRI-MERO El Pueblo',
        html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto">
          <div style="background:#006847;padding:20px;text-align:center">
            <h1 style="color:white;margin:0">PRI-MERO EL PUEBLO</h1>
          </div>
          <div style="padding:30px">
            <p>Hola <strong>${nombre}</strong>, tu código es:</p>
            <div style="text-align:center;margin:25px 0">
              <span style="font-size:40px;font-weight:bold;letter-spacing:8px;color:#C8102E">${codigo}</span>
            </div>
            <p style="color:#666;font-size:14px">Expira en 15 minutos.</p>
          </div>
        </div>`,
      });
    } catch (e) { console.error('Email error:', e.message); }
  }

  res.json({
    ok: true,
    mensaje: email?.trim() ? 'Código enviado a tu correo.' : 'Registro exitoso.',
    ...(process.env.NODE_ENV !== 'production' && { codigo_demo: codigo }),
  });
});

// ── POST /api/verificar ───────────────────────────────────────────────────────
app.post('/api/verificar', (req, res) => {
  const { telefono, codigo } = req.body;
  if (!telefono || !codigo) return res.status(400).json({ error: 'Datos incompletos.' });

  const db = loadDB();
  const ciudadano = db.ciudadanos.find(c => c.telefono === telefono.trim());
  if (!ciudadano) return res.status(404).json({ error: 'Teléfono no registrado.' });
  if (ciudadano.codigo !== codigo.trim()) return res.status(401).json({ error: 'Código incorrecto.' });
  if (Date.now() > ciudadano.expira) return res.status(401).json({ error: 'Código expirado. Solicita uno nuevo.' });

  ciudadano.verificado = true;
  saveDB(db);

  const token = Buffer.from(`${ciudadano.id}:${ciudadano.telefono}:${Date.now()}`).toString('base64');
  res.json({ ok: true, token, nombre: ciudadano.nombre, ciudadano_id: ciudadano.id });
});

// ── POST /api/queja ───────────────────────────────────────────────────────────
app.post('/api/queja', (req, res) => {
  const { ciudadano_id, token, red, subcategoria, descripcion, colonia, municipio, estado, foto_base64 } = req.body;

  if (!ciudadano_id || !token) return res.status(401).json({ error: 'No autenticado.' });
  if (!red || !subcategoria || !descripcion || !colonia || !municipio || !estado)
    return res.status(400).json({ error: 'Faltan campos obligatorios.' });

  let foto_path = null;
  if (foto_base64) {
    try {
      const fotosDir = join(dataDir, 'fotos');
      if (!fs.existsSync(fotosDir)) fs.mkdirSync(fotosDir, { recursive: true });
      const ext = foto_base64.split(';')[0].split('/')[1] || 'jpg';
      const filename = `${Date.now()}_${ciudadano_id}.${ext}`;
      fs.writeFileSync(join(fotosDir, filename), Buffer.from(foto_base64.split(',')[1], 'base64'));
      foto_path = filename;
    } catch (e) { console.error('Foto error:', e.message); }
  }

  const db = loadDB();
  const queja = {
    id: db.nextQuejaId++,
    ciudadano_id,
    red,
    subcategoria,
    descripcion: descripcion.slice(0, 200),
    colonia,
    municipio,
    estado,
    foto_path,
    fecha: Date.now(),
  };
  db.quejas.push(queja);
  saveDB(db);

  res.json({ ok: true, queja_id: queja.id, mensaje: 'Tu demanda fue registrada exitosamente.' });
});

// ── GET /api/stats ────────────────────────────────────────────────────────────
app.get('/api/stats', (req, res) => {
  const db = loadDB();
  const porRed = {};
  db.quejas.forEach(q => { porRed[q.red] = (porRed[q.red] || 0) + 1; });
  res.json({
    total_quejas: db.quejas.length,
    por_red: Object.entries(porRed).map(([red, n]) => ({ red, n })).sort((a, b) => b.n - a.n),
    ciudadanos_verificados: db.ciudadanos.filter(c => c.verificado).length,
  });
});

// ── SPA fallback ──────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  const indexPath = join(__dirname, '..', 'dist', 'index.html');
  if (fs.existsSync(indexPath)) res.sendFile(indexPath);
  else res.json({ status: 'API running. Build frontend with: npm run build' });
});

app.listen(PORT, () => console.log(`🟢 Servidor PRI-MERO El Pueblo en puerto ${PORT}`));
