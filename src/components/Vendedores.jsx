import { money } from '../lib/helpers'

export default function Vendedores({ vendedores, leads, onNew, onEdit, onDelete }) {
  return (
    <section className="view">
      <div className="page-head">
        <div>
          <h1>Vendedores</h1>
          <p>Rendimiento y comisiones acumuladas (10%).</p>
        </div>
        <button className="btn btn-primary" onClick={onNew}>＋ Nuevo vendedor</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Vendedor</th><th>Contacto</th><th>Leads</th><th>Cerrados</th>
              <th>Conversión</th><th>Total vendido</th><th>Comisión acumulada</th><th></th>
            </tr>
          </thead>
          <tbody>
            {vendedores.length === 0 ? (
              <tr><td colSpan={8} className="empty">No hay vendedores. Agrega uno.</td></tr>
            ) : (
              vendedores.map((v) => {
                const sus = leads.filter((l) => l.vendedor === v.id)
                const cerr = sus.filter((l) => l.estado === 'Cerrado')
                const vendido = cerr.reduce((s, l) => s + (Number(l.monto_cerrado) || 0), 0)
                const comision = cerr.reduce((s, l) => s + (Number(l.comision) || 0), 0)
                const conv = sus.length ? Math.round((cerr.length / sus.length) * 100) : 0
                return (
                  <tr key={v.id}>
                    <td className="strong">{v.nombre}</td>
                    <td>
                      <div className="sub">{v.telefono || '—'}</div>
                      <div className="sub">{v.email || ''}</div>
                    </td>
                    <td>{sus.length}</td>
                    <td>{cerr.length}</td>
                    <td>
                      {conv}%
                      <div className="bar"><i style={{ width: `${conv}%` }}></i></div>
                    </td>
                    <td>{money(vendido)}</td>
                    <td style={{ color: 'var(--good)', fontWeight: 600 }}>{money(comision)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => onEdit(v)}>Editar</button>{' '}
                      <button className="btn btn-danger btn-sm" onClick={() => onDelete(v)}>✕</button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
