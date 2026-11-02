import { useEffect, useRef, useState } from 'react'
import { supabase, supabaseConfigurado } from './supabaseClient'
import {
  getLeads, getVendedores,
  createLead, updateLead, deleteLead,
  createVendedor, updateVendedor, deleteVendedor,
} from './lib/data'
import { getLeadsSheet, updateLeadSheet, deleteLeadSheet } from './lib/dataSheet'
import { getExtras, createExtra, updateExtra, deleteExtra } from './lib/dataExtras'
import LeadsSheet from './components/LeadsSheet'
import { COMISION } from './constants'
import { ultimaHoraInicio, hayConflicto } from './lib/helpers'

import { useTranslation } from 'react-i18next'
import { useGoogleCalendar } from './hooks/useGoogleCalendar'
import GoogleCalendarBtn from './components/GoogleCalendarBtn'
import ImportGoogleCalendar from './components/ImportGoogleCalendar'
import ImportGoogleSheets from './components/ImportGoogleSheets'
import Auth from './components/Auth'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import Leads from './components/Leads'
import LeadModal from './components/LeadModal'
import Vendedores from './components/Vendedores'
import VendedorModal from './components/VendedorModal'
import Calendario from './components/Calendario'
import Reportes from './components/Reportes'
import Extras, { ExtraModal } from './components/Extras'
import Toast from './components/Toast'

export default function App() {
  const { t } = useTranslation()

  const gcal = useGoogleCalendar()
  const [session, setSession] = useState(null)
  const isViewer = session?.user?.user_metadata?.rol === "viewer" || session?.user?.app_metadata?.rol === "viewer"
  const [authReady, setAuthReady] = useState(false)

  const [leads, setLeads] = useState([])
  const [leadsSheet, setLeadsSheet] = useState([])
  const [vendedores, setVendedores] = useState([])
  const [extras, setExtras] = useState([])
  const [dataReady, setDataReady] = useState(false)

  const [view, setView] = useState('dashboard')
  const [leadModal, setLeadModal] = useState(null)
  const [importModal, setImportModal] = useState(false)
  const [sheetsModal, setSheetsModal] = useState(false)
  const [extraModal, setExtraModal] = useState(null) // { extra: obj|null }
  const [syncing, setSyncing] = useState(false)
  const [filtroEstadoLeads, setFiltroEstadoLeads] = useState("")
  const [vendModal, setVendModal] = useState(null)
  const [saving, setSaving] = useState(false)

  const [toast, setToast] = useState({ msg: '', type: 'ok', show: false })
  const timer = useRef()

  function notify(msg, type = 'ok') {
    setToast({ msg, type, show: true })
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 2800)
  }

  // ---------- Sesión ----------
  useEffect(() => {
    if (!supabaseConfigurado) {
      setAuthReady(true)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  // ---------- Carga de datos + Realtime ----------
  useEffect(() => {
    if (!session) return
    let activo = true
    ;(async () => {
      try {
        const [v, l, ex] = await Promise.all([getVendedores(), getLeads(), getExtras()])
        if (!activo) return
        setVendedores(v)
        setLeads(l)
        setExtras(ex)
      } catch (e) {
        notify(t('common.errorDatos', { msg: e.message }), 'bad')
      } finally {
        if (activo) setDataReady(true)
      }
      try {
        const ls = await getLeadsSheet()
        if (activo) setLeadsSheet(ls)
      } catch (e) {
        console.warn('leads_sheet no disponible aún:', e.message)
      }
    })()

    const channel = supabase
      .channel('universum-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' },
        () => { getLeads().then(l => setLeads(l)) })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads_sheet' },
        () => { getLeadsSheet().then(ls => setLeadsSheet(ls)) })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vendedores' },
        () => { getVendedores().then(v => setVendedores(v)) })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'extras' },
        () => { getExtras().then(ex => setExtras(ex)) })
      .subscribe()

    return () => {
      activo = false
      supabase.removeChannel(channel)
    }
  }, [session])

  const reloadLeads = async () => setLeads(await getLeads())
  const reloadLeadsSheet = async () => setLeadsSheet(await getLeadsSheet())
  const reloadVend = async () => setVendedores(await getVendedores())
  const reloadExtras = async () => setExtras(await getExtras())

  // ---------- Importar desde Google Calendar ----------
  async function onImportarLead(payload) {
    try {
      await createLead(payload)
    } catch(e) {
      console.error('Error importando lead:', e)
    }
  }

  // ---------- Sincronizar con Google Sheets ----------
  async function onSincronizarSheets(nuevos, actualizados) {
    let countNuevos = 0, countActualizados = 0
    try {
      if (nuevos.length > 0) {
        const { error } = await supabase.from('leads_sheet').insert(nuevos)
        if (error) console.error('Error inserción masiva:', error)
        else countNuevos = nuevos.length
      }
      for (const lead of actualizados) {
        try {
          await updateLeadSheet(lead._id, { estado: lead.estado, monto_venta: lead.monto_venta, notas: lead.notas })
          countActualizados++
        } catch(e) { console.error('actualizado:', e) }
      }
    } catch(e) {
      console.error('Error sincronizando:', e)
    }
    await reloadLeadsSheet()
    return { nuevos: countNuevos, actualizados: countActualizados }
  }

  async function onDeleteLeadSheet(lead) {
    if (!confirm(`¿Eliminar el lead de "${lead.nombre}"?`)) return
    try { await deleteLeadSheet(lead.id); await reloadLeadsSheet() } catch(e) { notify('Error: ' + e.message, 'bad') }
  }

  // ---------- Handlers de leads ----------
  function openNewLead(preset) { setLeadModal({ lead: null, preset: preset || null }) }
  function openEditLead(lead) { setLeadModal({ lead, preset: null }) }

  async function onSaveLead(payload, id) {
    if (!payload.nombre) { notify(t('leadModal.errorNombre'), 'bad'); return false }
    if (!payload.telefono) { notify(t('leadModal.errorTelefono'), 'bad'); return false }

    if (payload.fecha && payload.hora) {
      if (parseInt(payload.hora) > ultimaHoraInicio(payload.fecha)) {
        notify(t('leadModal.errorHora'), 'bad'); return false
      }
    }
    if (payload.estado === 'Cerrado' && (Number(payload.monto_cerrado) || 0) <= 0) {
      notify(t('leadModal.errorCerrado'), 'bad'); return false
    }

    payload.comision =
      payload.estado === 'Cerrado'
        ? +((Number(payload.monto_cerrado) || 0) * (vendedores.find(v => v.id === payload.vendedor)?.comision_pct / 100 || COMISION)).toFixed(2)
        : 0
    if (payload.estado === 'Cerrado' && !payload.fecha_venta) {
      const ahora = new Date()
      const panama = new Date(ahora.toLocaleString('en-US', { timeZone: 'America/Panama' }))
      const y = panama.getFullYear()
      const m = String(panama.getMonth() + 1).padStart(2, '0')
      const d = String(panama.getDate()).padStart(2, '0')
      payload.fecha_venta = `${y}-${m}-${d}`
    }
    if (payload.estado !== 'Cerrado') {
      payload.fecha_venta = null
    }

    try {
      setSaving(true)
      const vNombre = vendedores.find(v => v.id === payload.vendedor)?.nombre || ''

      if (id) {
        const leadExistente = leads.find(l => l.id === id)
        await updateLead(id, payload)

        if (gcal.conectado && payload.fecha && payload.hora) {
          if (payload.estado === 'Cerrado') {
            if (leadExistente?.google_event_id) {
              await gcal.actualizarEvento(leadExistente.google_event_id, payload, vNombre)
            } else {
              const eventId = await gcal.crearEvento(payload, vNombre)
              if (eventId) await updateLead(id, { google_event_id: eventId })
            }
          } else if (leadExistente?.google_event_id) {
            await gcal.eliminarEvento(leadExistente.google_event_id)
            await updateLead(id, { google_event_id: null })
          }
        }
      } else {
        const nuevo = await createLead(payload)

        if (gcal.conectado && payload.estado === 'Cerrado' && payload.fecha && payload.hora) {
          const eventId = await gcal.crearEvento(payload, vNombre)
          if (eventId && nuevo?.id) await updateLead(nuevo.id, { google_event_id: eventId })
        }
      }

      await reloadLeads()
      notify(id ? t('leadModal.exitoActualizado') : t('leadModal.exitoCreado'), 'ok')
      return true
    } catch (e) {
      notify(t('leadModal.errorGuardar', { msg: e.message }), 'bad')
      return false
    } finally {
      setSaving(false)
    }
  }

  async function onDeleteLead(lead) {
    if (!confirm(t('common.confirmarEliminarLead', { nombre: lead.nombre }))) return
    try {
      await deleteLead(lead.id)
      await reloadLeads()
      notify(t('common.leadEliminado'), 'ok')
    } catch (e) {
      notify(t('common.errorEliminar', { msg: e.message }), 'bad')
    }
  }

  // ---------- Handlers de vendedores ----------
  async function onSaveVend(payload, id) {
    if (!payload.nombre) { notify(t('vendedorModal.errorNombre'), 'bad'); return false }
    try {
      setSaving(true)
      if (id) await updateVendedor(id, payload)
      else await createVendedor(payload)
      await reloadVend()
      notify(id ? t('vendedorModal.exitoActualizado') : t('vendedorModal.exitoCreado'), 'ok')
      return true
    } catch (e) {
      notify('Error: ' + e.message, 'bad')
      return false
    } finally {
      setSaving(false)
    }
  }

  async function onDeleteVend(v) {
    const asignados = leads.filter((l) => l.vendedor === v.id).length
    const msg = asignados
      ? `"${v.nombre}" tiene ${asignados} lead(s) asignado(s). Quedarán sin vendedor. ¿Eliminar?`
      : `¿Eliminar al vendedor "${v.nombre}"?`
    if (!confirm(msg)) return
    try {
      await deleteVendedor(v.id)
      await Promise.all([reloadVend(), reloadLeads()])
      notify(t('common.vendedorEliminado'), 'ok')
    } catch (e) {
      notify('Error: ' + e.message, 'bad')
    }
  }

  // ---------- Handlers de extras ----------
  async function onSaveExtra(payload, id) {
    try {
      setSaving(true)
      if (id) await updateExtra(id, payload)
      else await createExtra(payload)
      await reloadExtras()
      notify(id ? 'Extra actualizado' : 'Extra creado', 'ok')
      return true
    } catch (e) {
      notify('Error: ' + e.message, 'bad')
      return false
    } finally {
      setSaving(false)
    }
  }

  async function onDeleteExtra(extra) {
    if (!confirm(`¿Eliminar el extra "${extra.nombre}"?`)) return
    try {
      await deleteExtra(extra.id)
      await reloadExtras()
      notify('Extra eliminado', 'ok')
    } catch (e) {
      notify('Error: ' + e.message, 'bad')
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    setDataReady(false)
    setLeads([])
    setVendedores([])
    setExtras([])
  }

  // ---------- Render ----------
  if (!authReady) {
    return (
      <div className="center-screen">
        <div><div className="spinner"></div><div className="loading-text">{t('common.cargando')}</div></div>
      </div>
    )
  }

  if (!session) return <Auth />

  if (!dataReady) {
    return (
      <div className="center-screen">
        <div><div className="spinner"></div><div className="loading-text">{t('common.cargandoDatos')}</div></div>
      </div>
    )
  }

  return (
    <>
      <div className="app">
        <Sidebar
          view={view}
          setView={setView}
          email={session.user?.email}
          isViewer={isViewer}
          onLogout={logout}
          gcal={gcal}
          onImportar={() => setImportModal(true)}
          onSheetsImport={() => setSheetsModal(true)}
          onSyncDirect={async () => { setSyncing(true); setSheetsModal(true); setSyncing(false) }}
        />
        <main className="main">
          {view === 'dashboard' && (
            <Dashboard leads={leads} vendedores={vendedores} onNewLead={() => openNewLead()} isViewer={isViewer} setView={setView} setFiltroEstado={setFiltroEstadoLeads} />
          )}
          {view === 'leads' && (
            <Leads
              leads={leads}
              vendedores={vendedores}
              onNew={() => openNewLead()}
              isViewer={isViewer}
              onEdit={openEditLead}
              onDelete={onDeleteLead}
            />
          )}
          {view === 'leadssheet' && (
            <LeadsSheet
              leads={leadsSheet}
              onSync={() => setSheetsModal(true)}
              onDelete={onDeleteLeadSheet}
              syncing={syncing}
            />
          )}
          {view === 'vendedores' && (
            <Vendedores
              vendedores={vendedores}
              leads={leads}
              onNew={() => setVendModal({ vendedor: null })}
              isViewer={isViewer}
              onEdit={(v) => setVendModal({ vendedor: v })}
              onDelete={onDeleteVend}
            />
          )}
          {view === 'reportes' && (
            <Reportes leads={leads} vendedores={vendedores} extras={extras} />
          )}
          {view === 'calendario' && (
            <Calendario leads={leads} onNew={openNewLead} onEdit={openEditLead} isViewer={isViewer} />
          )}
          {view === 'extras' && (
            <Extras
              extras={extras}
              vendedores={vendedores}
              onNew={() => setExtraModal({ extra: null })}
              onEdit={(e) => setExtraModal({ extra: e })}
              onDelete={onDeleteExtra}
              isViewer={isViewer}
            />
          )}
        </main>
      </div>

      {leadModal && (
        <LeadModal
          key={leadModal.lead?.id || 'nuevo'}
          lead={leadModal.lead}
          preset={leadModal.preset}
          vendedores={vendedores}
          onSave={onSaveLead}
          onDelete={onDeleteLead}
          onClose={() => setLeadModal(null)}
          saving={saving}
        />
      )}
      {vendModal && (
        <VendedorModal
          key={vendModal.vendedor?.id || 'nuevo'}
          vendedor={vendModal.vendedor}
          onSave={onSaveVend}
          onClose={() => setVendModal(null)}
          saving={saving}
        />
      )}
      {extraModal && (
        <ExtraModal
          key={extraModal.extra?.id || 'nuevo-extra'}
          extra={extraModal.extra}
          vendedores={vendedores}
          onSave={onSaveExtra}
          onDelete={(e) => { setExtraModal(null); onDeleteExtra(e) }}
          onClose={() => setExtraModal(null)}
          saving={saving}
        />
      )}

      {sheetsModal && (
        <ImportGoogleSheets
          leadsSheet={leadsSheet}
          onSincronizar={onSincronizarSheets}
          onClose={() => { setSheetsModal(false); setView('leadssheet') }}
        />
      )}
      {importModal && (
        <ImportGoogleCalendar
          gcal={gcal}
          vendedores={vendedores}
          onImportar={onImportarLead}
          onClose={() => { setImportModal(false); reloadLeads() }}
        />
      )}
      <Toast toast={toast} />
    </>
  )
}
