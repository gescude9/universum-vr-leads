import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { money, fmtFecha } from '../lib/helpers'

export default function Vendedores({ vendedores, leads, onNew, onEdit, onDelete, isViewer }) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState(null)

  const toggle = (id) => setSelected(selected === id ? null : id)

  return (
    <section className="view">
      <div className="page-head">
        <div><h1>{t('vendedores.titulo')}</h1><p>{t('vendedores.subtitulo')}</p></div>
        {!isViewer && <button className="btn btn-primary" onClick={onNew}>{t('vendedores.nuevoVendedor')}</button>}
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr>
            <th>{t('vendedores.columnas.vendedor')}</th>
            <th>{t('vendedores.columnas.contacto')}</th>
            <th>{t('vendedores.columnas.leads')}</th>
            <th>{t('vendedores.columnas.cerrados')}</th>
            <th>{t('vendedores.columnas.conversion')}</th>
            <th>{t('vendedores.columnas.totalVendido')}</th>
            <th>{t('vendedores.columnas.comision')}</th>
            <th></th>
          </tr></thead>
          <tbody>
            {vendedores.length === 0 ? (
              <tr><td colSpan={8} className="empty">{t('vendedores.sinVendedores')}</td></tr>
            ) : vendedores.map(v => {
              const sus = leads.filter(l => l.vendedor === v.id)
              const cerr = sus.filter(l => l.estado === 'Cerrado')
              const vendido = cerr.reduce((s, l) => s + (Number(l.monto_cerrado) || 0), 0)
              const pct = v.comision_pct != null ? Number(v.comision_pct) : 10
              const comision = cerr.reduce((s, l) => s + (Number(l.comision) || 0), 0)
              const conv = sus.length ? Math.round(cerr.length / sus.length * 100) : 0
              const isOpen = selected === v.id

              return (
                <>
                  <tr key={v.id}
                    onClick={() => toggle(v.id)}
                    style={{ cursor: 'pointer', background: isOpen ? 'rgba(140,108,255,.08)' : '' }}>
                    <td data-label={t('vendedores.columnas.vendedor')}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: 'var(--muted)', fontSize: 12 }}>{isOpen ? '▼' : '▶'}</span>
                        <strong>{v.nombre}</strong>
                      </div>
                    </td>
                    <td data-label={t('vendedores.columnas.contacto')}>
                      <div className="sub">{v.telefono || '-'}</div>
                      <div className="sub">{v.email || ''}</div>
                    </td>
                    <td data-label={t('vendedores.columnas.leads')}>{sus.length}</td>
                    <td data-label={t('vendedores.columnas.cerrados')}>{cerr.length}</td>
                    <td data-label={t('vendedores.columnas.conversion')}>
                      {conv}%
                      <div className="bar"><i style={{ width: `${conv}%` }}></i></div>
                    </td>
                    <td data-label={t('vendedores.columnas.totalVendido')}>{money(vendido)}</td>
                    <td data-label={t('vendedores.columnas.comision')} style={{ color: 'var(--good)', fontWeight: 600 }}>
                      {money(comision)}
                      <div className="sub" style={{ color: 'var(--muted)' }}>{pct}%</div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                      {!isViewer && <button className="btn btn-ghost btn-sm" onClick={() => onEdit(v)}>{t('vendedores.editar')}</button>}{' '}
                      {!isViewer && <button className="btn btn-danger btn-sm" onClick={() => onDelete(v)}>{t('vendedores.eliminar')}</button>}
                    </td>
                  </tr>
                  {isOpen && (
                    <tr key={v.id + '-detail'}>
                      <td colSpan={8} style={{ padding: 0, background: 'rgba(140,108,255,.04)' }}>
                        {cerr.length === 0 ? (
                          <div style={{ padding: '16px 24px', color: 'var(--muted)', fontSize: 13 }}>
                            No hay ventas cerradas aun para este vendedor.
                          </div>
                        ) : (
                          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                <th style={{ padding: '10px 24px', color: 'var(--muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', textAlign: 'left' }}>Cliente</th>
                                <th style={{ padding: '10px 16px', color: 'var(--muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', textAlign: 'left' }}>Fecha</th>
                                <th style={{ padding: '10px 16px', color: 'var(--muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', textAlign: 'left' }}>Paquete</th>
                                <th style={{ padding: '10px 16px', color: 'var(--muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', textAlign: 'left' }}>Personas</th>
                                <th style={{ padding: '10px 16px', color: 'var(--muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', textAlign: 'left' }}>Monto</th>
                                <th style={{ padding: '10px 16px', color: 'var(--muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', textAlign: 'left' }}>Comision</th>
                              </tr>
                            </thead>
                            <tbody>
                              {cerr.sort((a,b) => (b.fecha||'').localeCompare(a.fecha||'')).map(l => (
                                <tr key={l.id} style={{ borderBottom: '1px solid rgba(140,108,255,.08)' }}>
                                  <td style={{ padding: '10px 24px', fontWeight: 600 }}>{l.nombre}</td>
                                  <td style={{ padding: '10px 16px', color: 'var(--muted)' }}>{fmtFecha(l.fecha)}</td>
                                  <td style={{ padding: '10px 16px' }}>
                                    <span className="pkg-tag">{l.paquete}</span>
                                    {l.premium && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{l.premium}</div>}
                                  </td>
                                  <td style={{ padding: '10px 16px', color: 'var(--muted)' }}>{l.personas}p</td>
                                  <td style={{ padding: '10px 16px', color: 'var(--blue)', fontWeight: 600 }}>{money(l.monto_cerrado)}</td>
                                  <td style={{ padding: '10px 16px', color: 'var(--good)', fontWeight: 600 }}>{money(l.comision)}</td>
                                </tr>
                              ))}
                              <tr style={{ borderTop: '2px solid var(--border)' }}>
                                <td colSpan={4} style={{ padding: '10px 24px', color: 'var(--muted)', fontSize: 12 }}>
                                  Total {cerr.length} ventas cerradas
                                </td>
                                <td style={{ padding: '10px 16px', color: 'var(--blue)', fontWeight: 700 }}>{money(vendido)}</td>
                                <td style={{ padding: '10px 16px', color: 'var(--good)', fontWeight: 700 }}>{money(comision)}</td>
                              </tr>
                            </tbody>
                          </table>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
