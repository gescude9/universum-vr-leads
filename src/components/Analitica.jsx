import { useMemo, useState, useRef, useEffect } from 'react'
import { money } from '../lib/helpers'

const DIAS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const PALETTE = ['#a855f7','#10b981','#f59e0b','#06b6d4','#ef4444','#6366f1','#ec4899','#3b82f6']

function DonutChart({ data, size = 160, thickness = 32, centerLabel = '', centerSub = '', onClickSlice }) {
  const [hovered, setHovered] = useState(null)
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Sin datos aún</p>
  const r = (size - thickness) / 2
  const cx = size / 2, cy = size / 2
  const circumference = 2 * Math.PI * r
  let offset = 0
  const segments = data.map((d, i) => {
    const pct = d.value / total
    const dash = pct * circumference
    const seg = { ...d, pct, dash, offset, color: d.color || PALETTE[i % PALETTE.length] }
    offset += dash
    return seg
  })
  const hov = hovered !== null ? segments[hovered] : null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {segments.map((s, i) => (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={s.color}
              strokeWidth={hovered === i ? thickness + 5 : thickness}
              strokeDasharray={`${s.dash} ${circumference - s.dash}`}
              strokeDashoffset={-s.offset}
              style={{ cursor: 'pointer', transition: 'stroke-width .15s' }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onClickSlice && onClickSlice(s)}
            />
          ))}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          {hov ? (
            <>
              <span style={{ fontSize: 20, fontWeight: 800, color: hov.color, fontFamily: 'Space Grotesk,sans-serif' }}>{Math.round(hov.pct * 100)}%</span>
              <span style={{ fontSize: 10, color: 'var(--muted)', textAlign: 'center', maxWidth: 60, lineHeight: 1.2 }}>{hov.label}</span>
            </>
          ) : (
            <>
              <span style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Space Grotesk,sans-serif', color: 'var(--text)' }}>{centerLabel}</span>
              <span style={{ fontSize: 10, color: 'var(--muted)' }}>{centerSub}</span>
            </>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1, minWidth: 90 }}>
        {segments.map((s, i) => (
          <div key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} onClick={() => onClickSlice && onClickSlice(s)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', opacity: hovered !== null && hovered !== i ? 0.35 : 1, transition: 'opacity .15s' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--text)', flex: 1 }}>{s.label}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>

    </div>
  )
}

function HBar({ data, color = '#a855f7', format = v => v, onClickItem }) {
  const [hov, setHov] = useState(null)
  const max = Math.max(...data.map(d => d.value), 1)
  if (!data.length) return <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center' }}>Sin datos</p>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: onClickItem && d.leads?.length ? 'pointer' : 'default' }}
          onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} onClick={() => onClickItem && onClickItem(d)}>
          <span style={{ width: 52, fontSize: 11, color: 'var(--muted)', textAlign: 'right', flexShrink: 0 }}>{d.label}</span>
          <div style={{ flex: 1, height: 24, background: 'rgba(255,255,255,.05)', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(d.value / max) * 100}%`, background: d.color || color, borderRadius: 6, transition: 'width .7s cubic-bezier(.4,0,.2,1)', opacity: hov !== null && hov !== i ? 0.3 : 1 }} />
          </div>
          <span style={{ width: 44, fontSize: 11, fontWeight: 700, color: d.color || color, textAlign: 'right', flexShrink: 0 }}>{format(d.value)}</span>
        </div>
      ))}
    </div>
  )
}

function VBar({ data, color = '#6366f1', onClickItem }) {
  const [hov, setHov] = useState(null)
  const max = Math.max(...data.map(d => d.value), 1)
  if (!data.length) return <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center' }}>Sin datos</p>
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 130, paddingTop: 16 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', position: 'relative', cursor: 'pointer' }}
          onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} onClick={() => onClickItem && onClickItem(d)}>
          {hov === i && (
            <div style={{ position: 'absolute', top: -26, left: '50%', transform: 'translateX(-50%)', background: '#1e1b4b', border: '1px solid rgba(255,255,255,.12)', borderRadius: 5, padding: '2px 7px', fontSize: 11, fontWeight: 700, color: d.color || color, whiteSpace: 'nowrap', zIndex: 10 }}>
              {d.value}
            </div>
          )}
          <div style={{ width: '75%', maxWidth: 32, height: `${Math.max((d.value / max) * 100, d.value > 0 ? 3 : 0)}%`, background: d.color || color, borderRadius: '4px 4px 0 0', transition: 'height .6s cubic-bezier(.4,0,.2,1)', opacity: hov !== null && hov !== i ? 0.3 : 1 }} />
          <span style={{ fontSize: 9, color: 'var(--muted)', marginTop: 3 }}>{d.label}</span>
        </div>
      ))}
    </div>
  )
}

function TrendLine({ data, color = '#10b981', onClickPoint, format }) {
  const [hov, setHov] = useState(null)
  const W = 100, H = 55
  const max = Math.max(...data.map(d => d.value), 1)
  const pts = data.map((d, i) => ({ x: (i / (data.length - 1)) * W, y: H - (d.value / max) * H * 0.82 - 3, ...d }))
  const poly = pts.map(p => `${p.x},${p.y}`).join(' ')
  const area = `${pts[0].x},${H} ` + poly + ` ${pts[pts.length - 1].x},${H}`
  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 100 ${H}`} style={{ width: '100%', height: 110, overflow: 'visible' }} preserveAspectRatio="none">
        <defs>
          <linearGradient id={`tg-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity=".25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill={`url(#tg-${color})`} />
        <polyline points={poly} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={hov === i ? 2.5 : 1.5} fill={color}
            style={{ cursor: 'pointer', transition: 'r .1s' }}
            onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} onClick={() => onClickPoint && onClickPoint(data[i])} />
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: -6 }}>
        {data.filter((_, i) => i % 3 === 0 || i === data.length - 1).map((d, i) => (
          <span key={i} style={{ fontSize: 9, color: 'var(--muted)' }}>{d.label}</span>
        ))}
      </div>
      {hov !== null && (
        <div style={{ position: 'absolute', top: 0, left: `${pts[hov].x}%`, transform: 'translateX(-50%)', background: '#1e1b4b', border: '1px solid rgba(255,255,255,.12)', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, color, pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 10 }}>
          {data[hov].label}: {format ? format(data[hov].value) : data[hov].value}
        </div>
      )}
    </div>
  )
}

function KPI({ value, label, color, icon, sub, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
      style={{
        background: hov ? `${color}11` : 'var(--panel)',
        border: `1px solid ${hov ? color : 'var(--border)'}`,
        borderRadius: 16, padding: '20px 18px',
        display: 'flex', flexDirection: 'column', gap: 2,
        transition: 'all .18s', cursor: onClick ? 'pointer' : 'default',
        boxShadow: hov ? `0 4px 24px -6px ${color}55` : 'none',
      }}>
      <div style={{ fontSize: 26, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600, marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{sub}</div>}
    </div>
  )
}

function Card({ title, icon, children, wide }) {
  return (
    <div style={{
      background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 16,
      padding: '20px', gridColumn: wide ? '1 / -1' : undefined,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{title}</span>
      </div>
      {children}
    </div>
  )
}

function VendedorPerf({ vendedores, money }) {
  const [sel, setSel] = useState(null) // { vid, mi }

  const toggle = (vid, mi) => {
    if (sel && sel.vid === vid && sel.mi === mi) setSel(null)
    else setSel({ vid, mi })
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
      {vendedores.map((v) => {
        const maxVal = Math.max(...v.porMes.map(m => m.value), 1)
        const selMes = sel && sel.vid === v.id ? v.porMes[sel.mi] : null
        return (
          <div key={v.id} style={{ background: 'rgba(255,255,255,.03)', border: `1px solid ${v.color}33`, borderRadius: 12, padding: '16px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: v.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', color: v.color, fontWeight: 800, fontSize: 14, fontFamily: 'Space Grotesk,sans-serif' }}>
                  {v.nombre.charAt(0)}
                </div>
                <span style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{v.nombre}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 16, fontWeight: 800, color: v.color }}>${Math.round(v.totalAno).toLocaleString()}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)' }}>{v.totalEventos} eventos · ${Math.round(v.totalComision).toLocaleString()} comisión</div>
              </div>
            </div>

            {/* Barras clicables */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 60 }}>
              {v.porMes.map((m, mi) => {
                const isActive = sel && sel.vid === v.id && sel.mi === mi
                return (
                  <div key={mi}
                    onClick={() => m.eventos > 0 && toggle(v.id, mi)}
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', cursor: m.eventos > 0 ? 'pointer' : 'default' }}
                    title={`${m.label}: $${Math.round(m.value).toLocaleString()} · ${m.eventos} eventos`}>
                    <div style={{
                      width: '80%',
                      height: `${Math.max((m.value / maxVal) * 100, m.value > 0 ? 4 : 0)}%`,
                      background: isActive ? v.color : v.color + 'bb',
                      borderRadius: isActive ? '3px 3px 0 0' : '3px 3px 0 0',
                      outline: isActive ? `2px solid ${v.color}` : 'none',
                      transition: 'all .2s',
                    }} />
                    <span style={{ fontSize: 8, color: isActive ? v.color : 'var(--muted)', fontWeight: isActive ? 700 : 400, marginTop: 2 }}>{m.label}</span>
                  </div>
                )
              })}
            </div>

            {/* Valores debajo */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              {v.porMes.map((m, mi) => (
                <span key={mi} style={{ flex: 1, fontSize: 8, color: m.value > 0 ? v.color : 'transparent', textAlign: 'center', fontWeight: 700 }}>
                  {m.value > 0 ? `$${(m.value/1000).toFixed(0)}k` : '·'}
                </span>
              ))}
            </div>

            {/* Desglose al hacer click */}
            {selMes && selMes.leadsDetalle && selMes.leadsDetalle.length > 0 && (
              <div style={{ marginTop: 12, borderTop: `1px solid ${v.color}33`, paddingTop: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: v.color, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  {selMes.label} · {selMes.eventos} evento{selMes.eventos !== 1 ? 's' : ''} · ${Math.round(selMes.value).toLocaleString()}
                </div>
                {selMes.leadsDetalle.map(l => (
                  <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{l.nombre}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)' }}>{l.fecha || ''} {l.hora ? '· ' + l.hora.slice(0,5) : ''} {l.personas ? '· ' + l.personas + 'p' : ''}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)' }}>{money(l.monto_cerrado)}</div>
                      <div style={{ fontSize: 10, color: 'var(--good)' }}>{money(l.comision)} com.</div>
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, marginTop: 2 }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>Total comisión {selMes.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--good)' }}>{money(selMes.comision)}</div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function Analitica({ leads = [], vendedores = [], prereservas = [] }) {
  const cerrados = useMemo(() =>
    leads.filter(l => l.estado === 'Cerrado' && l.fecha && l.hora), [leads])

  const grupoDist = useMemo(() => {
    const c = {}
    cerrados.forEach(l => { const p = Number(l.personas) || 0; if (p > 0) c[p] = (c[p] || 0) + 1 })
    return Object.entries(c).map(([p, v]) => ({ label: `${p}p`, value: v, leads: cerrados.filter(l => (Number(l.personas)||0) === Number(p)) })).sort((a, b) => b.value - a.value).slice(0, 8)
  }, [cerrados])

  const horariosDist = useMemo(() => {
    const c = {}
    cerrados.forEach(l => { if (!l.hora) return; const h = l.hora.substring(0, 5); c[h] = (c[h] || 0) + 1 })
    return Object.entries(c).map(([h, v]) => ({ label: h, value: v, leads: cerrados.filter(l => l.hora && l.hora.substring(0,5) === h) })).sort((a, b) => b.value - a.value).slice(0, 8)
  }, [cerrados])

  const diasDist = useMemo(() => {
    const c = [0, 0, 0, 0, 0, 0, 0]
    cerrados.forEach(l => { if (l.fecha) c[new Date(l.fecha + 'T12:00:00').getDay()]++ })
    return DIAS_SHORT.map((label, i) => ({ label, value: c[i], color: i === 0 || i === 6 ? '#a855f7' : '#6366f1', leads: cerrados.filter(l => l.fecha && new Date(l.fecha+'T12:00:00').getDay()===i) }))
  }, [cerrados])

  const paquetesDist = useMemo(() => {
    const c = {}
    cerrados.forEach(l => { const k = l.paquete || 'Sin paquete'; c[k] = (c[k] || 0) + 1 })
    return Object.entries(c).map(([label, value]) => ({ label, value,
      leads: cerrados.filter(l => (l.paquete||'Sin paquete') === label)
    })).sort((a, b) => b.value - a.value)
  }, [cerrados])

  const ticketPorGrupo = useMemo(() => {
    const m = {}
    cerrados.forEach(l => {
      const p = Number(l.personas) || 0; if (p <= 0) return
      const b = p <= 5 ? '1-5p' : p <= 10 ? '6-10p' : p <= 15 ? '11-15p' : p <= 20 ? '16-20p' : '21+p'
      const midP = p <= 5 ? 3 : p <= 10 ? 8 : p <= 15 ? 13 : p <= 20 ? 18 : 25
      const o = p <= 5 ? 1 : p <= 10 ? 2 : p <= 15 ? 3 : p <= 20 ? 4 : 5
      if (!m[b]) m[b] = { sum: 0, sumP: 0, count: 0, order: o, midP }
      const v = Number(l.monto_cerrado) || Number(l.monto_estimado) || 0
      if (v > 0) { m[b].sum += v; m[b].sumP += v / p; m[b].count++ }
    })
    return Object.entries(m)
      .map(([label, { sum, sumP, count, order, midP }]) => ({
        label, order, midP,
        avg: count > 0 ? Math.round(sum / count) : 0,
        avgPerPerson: count > 0 ? Math.round(sumP / count) : 0,
        count
      }))
      .filter(d => d.avg > 0).sort((a, b) => a.order - b.order)
  }, [cerrados])

  const tendencia = useMemo(() => {
    const now = new Date(), months = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({ year: d.getFullYear(), month: d.getMonth(), label: MESES[d.getMonth()], value: 0, leads: [] })
    }
    cerrados.forEach(l => {
      const d = new Date(l.fecha + 'T12:00:00')
      const m = months.find(x => x.year === d.getFullYear() && x.month === d.getMonth())
      if (m) { m.value++; m.leads.push(l) }
    })
    return months
  }, [cerrados])

  const tendenciaIngresos = useMemo(() => {
    const now = new Date(), months = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({ year: d.getFullYear(), month: d.getMonth(), label: MESES[d.getMonth()], value: 0, leads: [] })
    }
    cerrados.forEach(l => {
      const d = new Date(l.fecha + 'T12:00:00')
      const m = months.find(x => x.year === d.getFullYear() && x.month === d.getMonth())
      if (m) { m.value += Number(l.monto_cerrado) || 0; m.leads.push(l) }
    })
    return months
  }, [cerrados])

  const recurrentes = useMemo(() => {
    const m = {}
    leads.filter(l => l.telefono && l.telefono.length > 4 && l.telefono !== '123' && l.telefono !== '321').forEach(l => {
      if (!m[l.telefono]) m[l.telefono] = { nombre: l.nombre, visitas: 0 }
      m[l.telefono].visitas++; m[l.telefono].nombre = l.nombre
    })
    return Object.values(m).filter(c => c.visitas > 1).sort((a, b) => b.visitas - a.visitas).slice(0, 8)
  }, [leads])

  // Performance vendedores por mes (año completo)
  const perfVendedores = useMemo(() => {
    const now = new Date()
    const months = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({ year: d.getFullYear(), month: d.getMonth(), label: MESES[d.getMonth()] })
    }
    return vendedores.map((v, vi) => {
      const color = PALETTE[vi % PALETTE.length]
      const porMes = months.map(m => {
        const leadsM = cerrados.filter(l => {
          if (l.vendedor !== v.id) return false
          const d = new Date(l.fecha + 'T12:00:00')
          return d.getFullYear() === m.year && d.getMonth() === m.month
        })
        const preM = prereservas.filter(p => {
          if (p.vendedor !== v.id) return false
          return p.ano === m.year && p.mes === m.month + 1
        })
        const totalLeads = leadsM.reduce((s, l) => s + (Number(l.monto_cerrado) || 0), 0)
        const totalPre = preM.reduce((s, p) => s + (Number(p.monto) || 0), 0)
        return {
          label: m.label,
          value: totalLeads + totalPre,
          eventos: leadsM.length,
          comision: leadsM.reduce((s, l) => s + (Number(l.comision) || 0), 0),
          leadsDetalle: leadsM.sort((a,b) => (a.fecha||'').localeCompare(b.fecha||'')),
        }
      })
      const totalAno = porMes.reduce((s, m) => s + m.value, 0)
      const totalEventos = porMes.reduce((s, m) => s + m.eventos, 0)
      const totalComision = porMes.reduce((s, m) => s + m.comision, 0)
      return { ...v, color, porMes, totalAno, totalEventos, totalComision }
    }).filter(v => v.totalAno > 0 || v.totalEventos > 0)
      .sort((a, b) => b.totalAno - a.totalAno)
  }, [cerrados, vendedores, prereservas])

  const [filtroActivo, setFiltroActivo] = useState(null) // { titulo, leads }
  const desglosRef = useRef(null)

  useEffect(() => {
    if (filtroActivo && desglosRef.current) {
      setTimeout(() => desglosRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    }
  }, [filtroActivo])

  const totalCerrados = cerrados.length
  const leadsSab = cerrados.filter(l => l.fecha && new Date(l.fecha+'T12:00:00').getDay() === 6)
  const leadsDom = cerrados.filter(l => l.fecha && new Date(l.fecha+'T12:00:00').getDay() === 0)
  const pctSab = totalCerrados > 0 ? Math.round((leadsSab.length / totalCerrados) * 100) : 0
  const pctDom = totalCerrados > 0 ? Math.round((leadsDom.length / totalCerrados) * 100) : 0
  const ingresoTotal = cerrados.reduce((s, l) => s + (Number(l.monto_cerrado) || 0), 0)
  const horaPico = horariosDist[0]?.label || '—'
  const grupoPico = grupoDist[0]?.label || '—'

  return (
    <div style={{ paddingBottom: 40 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 26, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
          📊 Analítica
        </h2>
        <span style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4, display: 'block' }}>
          {totalCerrados} eventos · datos en tiempo real
        </span>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        <KPI icon="🎉" value={totalCerrados} label="Eventos cerrados" color="#a855f7" sub="cumpleaños completados"
          onClick={() => cerrados.length && setFiltroActivo({ titulo: `🎉 Todos los eventos · ${cerrados.length} eventos`, leads: cerrados })} />
        <KPI icon="⏰" value={horaPico} label="Horario estrella" color="#6366f1" sub="hora más popular"
          onClick={() => horariosDist[0]?.leads?.length && setFiltroActivo({ titulo: `⏰ ${horaPico} · ${horariosDist[0].leads.length} eventos`, leads: horariosDist[0].leads })} />
        <KPI icon="👥" value={grupoPico} label="Grupo más común" color="#3b82f6" sub="personas por evento"
          onClick={() => grupoDist[0]?.leads?.length && setFiltroActivo({ titulo: `👥 Grupos de ${grupoPico} · ${grupoDist[0].leads.length} eventos`, leads: grupoDist[0].leads })} />
        <KPI icon="🗓️" value={`${pctSab}%`} label="Sábados" color="#06b6d4" sub={`${leadsSab.length} eventos`}
          onClick={() => leadsSab.length && setFiltroActivo({ titulo: `🗓️ Sábados · ${leadsSab.length} eventos`, leads: leadsSab })} />
        <KPI icon="🗓️" value={`${pctDom}%`} label="Domingos" color="#8b5cf6" sub={`${leadsDom.length} eventos`}
          onClick={() => leadsDom.length && setFiltroActivo({ titulo: `🗓️ Domingos · ${leadsDom.length} eventos`, leads: leadsDom })} />
        <KPI icon="💰" value={`$${Math.round(ingresoTotal).toLocaleString()}`} label="Ingresos totales" color="#10b981" sub="leads cerrados"
          onClick={() => cerrados.length && setFiltroActivo({ titulo: `💰 Ingresos totales · ${cerrados.length} eventos`, leads: [...cerrados].sort((a,b) => (Number(b.monto_cerrado)||0)-(Number(a.monto_cerrado)||0)) })} />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        <Card title="Distribución de paquetes" icon="🎮">
          <DonutChart data={paquetesDist} centerLabel={totalCerrados} centerSub="eventos" onClickSlice={d => d.leads?.length && setFiltroActivo({ titulo: `🎮 ${d.label} · ${d.leads.length} eventos`, leads: d.leads })} />
        </Card>
        <Card title="Días de la semana" icon="📅">
          <VBar data={diasDist} onClickItem={d => d.leads?.length && setFiltroActivo({ titulo: `📅 ${d.label} · ${d.leads.length} eventos`, leads: d.leads })} />
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8, margin: '8px 0 0' }}>
            Fin de semana = <strong style={{ color: '#a855f7' }}>{pctSab + pctDom}%</strong> del negocio
          </p>
        </Card>
        <Card title="Ingresos por mes · últimos 12 meses" icon="💰" wide>
          <TrendLine data={tendenciaIngresos} color="#f59e0b" format={v => `$${Math.round(v/1000)}k`} onClickPoint={d => d.leads?.length && setFiltroActivo({ titulo: `💰 ${d.label} · ${d.leads.length} eventos`, leads: d.leads.sort((a,b) => (Number(b.monto_cerrado)||0)-(Number(a.monto_cerrado)||0)) })} />
        </Card>
        <Card title="Eventos por mes · últimos 12 meses" icon="📈" wide>
          <TrendLine data={tendencia} color="#10b981" onClickPoint={d => d.leads?.length && setFiltroActivo({ titulo: `📅 ${d.label} · ${d.leads.length} eventos`, leads: d.leads })} />
        </Card>
        <Card title="Horarios pico" icon="⏰">
          <HBar data={horariosDist} color="#06b6d4" onClickItem={d => d.leads?.length && setFiltroActivo({ titulo: `🕐 ${d.label} · ${d.leads.length} eventos`, leads: d.leads })} />
        </Card>
        <Card title="Tamaño de grupo" icon="👥">
          <HBar data={grupoDist} color="#a855f7" onClickItem={d => d.leads?.length && setFiltroActivo({ titulo: `👥 Grupos de ${d.label} · ${d.leads.length} eventos`, leads: d.leads })} />
        </Card>
        <Card title="Ticket promedio por grupo" icon="💰">
          {ticketPorGrupo.length > 0 ? (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>Las barras muestran el ticket total por evento · el número pequeño es por persona</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {ticketPorGrupo.map((d, i) => {
                  const maxAvg = Math.max(...ticketPorGrupo.map(x => x.avg), 1)
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 48, fontSize: 11, color: 'var(--muted)', textAlign: 'right', flexShrink: 0 }}>{d.label}</span>
                      <div style={{ flex: 1, height: 28, background: 'rgba(255,255,255,.05)', borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
                        <div style={{ height: '100%', width: `${(d.avg / maxAvg) * 100}%`, background: 'linear-gradient(90deg,#f59e0b,#fbbf24)', borderRadius: 6, transition: 'width .7s cubic-bezier(.4,0,.2,1)' }} />
                        <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: 'rgba(255,255,255,.5)' }}>
                          ${d.avgPerPerson.toLocaleString()}/persona
                        </span>
                      </div>
                      <span style={{ width: 60, fontSize: 12, fontWeight: 700, color: '#f59e0b', textAlign: 'right', flexShrink: 0 }}>${d.avg.toLocaleString()}</span>
                    </div>
                  )
                })}
              </div>
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 10 }}>
                💡 Ticket total = monto del evento · <span style={{ color: '#fbbf24' }}>$/persona</span> = rentabilidad por cabeza
              </p>
            </>
          ) : (
            <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Sin datos de monto suficientes</p>
          )}
        </Card>
        {/* Performance vendedores */}
        {perfVendedores.length > 0 && (
          <Card title="Performance por vendedor · últimos 12 meses" icon="🏆" wide>
            <VendedorPerf vendedores={perfVendedores} money={money} />
          </Card>
        )}

        <Card title="Clientes recurrentes" icon="🔄" wide>
          {recurrentes.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 10 }}>
              {recurrentes.map((c, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, background: PALETTE[i % PALETTE.length] + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', color: PALETTE[i % PALETTE.length], fontWeight: 800, fontSize: 16, fontFamily: 'Space Grotesk,sans-serif' }}>
                    {c.visitas}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{c.nombre}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{c.visitas} visitas</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No hay clientes con más de una reserva aún</p>
          )}
        </Card>
      </div>

      {/* Panel de desglose al hacer click en gráficas */}
      {filtroActivo && (
        <div ref={desglosRef} style={{ marginTop: 24, background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
              {filtroActivo.titulo}
            </span>
            <button onClick={() => setFiltroActivo(null)} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>✕</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
            {(filtroActivo.leads || []).sort((a,b) => (a.fecha||'').localeCompare(b.fecha||'')).map(l => (
              <div key={l.id} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.nombre}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                    {l.fecha || ''}{l.hora ? ' · ' + l.hora.slice(0,5) : ''}{l.personas ? ' · ' + l.personas + 'p' : ''}{l.paquete ? ' · ' + l.paquete : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6' }}>{money(l.monto_cerrado)}</div>
                  <div style={{ fontSize: 10, color: '#10b981' }}>{money(l.comision)} com.</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div><span style={{ fontSize: 11, color: 'var(--muted)' }}>Total vendido </span><span style={{ fontSize: 14, fontWeight: 800, color: '#3b82f6' }}>{money((filtroActivo.leads||[]).reduce((s,l)=>s+(Number(l.monto_cerrado)||0),0))}</span></div>
            <div><span style={{ fontSize: 11, color: 'var(--muted)' }}>Total comisión </span><span style={{ fontSize: 14, fontWeight: 800, color: '#10b981' }}>{money((filtroActivo.leads||[]).reduce((s,l)=>s+(Number(l.comision)||0),0))}</span></div>
            <div><span style={{ fontSize: 11, color: 'var(--muted)' }}>Personas promedio </span><span style={{ fontSize: 14, fontWeight: 800, color: '#a855f7' }}>{Math.round((filtroActivo.leads||[]).reduce((s,l)=>s+(Number(l.personas)||0),0)/Math.max((filtroActivo.leads||[]).length,1))}p</span></div>
          </div>
        </div>
      )}
    </div>
  )
}
