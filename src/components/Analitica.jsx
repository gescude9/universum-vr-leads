import { useMemo, useState } from 'react'

const DIAS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const PALETTE = ['#a855f7','#6366f1','#3b82f6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899']

function DonutChart({ data, size = 160, thickness = 32, centerLabel = '', centerSub = '' }) {
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
          <div key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
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

function HBar({ data, color = '#a855f7', format = v => v }) {
  const [hov, setHov] = useState(null)
  const max = Math.max(...data.map(d => d.value), 1)
  if (!data.length) return <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center' }}>Sin datos</p>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}>
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

function VBar({ data, color = '#6366f1' }) {
  const [hov, setHov] = useState(null)
  const max = Math.max(...data.map(d => d.value), 1)
  if (!data.length) return <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center' }}>Sin datos</p>
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 130, paddingTop: 16 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', position: 'relative', cursor: 'pointer' }}
          onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}>
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

function TrendLine({ data, color = '#10b981' }) {
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
          <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity=".25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#tg)" />
        <polyline points={poly} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={hov === i ? 2.5 : 1.5} fill={color}
            style={{ cursor: 'pointer', transition: 'r .1s' }}
            onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} />
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: -6 }}>
        {data.filter((_, i) => i % 3 === 0 || i === data.length - 1).map((d, i) => (
          <span key={i} style={{ fontSize: 9, color: 'var(--muted)' }}>{d.label}</span>
        ))}
      </div>
      {hov !== null && (
        <div style={{ position: 'absolute', top: 0, left: `${pts[hov].x}%`, transform: 'translateX(-50%)', background: '#1e1b4b', border: '1px solid rgba(255,255,255,.12)', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, color, pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 10 }}>
          {data[hov].label}: {data[hov].value}
        </div>
      )}
    </div>
  )
}

function KPI({ value, label, color, icon, sub }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? `${color}11` : 'var(--panel)',
        border: `1px solid ${hov ? color : 'var(--border)'}`,
        borderRadius: 16, padding: '20px 18px',
        display: 'flex', flexDirection: 'column', gap: 2,
        transition: 'all .18s', cursor: 'default',
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

export default function Analitica({ leads = [] }) {
  const cerrados = useMemo(() =>
    leads.filter(l => l.estado === 'Cerrado' && l.fecha && l.hora), [leads])

  const grupoDist = useMemo(() => {
    const c = {}
    cerrados.forEach(l => { const p = Number(l.personas) || 0; if (p > 0) c[p] = (c[p] || 0) + 1 })
    return Object.entries(c).map(([p, v]) => ({ label: `${p}p`, value: v })).sort((a, b) => b.value - a.value).slice(0, 8)
  }, [cerrados])

  const horariosDist = useMemo(() => {
    const c = {}
    cerrados.forEach(l => { if (!l.hora) return; const h = l.hora.substring(0, 5); c[h] = (c[h] || 0) + 1 })
    return Object.entries(c).map(([h, v]) => ({ label: h, value: v })).sort((a, b) => b.value - a.value).slice(0, 8)
  }, [cerrados])

  const diasDist = useMemo(() => {
    const c = [0, 0, 0, 0, 0, 0, 0]
    cerrados.forEach(l => { if (l.fecha) c[new Date(l.fecha + 'T12:00:00').getDay()]++ })
    return DIAS_SHORT.map((label, i) => ({ label, value: c[i], color: i === 0 || i === 6 ? '#a855f7' : '#6366f1' }))
  }, [cerrados])

  const paquetesDist = useMemo(() => {
    const c = {}
    cerrados.forEach(l => { const k = l.paquete || 'Sin paquete'; c[k] = (c[k] || 0) + 1 })
    return Object.entries(c).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
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
      months.push({ year: d.getFullYear(), month: d.getMonth(), label: MESES[d.getMonth()], value: 0 })
    }
    cerrados.forEach(l => {
      const d = new Date(l.fecha + 'T12:00:00')
      const m = months.find(x => x.year === d.getFullYear() && x.month === d.getMonth())
      if (m) m.value++
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

  const totalCerrados = cerrados.length
  const pctFinSemana = totalCerrados > 0 ? Math.round(((diasDist[0].value + diasDist[6].value) / totalCerrados) * 100) : 0
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
        <KPI icon="🎉" value={totalCerrados} label="Eventos cerrados" color="#a855f7" sub="cumpleaños completados" />
        <KPI icon="⏰" value={horaPico} label="Horario estrella" color="#6366f1" sub="hora más popular" />
        <KPI icon="👥" value={grupoPico} label="Grupo más común" color="#3b82f6" sub="personas por evento" />
        <KPI icon="🗓️" value={`${pctFinSemana}%`} label="Fin de semana" color="#06b6d4" sub="sáb + dom" />
        <KPI icon="💰" value={`$${Math.round(ingresoTotal).toLocaleString()}`} label="Ingresos totales" color="#10b981" sub="leads cerrados" />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        <Card title="Distribución de paquetes" icon="🎮">
          <DonutChart data={paquetesDist} centerLabel={totalCerrados} centerSub="eventos" />
        </Card>
        <Card title="Días de la semana" icon="📅">
          <VBar data={diasDist} />
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8, margin: '8px 0 0' }}>
            Fin de semana = <strong style={{ color: '#a855f7' }}>{pctFinSemana}%</strong> del negocio
          </p>
        </Card>
        <Card title="Eventos por mes · últimos 12 meses" icon="📈" wide>
          <TrendLine data={tendencia} color="#10b981" />
        </Card>
        <Card title="Horarios pico" icon="⏰">
          <HBar data={horariosDist} color="#06b6d4" />
        </Card>
        <Card title="Tamaño de grupo" icon="👥">
          <HBar data={grupoDist} color="#a855f7" />
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
    </div>
  )
}
