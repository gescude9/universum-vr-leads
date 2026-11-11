import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { money, fmtFecha } from '../lib/helpers'
import { supabase } from '../supabaseClient'

const MESES_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const MESES_EN = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function Reportes({ leads, vendedores, extras, prereservas }) {
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

  const extrasArr = extras || []
  const prereservasArr = prereservas || []

  const anos = [...new Set([
    ...cerrados.map(l => getAno(l)).filter(Boolean),
    ...ventasManuales.map(v => v.ano),
    ...extrasArr.map(e => e.ano),
    ...prereservasArr.map(p => p.ano),
  ])].sort((a,b) => b - a)

  const cerradosAno = cerrados.filter(l => l.fecha_venta && getAno(l) === ano)
  const extrasAno = extrasArr.filter(e => e.ano === ano)
  const prereservasAno = prereservasArr.filter(p => p.ano === ano)

  const hoyMes = new Date().getMonth()
  const hoyAno = new Date().getFullYear()

  const resumenMeses = MESES.map((nombre, i) => {
    const manual = ventasManuales.find(v => v.mes === i + 1 && v.ano === ano)
    const totalManual = manual ? Number(manual.total) : 0
    const esMesActual = i === hoyMes && ano === hoyAno

    const extrasDelMes = extrasAno.filter(e => e.mes === i + 1)
    const totalExtras = extrasDelMes.reduce((s, e) => s + (Number(e.monto) || 0), 0)

    const prereservasDelMes = prereservasAno.filter(p => p.mes === i + 1)
    const totalPrereservas = prereservasDelMes.reduce((s, p) => s + (Number(p.monto) || 0), 0)

    if (manual) {
      const del = esMesActual ? cerradosAno.filter(l => getMes(l) === i) : []
      const totalSistema = del.reduce((s, l) => s + (Number(l.monto_cerrado) || 0), 0)
      return {
        mes: i, nombre, cantidad: del.length,
        totalSistema, totalManual, totalExtras, totalPrereservas,
        total: totalManual + totalSistema + totalExtras + totalPrereservas,
        comision: del.reduce((s, l) => s + (Number(l.comision) || 0), 0),
        esManual: true, notas: manual.notas || '',
        eventos: del.sort((a,b) => getFechaVenta(a).localeCompare(getFechaVenta(b))),
        extras: extrasDelMes,
        prereservas: prereservasDelMes,
      }
    }
    const del = cerradosAno.filter(l => getMes(l) === i)
    const totalSistema = del.reduce((s, l) => s + (Number(l.monto_cerrado) || 0), 0)
    return {
      mes: i, nombre, cantidad: del.length,
      totalSistema, totalManual: 0, totalExtras, totalPrereservas,
      total: totalSistema + totalExtras + totalPrereservas,
      comision: del.reduce((s, l) => s + (Number(l.comision) || 0), 0),
      esManual: false, notas: '',
      eventos: del.sort((a,b) => getFechaVenta(a).localeCompare(getFechaVenta(b))),
      extras: extrasDelMes,
      prereservas: prereservasDelMes,
    }
  }).filter(m => m.total > 0 || m.cantidad > 0)

  // Resumen por vendedor: incluye extras y prereservas
  const resumenVendedores = vendedores.map(v => {
    const sus = cerradosAno.filter(l => l.vendedor === v.id)
    const susExtras = extrasAno.filter(e => e.vendedor === v.id)
    const susPrereservas = prereservasAno.filter(p => p.vendedor === v.id)

    const porMes = MESES.map((nombre, i) => {
      const del = sus.filter(l => getMes(l) === i)
      const delExtras = susExtras.filter(e => e.mes === i + 1)
      const delPrereservas = susPrereservas.filter(p => p.mes === i + 1)
      const totalLeads = del.reduce((s,l) => s+(Number(l.monto_cerrado)||0),0)
      const totalExtrasM = delExtras.reduce((s,e) => s+(Number(e.monto)||0),0)
      const totalPrereservasM = delPrereservas.reduce((s,p) => s+(Number(p.monto)||0),0)
      return {
        mes: i, nombre,
        cantidad: del.length,
        total: totalLeads + totalExtrasM + totalPrereservasM,
        totalLeads,
        totalExtras: totalExtrasM,
        totalPrereservas: totalPrereservasM,
        comision: del.reduce((s,l) => s+(Number(l.comision)||0),0),
        eventos: del.sort((a,b) => getFechaVenta(a).localeCompare(getFechaVenta(b))),
        extras: delExtras,
        prereservas: delPrereservas,
      }
    }).filter(m => m.cantidad > 0 || m.extras.length > 0 || m.prereservas.length > 0)

    const totalLeadsAno = sus.reduce((s,l) => s+(Number(l.monto_cerrado)||0),0)
    const totalExtrasAno = susExtras.reduce((s,e) => s+(Number(e.monto)||0),0)
    const totalPrereservasAno = susPrereservas.reduce((s,p) => s+(Number(p.monto)||0),0)
    return {
      ...v,
      totalAno: totalLeadsAno + totalExtrasAno + totalPrereservasAno,
      totalLeadsAno,
      totalExtrasAno,
      totalPrereservasAno,
      comisionAno: sus.reduce((s,l) => s+(Number(l.comision)||0),0),
      cantidadAno: sus.length,
      cantidadExtrasAno: susExtras.length,
      cantidadPrereservasAno: susPrereservas.length,
      porMes
    }
  }).filter(v => v.cantidadAno > 0 || v.cantidadExtrasAno > 0 || v.cantidadPrereservasAno > 0).sort((a,b) => b.totalAno - a.totalAno)

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
                onClick={() => (!m.esManual || m.totalExtras > 0 || m.totalPrereservas > 0 || (m.esManual && m.cantidad > 0)) && seleccionarMes(m.mes)}
                style={{
                  background: mesSeleccionado === m.mes ? 'rgba(168,85,247,.15)' : 'var(--panel)',
                  border: `1px solid ${mesSeleccionado === m.mes ? 'var(--purple)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)', padding: 16,
                  cursor: 'pointer', transition: '.15s'
                }}>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 15, marginBottom: 8 }}>
                  {m.nombre}
                  {m.esManual && <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 6, background: 'rgba(140,108,255,.15)', padding: '2px 6px', borderRadius: 4 }}>histórico</span>}
                </div>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 22, fontWeight: 700, color: 'var(--good)' }}>
                  {money(m.total)}
                </div>
                {m.totalExtras > 0 && (
                  <div style={{ fontSize: 11, color: 'var(--purple)', marginTop: 3 }}>
                    + {money(m.totalExtras)} en extras
                  </div>
                )}
                {m.totalPrereservas > 0 && (
                  <div style={{ fontSize: 11, color: 'var(--blue)', marginTop: 3 }}>
                    + {money(m.totalPrereservas)} en pre-reservas
                  </div>
                )}
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                  {m.esManual ? m.notas : `${m.cantidad} ${m.cantidad === 1 ? 'evento' : 'eventos'} · ${money(m.comision)}`}
                </div>
                <div style={{ fontSize: 11, color: 'var(--purple)', marginTop: 6 }}>
                  {mesSeleccionado === m.mes ? t('reportes.ocultarDetalle') : t('reportes.verDetalle')}
                </div>
              </div>
            ))}
          </div>

          <div id="detalle-mes"></div>
          {mesSeleccionado !== null && (() => {
            const m = resumenMeses.find(m => m.mes === mesSeleccionado)
            if (!m) return null
            const tieneDetalle = m.cantidad > 0 || m.extras.length > 0 || m.prereservas.length > 0
            if (!tieneDetalle) return null
            return (
              <div>
                <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 20, marginBottom: 14, color: 'var(--purple)' }}>
                  {m.nombre} {ano}
                </h2>

                {/* Tabla leads del sistema */}
                {m.cantidad > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                      Cumpleaños ({m.cantidad})
                    </div>
                    <div className="table-wrap">
                      <table>
                        <thead><tr>
                          <th>Cliente</th><th>Fecha venta</th><th>Fecha evento</th><th>Paquete</th>
                          <th>Personas</th><th>Vendedor</th><th>Monto</th><th>Comision</th>
                        </tr></thead>
                        <tbody>
                          {m.eventos.map(l => (
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
                              Total {m.cantidad} eventos
                            </td>
                            <td style={{ color: 'var(--blue)', fontWeight: 700, padding: '12px 16px' }}>
                              {money(m.totalSistema)}
                            </td>
                            <td style={{ color: 'var(--good)', fontWeight: 700, padding: '12px 16px' }}>
                              {money(m.comision)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Tabla extras */}
                {m.extras.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                      ⚡ Extras ({m.extras.length})
                    </div>
                    <div className="table-wrap">
                      <table>
                        <thead><tr>
                          <th>Nombre / Descripción</th><th>Vendedor</th><th>Monto</th><th>Notas</th>
                        </tr></thead>
                        <tbody>
                          {m.extras.map(e => (
                            <tr key={e.id}>
                              <td data-label="Nombre" className="strong">
                                <span style={{ background: 'rgba(168,85,247,.12)', color: 'var(--purple)', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, marginRight: 6 }}>EXTRA</span>
                                {e.nombre}
                              </td>
                              <td data-label="Vendedor">{vName(e.vendedor)}</td>
                              <td data-label="Monto" style={{ color: 'var(--blue)', fontWeight: 600 }}>{money(e.monto)}</td>
                              <td data-label="Notas" style={{ color: 'var(--muted)', fontSize: 12 }}>{e.notas || '-'}</td>
                            </tr>
                          ))}
                          <tr style={{ borderTop: '2px solid var(--border)' }}>
                            <td colSpan={2} style={{ color: 'var(--muted)', fontSize: 12, padding: '12px 16px' }}>
                              Total {m.extras.length} extras
                            </td>
                            <td style={{ color: 'var(--blue)', fontWeight: 700, padding: '12px 16px' }}>
                              {money(m.totalExtras)}
                            </td>
                            <td></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Tabla pre-reservas */}
                {m.prereservas.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                      📋 Pre-reservas ({m.prereservas.length})
                    </div>
                    <div className="table-wrap">
                      <table>
                        <thead><tr>
                          <th>Cliente</th><th>Experiencia</th><th>Personas</th><th>Vendedor</th><th>Monto</th><th>Notas</th>
                        </tr></thead>
                        <tbody>
                          {m.prereservas.map(p => (
                            <tr key={p.id}>
                              <td data-label="Cliente" className="strong">
                                <span style={{ background: 'rgba(99,179,237,.12)', color: 'var(--blue)', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, marginRight: 6 }}>PRE</span>
                                {p.nombre}
                              </td>
                              <td data-label="Experiencia"><span className="pkg-tag">{p.experiencia}</span></td>
                              <td data-label="Personas">{p.personas}p</td>
                              <td data-label="Vendedor">{vName(p.vendedor)}</td>
                              <td data-label="Monto" style={{ color: 'var(--blue)', fontWeight: 600 }}>{money(p.monto)}</td>
                              <td data-label="Notas" style={{ color: 'var(--muted)', fontSize: 12 }}>{p.notas || '-'}</td>
                            </tr>
                          ))}
                          <tr style={{ borderTop: '2px solid var(--border)' }}>
                            <td colSpan={4} style={{ color: 'var(--muted)', fontSize: 12, padding: '12px 16px' }}>
                              Total {m.prereservas.length} pre-reservas
                            </td>
                            <td style={{ color: 'var(--blue)', fontWeight: 700, padding: '12px 16px' }}>
                              {money(m.totalPrereservas)}
                            </td>
                            <td></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Desglose por vendedor — solo octubre en adelante (mes >= 9) */}
                {m.mes >= 9 && !m.esManual && (m.cantidad > 0 || m.extras.length > 0 || m.prereservas.length > 0) && (() => {
                  const porVend = vendedores.map(v => {
                    const suyos = m.eventos.filter(l => l.vendedor === v.id)
                    const susExtras = m.extras.filter(e => e.vendedor === v.id)
                    const susPrereservas = m.prereservas.filter(p => p.vendedor === v.id)
                    if (suyos.length === 0 && susExtras.length === 0 && susPrereservas.length === 0) return null
                    return {
                      ...v,
                      eventos: suyos,
                      extras: susExtras,
                      prereservas: susPrereservas,
                      cantidad: suyos.length,
                      total: suyos.reduce((s,l) => s+(Number(l.monto_cerrado)||0),0)
                           + susExtras.reduce((s,e) => s+(Number(e.monto)||0),0)
                           + susPrereservas.reduce((s,p) => s+(Number(p.monto)||0),0),
                      comision: suyos.reduce((s,l) => s+(Number(l.comision)||0),0),
                    }
                  }).filter(Boolean).sort((a,b) => b.cantidad - a.cantidad)

                  if (porVend.length === 0) return null
                  return (
                    <div style={{ marginTop: 24 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                        Desglose por vendedor
                      </div>
                      <div className="table-wrap">
                        <table>
                          <thead><tr>
                            <th>Vendedor</th><th style={{ textAlign: 'center' }}>Eventos</th><th>Total vendido</th><th>Comisión</th>
                          </tr></thead>
                          <tbody>
                            {porVend.map(v => (
                              <>
                                <tr key={v.id}>
                                  <td className="strong">{v.nombre}</td>
                                  <td style={{ textAlign: 'center' }}>
                                    <span style={{ background: 'rgba(140,108,255,.15)', color: 'var(--purple)', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 15, borderRadius: 6, padding: '2px 10px' }}>
                                      {v.cantidad}
                                    </span>
                                  </td>
                                  <td style={{ color: 'var(--blue)', fontWeight: 600 }}>{money(v.total)}</td>
                                  <td style={{ color: 'var(--good)', fontWeight: 600 }}>{money(v.comision)}</td>
                                </tr>
                                {v.eventos.map(l => (
                                  <tr key={l.id} style={{ background: 'rgba(140,108,255,.03)' }}>
                                    <td style={{ paddingLeft: 28, color: 'var(--muted)', fontSize: 12 }}>↳ {l.nombre}</td>
                                    <td style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>{fmtFecha(l.fecha_venta || l.fecha)}</td>
                                    <td style={{ color: 'var(--blue)', fontSize: 12 }}>{money(l.monto_cerrado)}</td>
                                    <td style={{ color: 'var(--good)', fontSize: 12 }}>{money(l.comision)}</td>
                                  </tr>
                                ))}
                                {v.extras.map(e => (
                                  <tr key={e.id} style={{ background: 'rgba(168,85,247,.04)' }}>
                                    <td style={{ paddingLeft: 28, color: 'var(--muted)', fontSize: 12 }}>
                                      <span style={{ background: 'rgba(168,85,247,.15)', color: 'var(--purple)', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3, marginRight: 5 }}>EXTRA</span>
                                      {e.nombre}
                                    </td>
                                    <td style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>—</td>
                                    <td style={{ color: 'var(--blue)', fontSize: 12 }}>{money(e.monto)}</td>
                                    <td></td>
                                  </tr>
                                ))}
                                {v.prereservas.map(p => (
                                  <tr key={p.id} style={{ background: 'rgba(99,179,237,.04)' }}>
                                    <td style={{ paddingLeft: 28, color: 'var(--muted)', fontSize: 12 }}>
                                      <span style={{ background: 'rgba(99,179,237,.15)', color: 'var(--blue)', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3, marginRight: 5 }}>PRE</span>
                                      {p.nombre}
                                    </td>
                                    <td style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>{p.experiencia}</td>
                                    <td style={{ color: 'var(--blue)', fontSize: 12 }}>{money(p.monto)}</td>
                                    <td></td>
                                  </tr>
                                ))}
                              </>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                })()}
              </div>
            )
          })()}
        </div>
      )}

      {vista === 'vendedores' && (
        <div>
          <div className="table-wrap" style={{ marginBottom: 20 }}>
            <table>
              <thead><tr>
                <th>Vendedor</th><th>Eventos</th><th>Extras</th><th>Pre-reservas</th><th>Total vendido</th><th>Comision</th>
              </tr></thead>
              <tbody>
                {resumenVendedores.length === 0 ? (
                  <tr><td colSpan={6} className="empty">No hay ventas cerradas en {ano}.</td></tr>
                ) : resumenVendedores.map(v => (
                  <>
                    <tr key={v.id}
                      onClick={() => seleccionarVendedor(v.id)}
                      style={{ cursor: 'pointer', background: vendedorSeleccionado === v.id ? 'rgba(168,85,247,.08)' : '' }}>
                      <td data-label="Vendedor">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: 'var(--muted)', fontSize: 12 }}>{vendedorSeleccionado === v.id ? '▼' : '▶'}</span>
                          <strong>{v.nombre}</strong>
                        </div>
                      </td>
                      <td data-label="Eventos">{v.cantidadAno}</td>
                      <td data-label="Extras">
                        {v.cantidadExtrasAno > 0
                          ? <span style={{ color: 'var(--purple)', fontWeight: 600 }}>{v.cantidadExtrasAno} <span style={{ fontSize: 11, fontWeight: 400 }}>({money(v.totalExtrasAno)})</span></span>
                          : <span style={{ color: 'var(--muted)' }}>—</span>}
                      </td>
                      <td data-label="Pre-reservas">
                        {v.cantidadPrereservasAno > 0
                          ? <span style={{ color: 'var(--blue)', fontWeight: 600 }}>{v.cantidadPrereservasAno} <span style={{ fontSize: 11, fontWeight: 400 }}>({money(v.totalPrereservasAno)})</span></span>
                          : <span style={{ color: 'var(--muted)' }}>—</span>}
                      </td>
                      <td data-label="Total" style={{ color: 'var(--blue)', fontWeight: 600 }}>{money(v.totalAno)}</td>
                      <td data-label="Comision" style={{ color: 'var(--good)', fontWeight: 600 }}>{money(v.comisionAno)}</td>
                    </tr>
                    {vendedorSeleccionado === v.id && (
                      <tr key={v.id + '-detail'} id="detalle-vendedor">
                        <td colSpan={6} style={{ padding: 0, background: 'rgba(140,108,255,.04)' }}>
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
                                  {m.extras.map(e => (
                                    <tr key={e.id} style={{ borderBottom: '1px solid rgba(140,108,255,.06)', background: 'rgba(168,85,247,.04)' }}>
                                      <td style={{ padding: '6px 0', fontWeight: 600 }}>
                                        <span style={{ background: 'rgba(168,85,247,.15)', color: 'var(--purple)', fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 3, marginRight: 5 }}>EXTRA</span>
                                        {e.nombre}
                                      </td>
                                      <td style={{ padding: '6px 8px', color: 'var(--muted)', fontSize: 11 }}>{e.notas || '—'}</td>
                                      <td colSpan={2}></td>
                                      <td style={{ padding: '6px 8px', color: 'var(--blue)', fontWeight: 600 }}>{money(e.monto)}</td>
                                    </tr>
                                  ))}
                                  {m.prereservas.map(p => (
                                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(99,179,237,.06)', background: 'rgba(99,179,237,.04)' }}>
                                      <td style={{ padding: '6px 0', fontWeight: 600 }}>
                                        <span style={{ background: 'rgba(99,179,237,.15)', color: 'var(--blue)', fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 3, marginRight: 5 }}>PRE</span>
                                        {p.nombre}
                                      </td>
                                      <td style={{ padding: '6px 8px', color: 'var(--muted)', fontSize: 11 }}>{p.experiencia}</td>
                                      <td colSpan={2}></td>
                                      <td style={{ padding: '6px 8px', color: 'var(--blue)', fontWeight: 600 }}>{money(p.monto)}</td>
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
