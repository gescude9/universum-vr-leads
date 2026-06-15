import { money, fmtFecha, todayISO } from '../lib/helpers'

export default function Dashboard({ leads, vendedores, onNewLead }) {
  const vName = (id) => vendedores.find((v) => v.id === id)?.nombre || '—'
  const total = leads.length
  const by = (est) => leads.filter((l) => l.estado === est).length
  const cerrados = leads.filter((l) => l.estado === 'Cerrado')
  const ventas = cerrados.reduce((s, l) => s + (Number(l.monto_cerrado) || 0), 0)
  const comisiones = cerrados.reduce((s, l) => s + (Number(l.comision) || 0), 0)

  const pct = (n) => (total ? Math.round((n / total) * 100) + '% del total' : '—')

  const kpis = [
    { lbl: 'Total de leads', val: total, color: 'var(--purple)' },
    { lbl: 'Nuevos', val: by('Nuevo'), color: 'var(--blue)' },
    { lbl: 'En seguimiento', val: by('Seguimiento'), color: 'var(--warn)' },
    { lbl: 'Cerrados', val: cerrados.length, color: 'var(--good)' },
  ]

  const hoy = todayISO()
  const prox = leads
    .filter((l) => l.fecha && l.fecha >= hoy && l.estado !== 'Perdido')
    .sort((a, b) => (a.fecha + (a.hora || '')).localeCompare(b.fecha + (b.hora || '')))
    .slice(0, 6)

  return (
    <section className="view">
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p>Resumen general de leads, ventas y comisiones.</p>
        </div>
        <button className="btn btn-primary" onClick={onNewLead}>＋ Nuevo lead</button>
      </div>

      <div className="kpis">
        {kpis.map((k) => (
          <div className="card kpi" key={k.lbl}>
            <div className="lbl">{k.lbl}</div>
            <div className="val" style={{ color: k.color }}>{k.val}</div>
            <span className="tag">
              <span className="dot" style={{ background: k.color }}></span>
              {pct(k.val)}
            </span>
          </div>
        ))}
      </div>

      <div className="kpis money" style={{ marginTop: 2 }}>
        <div className="card kpi">
          <div className="lbl">Ventas totales cerradas</div>
          <div className="val grad">{money(ventas)}</div>
          <span className="tag">{cerrados.length} cerrados · {by('Perdido')} perdidos</span>
        </div>
        <div className="card kpi">
          <div className="lbl">Comisiones totales por pagar</div>
          <div className="val" style={{ color: 'var(--good)' }}>{money(comisiones)}</div>
          <span className="tag">10% sobre el monto cerrado</span>
        </div>
      </div>

      <div className="page-head" style={{ marginTop: 30, marginBottom: 14 }}>
        <div><h1 style={{ fontSize: 20 }}>Próximos cumpleaños</h1></div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Cliente</th><th>Fecha</th><th>Hora</th>
              <th>Paquete</th><th>Vendedor</th><th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {prox.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty">
                  <div className="big">🪐</div>No hay cumpleaños próximos agendados.
                </td>
              </tr>
            ) : (
              prox.map((l) => (
                <tr key={l.id}>
                  <td className="strong">{l.nombre}</td>
                  <td>{fmtFecha(l.fecha)}</td>
                  <td>{l.hora || '—'}</td>
                  <td><span className="pkg-tag">{l.paquete}</span></td>
                  <td>{vName(l.vendedor)}</td>
                  <td><span className={`pill st-${l.estado}`}>{l.estado}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
