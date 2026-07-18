import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { money, fmtFecha } from '../lib/helpers'
import { supabase } from '../supabaseClient'

const MESES_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const MESES_EN = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function Reportes({ leads, vendedores }) {
  const { t, i18n } = useTranslation()
  const MESES = i18n.language?.startsWith('en') ? MESES_EN : MESES_ES

  const [vista, setVista] = useState('meses')
  const [mesSeleccionado, setMesSeleccionado] = useState(null)
  const [vendedorSeleccionado, setVendedorSeleccionado] = useState(null)
  const [ventasManuales, setVentasManuales] = useState([])
  const [ano, setAno] = useState(new Date().getFullYear())

  useEffect(() => {
    supabase.from('ventas_manuales').select('*').then(({ data }) => {
      if (data) setVentasManuales(data)
    })
  }, [])

  const cerrados = leads.filter(l => l.estado === 'Cerrado')
  const vName = id => vendedores.find(v => v.id === id)?.nombre || '-'

  function getFechaVenta(lead) { return lead.fecha_venta || lead.fecha || '' }
  function getMes(lead) { return parseInt(getFechaVenta(lead).slice(5, 7)) - 1 }
  function getAno(lead) { return parseInt(getFechaVenta(lead).slice(0, 4)) }

  const anos = [...new Set([
    ...cerrados.map(l => getAno(l)).filter(Boolean),
    ...ventasManuales.map(v => v.ano)
  ])].sort((a,b) => b - a)

  const cerradosAno = cerrados.filter(l => l.fecha_venta && getAno(l) === ano)

  const hoyMes = new Date().getMonth()
  const hoyAno = new Date().getFullYear()

  const resumenMeses = MESES.map((nombre, i) => {
    const manual = ventasManuales.find(v => v.mes === i + 1 && v.ano === ano)
    const totalManual = manual ? Number(manual.total) : 0
    const esMesActual = i === hoyMes && ano === hoyAno

    if (manual) {
      const del = esMesActual ? cerradosAno.filter(l => getMes(l) === i) : []
      const totalSistema = del.reduce((s, l) => s + (Number(l.monto_cerrado) || 0), 0)
      return {
        mes: i, nombre, cantidad: del.length,
        totalSistema, totalManual,
        total: totalManual + totalSistema,
        comision: del.reduce((s, l) => s + (Number(l.comision) || 0), 0),
        esManual: true, notas: manual.notas || '',
        eventos: del.sort((a,b) => getFechaVenta(a).localeCompare(getFechaVenta(b)))
      }
    }
    const del = cerradosAno.filter(l => getMes(l) === i)
    const totalSistema = del.reduce((s, l) => s + (Number(l.monto_cerrado) || 0), 0)
    return {
      mes: i, nombre, cantidad: del.length,
      totalSistema, totalManual: 0, total: totalSistema,
      comision: del.reduce((s, l) => s + (Number(l.comision) || 0), 0),
      esManual: false, notas: '',
      eventos: del.sort((a,b) => getFechaVenta(a).localeCompare(getFechaVenta(b)))
    }
  }).filter(m => m.total > 0 || m.cantidad > 0)

  const resumenVendedores = vendedores.map(v => {
    const sus = cerradosAno.filter(l => l.vendedor === v.id)
    const porMes = MESES.map((nombre, i) => {
      const del = sus.filter(l => getMes(l) === i)
      return {
        mes: i, nombre,
        cantidad: del.length,
        total: del.reduce((s,l) => s+(Number(l.monto_cerrado)||0),0),
        comision: del.reduce((s,l) => s+(Number(l.comision)||0),0),
        eventos: del.sort((a,b) => getFechaVenta(a).localeCompare(getFechaVenta(b)))
      }
    }).filter(m => m.cantidad > 0)
    return {
      ...v,
      totalAno: sus.reduce((s,l) => s+(Number(l.monto_cerrado)||0),0),
      comisionAno: sus.reduce((s,l) => s+(Number(l.comision)||0),0),
      cantidadAno: sus.length,
      porMes
    }
  }).filter(v => v.cantidadAno > 0).sort((a,b) => b.totalAno - a.totalAno)

  function seleccionarMes(mes) {
    setMesSeleccionado(mesSeleccionado === mes ? null : mes)
    if (mesSeleccionado !== mes) {
      setTimeout(() => {
        const el = document.getElementById('detalle-mes')
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 50)
    }
  }

  function seleccionarVendedor(id) {
    setVendedorSeleccionado(vendedorSeleccionado === id ? null : id)
    if (vendedorSeleccionado !== id) {
      setTimeout(() => {
        const el = document.getElementById('detalle-vendedor')
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 50)
    }
  }

  const totalAno = resumenMeses.reduce((s,m) => s + m.total, 0)

  return (
    <section className="view">
      <div className="page-head">
        <div>
          <h1>{t('reportes.titulo')}</h1>
          <p>{t('reportes.subtitulo')}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={ano} onChange={e => { setAno(Number(e.target.value)); setMesSeleccionado(null); setVendedorSeleccionado(null) }}
            style={{ background: 'var(--panel-solid)', border: '1px solid var(--border)', color: 'var(--text)', font: 'inherit', fontSize: 14, padding: '9px 12px', borderRadius: 'var(--radius-sm)' }}>
            {anos.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <button className={`btn ${vista === 'meses' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setVista('meses'); setMesSeleccionado(null) }}>
            {t('reportes.porMes')}
          </button>
          <button className={`btn ${vista === 'vendedores' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setVista('vendedores'); setVendedorSeleccionado(null) }}>
            {t('reportes.porVendedor')}
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: 'var(--muted)', fontSize: 13 }}>Total vendido {ano}</div>
        <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 28, fontWeight: 700, color: 'var(--good)' }}>{money(totalAno)}</div>
      </div>

      {vista === 'meses' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: 12, marginBottom: 24 }}>
            {resumenMeses.map(m => (
              <div key={m.mes}
                onClick={() => !m.esManual && seleccionarMes(m.mes)}
                style={{
                  background: mesSeleccionado === m.mes ? 'rgba(168,85,247,.15)' : 'var(--panel)',
                  border: `1px solid ${mesSeleccionado === m.mes ? 'var(--purple)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)', padding: 16,
                  cursor: m.esManual ? 'default' : 'pointer', transition: '.15s'
                }}>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 15, marginBottom: 8 }}>
                  {m.nombre}
                  {m.esManual && <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 6, background: 'rgba(140,108,255,.15)', padding: '2px 6px', borderRadius: 4 }}>historico</span>}
                </div>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 22, fontWeight: 700, color: 'var(--good)' }}>
                  {money(m.total)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                  {m.esManual ? m.notas : `${m.cantidad} ${m.cantidad === 1 ? 'evento' : 'eventos'} - ${money(m.comision)}`}
                </div>
                {!m.esManual && m.cantidad > 0 && (
                  <div style={{ fontSize: 11, color: 'var(--purple)', marginTop: 6 }}>
                    {mesSeleccionado === m.mes ? t('reportes.ocultarDetalle') : t('reportes.verDetalle')}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div id="detalle-mes"></div>
          {mesSeleccionado !== null && resumenMeses.find(m => m.mes === mesSeleccionado)?.cantidad > 0 && (
            <div>
              <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 20, marginBottom: 14, color: 'var(--purple)' }}>
                {resumenMeses.find(m => m.mes === mesSeleccionado)?.nombre} {ano}
              </h2>
              <div className="table-wrap">
                <table>
                  <thead><tr>
                    <th>Cliente</th><th>Fecha venta</th><th>Fecha evento</th><th>Paquete</th>
                    <th>Personas</th><th>Vendedor</th><th>Monto</th><th>Comision</th>
                  </tr></thead>
                  <tbody>
                    {resumenMeses.find(m => m.mes === mesSeleccionado)?.eventos.map(l => (
                      <tr key={l.id}>
                        <td data-label="Cliente" className="strong">{l.nombre}</td>
                        <td data-label="Fecha venta" style={{ color: 'var(--blue)' }}>{fmtFecha(l.fecha_venta || l.fecha)}</td>
                        <td data-label="Fecha evento" style={{ color: 'var(--muted)' }}>{fmtFecha(l.fecha)}</td>
                        <td data-label="Paquete"><span className="pkg-tag">{l.paquete}</span></td>
                        <td data-label="Personas">{l.personas}p</td>
                        <td data-label="Vendedor">{vName(l.vendedor)}</td>
                        <td data-label="Monto" style={{ color: 'var(--blue)', fontWeight: 600 }}>{money(l.monto_cerrado)}</td>
                        <td data-label="Comision" style={{ color: 'var(--good)', fontWeight: 600 }}>{money(l.comision)}</td>
                      </tr>
                    ))}
                    <tr style={{ borderTop: '2px solid var(--border)' }}>
                      <td colSpan={6} style={{ color: 'var(--muted)', fontSize: 12, padding: '12px 16px' }}>
                        Total {resumenMeses.find(m => m.mes === mesSeleccionado)?.cantidad} eventos
                      </td>
                      <td style={{ color: 'var(--blue)', fontWeight: 700, padding: '12px 16px' }}>
                        {money(resumenMeses.find(m => m.mes === mesSeleccionado)?.totalSistema)}
                      </td>
                      <td style={{ color: 'var(--good)', fontWeight: 700, padding: '12px 16px' }}>
                        {money(resumenMeses.find(m => m.mes === mesSeleccionado)?.comision)}
                      </td>
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
                      onClick={() => seleccionarVendedor(v.id)}
                      style={{ cursor: 'pointer', background: vendedorSeleccionado === v.id ? 'rgba(168,85,247,.08)' : '' }}>
                      <td data-label="Vendedor">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: 'var(--muted)', fontSize: 12 }}>{vendedorSeleccionado === v.id ? 'v' : '>'}</span>
                          <strong>{v.nombre}</strong>
                        </div>
                      </td>
                      <td data-label="Eventos">{v.cantidadAno}</td>
                      <td data-label="Total" style={{ color: 'var(--blue)', fontWeight: 600 }}>{money(v.totalAno)}</td>
                      <td data-label="Comision" style={{ color: 'var(--good)', fontWeight: 600 }}>{money(v.comisionAno)}</td>
                    </tr>
                    {vendedorSeleccionado === v.id && (
                      <tr key={v.id + '-detail'} id="detalle-vendedor">
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
                                      <td style={{ padding: '6px 8px', color: 'var(--blue)' }}>{fmtFecha(l.fecha_venta || l.fecha)}</td>
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
