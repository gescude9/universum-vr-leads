import { useTranslation } from 'react-i18next'
import { money, fmtFecha, todayISO } from '../lib/helpers'

export default function Dashboard({ leads, vendedores, onNewLead }) {
  const { t } = useTranslation()
  const vName = id => vendedores.find(v => v.id === id)?.nombre || '—'
  const total = leads.length
  const by = est => leads.filter(l => l.estado === est).length
  const cerrados = leads.filter(l => l.estado === 'Cerrado')
  const ventas = cerrados.reduce((s, l) => s + (Number(l.monto_cerrado) || 0), 0)
  const comisiones = cerrados.reduce((s, l) => s + (Number(l.comision) || 0), 0)
  const pct = n => total ? Math.round(n / total * 100) + t('dashboard.delTotal') : '—'

  const kpis = [
    { lbl: t('dashboard.totalLeads'), val: total, color: 'var(--purple)' },
    { lbl: t('dashboard.nuevos'), val: by('Nuevo'), color: 'var(--blue)' },
    { lbl: t('dashboard.enSeguimiento'), val: by('Seguimiento'), color: 'var(--warn)' },
    { lbl: t('dashboard.cerrados'), val: cerrados.length, color: 'var(--good)' },
  ]

  const hoy = todayISO()
  const prox = leads
    .filter(l => l.fecha && l.fecha >= hoy && l.estado !== 'Perdido')
    .sort((a, b) => (a.fecha + (a.hora || '')).localeCompare(b.fecha + (b.hora || '')))
    .slice(0, 6)

  return (
    <section className="view">
      <div className="page-head">
        <div><h1>{t('dashboard.titulo')}</h1><p>{t('dashboard.subtitulo')}</p></div>
        <button className="btn btn-primary" onClick={onNewLead}>{t('dashboard.nuevoLead')}</button>
      </div>
      <div className="kpis">
        {kpis.map(k => (
          <div className="card kpi" key={k.lbl}>
            <div className="lbl">{k.lbl}</div>
            <div className="val" style={{ color: k.color }}>{k.val}</div>
            <span className="tag"><span className="dot" style={{ background: k.color }}></span>{pct(k.val)}</span>
          </div>
        ))}
      </div>
      <div className="kpis money" style={{ marginTop: 2 }}>
        <div className="card kpi">
          <div className="lbl">{t('dashboard.ventasTotales')}</div>
          <div className="val grad">{money(ventas)}</div>
          <span className="tag">{cerrados.length} {t('dashboard.cumplesCerrados')} · {by('Perdido')} {t('dashboard.perdidos')}</span>
        </div>
        <div className="card kpi">
          <div className="lbl">{t('dashboard.comisionesTotales')}</div>
          <div className="val" style={{ color: 'var(--good)' }}>{money(comisiones)}</div>
          <span className="tag">{t('dashboard.sobreMonto')}</span>
        </div>
      </div>
      <div className="page-head" style={{ marginTop: 30, marginBottom: 14 }}>
        <div><h1 style={{ fontSize: 20 }}>{t('dashboard.proximosCumples')}</h1></div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr>
            <th>{t('leads.columnas.cliente')}</th>
            <th>{t('leads.columnas.cumpleanos')}</th>
            <th>{t('calendario.titulo') === 'Calendar' ? 'Time' : 'Hora'}</th>
            <th>{t('leads.columnas.paquete')}</th>
            <th>{t('leads.columnas.vendedor')}</th>
            <th>{t('leads.columnas.estado')}</th>
          </tr></thead>
          <tbody>
            {prox.length === 0 ? (
              <tr><td colSpan={6} className="empty"><div className="big">🪐</div>{t('dashboard.noCumples')}</td></tr>
            ) : prox.map(l => (
              <tr key={l.id}>
                <td data-label="Cliente" className="strong">{l.nombre}</td>
                <td data-label="Fecha">{fmtFecha(l.fecha)}</td>
                <td data-label="Hora">{l.hora || '—'}</td>
                <td data-label="Paquete"><span className="pkg-tag">{l.paquete}</span></td>
                <td data-label="Vendedor">{vName(l.vendedor)}</td>
                <td data-label="Estado"><span className={`pill st-${l.estado}`}>{t(`estados.${l.estado}`)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
