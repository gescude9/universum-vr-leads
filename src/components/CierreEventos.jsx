import { useState } from 'react'
import { money, fmtFecha } from '../lib/helpers'

const MESES_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const MESES_CORTOS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

export default function CierreEventos({ leads, vendedores }) {
  const now = new Date()
  const [ano, setAno] = useState(now.getFullYear())
  const [vendedorAbierto, setVendedorAbierto] = useState(null)
  const [mesDesglose, setMesDesglose] = useState(null) // { vendedorId, mes }

  const cerrados = leads.filter(l => l.estado === 'Cerrado')
  const vName = id => vendedores.find(v => v.id === id)?.nombre || '-'

  function getFechaVenta(l) { return l.fecha_venta || l.fecha || '' }
  function getMes(l) { return parseInt(getFechaVenta(l).slice(5, 7)) - 1 }
  function getAno(l) { return parseInt(getFechaVenta(l).slice(0, 4)) }

  const anos = [...new Set(cerrados.map(l => getAno(l)).filter(Boolean))].sort((a, b) => b - a)
  if (anos.length === 0) anos.push(now.getFullYear())

  const cerradosAno = cerrados.filter(l => l.fecha_venta && getAno(l) === ano)

  // Tabla principal: vendedor × mes
  const filas = vendedores.map(v => {
    const suyos = cerradosAno.filter(l => l.vendedor === v.id)
    const porMes = MESES_ES.map((nombre, i) => {
      const del = suyos.filter(l => getMes(l) === i)
      return {
        mes: i,
        nombre,
        cantidad: del.length,
        total: del.reduce((s, l) => s + (Number(l.monto_cerrado) || 0), 0),
        comision: del.reduce((s, l) => s + (Number(l.comision) || 0), 0),
        eventos: del.sort((a, b) => getFechaVenta(a).localeCompare(getFechaVenta(b))),
      }
    })
    return {
      ...v,
      totalAno: suyos.reduce((s, l) => s + (Number(l.monto_cerrado) || 0), 0),
      cantidadAno: suyos.length,
      comisionAno: suyos.reduce((s, l) => s + (Number(l.comision) || 0), 0),
      porMes,
    }
  }).filter(v => v.cantidadAno > 0).sort((a, b) => b.cantidadAno - a.cantidadAno)

  // Totales por mes (para la fila de totales)
  const totalesMes = MESES_ES.map((_, i) => {
    const del = cerradosAno.filter(l => getMes(l) === i)
    return {
      cantidad: del.length,
      total: del.reduce((s, l) => s + (Number(l.monto_cerrado) || 0), 0),
    }
  })

  const totalGeneral = cerradosAno.reduce((s, l) => s + (Number(l.monto_cerrado) || 0), 0)
  const totalEventosAno = cerradosAno.length

  // Meses con al menos un evento
  const mesesActivos = MESES_ES.map((nombre, i) => ({
    mes: i, nombre,
    cantidad: cerradosAno.filter(l => getMes(l) === i).length,
  })).filter(m => m.cantidad > 0)

  function toggleVendedor(id) {
    if (vendedorAbierto === id) {
      setVendedorAbierto(null)
      setMesDesglose(null)
    } else {
      setVendedorAbierto(id)
      setMesDesglose(null)
    }
  }

  function toggleMes(vendedorId, mes) {
    const key = `${vendedorId}-${mes}`
    const curr = mesDesglose === key ? null : key
    setMesDesglose(curr)
  }

  return (
    <section className="view">
      {/* Encabezado */}
      <div className="page-head">
        <div>
          <h1>🏆 Cierre de Eventos</h1>
          <p>Eventos cerrados por vendedor y mes</p>
        </div>
        <select value={ano} onChange={e => { setAno(Number(e.target.value)); setVendedorAbierto(null); setMesDesglose(null) }}
          style={{ background: 'var(--panel-solid)', border: '1px solid var(--border)', color: 'var(--text)', font: 'inherit', fontSize: 14, padding: '9px 12px', borderRadius: 'var(--radius-sm)' }}>
          {anos.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: 12, marginBottom: 24 }}>
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 6 }}>Total eventos {ano}</div>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 28, fontWeight: 700 }}>{totalEventosAno}</div>
        </div>
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 6 }}>Total vendido {ano}</div>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 28, fontWeight: 700, color: 'var(--good)' }}>{money(totalGeneral)}</div>
        </div>
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 6 }}>Vendedores activos</div>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 28, fontWeight: 700, color: 'var(--blue)' }}>{filas.length}</div>
        </div>
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 6 }}>Mejor mes</div>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 22, fontWeight: 700, color: 'var(--purple)' }}>
            {mesesActivos.length > 0
              ? MESES_CORTOS[mesesActivos.sort((a,b) => b.cantidad - a.cantidad)[0].mes]
              : '—'}
          </div>
          {mesesActivos.length > 0 && (
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
              {mesesActivos.sort((a,b) => b.cantidad - a.cantidad)[0].cantidad} eventos
            </div>
          )}
        </div>
      </div>

      {filas.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <div>No hay eventos cerrados en {ano}</div>
        </div>
      ) : (
        <>
          {/* Tabla resumen por vendedor */}
          <div style={{ marginBottom: 10, fontSize: 13, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
            Resumen anual por vendedor
          </div>
          <div className="table-wrap" style={{ marginBottom: 32 }}>
            <table>
              <thead>
                <tr>
                  <th>Vendedor</th>
                  {mesesActivos.map(m => (
                    <th key={m.mes} style={{ textAlign: 'center', minWidth: 60 }}>{MESES_CORTOS[m.mes]}</th>
                  ))}
                  <th style={{ textAlign: 'center' }}>Total</th>
                  <th style={{ textAlign: 'right' }}>Monto</th>
                </tr>
              </thead>
              <tbody>
                {filas.map(v => (
                  <>
                    <tr key={v.id}
                      onClick={() => toggleVendedor(v.id)}
                      style={{ cursor: 'pointer', background: vendedorAbierto === v.id ? 'rgba(168,85,247,.08)' : '' }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: 'var(--muted)', fontSize: 11 }}>{vendedorAbierto === v.id ? '▼' : '▶'}</span>
                          <strong>{v.nombre}</strong>
                        </div>
                      </td>
                      {mesesActivos.map(m => {
                        const pm = v.porMes[m.mes]
                        return (
                          <td key={m.mes} style={{ textAlign: 'center' }}>
                            {pm.cantidad > 0 ? (
                              <span style={{
                                display: 'inline-block',
                                background: 'rgba(140,108,255,.15)',
                                color: 'var(--purple)',
                                fontFamily: 'Space Grotesk, sans-serif',
                                fontWeight: 700,
                                fontSize: 15,
                                borderRadius: 6,
                                padding: '2px 10px',
                                minWidth: 32,
                              }}>{pm.cantidad}</span>
                            ) : (
                              <span style={{ color: 'rgba(255,255,255,.15)', fontSize: 13 }}>—</span>
                            )}
                          </td>
                        )
                      })}
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          background: 'rgba(99,179,237,.18)',
                          color: 'var(--blue)',
                          fontFamily: 'Space Grotesk, sans-serif',
                          fontWeight: 700,
                          fontSize: 16,
                          borderRadius: 6,
                          padding: '2px 12px',
                        }}>{v.cantidadAno}</span>
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--good)', fontWeight: 600 }}>{money(v.totalAno)}</td>
                    </tr>

                    {/* Desglose por mes del vendedor */}
                    {vendedorAbierto === v.id && (
                      <tr key={v.id + '-det'}>
                        <td colSpan={mesesActivos.length + 3} style={{ padding: 0, background: 'rgba(140,108,255,.03)' }}>
                          <div style={{ padding: '12px 24px 16px' }}>
                            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                              Desglose mensual — {v.nombre}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: 10 }}>
                              {v.porMes.filter(m => m.cantidad > 0).map(m => (
                                <div key={m.mes}
                                  onClick={e => { e.stopPropagation(); toggleMes(v.id, m.mes) }}
                                  style={{
                                    background: mesDesglose === `${v.id}-${m.mes}` ? 'rgba(168,85,247,.12)' : 'var(--panel)',
                                    border: `1px solid ${mesDesglose === `${v.id}-${m.mes}` ? 'var(--purple)' : 'var(--border)'}`,
                                    borderRadius: 'var(--radius-sm)',
                                    padding: '12px 14px',
                                    cursor: 'pointer',
                                    transition: '.12s',
                                  }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 14 }}>{m.nombre}</span>
                                    <span style={{
                                      background: 'rgba(140,108,255,.2)',
                                      color: 'var(--purple)',
                                      fontWeight: 700,
                                      fontSize: 18,
                                      borderRadius: 6,
                                      padding: '0 10px',
                                    }}>{m.cantidad}</span>
                                  </div>
                                  <div style={{ fontSize: 13, color: 'var(--good)', fontWeight: 600, marginTop: 6 }}>{money(m.total)}</div>
                                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Comisión: {money(m.comision)}</div>
                                  <div style={{ fontSize: 11, color: 'var(--purple)', marginTop: 6 }}>
                                    {mesDesglose === `${v.id}-${m.mes}` ? '▲ Ocultar eventos' : '▼ Ver eventos'}
                                  </div>

                                  {/* Lista de eventos del mes */}
                                  {mesDesglose === `${v.id}-${m.mes}` && (
                                    <div style={{ marginTop: 10, borderTop: '1px solid var(--border)', paddingTop: 10 }}
                                      onClick={e => e.stopPropagation()}>
                                      {m.eventos.map(l => (
                                        <div key={l.id} style={{
                                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                          padding: '6px 0', borderBottom: '1px solid rgba(140,108,255,.06)',
                                          fontSize: 12,
                                        }}>
                                          <div>
                                            <div style={{ fontWeight: 600, color: 'var(--text)' }}>{l.nombre}</div>
                                            <div style={{ color: 'var(--muted)', fontSize: 11, marginTop: 1 }}>
                                              {fmtFecha(l.fecha_venta || l.fecha)} · <span className="pkg-tag" style={{ fontSize: 10, padding: '1px 5px' }}>{l.paquete}</span> · {l.personas}p
                                            </div>
                                          </div>
                                          <div style={{ textAlign: 'right' }}>
                                            <div style={{ color: 'var(--blue)', fontWeight: 600 }}>{money(l.monto_cerrado)}</div>
                                            <div style={{ color: 'var(--good)', fontSize: 11 }}>{money(l.comision)}</div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}

                {/* Fila de totales */}
                <tr style={{ borderTop: '2px solid var(--border)', fontWeight: 600, background: 'rgba(140,108,255,.06)' }}>
                  <td style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 700 }}>TOTAL</td>
                  {mesesActivos.map(m => (
                    <td key={m.mes} style={{ textAlign: 'center' }}>
                      {totalesMes[m.mes].cantidad > 0 ? (
                        <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: 'var(--text)' }}>
                          {totalesMes[m.mes].cantidad}
                        </span>
                      ) : '—'}
                    </td>
                  ))}
                  <td style={{ textAlign: 'center', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color: 'var(--blue)', fontSize: 16 }}>
                    {totalEventosAno}
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--good)', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700 }}>
                    {money(totalGeneral)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Ranking de vendedores */}
          <div style={{ marginBottom: 10, fontSize: 13, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
            Ranking {ano}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 12 }}>
            {filas.map((v, idx) => (
              <div key={v.id} className="card" style={{ padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
                <div style={{
                  position: 'absolute', top: 10, right: 14,
                  fontFamily: 'Space Grotesk, sans-serif', fontSize: 36, fontWeight: 900,
                  color: idx === 0 ? 'rgba(255,215,0,.15)' : idx === 1 ? 'rgba(192,192,192,.15)' : idx === 2 ? 'rgba(205,127,50,.15)' : 'rgba(140,108,255,.07)',
                  lineHeight: 1,
                }}>{idx + 1}</div>
                <div style={{ fontSize: 11, color: idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : 'var(--muted)', fontWeight: 700, marginBottom: 4 }}>
                  {idx === 0 ? '🥇 1er lugar' : idx === 1 ? '🥈 2do lugar' : idx === 2 ? '🥉 3er lugar' : `#${idx + 1}`}
                </div>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{v.nombre}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div>
                    <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 26, fontWeight: 700, color: 'var(--blue)', lineHeight: 1 }}>{v.cantidadAno}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>eventos</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: 'var(--good)', fontWeight: 600, fontSize: 14 }}>{money(v.totalAno)}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>comisión: {money(v.comisionAno)}</div>
                  </div>
                </div>
                {/* Mini barra de progreso relativa al primero */}
                <div style={{ marginTop: 10, height: 3, background: 'var(--border)', borderRadius: 2 }}>
                  <div style={{
                    height: '100%', borderRadius: 2,
                    width: `${filas[0].cantidadAno > 0 ? Math.round(v.cantidadAno / filas[0].cantidadAno * 100) : 0}%`,
                    background: idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : 'var(--purple)',
                    transition: 'width .4s',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
