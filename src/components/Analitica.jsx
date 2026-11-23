import { useMemo, useState, useRef, useEffect } from 'react'

const DIAS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

const PALETTE = [
  '#a855f7','#6366f1','#3b82f6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899',
]

// ── Donut Chart SVG ──────────────────────────────────────────────────────────
function DonutChart({ data, size = 180, thickness = 36, centerLabel = '', centerSub = '' }) {
  const [hovered, setHovered] = useState(null)
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return <p className="ana-empty">Sin datos aún</p>

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
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {segments.map((s, i) => (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={hovered === i ? thickness + 4 : thickness}
              strokeDasharray={`${s.dash} ${circumference - s.dash}`}
              strokeDashoffset={-s.offset}
              style={{ cursor: 'pointer', transition: 'stroke-width .15s' }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none'
        }}>
          {hov ? (
            <>
              <span style={{ fontSize: 22, fontWeight: 800, color: hov.color, fontFamily: 'Space Grotesk,sans-serif' }}>
                {Math.round(hov.pct * 100)}%
              </span>
              <span style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', maxWidth: 70, lineHeight: 1.2 }}>
                {hov.label}
              </span>
            </>
          ) : (
            <>
              <span style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Space Grotesk,sans-serif', color: 'var(--text)' }}>{centerLabel}</span>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>{centerSub}</span>
            </>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 100 }}>
        {segments.map((s, i) => (
          <div key={i}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
              opacity: hovered !== null && hovered !== i ? 0.4 : 1,
              transition: 'opacity .15s'
            }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'var(--text)', flex: 1 }}>{s.label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Bar Chart con tooltip ────────────────────────────────────────────────────
function BarChartV2({ data, color = '#a855f7', format = v => v, horizontal = false }) {
  const [hov, setHov] = useState(null)
  const max = Math.max(...data.map(d => d.value), 1)
  if (data.length === 0) return <p className="ana-empty">Sin datos aún</p>

  if (horizontal) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}
            onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}>
            <span style={{ width: 60, fontSize: 12, color: 'var(--muted)', textAlign: 'right', flexShrink: 0 }}>{d.label}</span>
            <div style={{ flex: 1, height: 28, background: 'rgba(255,255,255,.04)', borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
              <div style={{
                height: '100%',
                width: `${(d.value / max) * 100}%`,
                background: d.color || color,
                borderRadius: 6,
                transition: 'width .6s cubic-bezier(.4,0,.2,1)',
                opacity: hov !== null && hov !== i ? 0.4 : 1,
              }} />
              {hov === i && (
                <span style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 11, fontWeight: 700, color: '#fff', pointerEvents: 'none'
                }}>{format(d.value)}</span>
              )}
            </div>
            <span style={{ width: 36, fontSize: 12, fontWeight: 700, color: d.color || color, textAlign: 'right', flexShrink: 0 }}>
              {format(d.value)}
            </span>
          </div>
        ))}
      </div>
    )
  }

  // Vertical
  const barW = Math.max(20, Math.min(44, Math.floor(260 / data.length) - 6))
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 160, paddingTop: 20 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', position: 'relative' }}
          onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}>
          {hov === i && (
            <div style={{
              position: 'absolute', top: -32, left: '50%', transform: 'translateX(-50%)',
              background: 'var(--panel-solid)', border: '1px solid var(--border)', borderRadius: 6,
              padding: '3px 8px', fontSize: 11, fontWeight: 700, color: d.color || color, whiteSpace: 'nowrap', zIndex: 10
            }}>
              {format(d.value)}
            </div>
          )}
          <div style={{
            width: '80%', maxWidth: barW,
            height: `${(d.value / max) * 100}%`,
            minHeight: d.value > 0 ? 4 : 0,
            background: d.color || color,
            borderRadius: '4px 4px 0 0',
            transition: 'height .6s cubic-bezier(.4,0,.2,1)',
            opacity: hov !== null && hov !== i ? 0.35 : 1,
            cursor: 'pointer'
          }} />
          <span style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4, textAlign: 'center' }}>{d.label}</span>
        </div>
      ))}
    </div>
  )
}

// ── Trend Line SVG ────────────────────────────────────────────────────────────
function TrendLine({ data, color = '#10b981' }) {
  const [hov, setHov] = useState(null)
  const W = 100, H = 60
  const max = Math.max(...data.map(d => d.value), 1)
  const pts = data.map((d, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - (d.value / max) * H * 0.85 - 4,
    ...d
  }))
  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ')
  const area = `${pts[0].x},${H} ` + pts.map(p => `${p.x},${p.y}`).join(' ') + ` ${pts[pts.length-1].x},${H}`

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 100 ${H}`} style={{ width: '100%', height: 120, overflow: 'visible' }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="lg1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity=".3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#lg1)" />
        <polyline points={polyline} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={hov === i ? 2 : 1.5}
            fill={color}
            style={{ cursor: 'pointer', transition: 'r .1s' }}
            onMouseEnter={() => setHov(i)}
            onMouseLeave={() => setHov(null)}
          />
        ))}
      </svg>
      {/* Labels eje X */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: -4 }}>
        {data.filter((_, i) => i % 3 === 0 || i === data.length - 1).map((d, i) => (
          <span key={i} style={{ fontSize: 10, color: 'var(--muted)' }}>{d.label}</span>
        ))}
      </div>
      {/* Tooltip */}
      {hov !== null && (
        <div style={{
          position: 'absolute', top: 0,
          left: `${pts[hov].x}%`, transform: 'translateX(-50%)',
          background: 'var(--panel-solid)', border: '1px solid var(--border)',
          borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 700,
          color, pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 10
        }}>
          {data[hov].label}: {data[hov].value} eventos
        </div>
      )}
    </div>
  )
}

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KPI({ value, label, color = 'var(--purple)', icon }) {
  return (
    <div className="ana-kpi">
      <div className="ana-kpi-icon">{icon}</div>
      <div className="ana-kpi-val" style={{ color }}>{value}</div>
      <div className="ana-kpi-label">{label}</div>
    </div>
  )
}

// ── Card wrapper ──────────────────────────────────────────────────────────────
function Card({ title, icon, children, wide }) {
  return (
    <div className={`ana-card2 ${wide ? 'ana-card-wide' : ''}`}>
      <div className="ana-card2-head">
        <span style={{ fontSize: 18 }}>{icon}</span>
        <h3 className="ana-card2-title">{title}</h3>
      </div>
      <div className="ana-card2-body">{children}</div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
export default function Analitica({ leads = [] }) {
  const cerrados = useMemo(() =>
    leads.filter(l => l.estado === 'Cerrado' && l.fecha && l.hora), [leads])

  // 1. Distribución grupos
  const grupoDist = useMemo(() => {
    const counts = {}
    cerrados.forEach(l => {
      const p = Number(l.personas) || 0
      if (p > 0) counts[p] = (counts[p] || 0) + 1
    })
    return Object.entries(counts)
      .map(([p, c]) => ({ label: `${p}p`, value: c }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }, [cerrados])

  // 2. Horarios
  const horariosDist = useMemo(() => {
    const counts = {}
    cerrados.forEach(l => {
      if (!l.hora) return
      const h = l.hora.substring(0, 5)
      counts[h] = (counts[h] || 0) + 1
    })
    return Object.entries(counts)
      .map(([h, c]) => ({ label: h, value: c }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }, [cerrados])

  // 3. Días semana
  const diasDist = useMemo(() => {
    const counts = [0,0,0,0,0,0,0]
    cerrados.forEach(l => {
      if (!l.fecha) return
      counts[new Date(l.fecha + 'T12:00:00').getDay()]++
    })
    return DIAS_SHORT.map((label, i) => ({ label, value: counts[i], color: i === 0 || i === 6 ? '#a855f7' : '#6366f1' }))
  }, [cerrados])

  // 4. Paquetes distribución
  const paquetesDist = useMemo(() => {
    const counts = {}
    cerrados.forEach(l => { const k = l.paquete || 'Sin paquete'; counts[k] = (counts[k] || 0) + 1 })
    return Object.entries(counts).map(([label, value]) => ({ label, value })).sort((a,b) => b.value - a.value)
  }, [cerrados])

  // 5. Ticket promedio por bucket
  const ticketPorGrupo = useMemo(() => {
    const map = {}
    cerrados.forEach(l => {
      const p = Number(l.personas) || 0
      if (p <= 0) return
      const bucket = p <= 5 ? '1-5p' : p <= 10 ? '6-10p' : p <= 15 ? '11-15p' : p <= 20 ? '16-20p' : '21+p'
      const ord = p <= 5 ? 1 : p <= 10 ? 2 : p <= 15 ? 3 : p <= 20 ? 4 : 5
      if (!map[bucket]) map[bucket] = { sum: 0, count: 0, order: ord }
      const m = Number(l.monto_cerrado) || Number(l.monto_estimado) || 0
      if (m > 0) { map[bucket].sum += m; map[bucket].count++ }
    })
    return Object.entries(map)
      .map(([label, { sum, count, order }]) => ({ label, value: count > 0 ? Math.round(sum / count) : 0, order }))
      .filter(d => d.value > 0).sort((a,b) => a.order - b.order)
  }, [cerrados])

  // 6. Tendencia mensual
  const tendencia = useMemo(() => {
    const now = new Date()
    const months = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({ year: d.getFullYear(), month: d.getMonth(), label: MESES[d.getMonth()], count: 0 })
    }
    cerrados.forEach(l => {
      const d = new Date(l.fecha + 'T12:00:00')
      const m = months.find(x => x.year === d.getFullYear() && x.month === d.getMonth())
      if (m) m.count++
    })
    return months.map(m => ({ label: m.label, value: m.count }))
  }, [cerrados])

  // 7. Recurrentes
  const recurrentes = useMemo(() => {
    const map = {}
    leads.filter(l => l.telefono && l.telefono.length > 4 && l.telefono !== '123' && l.telefono !== '321').forEach(l => {
      if (!map[l.telefono]) map[l.telefono] = { nombre: l.nombre, visitas: 0 }
      map[l.telefono].visitas++
      map[l.telefono].nombre = l.nombre
    })
    return Object.values(map).filter(c => c.visitas > 1).sort((a,b) => b.visitas - a.visitas).slice(0, 8)
  }, [leads])

  const totalCerrados = cerrados.length
  const pctFinSemana = totalCerrados > 0
    ? Math.round(((diasDist[0].value + diasDist[6].value) / totalCerrados) * 100) : 0
  const horaPico = horariosDist[0]?.label || '—'
  const grupoPico = grupoDist[0]?.label || '—'
  const ingresoTotal = cerrados.reduce((s, l) => s + (Number(l.monto_cerrado) || 0), 0)

  return (
    <div className="ana-page2">
      {/* Header */}
      <div className="ana-header2">
        <div>
          <h2 className="ana-title2">📊 Analítica</h2>
          <span className="ana-sub2">{totalCerrados} eventos · datos en tiempo real</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="ana-kpis">
        <KPI icon="🎉" value={totalCerrados} label="Eventos cerrados" color="#a855f7" />
        <KPI icon="⏰" value={horaPico} label="Horario estrella" color="#6366f1" />
        <KPI icon="👥" value={grupoPico} label="Grupo más común" color="#3b82f6" />
        <KPI icon="🗓️" value={`${pctFinSemana}%`} label="Fin de semana" color="#06b6d4" />
        <KPI icon="💰" value={`$${Math.round(ingresoTotal).toLocaleString()}`} label="Ingresos totales" color="#10b981" />
      </div>

      {/* Gráficas grid */}
      <div className="ana-grid2">

        {/* Paquetes — donut */}
        <Card title="Distribución de paquetes" icon="🎮">
          <DonutChart
            data={paquetesDist}
            centerLabel={totalCerrados}
            centerSub="eventos"
          />
        </Card>

        {/* Días semana — barras verticales */}
        <Card title="Días de la semana" icon="📅">
          <BarChartV2 data={diasDist} color="#6366f1" />
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
            Fin de semana = <strong style={{ color: '#a855f7' }}>{pctFinSemana}%</strong> del negocio
          </p>
        </Card>

        {/* Tendencia — line chart */}
        <Card title="Eventos por mes (últimos 12 meses)" icon="📈" wide>
          <TrendLine data={tendencia} color="#10b981" />
        </Card>

        {/* Horarios — barras horizontales */}
        <Card title="Horarios pico" icon="⏰">
          <BarChartV2 data={horariosDist} color="#06b6d4" horizontal />
        </Card>

        {/* Grupos — barras horizontales */}
        <Card title="Tamaño de grupo" icon="👥">
          <BarChartV2 data={grupoDist} color="#a855f7" horizontal />
        </Card>

        {/* Ticket promedio */}
        <Card title="Ticket promedio por grupo" icon="💰">
          {ticketPorGrupo.length > 0 ? (
            <BarChartV2
              data={ticketPorGrupo}
              color="#f59e0b"
              horizontal
              format={v => `$${v.toLocaleString()}`}
            />
          ) : <p className="ana-empty">Sin datos de monto suficientes</p>}
        </Card>

        {/* Recurrentes */}
        <Card title="Clientes recurrentes" icon="🔄" wide>
          {recurrentes.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
              {recurrentes.map((c, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,.03)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: '10px 14px',
                  display: 'flex', alignItems: 'center', gap: 10
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: PALETTE[i % PALETTE.length] + '22',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: PALETTE[i % PALETTE.length], fontWeight: 800, fontSize: 15
                  }}>{c.visitas}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{c.nombre}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                      {c.visitas} {c.visitas === 1 ? 'visita' : 'visitas'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="ana-empty">No hay clientes con más de una reserva aún</p>
          )}
        </Card>

      </div>
    </div>
  )
}
