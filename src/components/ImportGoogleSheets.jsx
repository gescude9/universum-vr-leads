import { useState } from 'react'
import { useTranslation } from 'react-i18next'

// ============================================================
//  Importador de leads desde Google Sheets (hoja "Planilla")
//  El sheet debe ser público (cualquiera con el enlace puede leer)
// ============================================================

const SHEET_ID = '1DdUCz39dnwTlRU1viWAWVVR7mJmNmOHtHaRO64LpNn4'
const SHEET_NAME = 'Planilla'
const API_KEY = import.meta.env.VITE_GOOGLE_CLIENT_ID // Reusamos la misma clave de Google

// URL de la Sheets API v4 (lectura pública)
const SHEETS_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(SHEET_NAME)}?key=${API_KEY}`

// ── Mapeo de estados del sheet → estados de la app ──
const ESTADO_MAP = {
  'cerrada la venta':       'Cerrado',
  'venta cerrada':          'Cerrado',
  'no concretó la venta':   'Perdido',
  'no concretó':            'Perdido',
  'descalificado':          'Perdido',
  'perdido':                'Perdido',
  'sin contactar':          'Nuevo',
  'contactado':             'Contactado',
  'recontactado':           'Seguimiento',
  'a espera de respuesta':  'Seguimiento',
  'propuesta a confirmar':  'Cotizado',
  'propuesta':              'Cotizado',
}

function mapearEstado(raw) {
  if (!raw) return 'Nuevo'
  const k = raw.toLowerCase().trim()
  for (const [key, val] of Object.entries(ESTADO_MAP)) {
    if (k.includes(key)) return val
  }
  return 'Nuevo'
}

// ── Parser de una fila del sheet ──
// Columnas: ,Nro,Nombre,FechaContacto,Motivo,FechaEvento,TipoEvento,PotencialPersonas,Telefono,Status,MontoTransferencia,MontoTixr,Notas
function parsearFila(row) {
  // Ignorar filas vacías o de encabezado/mes
  const nombre = (row[2] || '').trim()
  if (!nombre || nombre === 'Nombre del Cliente' || nombre.length < 2) return null
  // Ignorar filas que son solo mes (Enero, Febrero, etc.)
  if (/^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)$/i.test(nombre)) return null

  const telefono    = (row[8] || '').trim()
  const statusRaw   = (row[9] || '').trim()
  const estado      = mapearEstado(statusRaw)
  const motivo      = (row[3] || '').trim()
  const tipoEvento  = (row[6] || '').trim()
  const personas    = parsearPersonas(row[7] || '')
  const fechaEvento = parsearFecha(row[5] || '')
  const montoTx     = parsearMonto(row[10] || '')
  const montoTixr   = parsearMonto(row[11] || '')
  const montoCerrado = montoTx || montoTixr || 0
  const notas = [
    motivo ? `Motivo: ${motivo}` : '',
    tipoEvento ? `Tipo: ${tipoEvento}` : '',
    row[12] ? `Notas: ${row[12]}` : '',
    statusRaw ? `Estado original: ${statusRaw}` : '',
    montoTx   ? `Pago transferencia: $${montoTx}` : '',
    montoTixr ? `Pago Tixr: $${montoTixr}` : '',
  ].filter(Boolean).join('\n')

  return {
    _key: `${nombre}__${telefono}`, // clave única para detectar duplicados
    nombre,
    telefono,
    contacto: '',
    fecha:    fechaEvento,
    hora:     '',
    personas: personas || 5,
    paquete:  'Gaming',
    premium:  '',
    estado,
    monto_estimado: montoCerrado,
    monto_cerrado:  montoCerrado,
    comision: estado === 'Cerrado' ? +(montoCerrado * 0.10).toFixed(2) : 0,
    notas,
    vendedor: null,
  }
}

function parsearPersonas(raw) {
  const m = String(raw).match(/\d+/)
  return m ? parseInt(m[0]) : 5
}

function parsearMonto(raw) {
  const clean = String(raw).replace(/[$,.\s]/g, '').replace(',','.')
  const m = String(raw).replace(/\s/g,'').match(/[\d]+[,.]?[\d]*/)?.[0]
  if (!m) return 0
  return parseFloat(String(raw).replace(/[^0-9.]/g,'')) || 0
}

function parsearFecha(raw) {
  if (!raw) return ''
  // Intentar parsear formatos comunes: DD/MM/YYYY, YYYY-MM-DD
  const m1 = raw.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (m1) return `${m1[3]}-${m1[2].padStart(2,'0')}-${m1[1].padStart(2,'0')}`
  const m2 = raw.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (m2) return raw.slice(0,10)
  return ''
}

// ============================================================
//  Componente modal
// ============================================================
export default function ImportGoogleSheets({ leads: leadsExistentes, vendedores, onSincronizar, onClose }) {
  const { i18n } = useTranslation()
  const isEN = i18n.language?.startsWith('en')
  const [cargando, setCargando] = useState(false)
  const [error, setError]       = useState('')
  const [preview, setPreview]   = useState(null) // { nuevos, actualizados, sinCambios }
  const [paso, setPaso]         = useState(1)
  const [vendedor, setVendedor] = useState('')
  const [resultado, setResultado] = useState(null)

  async function cargarSheet() {
    setCargando(true)
    setError('')
    try {
      // Usamos la API pública (sheet compartido como lector)
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(SHEET_NAME)}?key=AIzaSyD-9tSrke72PouQMnMX-a7eZSW0jkFMBWY`
      
      // Si no tenemos API key de Sheets, usar CSV export (siempre funciona con sheets públicos)
      const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`
      
      const resp = await fetch(csvUrl)
      if (!resp.ok) throw new Error('No se pudo acceder al sheet. Verifica que esté compartido como público.')
      
      const text = await resp.text()
      const rows = parseCSV(text)
      
      // Saltar cabecera y filas vacías
      const filas = rows.slice(1).map(r => parsearFila(r)).filter(Boolean)
      
      if (filas.length === 0) throw new Error('No se encontraron datos en el sheet.')

      // Comparar con leads existentes
      const nuevos = []
      const actualizados = []
      const sinCambios = []

      for (const fila of filas) {
        const existente = leadsExistentes.find(l =>
          normalizar(l.nombre) === normalizar(fila.nombre) &&
          (normalizar(l.telefono) === normalizar(fila.telefono) || !l.telefono || !fila.telefono)
        )
        if (!existente) {
          nuevos.push(fila)
        } else if (existente.estado !== fila.estado) {
          actualizados.push({ ...fila, _existenteId: existente.id })
        } else {
          sinCambios.push(fila)
        }
      }

      setPreview({ nuevos, actualizados, sinCambios, total: filas.length })
      setPaso(2)
    } catch(e) {
      setError(e.message || 'Error al leer el sheet.')
    }
    setCargando(false)
  }

  async function sincronizar() {
    if (!preview) return
    setCargando(true)
    const { nuevos, actualizados } = preview
    let countNuevos = 0, countActualizados = 0

    // Agregar vendedor a los nuevos si se seleccionó
    const nuevosConVend = nuevos.map(n => ({ ...n, vendedor: vendedor || null }))

    const res = await onSincronizar(nuevosConVend, actualizados)
    setResultado(res)
    setPaso(3)
    setCargando(false)
  }

  return (
    <div className="overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" style={{ maxWidth: 680 }}>
        <div className="modal-head">
          <h2>📊 Sincronizar con Google Sheets</h2>
          <button className="x" onClick={onClose}>×</button>
        </div>

        <div style={{ padding: '20px 24px' }}>

          {/* PASO 1 — Configurar */}
          {paso === 1 && (
            <div>
              <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 16 }}>
                Se leerá la hoja <strong style={{ color: 'var(--text)' }}>Planilla</strong> de tu Google Sheet
                y se compararán los datos con los leads actuales en la app.
                Los leads nuevos se agregarán y los que cambiaron de estado se actualizarán.
              </p>
              <div style={{ background: 'rgba(34,211,255,.06)', border: '1px solid rgba(34,211,255,.2)',
                borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13 }}>
                <div style={{ color: 'var(--blue)', fontWeight: 600, marginBottom: 6 }}>Mapeo de estados</div>
                <div style={{ color: 'var(--muted)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
                  <span>Cerrada la Venta → <strong style={{color:'var(--good)'}}>Cerrado</strong></span>
                  <span>Sin Contactar → <strong style={{color:'var(--blue)'}}>Nuevo</strong></span>
                  <span>No Concretó → <strong style={{color:'var(--bad)'}}>Perdido</strong></span>
                  <span>Contactado → <strong style={{color:'#6ec6ff'}}>Contactado</strong></span>
                  <span>Descalificado → <strong style={{color:'var(--bad)'}}>Perdido</strong></span>
                  <span>Recontactado → <strong style={{color:'var(--warn)'}}>Seguimiento</strong></span>
                  <span>A Espera → <strong style={{color:'var(--warn)'}}>Seguimiento</strong></span>
                  <span>Propuesta → <strong style={{color:'var(--purple)'}}>Cotizado</strong></span>
                </div>
              </div>
              <div className="field" style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>
                  Vendedor para leads nuevos (opcional)
                </label>
                <select value={vendedor} onChange={e => setVendedor(e.target.value)}
                  style={{ background: 'var(--panel-solid)', border: '1px solid var(--border)',
                    color: 'var(--text)', font: 'inherit', fontSize: 14, padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)', width: '100%' }}>
                  <option value="">— Sin asignar —</option>
                  {vendedores.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
                </select>
              </div>
              {error && <div className="auth-error" style={{ marginBottom: 12 }}>{error}</div>}
              <button className="btn btn-primary" onClick={cargarSheet} disabled={cargando}
                style={{ width: '100%', justifyContent: 'center' }}>
                {cargando ? '🔄 Leyendo Google Sheets…' : '🔍 Leer datos del Sheet'}
              </button>
            </div>
          )}

          {/* PASO 2 — Preview */}
          {paso === 2 && preview && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
                <div style={{ background: 'rgba(62,224,143,.08)', border: '1px solid rgba(62,224,143,.25)',
                  borderRadius: 10, padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--good)' }}>{preview.nuevos.length}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>Leads nuevos</div>
                </div>
                <div style={{ background: 'rgba(255,193,77,.08)', border: '1px solid rgba(255,193,77,.25)',
                  borderRadius: 10, padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--warn)' }}>{preview.actualizados.length}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>Con cambios de estado</div>
                </div>
                <div style={{ background: 'rgba(140,108,255,.08)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--muted)' }}>{preview.sinCambios.length}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>Sin cambios</div>
                </div>
              </div>

              {preview.nuevos.length === 0 && preview.actualizados.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--muted)' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                  <div>La app ya está sincronizada con el Sheet. No hay cambios.</div>
                </div>
              ) : (
                <>
                  {preview.nuevos.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--good)', marginBottom: 8 }}>
                        ✚ {preview.nuevos.length} leads nuevos a agregar:
                      </div>
                      <div style={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {preview.nuevos.slice(0, 20).map((l, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between',
                            background: 'var(--panel-solid)', borderRadius: 8, padding: '8px 12px', fontSize: 13 }}>
                            <span className="strong">{l.nombre}</span>
                            <span style={{ display: 'flex', gap: 10, color: 'var(--muted)' }}>
                              <span>{l.telefono || '—'}</span>
                              <span className={`pill st-${l.estado}`} style={{ padding: '2px 8px', fontSize: 11 }}>{l.estado}</span>
                            </span>
                          </div>
                        ))}
                        {preview.nuevos.length > 20 && (
                          <div style={{ color: 'var(--muted)', fontSize: 12, textAlign: 'center' }}>
                            ...y {preview.nuevos.length - 20} más
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {preview.actualizados.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--warn)', marginBottom: 8 }}>
                        ↻ {preview.actualizados.length} leads a actualizar estado:
                      </div>
                      <div style={{ maxHeight: 120, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {preview.actualizados.map((l, i) => {
                          const existente = leadsExistentes.find(x => x.id === l._existenteId)
                          return (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between',
                              background: 'var(--panel-solid)', borderRadius: 8, padding: '8px 12px', fontSize: 13 }}>
                              <span className="strong">{l.nombre}</span>
                              <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <span className={`pill st-${existente?.estado}`} style={{ padding: '2px 8px', fontSize: 11 }}>{existente?.estado}</span>
                                <span style={{ color: 'var(--muted)' }}>→</span>
                                <span className={`pill st-${l.estado}`} style={{ padding: '2px 8px', fontSize: 11 }}>{l.estado}</span>
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}

              {error && <div className="auth-error" style={{ marginBottom: 12 }}>{error}</div>}
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button className="btn btn-ghost" onClick={() => setPaso(1)}>← Volver</button>
                {(preview.nuevos.length > 0 || preview.actualizados.length > 0) && (
                  <button className="btn btn-primary" onClick={sincronizar} disabled={cargando}
                    style={{ flex: 1, justifyContent: 'center' }}>
                    {cargando ? 'Sincronizando…' : `✓ Sincronizar ${preview.nuevos.length + preview.actualizados.length} cambios`}
                  </button>
                )}
                {preview.nuevos.length === 0 && preview.actualizados.length === 0 && (
                  <button className="btn btn-ghost" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>
                    Cerrar
                  </button>
                )}
              </div>
            </div>
          )}

          {/* PASO 3 — Resultado */}
          {paso === 3 && resultado && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
              <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, marginBottom: 8 }}>
                ¡Sincronización completada!
              </h3>
              <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>
                {resultado.nuevos > 0 && <span>Se agregaron <strong style={{ color: 'var(--good)' }}>{resultado.nuevos}</strong> leads nuevos. </span>}
                {resultado.actualizados > 0 && <span>Se actualizaron <strong style={{ color: 'var(--warn)' }}>{resultado.actualizados}</strong> estados.</span>}
              </p>
              <button className="btn btn-primary" onClick={onClose} style={{ justifyContent: 'center' }}>
                Ver Cartera de Clientes →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Parser CSV simple ──
function parseCSV(text) {
  const rows = []
  const lines = text.split('\n')
  for (const line of lines) {
    if (!line.trim()) continue
    const row = []
    let cur = '', inQ = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (c === '"') { inQ = !inQ }
      else if (c === ',' && !inQ) { row.push(cur.trim()); cur = '' }
      else cur += c
    }
    row.push(cur.trim())
    rows.push(row)
  }
  return rows
}

function normalizar(s) {
  return (s || '').toLowerCase().trim().replace(/[-\s]/g, '')
}
