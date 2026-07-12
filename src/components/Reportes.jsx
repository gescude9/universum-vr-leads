import { useState } from 'react'
import { money, fmtFecha } from '../lib/helpers'
import { useTranslation } from 'react-i18next'

const MESES_ES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
]
const MESES_EN = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]


export default function Reportes({ leads, vendedores }) {
  const { t, i18n } = useTranslation()
  const MESES = i18n.language?.startsWith('en') ? MESES_EN : MESES_ES
  const [vista, setVista] = useState('meses')
  const [mesSeleccionado, setMesSeleccionado] = useState(null)
  const [vendedorSeleccionado, setVendedorSeleccionado] = useState(null)

  const cerrados = leads.filter(l => l.estado === 'Cerrado' && l.fecha)
  const vName = id => vendedores.find(v => v.id === id)?.nombre || '-'

  function getMes(fecha) { return parseInt(fecha.slice(5, 7)) - 1 }
  function getAno(fecha) { return parseInt(fecha.slice(0, 4)) }

  const anos = [...new Set(cerrados.map(l => getAno(l.fecha)))].sort((a,b) => b - a)
  const [ano, setAno] = useState(new Date().getFullYear())

  const cerradosAno = cerrados.filter(l => getAno(l.fecha) === ano)

  const resumenMeses = MESES.map((nombre, i) => {
    const del = cerradosAno.filter(l => getMes(l.fecha) === i)
    return {
      mes: i,
      nombre,
      cantidad: del.length,
      total: del.reduce((s, l) => s + (Number(l.monto_cerrado) || 0), 0),
      comision: del.reduce((s, l) => s + (Number(l.comision) || 0), 0),
      eventos: del.sort((a,b) => a.fecha.localeCompare(b.fecha))
    }
  })

  const resumenVendedores = vendedores.map(v => {
    const sus = cerradosAno.filter(l => l.vendedor === v.id)
    const porMes = MESES.map((nombre, i) => {
      const del = sus.filter(l => getMes(l.fecha) === i)
      return {
        mes: i, nombre,
        cantidad: del.length,
        total: del.reduce((s,l) => s + (Number(l.monto_cerrado)||0), 0),
        comision: del.reduce((s,l) => s + (Number(l.comision)||0), 0),
        eventos: del.sort((a,b) => a.fecha.localeCompare(b.fecha))
      }
    }).filter(m => m.cantidad > 0)
    return {
      ...v,
      totalAno: sus.reduce((s,l) => s + (Number(l.monto_cerrado)||0), 0),
      comisionAno: sus.reduce((s,l) => s + (Number(l.comision)||0), 0),
      cantidadAno: sus.length,
      porMes
    }
  }).filter(v => v.cantidadAno > 0).sort((a,b) => b.totalAno - a.totalAno)

  return (
    <section className="view">
      <div className="page-head">
        <div><h1>{t('reportes.titulo')}</h1><p>{t('reportes.subtitulo')}</p></div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={ano} onChange={e => { setAno(Number(e.target.value)); setMesSeleccionado(null); setVendedorSeleccionado(null) }}
            style={{ background: 'var(--panel-solid)', border: '1px solid var(--border)', color: 'var(--text)', font: 'inherit', fontSize: 14, padding: '9px 12px', borderRadius: 'var(--radius-sm)' }}>
            {anos.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <button className={`btn ${vista === 'meses' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setVista('meses'); setMesSeleccionado(null) }}>
            Por mes
          </button>
          <button className={`btn ${vista === 'vendedores' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setVista('vendedores'); setVendedorSeleccionado(null) }}>
            Por vendedor
          </button>
        </div>
      </div>

      {vista === 'meses' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 12, marginBottom: 24 }}>
            {resumenMeses.map(m => (
              <div key={m.mes}
                onClick={() => setMesSeleccionado(mesSeleccionado === m.mes ? null : m.mes)}
                style={{
                  background: mesSeleccionado === m.mes ? 'rgba(168,85,247,.15)' : 'var(--panel)',
                  border: `1px solid ${mesSeleccionado === m.mes ? 'var(--purple)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)', padding: 16, cursor: 'pointer', transition: '.15s'
                }}>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
                  {m.nombre}
                </div>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 22, fontWeight: 700, color: 'var(--good)' }}>
                  {money(m.total)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                  {m.cantidad} {m.cantidad === 1 ? 'evento' : 'eventos'} · Comision: {money(m.comision)}
                </div>
                {m.cantidad > 0 && (
                  <div style={{ fontSize: 11, color: 'var(--purple)', marginTop: 6 }}>
                    {mesSeleccionado === m.mes ? 'Ocultar detalle ▲' : 'Ver detalle ▼'}
                  </div>
                )}
              </div>
            ))}
          </div>

          {mesSeleccionado !== null && resumenMeses[mesSeleccionado].cantidad > 0 && (
            <div>
              <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 20, marginBottom: 14, color: 'var(--purple)' }}>
                {resumenMeses[mesSeleccionado].nombre} {ano} — {resumenMeses[mesSeleccionado].cantidad} eventos
              </h2>
              <div className="table-wrap">
                <table>
                  <thead><tr>
                    <th>Cliente</th><th>Fecha</th><th>Hora</th><th>Paquete</th>
                    <th>Personas</th><th>Vendedor</th><th>Monto</th><th>Comision</th>
                  </tr></thead>
                  <tbody>
                    {resumenMeses[mesSeleccionado].eventos.map(l => (
                      <tr key={l.id}>
                        <td data-label="Cliente" className="strong">{l.nombre}</td>
                        <td data-label="Fecha">{fmtFecha(l.fecha)}</td>
                        <td data-label="Hora">{l.hora || '-'}</td>
                        <td data-label="Paquete"><span className="pkg-tag">{l.paquete}</span></td>
                        <td data-label="Personas">{l.personas}p</td>
                        <td data-label="Vendedor">{vName(l.vendedor)}</td>
                        <td data-label="Monto" style={{ color: 'var(--blue)', fontWeight: 600 }}>{money(l.monto_cerrado)}</td>
                        <td data-label="Comision" style={{ color: 'var(--good)', fontWeight: 600 }}>{money(l.comision)}</td>
                      </tr>
                    ))}
                    <tr style={{ borderTop: '2px solid var(--border)' }}>
                      <td colSpan={6} style={{ color: 'var(--muted)', fontSize: 12, padding: '12px 16px' }}>Total {resumenMeses[mesSeleccionado].cantidad} eventos</td>
                      <td style={{ color: 'var(--blue)', fontWeight: 700, padding: '12px 16px' }}>{money(resumenMeses[mesSeleccionado].total)}</td>
                      <td style={{ color: 'var(--good)', fontWeight: 700, padding: '12px 16px' }}>{money(resumenMeses[mesSeleccionado].comision)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {vista === 'vendedores' && (
        <div>
          <div className="table-wrap" style={{ marginBottom: 20 }}>
            <table>
              <thead><tr>
                <th>Vendedor</th><th>Eventos</th><th>Total vendido</th><th>Comision</th>
              </tr></thead>
              <tbody>
                {resumenVendedores.length === 0 ? (
                  <tr><td colSpan={4} className="empty">No hay ventas cerradas en {ano}.</td></tr>
                ) : resumenVendedores.map(v => (
                  <>
                    <tr key={v.id}
                      onClick={() => setVendedorSeleccionado(vendedorSeleccionado === v.id ? null : v.id)}
                      style={{ cursor: 'pointer', background: vendedorSeleccionado === v.id ? 'rgba(168,85,247,.08)' : '' }}>
                      <td data-label="Vendedor">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: 'var(--muted)', fontSize: 12 }}>{vendedorSeleccionado === v.id ? '▼' : '▶'}</span>
                          <strong>{v.nombre}</strong>
                        </div>
                      </td>
                      <td data-label="Eventos">{v.cantidadAno}</td>
                      <td data-label="Total" style={{ color: 'var(--blue)', fontWeight: 600 }}>{money(v.totalAno)}</td>
                      <td data-label="Comision" style={{ color: 'var(--good)', fontWeight: 600 }}>{money(v.comisionAno)}</td>
                    </tr>
                    {vendedorSeleccionado === v.id && (
                      <tr key={v.id + '-detail'}>
                        <td colSpan={4} style={{ padding: 0, background: 'rgba(140,108,255,.04)' }}>
                          {v.porMes.map(m => (
                            <div key={m.mes} style={{ borderBottom: '1px solid var(--border)', padding: '12px 24px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 15 }}>{m.nombre}</span>
                                <span style={{ display: 'flex', gap: 20 }}>
                                  <span style={{ color: 'var(--blue)', fontWeight: 600 }}>{money(m.total)}</span>
                                  <span style={{ color: 'var(--good)', fontWeight: 600 }}>{money(m.comision)}</span>
                                </span>
                              </div>
                              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                                <tbody>
                                  {m.eventos.map(l => (
                                    <tr key={l.id} style={{ borderBottom: '1px solid rgba(140,108,255,.06)' }}>
                                      <td style={{ padding: '6px 0', fontWeight: 600 }}>{l.nombre}</td>
                                      <td style={{ padding: '6px 8px', color: 'var(--muted)' }}>{fmtFecha(l.fecha)}</td>
                                      <td style={{ padding: '6px 8px' }}><span className="pkg-tag">{l.paquete}</span></td>
                                      <td style={{ padding: '6px 8px', color: 'var(--muted)' }}>{l.personas}p</td>
                                      <td style={{ padding: '6px 8px', color: 'var(--blue)', fontWeight: 600 }}>{money(l.monto_cerrado)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ))}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}
