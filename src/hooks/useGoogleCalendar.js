import { useState, useEffect, useCallback } from 'react'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const SCOPES = 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly'

export function useGoogleCalendar() {
  const [gapiLoaded, setGapiLoaded] = useState(false)
  const [gisLoaded, setGisLoaded]   = useState(false)
  const [conectado, setConectado]   = useState(false)
  const [cargando, setCargando]     = useState(false)
  const [error, setError]           = useState('')
  const [tokenClient, setTokenClient] = useState(null)

  // Cargar script GAPI
  useEffect(() => {
    if (document.getElementById('gapi-script')) {
      if (window.gapi) initGapi()
      return
    }
    const s = document.createElement('script')
    s.id = 'gapi-script'
    s.src = 'https://apis.google.com/js/api.js'
    s.async = true
    s.defer = true
    s.onload = initGapi
    s.onerror = () => setError('Error cargando Google API')
    document.head.appendChild(s)
  }, [])

  function initGapi() {
    window.gapi.load('client', async () => {
      try {
        await window.gapi.client.init({
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
        })
        setGapiLoaded(true)
        // Verificar token guardado
        const token = sessionStorage.getItem('gc_token')
        if (token) {
          window.gapi.client.setToken({ access_token: token })
          setConectado(true)
        }
      } catch(e) {
        setError('Error iniciando Google API: ' + e.message)
      }
    })
  }

  // Cargar script GIS
  useEffect(() => {
    if (document.getElementById('gis-script')) {
      if (window.google?.accounts) initGIS()
      return
    }
    const s = document.createElement('script')
    s.id = 'gis-script'
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.defer = true
    s.onload = initGIS
    s.onerror = () => setError('Error cargando Google Identity')
    document.head.appendChild(s)
  }, [])

  function initGIS() {
    if (!CLIENT_ID) {
      setError('Falta VITE_GOOGLE_CLIENT_ID en las variables de entorno')
      return
    }
    try {
      const tc = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (resp) => {
          setCargando(false)
          if (resp.error) {
            setError('Error de autenticación: ' + resp.error)
            return
          }
          sessionStorage.setItem('gc_token', resp.access_token)
          window.gapi.client.setToken({ access_token: resp.access_token })
          setConectado(true)
          setError('')
        },
        error_callback: (err) => {
          setCargando(false)
          if (err.type === 'popup_closed') {
            setError('Popup cerrado. Intenta de nuevo.')
          } else {
            setError('Error: ' + err.type)
          }
        }
      })
      setTokenClient(tc)
      setGisLoaded(true)
    } catch(e) {
      setError('Error iniciando GIS: ' + e.message)
    }
  }

  const conectar = useCallback(() => {
    setError('')
    if (!CLIENT_ID) { setError('Falta configurar el Client ID de Google'); return }
    if (!gapiLoaded) { setError('Google API aún cargando, espera un momento'); return }
    if (!gisLoaded || !tokenClient) { setError('Google Identity aún cargando, espera un momento'); return }
    setCargando(true)
    tokenClient.requestAccessToken({ prompt: 'consent' })
  }, [gapiLoaded, gisLoaded, tokenClient])

  const desconectar = useCallback(() => {
    const token = sessionStorage.getItem('gc_token')
    if (token && window.google?.accounts?.oauth2) {
      window.google.accounts.oauth2.revoke(token, () => {})
    }
    sessionStorage.removeItem('gc_token')
    if (window.gapi?.client) window.gapi.client.setToken(null)
    setConectado(false)
    setError('')
  }, [])

  // ── Crear evento ──
  const crearEvento = useCallback(async (lead, vendedorNombre) => {
    if (!conectado) return null
    try {
      const token = sessionStorage.getItem('gc_token')
      window.gapi.client.setToken({ access_token: token })
      const { inicio, fin } = calcularHorario(lead)
      const resp = await window.gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: buildEvent(lead, vendedorNombre, inicio, fin),
      })
      return resp.result.id
    } catch(e) {
      console.error('Error creando evento:', e)
      return null
    }
  }, [conectado])

  const actualizarEvento = useCallback(async (googleEventId, lead, vendedorNombre) => {
    if (!conectado || !googleEventId) return
    try {
      const token = sessionStorage.getItem('gc_token')
      window.gapi.client.setToken({ access_token: token })
      const { inicio, fin } = calcularHorario(lead)
      await window.gapi.client.calendar.events.update({
        calendarId: 'primary',
        eventId: googleEventId,
        resource: buildEvent(lead, vendedorNombre, inicio, fin),
      })
    } catch(e) { console.error('Error actualizando evento:', e) }
  }, [conectado])

  const eliminarEvento = useCallback(async (googleEventId) => {
    if (!conectado || !googleEventId) return
    try {
      const token = sessionStorage.getItem('gc_token')
      window.gapi.client.setToken({ access_token: token })
      await window.gapi.client.calendar.events.delete({
        calendarId: 'primary', eventId: googleEventId,
      })
    } catch(e) { console.error('Error eliminando evento:', e) }
  }, [conectado])

  return {
    conectado, cargando, error, gapiLoaded, gisLoaded,
    conectar, desconectar, crearEvento, actualizarEvento, eliminarEvento,
  }
}

const DURACION = { 'Gaming': 1, 'Double Gaming': 2, 'Full VR': 3 }

function calcularHorario(lead) {
  const [hh] = lead.hora.split(':').map(Number)
  const inicio = new Date(`${lead.fecha}T${String(hh).padStart(2,'0')}:00:00`)
  const fin = new Date(inicio.getTime() + (DURACION[lead.paquete] || 1) * 3600000)
  return { inicio: inicio.toISOString(), fin: fin.toISOString() }
}

function buildEvent(lead, vendedorNombre, inicio, fin) {
  const emoji = { 'Gaming': '🎮', 'Double Gaming': '🎮🎮', 'Full VR': '🥽' }[lead.paquete] || '🎂'
  return {
    summary: `${emoji} Cumpleaños VR — ${lead.nombre}`,
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
    colorId: '11',
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 1440 },
        { method: 'popup', minutes: 60 },
      ],
    },
  }
}
