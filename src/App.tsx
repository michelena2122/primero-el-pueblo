import { useState, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Ciudadano {
  id: number;
  nombre: string;
  token: string;
}

type Pantalla = 'inicio' | 'registro' | 'verificar' | 'portal' | 'formulario' | 'gracias';

interface Red {
  id: string;
  titulo: string;
  emoji: string;
  color: string;
  subcategorias: string[];
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const REDES: Red[] = [
  {
    id: 'agua', titulo: 'Red Ciudadana por el Agua', emoji: '💧', color: '#1a6ea8',
    subcategorias: ['Fugas de agua', 'Colonia o calle sin agua', 'Contaminación en red de agua', 'Venta de agua a precio desmedido', 'Otro']
  },
  {
    id: 'seguridad', titulo: 'Red Ciudadana por la Seguridad', emoji: '🛡️', color: '#8B1A1A',
    subcategorias: ['Violencia', 'Extorsión', 'Narcotráfico', 'Personas desaparecidas', 'Cobro de piso', 'Robo', 'Otro']
  },
  {
    id: 'salud', titulo: 'Red Ciudadana por la Salud', emoji: '⚕️', color: '#1a7a4a',
    subcategorias: ['Falta de medicinas', 'Falta de citas médicas', 'Mala atención', 'Falta de especialistas', 'Otro']
  },
  {
    id: 'empleo', titulo: 'Red Ciudadana por Empleo Formal', emoji: '💼', color: '#5a4a8a',
    subcategorias: ['Mejores salarios', 'Mejores prestaciones', 'Derecho a seguridad social', 'Oportunidades para los jóvenes', 'Otro']
  },
  {
    id: 'economia', titulo: 'Red Ciudadana por la Economía', emoji: '📈', color: '#a86a00',
    subcategorias: ['Abusos precio combustibles', 'Altos precios de alimentos', 'Alto precio de transporte', 'Falta de servicios', 'Otro']
  },
  {
    id: 'corrupcion', titulo: 'Red Ciudadana contra la Corrupción', emoji: '⚖️', color: '#1a4a7a',
    subcategorias: ['Funcionarios que condicionan servicios por dinero', 'Funcionarios que condicionan un trámite', 'Funcionarios que abusan del poder', 'Funcionarios que solicitan voto o registro', 'Otro']
  },
  {
    id: 'infraestructura', titulo: 'Red Ciudadana por la Infraestructura', emoji: '🏗️', color: '#6a4a1a',
    subcategorias: ['Falta de alumbrado', 'Falta de señalamientos de tráfico', 'Baches', 'Drenaje e inundaciones', 'Falta de puentes o accesos', 'Falta de seguridad peatonal', 'Falta de recolección de basura', 'Otro']
  },
  {
    id: 'educacion', titulo: 'Red Ciudadana por la Educación', emoji: '📚', color: '#2a6a2a',
    subcategorias: ['Falta de maestros', 'Infraestructura escolar deteriorada', 'Falta de útiles o becas', 'Acoso escolar', 'Otro']
  },
  {
    id: 'vivienda', titulo: 'Red Ciudadana por la Vivienda', emoji: '🏠', color: '#7a2a5a',
    subcategorias: ['Créditos para vivienda', 'Vivienda de calidad y a buen precio', 'Servicios urbanos adecuados', 'Otro']
  },
  {
    id: 'medioambiente', titulo: 'Red Ciudadana por el Medio Ambiente', emoji: '🌿', color: '#1a7a3a',
    subcategorias: ['Contaminación', 'Basura', 'Pérdida de áreas verdes', 'Mala calidad del aire', 'Maltrato animal', 'Otro']
  },
];

const ESTADOS_MX = [
  'Aguascalientes','Baja California','Baja California Sur','Campeche','Chiapas','Chihuahua',
  'Ciudad de México','Coahuila','Colima','Durango','Estado de México','Guanajuato','Guerrero',
  'Hidalgo','Jalisco','Michoacán','Morelos','Nayarit','Nuevo León','Oaxaca','Puebla','Querétaro',
  'Quintana Roo','San Luis Potosí','Sinaloa','Sonora','Tabasco','Tamaulipas','Tlaxcala',
  'Veracruz','Yucatán','Zacatecas'
];

const API = import.meta.env.VITE_API_URL || '';

// ─── Component ────────────────────────────────────────────────────────────────
export default function App() {
  const [pantalla, setPantalla] = useState<Pantalla>('inicio');
  const [ciudadano, setCiudadano] = useState<Ciudadano | null>(null);
  const [redSeleccionada, setRedSeleccionada] = useState<Red | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  // Registro
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');

  // Verificación
  const [codigo, setCodigo] = useState('');
  const [codigoDemo, setCodigoDemo] = useState('');

  // Formulario queja
  const [subcategoria, setSubcategoria] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [colonia, setColonia] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [estado, setEstado] = useState('');
  const [foto, setFoto] = useState<string | null>(null);
  const [fotoNombre, setFotoNombre] = useState('');

  // Stats
  const [stats, setStats] = useState<{total_quejas:number; ciudadanos_verificados:number} | null>(null);

  useEffect(() => {
    // Restore session
    const saved = localStorage.getItem('pep_session');
    if (saved) {
      try { setCiudadano(JSON.parse(saved)); } catch {}
    }
    // Load stats
    fetch(`${API}/api/stats`).then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  const guardarSesion = (c: Ciudadano) => {
    setCiudadano(c);
    localStorage.setItem('pep_session', JSON.stringify(c));
  };

  const cerrarSesion = () => {
    setCiudadano(null);
    localStorage.removeItem('pep_session');
    setPantalla('inicio');
  };

  // ── Registro ──────────────────────────────────────────────────────────────
  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!nombre.trim() || !telefono.trim()) { setError('Nombre y teléfono son obligatorios.'); return; }
    setCargando(true);
    try {
      const r = await fetch(`${API}/api/registro`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre.trim(), telefono: telefono.trim(), email: email.trim() || undefined })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      if (d.codigo_demo) setCodigoDemo(d.codigo_demo); // dev only
      setPantalla('verificar');
    } catch (e: any) { setError(e.message || 'Error al registrar.'); }
    finally { setCargando(false); }
  };

  // ── Verificación ──────────────────────────────────────────────────────────
  const handleVerificar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const r = await fetch(`${API}/api/verificar`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefono: telefono.trim(), codigo: codigo.trim() })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      guardarSesion({ id: d.ciudadano_id, nombre: d.nombre, token: d.token });
      setPantalla('portal');
    } catch (e: any) { setError(e.message || 'Código incorrecto.'); }
    finally { setCargando(false); }
  };

  // ── Enviar queja ──────────────────────────────────────────────────────────
  const handleQueja = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!subcategoria || !descripcion || !colonia || !municipio || !estado) {
      setError('Por favor completa todos los campos obligatorios.'); return;
    }
    setCargando(true);
    try {
      const r = await fetch(`${API}/api/queja`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ciudadano_id: ciudadano!.id, token: ciudadano!.token,
          red: redSeleccionada!.id, subcategoria, descripcion, colonia, municipio, estado,
          foto_base64: foto || undefined
        })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setSubcategoria(''); setDescripcion(''); setColonia(''); setMunicipio(''); setEstado(''); setFoto(null); setFotoNombre('');
      setPantalla('gracias');
    } catch (e: any) { setError(e.message || 'Error al enviar.'); }
    finally { setCargando(false); }
  };

  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFotoNombre(f.name);
    const reader = new FileReader();
    reader.onload = ev => setFoto(ev.target?.result as string);
    reader.readAsDataURL(f);
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f8f4f0 0%, #fff 60%, #f0f4f8 100%)', fontFamily: "'Georgia', serif" }}>

      {/* ── Header ── */}
      <header style={{ background: 'linear-gradient(90deg, #006847 0%, #004d35 100%)', borderBottom: '4px solid #C8102E' }}>
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4">
              {/* PRI Logo SVG */}
              <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                <circle cx="32" cy="32" r="30" fill="white" stroke="#999" strokeWidth="2"/>
                <path d="M32 2 L32 62" stroke="#999" strokeWidth="0.5"/>
                <rect x="2" y="2" width="19" height="60" rx="18" fill="#006847" clipPath="url(#circ)"/>
                <rect x="21.5" y="2" width="21" height="60" fill="white" clipPath="url(#circ)"/>
                <rect x="42.5" y="2" width="20" height="60" rx="18" fill="#C8102E" clipPath="url(#circ)"/>
                <clipPath id="circ"><circle cx="32" cy="32" r="30"/></clipPath>
                <text x="32" y="38" textAnchor="middle" fontWeight="bold" fontSize="18" fontFamily="Arial" fill="black" letterSpacing="1">PRI</text>
              </svg>
              <div>
                <h1 style={{ color: 'white', fontFamily: "'Georgia', serif", fontSize: '1.4rem', fontWeight: 'bold', margin: 0, letterSpacing: '0.5px' }}>
                  PRI-MERO EL PUEBLO
                </h1>
                <p style={{ color: '#90EE90', fontSize: '0.75rem', margin: 0 }}>Aquí sí, PRI-MERO las demandas del pueblo</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {stats && (
                <div style={{ textAlign: 'right', color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem' }}>
                  <div><strong style={{ color: '#90EE90', fontSize: '1rem' }}>{stats.total_quejas}</strong> demandas registradas</div>
                  <div><strong style={{ color: '#90EE90' }}>{stats.ciudadanos_verificados}</strong> ciudadanos participando</div>
                </div>
              )}
              {ciudadano ? (
                <div className="flex items-center gap-2">
                  <span style={{ color: 'white', fontSize: '0.85rem' }}>Hola, <strong>{ciudadano.nombre.split(' ')[0]}</strong></span>
                  <button onClick={cerrarSesion} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '6px', padding: '4px 10px', fontSize: '0.75rem', cursor: 'pointer' }}>
                    Salir
                  </button>
                </div>
              ) : (
                <button onClick={() => { setError(''); setPantalla('registro'); }}
                  style={{ background: '#C8102E', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 18px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}>
                  Registrarse
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Aviso legal */}
        <div style={{ background: 'rgba(0,0,0,0.35)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="max-w-6xl mx-auto px-4 py-3">
            <details>
              <summary style={{ color: '#90EE90', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 'bold' }}>
                📋 Aviso importante — Haz clic para leer
              </summary>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.73rem', marginTop: '8px', lineHeight: '1.6' }}>
                Este espacio tiene como único propósito promover la participación ciudadana y recopilar opiniones, denuncias, reportes y demandas sociales de la población, con el fin de identificar problemáticas comunitarias y generar propuestas de atención pública. La participación es <strong>completamente voluntaria</strong> y no implica afiliación partidista ni compromiso político. El envío de información <strong>NO constituye solicitud, promoción, compra o inducción del voto</strong>. Los datos personales serán tratados conforme a la legislación mexicana de protección de datos.
              </div>
            </details>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="max-w-6xl mx-auto px-4 py-8">

        {/* ══ PANTALLA: INICIO ══ */}
        {pantalla === 'inicio' && (
          <>
            <div className="text-center mb-10">
              <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '8px' }}>
                Tu voz hace la diferencia
              </h2>
              <p style={{ color: '#555', maxWidth: '600px', margin: '0 auto', lineHeight: '1.7' }}>
                Selecciona una red ciudadana para registrar tu demanda, queja o propuesta. Tu participación es anónima y voluntaria.
              </p>
            </div>

            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {REDES.map(red => (
                <div key={red.id}
                  onClick={() => { ciudadano ? (setRedSeleccionada(red), setSubcategoria(''), setPantalla('formulario')) : (setError(''), setPantalla('registro')); }}
                  style={{
                    background: 'white', borderRadius: '12px', padding: '20px', cursor: 'pointer',
                    borderLeft: `5px solid ${red.color}`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{red.emoji}</div>
                  <h3 style={{ fontWeight: 'bold', color: red.color, fontSize: '0.95rem', margin: '0 0 8px' }}>{red.titulo}</h3>
                  <p style={{ color: '#777', fontSize: '0.8rem', margin: 0 }}>
                    {red.subcategorias.slice(0, 3).join(' · ')}
                    {red.subcategorias.length > 3 && ' · ...'}
                  </p>
                  <div style={{ marginTop: '12px', textAlign: 'right' }}>
                    <span style={{ background: red.color, color: 'white', borderRadius: '20px', padding: '3px 12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                      Reportar →
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {!ciudadano && (
              <div className="text-center mt-10">
                <button onClick={() => { setError(''); setPantalla('registro'); }}
                  style={{ background: 'linear-gradient(90deg, #006847, #008a5e)', color: 'white', border: 'none', borderRadius: '10px', padding: '14px 36px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,104,71,0.3)' }}>
                  Regístrate para participar →
                </button>
                <p style={{ color: '#888', marginTop: '8px', fontSize: '0.8rem' }}>Es gratuito, rápido y voluntario</p>
              </div>
            )}
          </>
        )}

        {/* ══ PANTALLA: REGISTRO ══ */}
        {pantalla === 'registro' && (
          <FormCard titulo="Registro Ciudadano" subtitulo="Ingresa tus datos para participar. Solo necesitas nombre y teléfono.">
            <form onSubmit={handleRegistro}>
              <Campo label="Nombre (sin apellidos) *" value={nombre} onChange={setNombre} placeholder="Ejemplo: María" />
              <Campo label="Teléfono celular *" value={telefono} onChange={setTelefono} placeholder="10 dígitos, ej: 5512345678" type="tel" />
              <Campo label="Correo electrónico (opcional — para recibir tu código)" value={email} onChange={setEmail} placeholder="tu@correo.com" type="email" />
              {error && <MsgError>{error}</MsgError>}
              <div className="flex gap-3 mt-5">
                <BtnSecundario onClick={() => { setError(''); setPantalla('inicio'); }}>← Volver</BtnSecundario>
                <BtnPrimario type="submit" cargando={cargando}>Enviar código →</BtnPrimario>
              </div>
            </form>
          </FormCard>
        )}

        {/* ══ PANTALLA: VERIFICAR ══ */}
        {pantalla === 'verificar' && (
          <FormCard titulo="Verifica tu identidad" subtitulo={`Ingresa el código de 6 dígitos enviado${email ? ` a ${email}` : ''}.`}>
            {codigoDemo && (
              <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '0.85rem' }}>
                🔧 <strong>Modo demo:</strong> Tu código es <strong style={{ fontSize: '1.2rem', letterSpacing: '3px' }}>{codigoDemo}</strong>
              </div>
            )}
            <form onSubmit={handleVerificar}>
              <Campo label="Código de verificación *" value={codigo} onChange={setCodigo} placeholder="123456" maxLength={6}
                style={{ letterSpacing: '6px', fontSize: '1.4rem', textAlign: 'center', fontWeight: 'bold' }} />
              {error && <MsgError>{error}</MsgError>}
              <div className="flex gap-3 mt-5">
                <BtnSecundario onClick={() => { setError(''); setPantalla('registro'); }}>← Volver</BtnSecundario>
                <BtnPrimario type="submit" cargando={cargando}>Verificar →</BtnPrimario>
              </div>
            </form>
            <button onClick={() => { setError(''); setCodigo(''); handleRegistro({ preventDefault: () => {} } as any); }}
              style={{ marginTop: '12px', background: 'none', border: 'none', color: '#006847', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline' }}>
              Reenviar código
            </button>
          </FormCard>
        )}

        {/* ══ PANTALLA: PORTAL ══ */}
        {pantalla === 'portal' && ciudadano && (
          <>
            <div style={{ background: 'linear-gradient(90deg, #006847, #008a5e)', borderRadius: '12px', padding: '20px 24px', marginBottom: '24px', color: 'white' }}>
              <h2 style={{ margin: '0 0 4px', fontSize: '1.3rem' }}>Bienvenido/a, {ciudadano.nombre} ✅</h2>
              <p style={{ margin: 0, opacity: 0.85, fontSize: '0.9rem' }}>Selecciona la red ciudadana en la que quieres interponer tu demanda o queja.</p>
            </div>
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {REDES.map(red => (
                <div key={red.id}
                  onClick={() => { setRedSeleccionada(red); setSubcategoria(''); setError(''); setPantalla('formulario'); }}
                  style={{ background: 'white', borderRadius: '12px', padding: '20px', cursor: 'pointer', borderLeft: `5px solid ${red.color}`, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', transition: 'transform 0.15s, box-shadow 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{red.emoji}</div>
                  <h3 style={{ fontWeight: 'bold', color: red.color, fontSize: '0.95rem', margin: '0 0 8px' }}>{red.titulo}</h3>
                  <p style={{ color: '#777', fontSize: '0.8rem', margin: 0 }}>{red.subcategorias.slice(0, 3).join(' · ')}{red.subcategorias.length > 3 && ' · ...'}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ══ PANTALLA: FORMULARIO ══ */}
        {pantalla === 'formulario' && redSeleccionada && ciudadano && (
          <FormCard
            titulo={`${redSeleccionada.emoji} ${redSeleccionada.titulo}`}
            subtitulo="Completa el formulario. Todos los campos marcados con * son obligatorios."
            accentColor={redSeleccionada.color}
          >
            <form onSubmit={handleQueja}>
              {/* Subcategoría */}
              <div className="mb-4">
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', fontSize: '0.9rem', color: '#333' }}>
                  Tipo de demanda / queja *
                </label>
                <select value={subcategoria} onChange={e => setSubcategoria(e.target.value)} required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.9rem', background: 'white' }}>
                  <option value="">— Selecciona —</option>
                  {redSeleccionada.subcategorias.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: '1fr 1fr' }} className="mb-4">
                <Campo label="Colonia *" value={colonia} onChange={setColonia} placeholder="Nombre de la colonia" />
                <Campo label="Municipio / Alcaldía *" value={municipio} onChange={setMunicipio} placeholder="Municipio" />
              </div>

              {/* Estado */}
              <div className="mb-4">
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', fontSize: '0.9rem', color: '#333' }}>Estado *</label>
                <select value={estado} onChange={e => setEstado(e.target.value)} required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.9rem', background: 'white' }}>
                  <option value="">— Selecciona tu estado —</option>
                  {ESTADOS_MX.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Descripción */}
              <div className="mb-4">
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', fontSize: '0.9rem', color: '#333' }}>
                  Descripción * <span style={{ color: '#888', fontWeight: 'normal' }}>({descripcion.length}/200 caracteres)</span>
                </label>
                <textarea value={descripcion} onChange={e => setDescripcion(e.target.value.slice(0, 200))} required rows={4}
                  placeholder="Describe brevemente la situación, dónde ocurre y desde cuándo..."
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.9rem', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>

              {/* Foto */}
              <div className="mb-4">
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', fontSize: '0.9rem', color: '#333' }}>
                  Fotografía (opcional)
                </label>
                <label style={{ display: 'inline-block', padding: '8px 16px', background: '#f0f0f0', border: '1px dashed #aaa', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                  📷 {fotoNombre || 'Seleccionar imagen'}
                  <input type="file" accept="image/*" onChange={handleFoto} style={{ display: 'none' }} />
                </label>
                {foto && <img src={foto} alt="preview" style={{ display: 'block', marginTop: '8px', maxHeight: '120px', borderRadius: '8px', border: '1px solid #ddd' }} />}
              </div>

              {error && <MsgError>{error}</MsgError>}

              <div className="flex gap-3 mt-5">
                <BtnSecundario onClick={() => { setError(''); setPantalla('portal'); }}>← Volver</BtnSecundario>
                <BtnPrimario type="submit" cargando={cargando} color={redSeleccionada.color}>Enviar demanda →</BtnPrimario>
              </div>
            </form>
          </FormCard>
        )}

        {/* ══ PANTALLA: GRACIAS ══ */}
        {pantalla === 'gracias' && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '5rem', marginBottom: '16px' }}>✅</div>
            <h2 style={{ fontSize: '2rem', color: '#006847', marginBottom: '8px' }}>¡Gracias por participar!</h2>
            <p style={{ color: '#555', maxWidth: '500px', margin: '0 auto 24px', lineHeight: '1.7', fontSize: '1rem' }}>
              Tu demanda fue registrada exitosamente. Tu voz es importante y contribuye a identificar las problemáticas de tu comunidad.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button onClick={() => setPantalla('portal')}
                style={{ background: 'linear-gradient(90deg, #006847, #008a5e)', color: 'white', border: 'none', borderRadius: '10px', padding: '12px 24px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' }}>
                Reportar otra demanda
              </button>
              <button onClick={() => setPantalla('inicio')}
                style={{ background: 'white', color: '#333', border: '2px solid #ddd', borderRadius: '10px', padding: '12px 24px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' }}>
                Ir al inicio
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ background: '#1a1a1a', color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '20px', fontSize: '0.75rem', marginTop: '40px' }}>
        <p style={{ margin: 0 }}>© 2025 PRI-MERO El Pueblo — Partido Revolucionario Institucional</p>
        <p style={{ margin: '4px 0 0' }}>Los datos personales son tratados conforme a la legislación mexicana de protección de datos.</p>
      </footer>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FormCard({ titulo, subtitulo, children, accentColor = '#006847' }: { titulo: string; subtitulo: string; children: React.ReactNode; accentColor?: string }) {
  return (
    <div style={{ maxWidth: '560px', margin: '0 auto' }}>
      <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <div style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}cc)`, padding: '20px 24px' }}>
          <h2 style={{ color: 'white', margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>{titulo}</h2>
          <p style={{ color: 'rgba(255,255,255,0.85)', margin: '4px 0 0', fontSize: '0.85rem' }}>{subtitulo}</p>
        </div>
        <div style={{ padding: '24px' }}>{children}</div>
      </div>
    </div>
  );
}

function Campo({ label, value, onChange, placeholder, type = 'text', maxLength, style: extraStyle }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
  type?: string; maxLength?: number; style?: React.CSSProperties;
}) {
  return (
    <div className="mb-4">
      <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', fontSize: '0.9rem', color: '#333' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} maxLength={maxLength}
        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.9rem', boxSizing: 'border-box', ...extraStyle }} />
    </div>
  );
}

function MsgError({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#fee', border: '1px solid #fcc', borderRadius: '8px', padding: '10px 14px', color: '#c00', fontSize: '0.85rem', marginTop: '8px' }}>
      ⚠️ {children}
    </div>
  );
}

function BtnPrimario({ children, type = 'button', cargando, onClick, color = '#006847' }: {
  children: React.ReactNode; type?: 'button' | 'submit'; cargando?: boolean; onClick?: () => void; color?: string;
}) {
  return (
    <button type={type} onClick={onClick} disabled={cargando}
      style={{ flex: 1, background: cargando ? '#aaa' : `linear-gradient(90deg, ${color}, ${color}cc)`, color: 'white', border: 'none', borderRadius: '8px', padding: '11px 20px', fontWeight: 'bold', cursor: cargando ? 'not-allowed' : 'pointer', fontSize: '0.9rem' }}>
      {cargando ? 'Cargando...' : children}
    </button>
  );
}

function BtnSecundario({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      style={{ background: 'white', color: '#555', border: '2px solid #ddd', borderRadius: '8px', padding: '11px 20px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}>
      {children}
    </button>
  );
}
