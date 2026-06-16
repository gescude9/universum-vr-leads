// ============================================================
//  useGoogleCalendar — Autenticación OAuth y operaciones
//  con Google Calendar API desde el frontend
// ============================================================
import { useState, useEffect, useCallback } from 'react'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const SCOPES = 'https://www.googleapis.com/auth/calendar.events'
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'

// El calendario por defecto es "primary" (el principal del usuario)
const CALENDAR_ID = 'primary'

export function useGoogleCalendar() {
  const [gapiLoaded, setGapiLoaded] = useState(false)
  const [gisLoaded, setGisLoaded]   = useState(false)
  const [conectado, setConectado]   = useState(false)
  const [cargando, setCargando]     = useState(false)
  const [error, setError]           = useState('')

  // Cargar scripts de Google
  useEffect(() => {
    // Script GAPI (Google API client)
    const gapiScript = document.createElement('script')
    gapiScript.src = 'https://apis.google.com/js/api.js'
    gapiScript.onload = () => {
      window.gapi.load('client', async () => {
        await window.gapi.client.init({
          discoveryDocs: [DISCOVERY_DOC],
        })
        setGapiLoaded(true)
      })
    }
    document.body.appendChild(gapiScript)

    // Script GIS (Google Identity Services)
    const gisScript = document.createElement('script')
    gisScript.src = 'https://accounts.google.com/gsi/client'
    gisScript.onload = () => setGisLoaded(true)
    document.body.appendChild(gisScript)

    return () => {
      document.body.removeChild(gapiScript)
      document.body.removeChild(gisScript)
    }
  }, [])

  // Iniciar sesión con Google
  const conectar = useCallback(() => {
    if (!gapiLoaded || !gisLoaded) return
    setCargando(true)
    setError('')

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (resp) => {
        setCargando(false)
        if (resp.error) {
          setError('No se pudo conectar con Google Calendar.')
          return
        }
        setConectado(true)
        // Guardar token en sessionStorage para esta sesión
        sessionStorage.setItem('gc_token', resp.access_token)
      },
    })
    tokenClient.requestAccessToken({ prompt: 'consent' })
  }, [gapiLoaded, gisLoaded])

  // Desconectar
  const desconectar = useCallback(() => {
    const token = sessionStorage.getItem('gc_token')
    if (token) window.google.accounts.oauth2.revoke(token)
    sessionStorage.removeItem('gc_token')
    setConectado(false)
  }, [])

  // Verificar si ya hay token al cargar
  useEffect(() => {
    if (!gapiLoaded) return
    const token = sessionStorage.getItem('gc_token')
    if (token) {
      window.gapi.client.setToken({ access_token: token })
      setConectado(true)
    }
  }, [gapiLoaded])

  // ── Crear evento en Google Calendar ──
  const crearEvento = useCallback(async (lead, vendedorNombre) => {
    if (!conectado) return null
    try {
      const token = sessionStorage.getItem('gc_token')
      window.gapi.client.setToken({ access_token: token })

      const { inicio, fin } = calcularHorario(lead)
      const event = buildEvent(lead, vendedorNombre, inicio, fin)

      const resp = await window.gapi.client.calendar.events.insert({
        calendarId: CALENDAR_ID,
        resource: event,
      })
      return resp.result.id
    } catch (e) {
      console.error('Error creando evento en Google Calendar:', e)
      return null
    }
  }, [conectado])

  // ── Actualizar evento existente ──
  const actualizarEvento = useCallback(async (googleEventId, lead, vendedorNombre) => {
    if (!conectado || !googleEventId) return
    try {
      const token = sessionStorage.getItem('gc_token')
      window.gapi.client.setToken({ access_token: token })

      const { inicio, fin } = calcularHorario(lead)
      const event = buildEvent(lead, vendedorNombre, inicio, fin)

      await window.gapi.client.calendar.events.update({
        calendarId: CALENDAR_ID,
        eventId: googleEventId,
        resource: event,
      })
    } catch (e) {
      console.error('Error actualizando evento en Google Calendar:', e)
    }
  }, [conectado])

  // ── Eliminar evento ──
  const eliminarEvento = useCallback(async (googleEventId) => {
    if (!conectado || !googleEventId) return
    try {
      const token = sessionStorage.getItem('gc_token')
      window.gapi.client.setToken({ access_token: token })

      await window.gapi.client.calendar.events.delete({
        calendarId: CALENDAR_ID,
        eventId: googleEventId,
      })
    } catch (e) {
      console.error('Error eliminando evento en Google Calendar:', e)
    }
  }, [conectado])

  return {
    conectado, cargando, error, gapiLoaded, gisLoaded,
    conectar, desconectar, crearEvento, actualizarEvento, eliminarEvento,
  }
}

// ── Helpers ──

const DURACION = { 'Gaming': 1, 'Double Gaming': 2, 'Full VR': 3 }

function calcularHorario(lead) {
  const fecha = lead.fecha // YYYY-MM-DD
  const hora  = lead.hora  // HH:00
  const dur   = DURACION[lead.paquete] || 1

  const [hh] = hora.split(':').map(Number)
  const inicio = new Date(`${fecha}T${String(hh).padStart(2,'0')}:00:00`)
  const fin    = new Date(inicio.getTime() + dur * 60 * 60 * 1000)

  return {
    inicio: inicio.toISOString(),
    fin:    fin.toISOString(),
  }
}

function buildEvent(lead, vendedorNombre, inicio, fin) {
  const paqueteEmoji = {
    'Gaming': '🎮',
    'Double Gaming': '🎮🎮',
    'Full VR': '🥽',
  }[lead.paquete] || '🎂'

  return {
    summary: `${paqueteEmoji} Cumpleaños VR — ${lead.nombre}`,
    description: [
      `👤 Cliente: ${lead.nombre}`,
      `📞 Teléfono: ${lead.telefono || '—'}`,
      `📦 Paquete: ${lead.paquete} (${lead.personas} personas)`,
      lead.premium ? `⭐ Experiencia: ${lead.premium}` : '',
      `💰 Monto: $${lead.monto_cerrado}`,
      `🤝 Vendedor: ${vendedorNombre || '—'}`,
      lead.notas ? `📝 Notas: ${lead.notas}` : '',
    ].filter(Boolean).join('\n'),
    start: { dateTime: inicio, timeZone: 'America/Panama' },
    end:   { dateTime: fin,    timeZone: 'America/Panama' },
    colorId: '11', // Rojo tomate — para que destaque en el calendario
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email',  minutes: 24 * 60 }, // 1 día antes
        { method: 'popup',  minutes: 60 },       // 1 hora antes
      ],
    },
  }
}
