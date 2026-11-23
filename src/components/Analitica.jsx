import { useMemo } from 'react'

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const DIAS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function BarChart({ data, colorClass = 'bar-purple', maxLabel = '' }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="ana-chart">
      {data.map((d, i) => (
        <div key={i} className="ana-bar-row">
          <span className="ana-bar-label">{d.label}</span>
          <div className="ana-bar-track">
            <div
              className={`ana-bar-fill ${colorClass}`}
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
          <span className="ana-bar-value">{d.value}{maxLabel}</span>
        </div>
      ))}
    </div>
  )
}

function StatCard({ title, children, icon }) {
  return (
    <div className="ana-card">
      <div className="ana-card-head">
        <span className="ana-card-icon">{icon}</span>
        <h3 className="ana-card-title">{title}</h3>
      </div>
      <div className="ana-card-body">{children}</div>
    </div>
  )
}

export default function Analitica({ leads = [] }) {
  const cerrados = useMemo(() =>
    leads.filter(l => l.estado === 'Cerrado' && l.fecha && l.hora),
    [leads]
  )

  // 1. Distribución de tamaño de grupo
  const grupoDist = useMemo(() => {
    const counts = {}
    cerrados.forEach(l => {
      const p = Number(l.personas) || 0
      if (p > 0) counts[p] = (counts[p] || 0) + 1
    })
    return Object.entries(counts)
      .map(([p, c]) => ({ label: `${p} personas`, value: c, num: Number(p) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }, [cerrados])

  // 2. Horarios pico
  const horariosDist = useMemo(() => {
    const counts = {}
    cerrados.forEach(l => {
      if (!l.hora) return
      const hora = l.hora.substring(0, 5) // "HH:MM"
      counts[hora] = (counts[hora] || 0) + 1
    })
    return Object.entries(counts)
      .map(([h, c]) => ({ label: h, value: c }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }, [cerrados])

  // 3. Días de semana
  const diasDist = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0, 0]
    cerrados.forEach(l => {
      if (!l.fecha) return
      const d = new Date(l.fecha + 'T12:00:00')
      counts[d.getDay()]++
    })
    return DIAS_SHORT.map((label, i) => ({ label, value: counts[i] }))
  }, [cerrados])

  // 4. Clientes recurrentes (por teléfono)
  const recurrentes = useMemo(() => {
    const map = {}
    leads.filter(l => l.telefono && l.telefono.length > 4 && l.telefono !== '123' && l.telefono !== '321').forEach(l => {
      if (!map[l.telefono]) map[l.telefono] = { telefono: l.telefono, nombre: l.nombre, visitas: 0, ultima: '' }
      map[l.telefono].visitas++
      if (!map[l.telefono].ultima || l.fecha > map[l.telefono].ultima) {
        map[l.telefono].ultima = l.fecha
        map[l.telefono].nombre = l.nombre
      }
    })
    return Object.values(map)
      .filter(c => c.visitas > 1)
      .sort((a, b) => b.visitas - a.visitas)
      .slice(0, 10)
  }, [leads])

  // 5. Ticket promedio por tamaño de grupo
  const ticketPorGrupo = useMemo(() => {
    const map = {}
    cerrados.forEach(l => {
      const p = Number(l.personas) || 0
      if (p <= 0) return
      const bucket = p <= 5 ? '1-5' : p <= 10 ? '6-10' : p <= 15 ? '11-15' : p <= 20 ? '16-20' : '21+'
      if (!map[bucket]) map[bucket] = { sum: 0, count: 0, order: p <= 5 ? 1 : p <= 10 ? 2 : p <= 15 ? 3 : p <= 20 ? 4 : 5 }
      const monto = Number(l.monto_cerrado) || Number(l.monto_estimado) || 0
      if (monto > 0) { map[bucket].sum += monto; map[bucket].count++ }
    })
    return Object.entries(map)
      .map(([label, { sum, count, order }]) => ({
        label,
        value: count > 0 ? Math.round(sum / count) : 0,
        order
      }))
      .filter(d => d.value > 0)
      .sort((a, b) => a.order - b.order)
  }, [cerrados])

  // 6. Tendencia mensual (últimos 12 meses)
  const tendenciaMensual = useMemo(() => {
    const now = new Date()
    const months = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({ year: d.getFullYear(), month: d.getMonth(), label: MESES[d.getMonth()] + ' ' + String(d.getFullYear()).slice(2), count: 0 })
    }
    cerrados.forEach(l => {
      const d = new Date(l.fecha + 'T12:00:00')
      const m = months.find(x => x.year === d.getFullYear() && x.month === d.getMonth())
      if (m) m.count++
    })
    return months
  }, [cerrados])

  const totalCerrados = cerrados.length
  const pctFinSemana = totalCerrados > 0
    ? Math.round(((diasDist[0].value + diasDist[6].value) / totalCerrados) * 100)
    : 0

  return (
    <div className="ana-page">
      <div className="ana-header">
        <h2 className="ana-title">📊 Analítica</h2>
        <span className="ana-subtitle">{totalCerrados} eventos analizados · datos en tiempo real</span>
      </div>

      {/* Resumen rápido */}
      <div className="ana-stats-row">
        <div className="ana-stat">
          <span className="ana-stat-num">{totalCerrados}</span>
          <span className="ana-stat-label">Eventos totales</span>
        </div>
        <div className="ana-stat">
          <span className="ana-stat-num">{grupoDist[0]?.label || '—'}</span>
          <span className="ana-stat-label">Grupo más común</span>
        </div>
        <div className="ana-stat">
          <span className="ana-stat-num">{horariosDist[0]?.label || '—'}</span>
          <span className="ana-stat-label">Horario pico</span>
        </div>
        <div className="ana-stat">
          <span className="ana-stat-num">{pctFinSemana}%</span>
          <span className="ana-stat-label">Fin de semana</span>
        </div>
      </div>

      <div className="ana-grid">

        {/* Tamaño de grupo */}
        <StatCard title="Tamaño de grupo" icon="👥">
          <BarChart data={grupoDist} colorClass="bar-purple" />
        </StatCard>

        {/* Horarios pico */}
        <StatCard title="Horarios pico" icon="⏰">
          <BarChart data={horariosDist} colorClass="bar-teal" />
        </StatCard>

        {/* Días de la semana */}
        <StatCard title="Días de la semana" icon="📅">
          <BarChart data={diasDist} colorClass="bar-blue" />
          <p className="ana-note">Sábado + domingo = {pctFinSemana}% del negocio</p>
        </StatCard>

        {/* Ticket promedio por grupo */}
        <StatCard title="Ticket promedio por grupo" icon="💰">
          {ticketPorGrupo.length > 0 ? (
            <div className="ana-ticket-table">
              {ticketPorGrupo.map((t, i) => (
                <div key={i} className="ana-ticket-row">
                  <span className="ana-ticket-label">{t.label} personas</span>
                  <span className="ana-ticket-val">${t.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : <p className="ana-empty">Sin datos de monto suficientes</p>}
        </StatCard>

        {/* Tendencia mensual */}
        <StatCard title="Eventos por mes (últimos 12 meses)" icon="📈">
          <BarChart data={tendenciaMensual} colorClass="bar-green" />
        </StatCard>

        {/* Clientes recurrentes */}
        <StatCard title="Clientes recurrentes" icon="🔄">
          {recurrentes.length > 0 ? (
            <div className="ana-recurrentes">
              <div className="ana-rec-head">
                <span>Cliente</span><span>Teléfono</span><span>Visitas</span>
              </div>
              {recurrentes.map((c, i) => (
                <div key={i} className="ana-rec-row">
                  <span className="ana-rec-nombre">{c.nombre}</span>
                  <span className="ana-rec-tel">{c.telefono}</span>
                  <span className="ana-rec-visitas">{c.visitas}x</span>
                </div>
              ))}
            </div>
          ) : <p className="ana-empty">No hay clientes con más de una reserva aún</p>}
        </StatCard>

      </div>
    </div>
  )
}
