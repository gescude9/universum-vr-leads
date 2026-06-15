import { useState } from 'react'
import { money, fmtFecha } from '../lib/helpers'
import { ESTADOS } from '../constants'

export default function Leads({ leads, vendedores, onNew, onEdit, onDelete }) {
  const [q, setQ] = useState('')
  const [fe, setFe] = useState('')
  const [fv, setFv] = useState('')

  const vName = (id) => vendedores.find((v) => v.id === id)?.nombre || '—'

  let rows = leads.slice()
  if (q) {
    const t = q.toLowerCase()
    rows = rows.filter((l) =>
      `${l.nombre} ${l.telefono || ''} ${l.contacto || ''}`.toLowerCase().includes(t)
    )
  }
  if (fe) rows = rows.filter((l) => l.estado === fe)
  if (fv) rows = rows.filter((l) => l.vendedor === fv)

  return (
    <section className="view">
      <div className="page-head">
        <div>
          <h1>Leads</h1>
          <p>Registra y da seguimiento a cada cumpleaños.</p>
        </div>
        <button className="btn btn-primary" onClick={onNew}>＋ Nuevo lead</button>
      </div>

      <div className="toolbar">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, teléfono o contacto…"
        />
        <select value={fe} onChange={(e) => setFe(e.target.value)}>
          <option value="">Todos los estados</option>
          {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
        <select value={fv} onChange={(e) => setFv(e.target.value)}>
          <option value="">Todos los vendedores</option>
          {vendedores.map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}
        </select>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Cliente</th><th>Cumpleaños</th><th>Paquete</th><th>Pers.</th>
              <th>Vendedor</th><th>Estado</th><th>Estimado</th>
              <th>Cerrado</th><th>Comisión</th><th></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="empty">
                  <div className="big">✨</div>
                  No hay leads que coincidan. Crea el primero con “Nuevo lead”.
                </td>
              </tr>
            ) : (
              rows.map((l) => (
                <tr key={l.id}>
                  <td>
                    <div className="strong">{l.nombre}</div>
                    <div className="sub">{l.contacto || l.telefono || ''}</div>
                  </td>
                  <td>{fmtFecha(l.fecha)}<div className="sub">{l.hora || ''}</div></td>
                  <td>
                    <span className="pkg-tag">{l.paquete}</span>
                    {l.premium && <div className="sub">{l.premium}</div>}
                  </td>
                  <td>{l.personas}</td>
                  <td>{vName(l.vendedor)}</td>
                  <td><span className={`pill st-${l.estado}`}>{l.estado}</span></td>
                  <td>{money(l.monto_estimado)}</td>
                  <td>{l.estado === 'Cerrado' ? money(l.monto_cerrado) : '—'}</td>
                  <td style={{ color: 'var(--good)', fontWeight: 600 }}>
                    {l.estado === 'Cerrado' ? money(l.comision) : '—'}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => onEdit(l)}>Editar</button>{' '}
                    <button className="btn btn-danger btn-sm" onClick={() => onDelete(l)}>✕</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
