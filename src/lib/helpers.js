import { PRECIOS, DURACION } from '../constants'

// ---------- Formato ----------
export const money = (n) => '$' + (Number(n) || 0).toLocaleString('en-US')

export const todayISO = () => new Date().toISOString().slice(0, 10)

export function fmtFecha(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

// ---------- Precios ----------
export function precioDe(paquete, personas) {
  const tabla = PRECIOS[paquete]
  if (!tabla) return 0
  return tabla[Number(personas)] || 0
}

// ---------- Horarios por día de la semana ----------
// getDay: 0=Dom .. 6=Sáb
//  Lun–Jue y Dom: 11:00 a 20:00 (última reserva 8 PM)
//  Vie y Sáb:     11:00 a 21:00 (última reserva 9 PM)
export function ultimaHoraInicio(dateISO) {
  const d = new Date(dateISO + 'T00:00').getDay()
  return d === 5 || d === 6 ? 21 : 20
}

export function horasDe(dateISO) {
  const last = ultimaHoraInicio(dateISO)
  const arr = []
  for (let h = 11; h <= last; h++) arr.push(String(h).padStart(2, '0') + ':00')
  return arr
}

// ---------- Calendario ----------
export const DOW = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
export const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

export const isoOf = (d) => d.toISOString().slice(0, 10)

// Lunes de la semana que contiene 'iso'
export function inicioSemana(iso) {
  const d = new Date(iso + 'T00:00')
  const wd = (d.getDay() + 6) % 7 // 0 = lunes
  d.setDate(d.getDate() - wd)
  return d
}

// Etiqueta de hora 12h: 11 -> "11 AM", 20 -> "8 PM"
export function etiquetaHora(h) {
  const ap = h >= 12 ? 'PM' : 'AM'
  let hh = h % 12
  if (hh === 0) hh = 12
  return `${hh} ${ap}`
}

// ---------- Detección de solapes de reservas ----------
// Considera la duración de cada paquete. Los leads "Perdido" liberan el horario.
export function hayConflicto(leads, fecha, hora, paquete, ignoreId) {
  const ini = parseInt(hora)
  const fin = ini + (DURACION[paquete] || 1)
  return (
    leads.find((l) => {
      if (l.id === ignoreId) return false
      if (l.estado === 'Perdido') return false
      if (l.fecha !== fecha || !l.hora) return false
      const i2 = parseInt(l.hora)
      const f2 = i2 + (DURACION[l.paquete] || 1)
      return ini < f2 && i2 < fin
    }) || null
  )
}
