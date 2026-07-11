import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DURACION } from '../constants'
import { isoOf, inicioSemana, etiquetaHora, ultimaHoraInicio, todayISO } from '../lib/helpers'

const GRID_START = 11, GRID_END = 22, ROW_H = 56

export default function Calendario({ leads, onNew, onEdit, isViewer }) {
  const { t } = useTranslation()
  const [calCurrent, setCalCurrent] = useState(todayISO())

  const DOW = t('calendario.dias', { returnObjects: true })
  const MESES = t('calendario.meses', { returnObjects: true })

  const start = inicioSemana(calCurrent)
  const dias = []
  for (let i = 0; i < 7; i++) { const d = new Date(start); d.setDate(start.getDate() + i); dias.push(d) }

  const a = dias[0], b = dias[6]
  const label = a.getMonth() === b.getMonth()
    ? `${a.getDate()} – ${b.getDate()} ${MESES[b.getMonth()]} ${b.getFullYear()}`
    : `${a.getDate()} ${MESES[a.getMonth()]} – ${b.getDate()} ${MESES[b.getMonth()]} ${b.getFullYear()}`

  const hoy = todayISO()
  const horasLabels = []
  for (let h = GRID_START; h < GRID_END; h++) horasLabels.push(h)

  function shiftWeek(d) {
    const dt = new Date(calCurrent + 'T00:00'); dt.setDate(dt.getDate() + d); setCalCurrent(isoOf(dt))
  }

  return (
    <section className="view">
      <div className="page-head">
        <div><h1>{t('calendario.titulo')}</h1><p>{t('calendario.subtitulo')}</p></div>
      </div>
      <div className="cal-controls">
        <div className="cal-nav">
          <button onClick={() => shiftWeek(-7)}>‹</button>
          <button onClick={() => shiftWeek(7)}>›</button>
        </div>
        <div className="cal-label">{label}</div>
        <button className="btn btn-ghost btn-sm" onClick={() => setCalCurrent(todayISO())}>{t('calendario.hoy')}</button>
        <input type="date" value={calCurrent} onChange={e => e.target.value && setCalCurrent(e.target.value)} />
        <div style={{ flex: 1 }}></div>
        {!isViewer && <button className="btn btn-primary btn-sm" onClick={() => onNew({ fecha: calCurrent, hora: '11:00' })}>{t('calendario.nuevoLead')}</button>
      </div>
      <div className="cal-legend">
        <span><b>{t('calendario.horarios').split(':')[0]}:</b>{t('calendario.horarios').split(':').slice(1).join(':')}</span>
        <span>{t('calendario.fueraHorario')}</span>
      </div>
      <div className="gcal-wrap">
        <div className="gcal">
          <div className="gcal-head">
            <div className="dh"></div>
            {dias.map(d => {
              const iso = isoOf(d)
              return (
                <div key={iso} className={`dh ${iso === hoy ? 'today' : ''}`}>
                  <small>{DOW[d.getDay()]}</small><b>{d.getDate()}</b>
                </div>
              )
            })}
          </div>
          <div className="gcal-body">
            <div className="gcal-times">
              {horasLabels.map(h => <div className="t" key={h}>{etiquetaHora(h)}</div>)}
            </div>
            {dias.map(d => {
              const iso = isoOf(d)
              const last = ultimaHoraInicio(iso)
              const eventos = leads.filter(l => l.fecha === iso && l.hora && l.estado !== 'Perdido')
              return (
                <div className="gcal-col" key={iso}>
                  {horasLabels.map(h => (
                    <div key={h} className={`gcal-cell ${h > last ? 'closed' : ''}`}
                      onClick={() => !isViewer && h <= last && onNew({ fecha: iso, hora: String(h).padStart(2, '0') + ':00' })}></div>
                  ))}
                  {eventos.map(l => {
                    const s = parseInt(l.hora), dur = DURACION[l.paquete] || 1
                    const top = (s - GRID_START) * ROW_H
                    const alto = Math.max(Math.min(dur, GRID_END - s) * ROW_H - 4, 24)
                    return (
                      <div key={l.id} className={`gc-event st-${l.estado}`}
                        style={{ top, height: alto }} title={`${l.nombre} · ${l.hora}`}
                        onClick={() => onEdit(l)}>
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
