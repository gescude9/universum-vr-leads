import { useTranslation } from 'react-i18next'

export default function GoogleCalendarBtn({ conectado, cargando, error, onConectar, onDesconectar, gapiLoaded, gisLoaded }) {
  const { i18n } = useTranslation()
  const isEN = i18n.language?.startsWith('en')
  const listo = gapiLoaded && gisLoaded

  return (
    <div style={{ marginBottom: 8 }}>
      {conectado ? (
        <button className="gcal-btn gcal-connected" onClick={onDesconectar}>
          <span className="gcal-icon">📅</span>
          <span className="gcal-label">{isEN ? 'Google Cal. ✓' : 'Google Cal. ✓'}</span>
          <span className="gcal-dot"></span>
        </button>
      ) : (
        <button className="gcal-btn" onClick={onConectar} disabled={cargando || !listo}>
          <span className="gcal-icon">📅</span>
          <span className="gcal-label">
            {!listo ? (isEN ? 'Loading…' : 'Cargando…')
              : cargando ? (isEN ? 'Connecting…' : 'Conectando…')
              : (isEN ? 'Connect Google Cal.' : 'Conectar Google Cal.')}
          </span>
        </button>
      )}
      {error && (
        <div style={{ fontSize: 11, color: 'var(--bad)', marginTop: 4, padding: '4px 8px',
          background: 'rgba(255,94,122,.1)', borderRadius: 6, lineHeight: 1.4 }}>
          {error}
        </div>
      )}
    </div>
  )
}
