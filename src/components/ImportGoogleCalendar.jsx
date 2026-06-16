import { useState } from 'react'
import { useTranslation } from 'react-i18next'

// ============================================================
//  Parser de eventos de Google Calendar → leads de Universum
// ============================================================

const EXPERIENCIAS = [
  'Titanic', 'Coliseo', 'Blue Moon', 'Paraíso Salvaje',
  'titanic', 'coliseo', 'blue moon', 'paraiso salvaje'
]

function parsearEvento(evento) {
  const titulo = evento.summary || ''
  const desc   = evento.description || ''
  const start  = evento.start?.dateTime || evento.start?.date || ''

  // Fecha y hora
  let fecha = '', hora = ''
  if (start) {
    const d = new Date(start)
    fecha = d.toISOString().slice(0, 10)
    hora  = String(d.getHours()).padStart(2, '0') + ':00'
  }

  // Nombre del cliente — busca "Nombre: X" en descripción
  let nombre = ''
  const matchNombre = desc.match(/Nombre:\s*(.+)/i)
  if (matchNombre) {
    nombre = matchNombre[1].trim()
  } else {
    // Fallback: extraer del título "Cumpleaños X HH:MM"
    const matchTitulo = titulo.match(/Cumplea[ñn]os\s+(.+?)\s+\d+:\d+/i)
    if (matchTitulo) nombre = matchTitulo[1].trim()
    else nombre = titulo.replace(/Cumplea[ñn]os\s*/i, '').replace(/\d+:\d+\s*(AM|PM)?/i, '').trim()
  }

  // Cantidad de personas
  let personas = 5
  const matchCantidad = desc.match(/Cantidad:\s*(\d+)/i)
  if (matchCantidad) personas = parseInt(matchCantidad[1])

  // Monto cerrado — busca *$249* o $249
  let montoCerrado = 0
  const matchMonto = desc.match(/\*?\$(\d+(?:\.\d+)?)\*?/)
  if (matchMonto) montoCerrado = parseFloat(matchMonto[1])

  // Actividades → detectar número y tipo
  const lineasActividades = []
  const seccionAct = desc.match(/\d+\s+actividades?:([\s\S]*?)(?:\n\n|\n[A-Z*]|$)/i)
  if (seccionAct) {
    const lineas = seccionAct[1].trim().split('\n')
    lineas.forEach(l => {
      const m = l.match(/^\d+\)\s*(.+)/i)
      if (m) lineasActividades.push(m[1].trim())
    })
  }

  // Número de actividades → paquete
  const numAct = lineasActividades.length
  let paquete = 'Gaming'
  if (numAct >= 3)      paquete = 'Full VR'
  else if (numAct === 2) paquete = 'Double Gaming'

  // Experiencia premium (última actividad si es Full VR y no es GAMING)
  let premium = ''
  if (paquete === 'Full VR' && lineasActividades.length > 0) {
    const ultima = lineasActividades[lineasActividades.length - 1]
    const esGaming = /gaming/i.test(ultima)
    if (!esGaming) premium = ultima
    else {
      // Buscar en todas las actividades la que no sea gaming
      const exp = lineasActividades.find(a => !/gaming/i.test(a))
      if (exp) premium = exp
    }
  }

  // Notas: guardar descripción completa para referencia
  const notas = desc.replace(/<[^>]+>/g, '').trim()

  return { nombre, fecha, hora, personas, paquete, premium, montoCerrado, notas }
}

// ============================================================
//  Componente modal
// ============================================================
export default function ImportGoogleCalendar({ gcal, vendedores, onImportar, onClose }) {
  const { t } = useTranslation()
  const [cargando, setCargando] = useState(false)
  const [error, setError]       = useState('')
  const [eventos, setEventos]   = useState([])
  const [seleccionados, setSeleccionados] = useState({})
  const [vendedor, setVendedor] = useState('')
  const [paso, setPaso]         = useState(1) // 1=buscar, 2=revisar, 3=listo
  const [importados, setImportados] = useState(0)

  async function buscarEventos() {
    setCargando(true)
    setError('')
    try {
      const token = sessionStorage.getItem('gc_token')
      window.gapi.client.setToken({ access_token: token })

      const resp = await window.gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: '2026-01-01T00:00:00Z',
        timeMax: '2026-12-31T23:59:59Z',
        maxResults: 500,
        singleEvents: true,
        orderBy: 'startTime',
      })

      // Log para diagnóstico — ver todos los colorIds
      const todos = resp.result.items || []
      const colorCount = {}
      todos.forEach(e => {
        const cid = e.colorId || 'default(sin color)'
        colorCount[cid] = (colorCount[cid] || 0) + 1
      })
      console.log('=== COLORES EN TU GOOGLE CALENDAR 2026 ===', colorCount)
      console.log('Total eventos encontrados:', todos.length)

      // Tangerine = colorId "6", Default = sin colorId o colorId null/undefined
      const items = todos.filter(e => {
        const cid = e.colorId
        return !cid || cid === '6'
      })
      console.log('Eventos con color Tangerine/Default:', items.length)

      if (items.length === 0) {
        setError('No se encontraron eventos de cumpleaños en 2026.')
        setCargando(false)
        return
      }

      const parseados = items.map(e => ({ ...parsearEvento(e), _id: e.id, _raw: e.summary }))
      setEventos(parseados)

      // Seleccionar todos por defecto
      const sel = {}
      parseados.forEach((_, i) => { sel[i] = true })
      setSeleccionados(sel)
      setPaso(2)
    } catch(e) {
      setError('Error al leer Google Calendar: ' + (e.message || e))
    }
    setCargando(false)
  }

  async function importar() {
    setCargando(true)
    const paraImportar = eventos.filter((_, i) => seleccionados[i])
    let count = 0
    for (const ev of paraImportar) {
      await onImportar({
        nombre:         ev.nombre,
        telefono:       '',
        contacto:       '',
        vendedor:       vendedor || null,
        fecha:          ev.fecha,
        hora:           ev.hora,
        personas:       ev.personas,
        paquete:        ev.paquete,
        premium:        ev.premium,
        estado:         'Cerrado',
        monto_estimado: ev.montoCerrado,
        monto_cerrado:  ev.montoCerrado,
        comision:       +(ev.montoCerrado * 0.10).toFixed(2),
        notas:          ev.notas,
      })
      count++
    }
    setImportados(count)
    setPaso(3)
    setCargando(false)
  }

  function toggleTodos(val) {
    const sel = {}
    eventos.forEach((_, i) => { sel[i] = val })
    setSeleccionados(sel)
  }

  const selCount = Object.values(seleccionados).filter(Boolean).length

  return (
    <div className="overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" style={{ maxWidth: 720 }}>
        <div className="modal-head">
          <h2>📅 Importar desde Google Calendar</h2>
          <button className="x" onClick={onClose}>×</button>
        </div>

        <div style={{ padding: '20px 24px' }}>

          {/* PASO 1 — Buscar */}
          {paso === 1 && (
            <div>
              <p style={{ color: 'var(--muted)', marginBottom: 16, fontSize: 14 }}>
                Se buscarán todos los eventos de cumpleaños en tu Google Calendar del año 2026
                y se importarán como leads con estado <strong style={{ color: 'var(--good)' }}>Cerrado</strong>.
              </p>
              <div className="field" style={{ marginBottom: 16 }}>
                <label>Vendedor asignado a todos los leads importados</label>
                <select value={vendedor} onChange={e => setVendedor(e.target.value)}
                  style={{ background: 'var(--panel-solid)', border: '1px solid var(--border)',
                    color: 'var(--text)', font: 'inherit', fontSize: 14, padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)', width: '100%' }}>
                  <option value="">— Sin asignar —</option>
                  {vendedores.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
                </select>
              </div>
              {error && <div className="auth-error">{error}</div>}
              <button className="btn btn-primary" onClick={buscarEventos} disabled={cargando}
                style={{ width: '100%', justifyContent: 'center' }}>
                {cargando ? 'Buscando eventos…' : '🔍 Buscar cumpleaños en 2026'}
              </button>
            </div>
          )}

          {/* PASO 2 — Revisar */}
          {paso === 2 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <p style={{ color: 'var(--muted)', fontSize: 13 }}>
                  Se encontraron <strong style={{ color: 'var(--text)' }}>{eventos.length}</strong> cumpleaños.
                  Selecciona los que quieres importar.
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => toggleTodos(true)}>Todos</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => toggleTodos(false)}>Ninguno</button>
                </div>
              </div>

              <div style={{ maxHeight: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {eventos.map((ev, i) => (
                  <div key={i} onClick={() => setSeleccionados(s => ({ ...s, [i]: !s[i] }))}
                    style={{
                      display: 'flex', gap: 12, alignItems: 'flex-start',
                      background: seleccionados[i] ? 'rgba(62,224,143,.08)' : 'var(--panel-solid)',
                      border: `1px solid ${seleccionados[i] ? 'rgba(62,224,143,.3)' : 'var(--border)'}`,
                      borderRadius: 10, padding: '10px 14px', cursor: 'pointer', transition: '.15s'
                    }}>
                    <input type="checkbox" checked={!!seleccionados[i]} onChange={() => {}}
                      style={{ marginTop: 3, accentColor: 'var(--good)', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{ev.nombre || '(sin nombre)'}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <span>📅 {ev.fecha}</span>
                        <span>🕐 {ev.hora}</span>
                        <span>👥 {ev.personas} personas</span>
                        <span>📦 {ev.paquete}</span>
                        {ev.premium && <span>⭐ {ev.premium}</span>}
                        <span style={{ color: 'var(--good)' }}>💰 ${ev.montoCerrado}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {error && <div className="auth-error" style={{ marginTop: 12 }}>{error}</div>}

              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button className="btn btn-ghost" onClick={() => setPaso(1)}>← Volver</button>
                <button className="btn btn-primary" onClick={importar}
                  disabled={cargando || selCount === 0}
                  style={{ flex: 1, justifyContent: 'center' }}>
                  {cargando ? 'Importando…' : `✓ Importar ${selCount} cumpleaños`}
                </button>
              </div>
            </div>
          )}

          {/* PASO 3 — Éxito */}
          {paso === 3 && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, marginBottom: 8 }}>
                ¡Importación completada!
              </h3>
              <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>
                Se importaron <strong style={{ color: 'var(--good)' }}>{importados}</strong> cumpleaños
                como leads con estado Cerrado.
              </p>
              <button className="btn btn-primary" onClick={onClose}
                style={{ justifyContent: 'center' }}>
                Ver leads →
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
