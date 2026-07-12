import { useTranslation } from 'react-i18next'
import LanguageToggle from './LanguageToggle'
import GoogleCalendarBtn from './GoogleCalendarBtn'

export default function Sidebar({ view, setView, email, onLogout, gcal, onImportar, onSheetsImport, isViewer }) {
  const { t } = useTranslation()

  const ITEMS = [
    { id: 'dashboard',   label: t('nav.dashboard'),   ic: '◎' },
    { id: 'leadssheet',  label: 'Leads',               ic: '⚡' },
    { id: 'leads',       label: t('nav.leads'),        ic: '★' },
    { id: 'vendedores',  label: t('nav.vendedores'),   ic: '⬡' },
    { id: 'calendario',  label: t('nav.calendario'),   ic: '▦' },
    { id: 'reportes', label: 'Reportes', ic: '📊' },
    { id: 'reportes',    label: 'Reportes',               ic: '📊' },
  ]

  return (
    <aside className="sidebar">
      <div className="brand">
        <img src="/logo.png" alt="Universum Panama" onError={e => e.target.style.display='none'}
          style={{ width: '100%', maxWidth: 180, height: 'auto', display: 'block', margin: '0 auto 20px' }} />
      </div>

      {ITEMS.map(it => (
        <button key={it.id} className={`nav-btn ${view === it.id ? 'active' : ''}`}
          onClick={() => setView(it.id)}>
          <span className="ic">{it.ic}</span> {it.label}
        </button>
      ))}

      <div className="spacer"></div>

      {!isViewer && gcal && (
        <GoogleCalendarBtn
          conectado={gcal.conectado}
          cargando={gcal.cargando}
          error={gcal.error}
          gapiLoaded={gcal.gapiLoaded}
          gisLoaded={gcal.gisLoaded}
          onConectar={gcal.conectar}
          onDesconectar={gcal.desconectar}
        />
      )}
      {!isViewer && gcal?.conectado && (
        <button className="gcal-btn" onClick={onImportar}
          style={{ marginBottom: 8, background: 'rgba(168,85,247,.12)', borderColor: 'rgba(168,85,247,.35)', color: 'var(--purple)' }}>
          <span>⬇️</span>
          <span style={{ fontSize: 12 }}>Importar de Google Cal.</span>
        </button>
      )}
      {!isViewer && (
        <button className="gcal-btn" onClick={onSheetsImport}
          style={{ marginBottom: 8, background: 'rgba(52,168,83,.1)', borderColor: 'rgba(52,168,83,.35)', color: '#6ee08f' }}>
          <span>📊</span>
          <span style={{ fontSize: 12 }}>Sincronizar Sheets</span>
        </button>
      )}

      {isViewer && (
        <div style={{ fontSize: 11, color: 'var(--muted-2)', padding: '8px 10px',
          background: 'rgba(140,108,255,.08)', borderRadius: 8, marginBottom: 8, textAlign: 'center' }}>
          Modo solo lectura
        </div>
      )}

      <LanguageToggle />
      {email && <div className="user-chip">{t('nav.sesion')}: <b>{email}</b></div>}
      <button className="logout" onClick={onLogout}>{t('nav.cerrarSesion')}</button>
    </aside>
  )
}
