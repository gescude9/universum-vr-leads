import { PRECIOS, DURACION, ADICIONAL, BASES_PERSONAS } from '../constants'

export const money = (n) => '$' + (Number(n) || 0).toLocaleString('en-US')
export const todayISO = () => new Date().toISOString().slice(0, 10)

export function fmtFecha(iso) {
  if (!iso) return '-'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export function precioDe(paquete, personas) {
  const n = Number(personas)
  if (!n || n < 1) return 0
  const tabla = PRECIOS[paquete]
  if (!tabla) return 0
  if (tabla[n]) return tabla[n]
  const base = [...BASES_PERSONAS].reverse().find(b => b <= n) || 5
  const adicionales = n - base
  return tabla[base] + adicionales * (ADICIONAL[paquete] || 0)
}

export function desglosePrecio(paquete, personas) {
  const n = Number(personas)
  if (!n || n < 1) return null
  const tabla = PRECIOS[paquete]
  if (!tabla) return null
  if (tabla[n]) return { base: n, adicionales: 0, precioBase: tabla[n], total: tabla[n] }
  const base = [...BASES_PERSONAS].reverse().find(b => b <= n) || 5
  const adicionales = n - base
  const precioBase = tabla[base]
  const precioAdicional = adicionales * (ADICIONAL[paquete] || 0)
  return { base, adicionales, precioBase, precioAdicional, total: precioBase + precioAdicional }
}

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

export const DOW = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
export const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
export const isoOf = (d) => d.toISOString().slice(0, 10)

export function inicioSemana(iso) {
  const d = new Date(iso + 'T00:00')
  const wd = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - wd)
  return d
}

export function etiquetaHora(h) {
  const ap = h >= 12 ? 'PM' : 'AM'
  let hh = h % 12
  if (hh === 0) hh = 12
  return `${hh} ${ap}`
}

export function hayConflicto(leads, fecha, hora, paquete, ignoreId) {
  const ini = parseInt(hora)
  const fin = ini + (DURACION[paquete] || 1)
  return leads.find((l) => {
    if (l.id ===
cat > "/Users/gerardosmacbook2026/Desktop/APP WEB UNIVERSUM/files/universum-vr-react/src/lib/helpers.js" << 'EOF'
import { PRECIOS, DURACION, ADICIONAL, BASES_PERSONAS } from '../constants'

export const money = (n) => '$' + (Number(n) || 0).toLocaleString('en-US')
export const todayISO = () => new Date().toISOString().slice(0, 10)

export function fmtFecha(iso) {
  if (!iso) return '-'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export function precioDe(paquete, personas) {
  const n = Number(personas)
  if (!n || n < 1) return 0
  const tabla = PRECIOS[paquete]
  if (!tabla) return 0
  if (tabla[n]) return tabla[n]
  const base = [...BASES_PERSONAS].reverse().find(b => b <= n) || 5
  const adicionales = n - base
  return tabla[base] + adicionales * (ADICIONAL[paquete] || 0)
}

export function desglosePrecio(paquete, personas) {
  const n = Number(personas)
  if (!n || n < 1) return null
  const tabla = PRECIOS[paquete]
  if (!tabla) return null
  if (tabla[n]) return { base: n, adicionales: 0, precioBase: tabla[n], total: tabla[n] }
  const base = [...BASES_PERSONAS].reverse().find(b => b <= n) || 5
  const adicionales = n - base
  const precioBase = tabla[base]
  const precioAdicional = adicionales * (ADICIONAL[paquete] || 0)
  return { base, adicionales, precioBase, precioAdicional, total: precioBase + precioAdicional }
}

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

export const DOW = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
export const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
export const isoOf = (d) => d.toISOString().slice(0, 10)

export function inicioSemana(iso) {
  const d = new Date(iso + 'T00:00')
  const wd = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - wd)
  return d
}

export function etiquetaHora(h) {
  const ap = h >= 12 ? 'PM' : 'AM'
  let hh = h % 12
  if (hh === 0) hh = 12
  return `${hh} ${ap}`
}

export function hayConflicto(leads, fecha, hora, paquete, ignoreId) {
  const ini = parseInt(hora)
  const fin = ini + (DURACION[paquete] || 1)
  return leads.find((l) => {
    if (l.id === ignoreId) return false
    if (l.estado === 'Perdido') return false
    if (l.fecha !== fecha || !l.hora) return false
    const i2 = parseInt(l.hora)
    const f2 = i2 + (DURACION[l.paquete] || 1)
    return ini < f2 && i2 < fin
  }) || null
}
