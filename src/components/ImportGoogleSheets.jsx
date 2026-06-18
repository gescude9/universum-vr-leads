import { useState } from 'react'

const SHEET_ID = '1DdUCz39dnwTlRU1viWAWVVR7mJmNmOHtHaRO64LpNn4'
const SHEET_NAME = 'Planilla'

const ESTADO_MAP = {
  'cerrada la venta':       'Cerrado',
  'venta cerrada':          'Cerrado',
  'no concretó la venta':   'Perdido',
  'no concretó':            'Perdido',
  'descalificado':          'Perdido',
  'perdido':                'Perdido',
  'sin contactar':          'Nuevo',
  'contactado':             'Contactado',
  'recontactado':           'Recontactado',
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

function limpiarTelefono(raw) {
  if (!raw) return ''
  let t = raw.trim()
  // Quitar + al inicio
  t = t.replace(/^\+/, '')
  // Quitar prefijos internacionales: 507, 506, 51, 1 seguidos de espacio o guion
  t = t.replace(/^507[\s\-]?/, '')
  t = t.replace(/^506[\s\-]?/, '')
  t = t.replace(/^51[\s\-]?/, '')
  t = t.replace(/^1[\s\-]?/, '')
  // Quitar todo lo que no sea dígito
  t = t.replace(/[^0-9]/g, '')
  // Si quedó muy largo (más de 8 dígitos para Panama), tomar los últimos 8
  if (t.length > 8) t = t.slice(-8)
  return t
}

function parsearFila(row, filaNum) {
  const nombre = String(row[2] || '').trim()
  if (!nombre || nombre === 'Nombre del Cliente' || nombre.length < 2) return null
  if (/^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|JULIO|JUNIO|MAYO|ABRIL)$/i.test(nombre)) return null

  const fechaContacto = String(row[3] || '').trim()
  const tipoEvento    = String(row[6] || '').trim()
  const personas      = String(row[7] || '').trim()
  const telefonoRaw   = String(row[8] || '').trim()
  if (telefonoRaw && !limpiarTelefono(telefonoRaw)) {
    console.log('TELEFONO VACIO:', JSON.stringify(row[8]), '→', telefonoRaw)
  }
  const telefono      = limpiarTelefono(telefonoRaw)
  const statusRaw     = String(row[9] || '').trim()
  const montoTx       = parsearMonto(String(row[10] || ''))
  const montoTixr     = parsearMonto(String(row[11] || ''))
  const notaExtra     = String(row[12] || '').trim()
  const fechaEvento   = parsearFecha(String(row[5] || ''))
  const estado        = mapearEstado(statusRaw)
  const montoVenta    = estado === 'Cerrado' ? (montoTx || montoTixr || 0) : 0

  const notas = [
    row[3] ? `Motivo: ${String(row[3]).trim().slice(0, 120)}` : '',
    notaExtra ? `Nota: ${notaExtra}` : '',
    statusRaw ? `Estado original: ${statusRaw}` : '',
    montoTx   ? `Pago transferencia: $${montoTx}` : '',
    montoTixr ? `Pago Tixr: $${montoTixr}` : '',
  ].filter(Boolean).join('\n')

  return {
    fila_sheet:     filaNum,
    nombre,
    telefono,
    contacto:       '',
    fecha_contacto: fechaContacto,
    fecha_evento:   fechaEvento || null,
    tipo_evento:    tipoEvento,
    personas,
    estado,
    monto_venta:    montoVenta,
    notas,
  }
}

function parsearMonto(raw) {
  const m = raw.replace(/[$,\s]/g, '').match(/[\d]+\.?[\d]*/)
  return m ? parseFloat(m[0]) : 0
}

function parsearFecha(raw) {
  if (!raw) return ''
  const m1 = raw.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (m1) return `${m1[3]}-${m1[2].padStart(2,'0')}-${m1[1].padStart(2,'0')}`
  const m2 = raw.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (m2) return raw.slice(0,10)
  return ''
}

async function leerSheet() {
  // Usamos gviz/tq con formato JSON — sin límite de filas, funciona con sheets públicos
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`
  const resp = await fetch(url)
  if (!resp.ok) throw new Error('No se pudo acceder al sheet. Verifica que esté compartido como público.')
  const text = await resp.text()
  // Google devuelve JSONP: /*O_o*/\ngoogle.visualization.Query.setResponse({...});
  const jsonStr = text.replace(/^[^{]*/, '').replace(/[^}]*$/, '')
  const json = JSON.parse(jsonStr)
  const table = json.table
  if (!table || !table.rows) throw new Error('No se encontraron datos en el sheet.')

  const cols = table.cols.length
  const rows = table.rows.map(row => {
    const arr = []
    for (let i = 0; i < cols; i++) {
      const cell = row.c?.[i]
      let val = ''
      if (cell != null) {
        // Siempre preferir el formato legible (cell.f) sobre el valor (cell.v)
        // Esto evita que "6674-3243" sea interpretado como número negativo
        if (cell.f != null) val = String(cell.f)
        else if (cell.v != null) val = String(cell.v)
      }
      arr.push(val)
    }
    return arr
  })

  console.log('Total filas del sheet:', rows.length)
  return rows
}

export default function ImportGoogleSheets({ leadsSheet, onSincronizar, onClose }) {
  const [cargando, setCargando] = useState(false)
  const [error, setError]       = useState('')
  const [preview, setPreview]   = useState(null)
  const [paso, setPaso]         = useState(1)
  const [resultado, setResultado] = useState(null)

  async function cargarSheet() {
    setCargando(true)
    setError('')
    try {
      const rows = await leerSheet()
      const filas = rows.map((r, i) => parsearFila(r, i + 2)).filter(Boolean)
      if (filas.length === 0) throw new Error('No se encontraron leads válidos.')

      const nuevos = []
      const actualizados = []
      const sinCambios = []

      for (const fila of filas) {
        const existente = leadsSheet.find(l => l.fila_sheet === fila.fila_sheet)
        if (!existente) {
          nuevos.push(fila)
        } else if (existente.estado !== fila.estado || existente.monto_venta !== fila.monto_venta) {
          actualizados.push({ ...fila, _id: existente.id })
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
    const res = await onSincronizar(preview.nuevos, preview.actualizados)
    setResultado(res)
    setPaso(3)
    setCargando(false)
  }

  return (
    <div className="overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" style={{ maxWidth: 700 }}>
        <div className="modal-head">
          <h2>📊 Sincronizar con Google Sheets</h2>
          <button className="x" onClick={onClose}>×</button>
        </div>
        <div style={{ padding: '20px 24px' }}>

          {paso === 1 && (
            <div>
              <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 16 }}>
                Se leerá la hoja <strong style={{ color: 'var(--text)' }}>Planilla</strong> completa
                y se sincronizarán todos los leads. Los nuevos se agregan y los que cambiaron de estado se actualizan.
              </p>
              <div style={{ background: 'rgba(34,211,255,.06)', border: '1px solid rgba(34,211,255,.2)',
                borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13 }}>
                <div style={{ color: 'var(--blue)', fontWeight: 600, marginBottom: 6 }}>Mapeo de estados</div>
                <div style={{ color: 'var(--muted)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
                  <span>Cerrada la Venta → <strong style={{color:'var(--good)'}}>Cerrado</strong></span>
                  <span>Sin Contactar → <strong style={{color:'var(--blue)'}}>Nuevo</strong></span>
                  <span>No Concretó / Descalificado → <strong style={{color:'var(--bad)'}}>Perdido</strong></span>
                  <span>Contactado → <strong style={{color:'#6ec6ff'}}>Contactado</strong></span>
                  <span>Recontactado → <strong style={{color:'#c084fc'}}>Recontactado</strong></span>
                  <span>Propuesta a Confirmar → <strong style={{color:'var(--purple)'}}>Cotizado</strong></span>
                </div>
              </div>
              {error && <div className="auth-error" style={{ marginBottom: 12 }}>{error}</div>}
              <button className="btn btn-primary" onClick={cargarSheet} disabled={cargando}
                style={{ width: '100%', justifyContent: 'center' }}>
                {cargando ? '🔄 Leyendo Google Sheets…' : '🔍 Leer datos del Sheet'}
              </button>
            </div>
          )}

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
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>Con cambios</div>
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
                  <div>Todo está al día. No hay cambios.</div>
                </div>
              ) : (
                <>
                  {preview.nuevos.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--good)', marginBottom: 8 }}>
                        ✚ {preview.nuevos.length} leads nuevos
                      </div>
                      <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {preview.nuevos.slice(0, 30).map((l, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            background: 'var(--panel-solid)', borderRadius: 8, padding: '7px 12px', fontSize: 13 }}>
                            <span className="strong">{l.nombre}</span>
                            <span style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--muted)' }}>
                              <span style={{ fontSize: 11 }}>{l.tipo_evento}</span>
                              <span className={`pill st-${l.estado}`} style={{ padding: '2px 8px', fontSize: 11 }}>{l.estado}</span>
                            </span>
                          </div>
                        ))}
                        {preview.nuevos.length > 30 && (
                          <div style={{ color: 'var(--muted)', fontSize: 12, textAlign: 'center' }}>
                            ...y {preview.nuevos.length - 30} más
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {preview.actualizados.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--warn)', marginBottom: 8 }}>
                        ↻ {preview.actualizados.length} leads a actualizar
                      </div>
                      <div style={{ maxHeight: 120, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {preview.actualizados.map((l, i) => {
                          const ex = leadsSheet.find(x => x.id === l._id)
                          return (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              background: 'var(--panel-solid)', borderRadius: 8, padding: '7px 12px', fontSize: 13 }}>
                              <span className="strong">{l.nombre}</span>
                              <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <span className={`pill st-${ex?.estado}`} style={{ padding: '2px 8px', fontSize: 11 }}>{ex?.estado}</span>
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
                {(preview.nuevos.length > 0 || preview.actualizados.length > 0) ? (
                  <button className="btn btn-primary" onClick={sincronizar} disabled={cargando}
                    style={{ flex: 1, justifyContent: 'center' }}>
                    {cargando ? 'Sincronizando…' : `✓ Sincronizar ${preview.nuevos.length + preview.actualizados.length} cambios`}
                  </button>
                ) : (
                  <button className="btn btn-ghost" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>Cerrar</button>
                )}
              </div>
            </div>
          )}

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
                Ver Leads →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
