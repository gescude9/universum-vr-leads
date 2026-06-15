import { useState } from 'react'
import { DURACION } from '../constants'
import {
  DOW, MESES, isoOf, inicioSemana, etiquetaHora,
  ultimaHoraInicio, todayISO,
} from '../lib/helpers'

const GRID_START = 11
const GRID_END = 22
const ROW_H = 56

export default function Calendario({ leads, onNew, onEdit }) {
  const [calCurrent, setCalCurrent] = useState(todayISO())

  const start = inicioSemana(calCurrent)
  const dias = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    dias.push(d)
  }

  const a = dias[0], b = dias[6]
  const label =
    a.getMonth() === b.getMonth()
      ? `${a.getDate()} – ${b.getDate()} ${MESES[b.getMonth()]} ${b.getFullYear()}`
      : `${a.getDate()} ${MESES[a.getMonth()]} – ${b.getDate()} ${MESES[b.getMonth()]} ${b.getFullYear()}`

  const hoy = todayISO()

  function shiftWeek(delta) {
    const dt = new Date(calCurrent + 'T00:00')
    dt.setDate(dt.getDate() + delta)
    setCalCurrent(isoOf(dt))
  }

  const horasLabels = []
  for (let h = GRID_START; h < GRID_END; h++) horasLabels.push(h)

  return (
    <section className="view">
      <div className="page-head">
        <div>
          <h1>Calendario</h1>
          <p>Vista semanal. Toca una celda libre para agendar o un evento para editarlo.</p>
        </div>
      </div>

      <div className="cal-controls">
        <div className="cal-nav">
          <button onClick={() => shiftWeek(-7)} title="Semana anterior">‹</button>
          <button onClick={() => shiftWeek(7)} title="Semana siguiente">›</button>
        </div>
        <div className="cal-label">{label}</div>
        <button className="btn btn-ghost btn-sm" onClick={() => setCalCurrent(todayISO())}>Hoy</button>
        <input
          type="date"
          value={calCurrent}
          onChange={(e) => e.target.value && setCalCurrent(e.target.value)}
        />
        <div style={{ flex: 1 }}></div>
        <button className="btn btn-primary btn-sm" onClick={() => onNew({ fecha: calCurrent, hora: '11:00' })}>
          ＋ Nuevo lead
        </button>
      </div>

      <div className="cal-legend">
        <span><b>Horarios:</b> Lun–Jue y Dom 11:00–20:00 · Vie–Sáb 11:00–21:00</span>
        <span>Las celdas con rayas están fuera de horario.</span>
      </div>

      <div className="gcal-wrap">
        <div className="gcal">
          <div className="gcal-head">
            <div className="dh"></div>
            {dias.map((d) => {
              const iso = isoOf(d)
              return (
                <div key={iso} className={`dh ${iso === hoy ? 'today' : ''}`}>
                  <small>{DOW[d.getDay()]}</small>
                  <b>{d.getDate()}</b>
                </div>
              )
            })}
          </div>

          <div className="gcal-body">
            <div className="gcal-times">
              {horasLabels.map((h) => <div className="t" key={h}>{etiquetaHora(h)}</div>)}
            </div>

            {dias.map((d) => {
              const iso = isoOf(d)
              const last = ultimaHoraInicio(iso)
              const eventos = leads.filter(
                (l) => l.fecha === iso && l.hora && l.estado !== 'Perdido'
              )
              return (
                <div className="gcal-col" key={iso}>
                  {horasLabels.map((h) => {
                    const cerrado = h > last
                    return (
                      <div
                        key={h}
                        className={`gcal-cell ${cerrado ? 'closed' : ''}`}
                        onClick={() =>
                          !cerrado && onNew({ fecha: iso, hora: String(h).padStart(2, '0') + ':00' })
                        }
                      ></div>
                    )
                  })}
                  {eventos.map((l) => {
                    const s = parseInt(l.hora)
                    const dur = DURACION[l.paquete] || 1
                    const top = (s - GRID_START) * ROW_H
                    const alto = Math.max(Math.min(dur, GRID_END - s) * ROW_H - 4, 24)
                    return (
                      <div
                        key={l.id}
                        className={`gc-event st-${l.estado}`}
                        style={{ top, height: alto }}
                        title={`${l.nombre} · ${l.hora}`}
                        onClick={() => onEdit(l)}
                      >
                        <b>{l.nombre}</b>
                        <span className="pk">{l.hora} · {l.paquete} · {l.personas}p</span>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
