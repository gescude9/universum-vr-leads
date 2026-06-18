import { useState } from 'react'

const ESTADOS = ['Nuevo', 'Contactado', 'Cotizado', 'Seguimiento', 'Cerrado', 'Perdido']
const TIPO_COLORS = {
  'Cumpleanos':       { bg: 'rgba(168,85,247,.15)', color: 'var(--purple)' },
  'Empresa':          { bg: 'rgba(34,211,255,.12)', color: 'var(--blue)' },
  'Grupo Estudiantil':{ bg: 'rgba(255,193,77,.12)', color: 'var(--warn)' },
  'Paseo Grupal':     { bg: 'rgba(62,224,143,.12)', color: 'var(--good)' },
  'Universidad':      { bg: 'rgba(255,78,205,.12)', color: 'var(--pink)' },
}

export default function LeadsSheet({ leads, onSync, onDelete, syncing }) {
  const [q, setQ] = useState('')
  const [fe, setFe] = useState('')
  const [ft, setFt] = useState('')

  const safeLeads = leads || []
  let rows = safeLeads.slice()
  if (q) {
    const tx = q.toLowerCase()
    rows = rows.filter(l =>
      (l.nombre + ' ' + (l.telefono||'') + ' ' + (l.tipo_evento||'')).toLowerCase().includes(tx)
    )
  }
  if (fe) rows = rows.filter(l => l.estado === fe)
  if (ft) rows = rows.filter(l => l.tipo_evento === ft)

  const tipos = [...new Set(safeLeads.map(l => l.tipo_evento).filter(Boolean))]
  const estadoCounts = {}
  ESTADOS.forEach(e => { estadoCounts[e] = safeLeads.filter(l => l.estado === e).length })

  return (
    <section className="view">
      <div className="page-head">
        <div>
          <h1>Leads</h1>
          <p>Prospectos desde Google Sheets · {safeLeads.length} registros</p>
        </div>
        <button className="btn btn-primary" onClick={onSync} disabled={syncing}>
          {syncing ? 'Sincronizando...' : 'Sincronizar Sheets'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
        {ESTADOS.map(e => (
          <div key={e} onClick={() => setFe(fe === e ? '' : e)} style={{
            cursor: 'pointer',
            background: fe === e ? 'rgba(140,108,255,.2)' : 'var(--panel)',
            border: '1px solid ' + (fe === e ? 'var(--border-strong)' : 'var(--border)'),
            borderRadius: 10, padding: '8px 14px', fontSize: 13,
            transition: '.15s', userSelect: 'none'
          }}>
            <span className={'pill st-' + e} style={{ padding: '2px 8px', fontSize: 11 }}>{e}</span>
            <span style={{ marginLeft: 8, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif' }}>
              {estadoCounts[e]}
            </span>
          </div>
        ))}
      </div>

      <div className="toolbar">
        <input
          type="search" value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Buscar por nombre, telefono o tipo..."
        />
        <select value={fe} onChange={e => setFe(e.target.value)}>
          <option value="">Todos los estados</option>
          {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <select value={ft} onChange={e => setFt(e.target.value)}>
          <option value="">Todos los tipos</option>
          {tipos.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th><th>Nombre</th><th>Telefono</th><th>Tipo</th>
              <th>Personas</th><th>Fecha evento</th><th>Estado</th>
              <th>Monto</th><th>Notas</th><th></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="empty">
                  <div className="big">📊</div>
                  {safeLeads.length === 0
                    ? 'No hay leads. Haz clic en Sincronizar Sheets.'
                    : 'No hay leads que coincidan.'}
                </td>
              </tr>
            ) : rows.map(l => {
              const ts = TIPO_COLORS[l.tipo_evento] || { bg: 'rgba(140,108,255,.1)', color: 'var(--muted)' }
              return (
                <tr key={l.id}>
                  <td data-label="#" style={{ color: 'var(--muted-2)', fontSize: 12 }}>
                    {l.fila_sheet || '-'}
                  </td>
                  <td data-label="Nombre">
                    <div className="strong">{l.nombre}</div>
                    {l.fecha_contacto && <div className="sub">{l.fecha_contacto}</div>}
                  </td>
                  <td data-label="Telefono">{l.telefono || '-'}</td>
                  <td data-label="Tipo">
                    {l.tipo_evento && (
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '3px 9px',
                        borderRadius: 6, background: ts.bg, color: ts.color
                      }}>
                        {l.tipo_evento}
                      </span>
                    )}
                  </td>
                  <td data-label="Personas">{l.personas || '-'}</td>
                  <td data-label="Fecha">
                    {l.fecha_evento
                      ? new Date(l.fecha_evento + 'T00:00').toLocaleDateString('es-PA')
                      : '-'}
                  </td>
                  <td data-label="Estado">
                    <span className={'pill st-' + l.estado}>{l.estado}</span>
                  </td>
                  <td data-label="Monto">
                    {l.monto_venta > 0
                      ? <span style={{ color: 'var(--good)', fontWeight: 600 }}>${l.monto_venta}</span>
                      : '-'}
                  </td>
                  <td data-label="Notas">
                    {l.notas
                      ? <span title={l.notas} style={{ color: 'var(--muted)', fontSize: 12, cursor: 'help' }}>
                          {l.notas.length > 40 ? l.notas.slice(0, 40) + '...' : l.notas}
                        </span>
                      : '-'}
                  </td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => onDelete(l)}>x</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
