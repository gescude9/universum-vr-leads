import { useTranslation } from 'react-i18next'

export default function GoogleCalendarBtn({ conectado, cargando, onConectar, onDesconectar, gapiLoaded, gisLoaded }) {
  const { i18n } = useTranslation()
  const listo = gapiLoaded && gisLoaded

  if (!listo) return null

  return conectado ? (
    <button
      className="gcal-btn gcal-connected"
      onClick={onDesconectar}
      title="Desconectar Google Calendar"
    >
      <span className="gcal-icon">📅</span>
      <span className="gcal-label">
        {i18n.language?.startsWith('en') ? 'Google Cal. connected' : 'Google Cal. conectado'}
      </span>
      <span className="gcal-dot"></span>
    </button>
  ) : (
    <button
      className="gcal-btn"
      onClick={onConectar}
      disabled={cargando}
      title="Conectar Google Calendar"
    >
      <span className="gcal-icon">📅</span>
      <span className="gcal-label">
        {cargando
          ? (i18n.language?.startsWith('en') ? 'Connecting…' : 'Conectando…')
          : (i18n.language?.startsWith('en') ? 'Connect Google Cal.' : 'Conectar Google Cal.')}
      </span>
    </button>
  )
}
